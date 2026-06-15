use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use walkdir::WalkDir;

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct TokenUsage {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cached_tokens: u64,
    pub reasoning_output_tokens: u64,
    pub total_tokens: u64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct UsageEvent {
    pub event_index: u64,
    pub occurred_at: String,
    pub project_path: Option<String>,
    pub project_name: String,
    pub usage: TokenUsage,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionUsage {
    pub id: String,
    pub title: String,
    pub project_path: Option<String>,
    pub project_name: String,
    pub model: Option<String>,
    pub started_at: Option<String>,
    pub updated_at: Option<String>,
    pub source_path: String,
    pub usage: TokenUsage,
    pub token_events: u64,
    pub usage_events: Vec<UsageEvent>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SourceFileImport {
    pub source_path: String,
    pub session_id: Option<String>,
    pub modified_at: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ImportResult {
    pub sessions: Vec<SessionUsage>,
    pub scanned_files: u64,
    pub parsed_files: u64,
    pub unchanged_files: u64,
    pub skipped_files: u64,
    #[serde(skip)]
    pub source_files: Vec<SourceFileImport>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SummaryStats {
    pub total_tokens: u64,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cached_tokens: u64,
    pub reasoning_output_tokens: u64,
    pub sessions: u64,
    pub projects: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyUsage {
    pub date: String,
    pub total_tokens: u64,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cached_tokens: u64,
    pub sessions: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectUsage {
    pub project_path: String,
    pub project_name: String,
    pub total_tokens: u64,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cached_tokens: u64,
    pub sessions: u64,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardData {
    pub summary: SummaryStats,
    pub daily_usage: Vec<DailyUsage>,
    pub project_usage: Vec<ProjectUsage>,
    pub sessions: Vec<SessionUsage>,
    pub scanned_files: u64,
    pub parsed_files: u64,
    pub unchanged_files: u64,
    pub skipped_files: u64,
    pub codex_home: String,
    pub database_path: String,
    pub last_imported_at: String,
}

#[derive(Debug, thiserror::Error)]
pub enum UsageError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("could not find the user home directory")]
    MissingHome,
}

pub fn default_codex_home() -> Result<PathBuf, UsageError> {
    if let Ok(home) = env::var("CODEX_HOME") {
        let trimmed = home.trim();
        if !trimmed.is_empty() {
            return Ok(PathBuf::from(trimmed));
        }
    }

    let home = dirs::home_dir().ok_or(UsageError::MissingHome)?;
    Ok(home.join(".codex"))
}

pub fn parse_session_jsonl(path: &Path, content: &str) -> Option<SessionUsage> {
    let mut id = session_id_from_filename(path);
    let mut title = String::new();
    let mut project_path = None;
    let mut model = None;
    let mut started_at = None;
    let mut updated_at = None;
    let mut usage = TokenUsage::default();
    let mut token_events = 0;
    let mut usage_events = Vec::new();
    let mut current_project_path: Option<String> = None;

    for line in content
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
    {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            continue;
        };

        let timestamp = string_at(&value, &["timestamp"]);
        let record_type = string_at(&value, &["type"]);
        match record_type.as_deref() {
            Some("session_meta") => {
                id = string_at(&value, &["payload", "id"]).or(id);
                started_at = string_at(&value, &["payload", "timestamp"]).or(timestamp.clone());
                updated_at = timestamp.clone().or(updated_at);
                project_path = string_at(&value, &["payload", "cwd"]).or(project_path);
                current_project_path = project_path.clone();
                model = string_at(&value, &["payload", "model"])
                    .or_else(|| string_at(&value, &["payload", "model_slug"]))
                    .or(model);
            }
            Some("turn_context") => {
                updated_at = timestamp.clone().or(updated_at);
                project_path = string_at(&value, &["payload", "cwd"]).or(project_path);
                current_project_path =
                    string_at(&value, &["payload", "cwd"]).or(current_project_path);
                model = string_at(&value, &["payload", "model"]).or(model);
            }
            Some("event_msg") => {
                if string_at(&value, &["payload", "type"]).as_deref() == Some("token_count") {
                    if let Some(total) = value.pointer("/payload/info/total_token_usage") {
                        usage = token_usage_from_value(total);
                        token_events += 1;
                        updated_at = timestamp.clone().or(updated_at);

                        if let Some(occurred_at) = timestamp {
                            let event_usage = value
                                .pointer("/payload/info/last_token_usage")
                                .map(token_usage_from_value)
                                .unwrap_or_else(|| usage.clone());
                            let event_project_path = current_project_path
                                .clone()
                                .or_else(|| project_path.clone());
                            usage_events.push(UsageEvent {
                                event_index: usage_events.len() as u64,
                                occurred_at,
                                project_name: event_project_path
                                    .as_deref()
                                    .map(project_name_from_path)
                                    .unwrap_or_else(|| "Unknown project".to_string()),
                                project_path: event_project_path,
                                usage: event_usage,
                            });
                        }
                    }
                }
            }
            Some("turn_context_summary") => {
                title = string_at(&value, &["payload", "thread_name"]).unwrap_or(title);
            }
            _ => {}
        }
    }

    let id = id?;
    let project_name = project_path
        .as_deref()
        .map(project_name_from_path)
        .unwrap_or_else(|| "Unknown project".to_string());
    if title.is_empty() {
        title = title_from_filename(path).unwrap_or_else(|| "Untitled session".to_string());
    }

    Some(SessionUsage {
        id,
        title,
        project_path,
        project_name,
        model,
        started_at,
        updated_at,
        source_path: path.to_string_lossy().to_string(),
        usage,
        token_events,
        usage_events,
    })
}

#[cfg(test)]
pub fn import_codex_sessions(codex_home: &Path) -> ImportResult {
    let titles = load_session_titles(codex_home);
    let mut sessions = Vec::new();
    let mut scanned_files = 0;
    let mut parsed_files = 0;
    let mut skipped_files = 0;
    let mut source_files = Vec::new();

    for file in safe_session_files(codex_home) {
        scanned_files += 1;
        let source = source_file_import(&file, None);
        match fs::read_to_string(&file) {
            Ok(content) => {
                if let Some(mut session) = parse_session_jsonl(&file, &content) {
                    if let Some(index_title) = titles.get(&session.id) {
                        session.title = index_title.clone();
                    }
                    if session.token_events > 0 {
                        parsed_files += 1;
                        source_files.push(SourceFileImport {
                            session_id: Some(session.id.clone()),
                            ..source
                        });
                        sessions.push(session);
                    }
                }
            }
            Err(_) => skipped_files += 1,
        }
    }

    ImportResult {
        sessions,
        scanned_files,
        parsed_files,
        unchanged_files: 0,
        skipped_files,
        source_files,
    }
}

pub fn refresh_database(db_path: &Path, codex_home: &Path) -> Result<DashboardData, UsageError> {
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let mut conn = Connection::open(db_path)?;
    ensure_schema(&conn)?;
    let imported_at = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Nanos, true);
    let import = import_changed_codex_sessions(&conn, codex_home)?;
    let transaction = conn.transaction()?;

    for source_file in &import.source_files {
        upsert_source_file(&transaction, source_file, &imported_at)?;
    }

    for session in &import.sessions {
        upsert_session(&transaction, session, &imported_at)?;
        replace_usage_events(&transaction, session)?;
    }

    transaction.execute(
        "DELETE FROM sessions WHERE id NOT IN (
            SELECT session_id FROM source_files WHERE last_seen_at = ?1 AND session_id IS NOT NULL
        )",
        params![imported_at],
    )?;
    transaction.execute(
        "DELETE FROM session_usage_events WHERE session_id NOT IN (SELECT id FROM sessions)",
        [],
    )?;
    transaction.execute(
        "DELETE FROM source_files WHERE last_seen_at <> ?1",
        params![imported_at],
    )?;
    transaction.commit()?;

    let sessions = load_sessions(&conn)?;
    Ok(build_dashboard(
        sessions,
        import.scanned_files,
        import.parsed_files,
        import.unchanged_files,
        import.skipped_files,
        codex_home,
        db_path,
        imported_at,
    ))
}

pub fn load_database(db_path: &Path, codex_home: &Path) -> Result<DashboardData, UsageError> {
    refresh_database(db_path, codex_home)
}

fn import_changed_codex_sessions(
    conn: &Connection,
    codex_home: &Path,
) -> Result<ImportResult, UsageError> {
    let titles = load_session_titles(codex_home);
    let mut sessions = Vec::new();
    let mut source_files = Vec::new();
    let mut scanned_files = 0;
    let mut parsed_files = 0;
    let mut unchanged_files = 0;
    let mut skipped_files = 0;

    for file in safe_session_files(codex_home) {
        scanned_files += 1;
        let current_source = source_file_import(&file, None);
        let existing_source = load_source_file(conn, &current_source.source_path)?;

        if let Some(existing) = existing_source.as_ref() {
            if existing.modified_at == current_source.modified_at
                && existing.size_bytes == current_source.size_bytes
                && existing
                    .session_id
                    .as_deref()
                    .map(|id| session_exists(conn, id))
                    .transpose()?
                    .unwrap_or(false)
            {
                unchanged_files += 1;
                source_files.push(existing.clone());
                continue;
            }
        }

        match fs::read_to_string(&file) {
            Ok(content) => {
                if let Some(mut session) = parse_session_jsonl(&file, &content) {
                    if let Some(index_title) = titles.get(&session.id) {
                        session.title = index_title.clone();
                    }
                    if session.token_events > 0 {
                        parsed_files += 1;
                        source_files.push(SourceFileImport {
                            session_id: Some(session.id.clone()),
                            ..current_source
                        });
                        sessions.push(session);
                    } else {
                        source_files.push(current_source);
                    }
                } else {
                    source_files.push(current_source);
                }
            }
            Err(_) => {
                skipped_files += 1;
                source_files.push(existing_source.unwrap_or(current_source));
            }
        }
    }

    Ok(ImportResult {
        sessions,
        scanned_files,
        parsed_files,
        unchanged_files,
        skipped_files,
        source_files,
    })
}

fn ensure_schema(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            project_path TEXT,
            project_name TEXT NOT NULL,
            model TEXT,
            started_at TEXT,
            updated_at TEXT,
            source_path TEXT NOT NULL,
            input_tokens INTEGER NOT NULL,
            output_tokens INTEGER NOT NULL,
            cached_tokens INTEGER NOT NULL,
            reasoning_output_tokens INTEGER NOT NULL,
            total_tokens INTEGER NOT NULL,
            token_events INTEGER NOT NULL,
            last_imported_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS session_usage_events (
            session_id TEXT NOT NULL,
            event_index INTEGER NOT NULL,
            occurred_at TEXT NOT NULL,
            project_path TEXT,
            project_name TEXT NOT NULL,
            input_tokens INTEGER NOT NULL,
            output_tokens INTEGER NOT NULL,
            cached_tokens INTEGER NOT NULL,
            reasoning_output_tokens INTEGER NOT NULL,
            total_tokens INTEGER NOT NULL,
            PRIMARY KEY (session_id, event_index)
        );

        CREATE TABLE IF NOT EXISTS source_files (
            source_path TEXT PRIMARY KEY,
            session_id TEXT,
            modified_at TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            last_seen_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_project_name ON sessions(project_name);
        CREATE INDEX IF NOT EXISTS idx_usage_events_occurred_at ON session_usage_events(occurred_at);
        CREATE INDEX IF NOT EXISTS idx_usage_events_project_name ON session_usage_events(project_name);
        CREATE INDEX IF NOT EXISTS idx_source_files_session_id ON source_files(session_id);
        "#,
    )
}

fn upsert_source_file(
    conn: &Connection,
    source_file: &SourceFileImport,
    imported_at: &str,
) -> rusqlite::Result<()> {
    conn.execute(
        r#"
        INSERT INTO source_files (source_path, session_id, modified_at, size_bytes, last_seen_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(source_path) DO UPDATE SET
            session_id = excluded.session_id,
            modified_at = excluded.modified_at,
            size_bytes = excluded.size_bytes,
            last_seen_at = excluded.last_seen_at
        "#,
        params![
            source_file.source_path,
            source_file.session_id,
            source_file.modified_at,
            source_file.size_bytes as i64,
            imported_at,
        ],
    )?;
    Ok(())
}

fn upsert_session(
    conn: &Connection,
    session: &SessionUsage,
    imported_at: &str,
) -> rusqlite::Result<()> {
    conn.execute(
        r#"
        INSERT INTO sessions (
            id, title, project_path, project_name, model, started_at, updated_at,
            source_path, input_tokens, output_tokens, cached_tokens,
            reasoning_output_tokens, total_tokens, token_events, last_imported_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            project_path = excluded.project_path,
            project_name = excluded.project_name,
            model = excluded.model,
            started_at = excluded.started_at,
            updated_at = excluded.updated_at,
            source_path = excluded.source_path,
            input_tokens = excluded.input_tokens,
            output_tokens = excluded.output_tokens,
            cached_tokens = excluded.cached_tokens,
            reasoning_output_tokens = excluded.reasoning_output_tokens,
            total_tokens = excluded.total_tokens,
            token_events = excluded.token_events,
            last_imported_at = excluded.last_imported_at
        "#,
        params![
            session.id,
            session.title,
            session.project_path,
            session.project_name,
            session.model,
            session.started_at,
            session.updated_at,
            session.source_path,
            session.usage.input_tokens as i64,
            session.usage.output_tokens as i64,
            session.usage.cached_tokens as i64,
            session.usage.reasoning_output_tokens as i64,
            session.usage.total_tokens as i64,
            session.token_events as i64,
            imported_at,
        ],
    )?;
    Ok(())
}

fn replace_usage_events(conn: &Connection, session: &SessionUsage) -> rusqlite::Result<()> {
    conn.execute(
        "DELETE FROM session_usage_events WHERE session_id = ?1",
        params![session.id],
    )?;

    for event in &session.usage_events {
        conn.execute(
            r#"
            INSERT INTO session_usage_events (
                session_id, event_index, occurred_at, project_path, project_name,
                input_tokens, output_tokens, cached_tokens, reasoning_output_tokens, total_tokens
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
            "#,
            params![
                session.id,
                event.event_index as i64,
                event.occurred_at,
                event.project_path,
                event.project_name,
                event.usage.input_tokens as i64,
                event.usage.output_tokens as i64,
                event.usage.cached_tokens as i64,
                event.usage.reasoning_output_tokens as i64,
                event.usage.total_tokens as i64,
            ],
        )?;
    }

    Ok(())
}

fn load_sessions(conn: &Connection) -> rusqlite::Result<Vec<SessionUsage>> {
    let mut stmt = conn.prepare(
        r#"
        SELECT id, title, project_path, project_name, model, started_at, updated_at,
               source_path, input_tokens, output_tokens, cached_tokens,
               reasoning_output_tokens, total_tokens, token_events
        FROM sessions
        ORDER BY COALESCE(updated_at, started_at, '') DESC
        "#,
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(SessionUsage {
            id: row.get(0)?,
            title: row.get(1)?,
            project_path: row.get(2)?,
            project_name: row.get(3)?,
            model: row.get(4)?,
            started_at: row.get(5)?,
            updated_at: row.get(6)?,
            source_path: row.get(7)?,
            usage: TokenUsage {
                input_tokens: row.get::<_, i64>(8)? as u64,
                output_tokens: row.get::<_, i64>(9)? as u64,
                cached_tokens: row.get::<_, i64>(10)? as u64,
                reasoning_output_tokens: row.get::<_, i64>(11)? as u64,
                total_tokens: row.get::<_, i64>(12)? as u64,
            },
            token_events: row.get::<_, i64>(13)? as u64,
            usage_events: Vec::new(),
        })
    })?;

    let mut sessions: Vec<SessionUsage> = rows.collect::<rusqlite::Result<_>>()?;
    let mut events_by_session = load_usage_events(conn)?;

    for session in &mut sessions {
        session.usage_events = events_by_session.remove(&session.id).unwrap_or_default();
    }

    Ok(sessions)
}

fn load_usage_events(conn: &Connection) -> rusqlite::Result<HashMap<String, Vec<UsageEvent>>> {
    let mut stmt = conn.prepare(
        r#"
        SELECT session_id, event_index, occurred_at, project_path, project_name,
               input_tokens, output_tokens, cached_tokens, reasoning_output_tokens, total_tokens
        FROM session_usage_events
        ORDER BY session_id, event_index
        "#,
    )?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            UsageEvent {
                event_index: row.get::<_, i64>(1)? as u64,
                occurred_at: row.get(2)?,
                project_path: row.get(3)?,
                project_name: row.get(4)?,
                usage: TokenUsage {
                    input_tokens: row.get::<_, i64>(5)? as u64,
                    output_tokens: row.get::<_, i64>(6)? as u64,
                    cached_tokens: row.get::<_, i64>(7)? as u64,
                    reasoning_output_tokens: row.get::<_, i64>(8)? as u64,
                    total_tokens: row.get::<_, i64>(9)? as u64,
                },
            },
        ))
    })?;

    let mut events_by_session: HashMap<String, Vec<UsageEvent>> = HashMap::new();
    for row in rows {
        let (session_id, event) = row?;
        events_by_session.entry(session_id).or_default().push(event);
    }

    Ok(events_by_session)
}

fn load_source_file(
    conn: &Connection,
    source_path: &str,
) -> rusqlite::Result<Option<SourceFileImport>> {
    let mut stmt = conn.prepare(
        "SELECT source_path, session_id, modified_at, size_bytes FROM source_files WHERE source_path = ?1",
    )?;
    let mut rows = stmt.query_map(params![source_path], |row| {
        Ok(SourceFileImport {
            source_path: row.get(0)?,
            session_id: row.get(1)?,
            modified_at: row.get(2)?,
            size_bytes: row.get::<_, i64>(3)? as u64,
        })
    })?;

    rows.next().transpose()
}

fn session_exists(conn: &Connection, session_id: &str) -> rusqlite::Result<bool> {
    conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM sessions WHERE id = ?1)",
        params![session_id],
        |row| row.get(0),
    )
}

fn build_dashboard(
    sessions: Vec<SessionUsage>,
    scanned_files: u64,
    parsed_files: u64,
    unchanged_files: u64,
    skipped_files: u64,
    codex_home: &Path,
    db_path: &Path,
    imported_at: String,
) -> DashboardData {
    let mut summary = SummaryStats {
        sessions: sessions.len() as u64,
        ..SummaryStats::default()
    };
    let mut daily: BTreeMap<String, DailyUsage> = BTreeMap::new();
    let mut projects: HashMap<String, ProjectUsage> = HashMap::new();
    let mut daily_sessions: HashMap<String, HashSet<String>> = HashMap::new();
    let mut project_sessions: HashMap<String, HashSet<String>> = HashMap::new();

    for session in &sessions {
        summary.total_tokens += session.usage.total_tokens;
        summary.input_tokens += session.usage.input_tokens;
        summary.output_tokens += session.usage.output_tokens;
        summary.cached_tokens += session.usage.cached_tokens;
        summary.reasoning_output_tokens += session.usage.reasoning_output_tokens;

        if session.usage_events.is_empty() {
            if let Some(date) = session_date(session) {
                add_daily_usage(
                    &mut daily,
                    &mut daily_sessions,
                    &date,
                    &session.id,
                    &session.usage,
                );
            }

            let project_key = session
                .project_path
                .clone()
                .unwrap_or_else(|| "Unknown project".to_string());
            add_project_usage(
                &mut projects,
                &mut project_sessions,
                &project_key,
                &session.project_name,
                session.updated_at.clone(),
                &session.id,
                &session.usage,
            );
            continue;
        }

        for event in &session.usage_events {
            let date: String = event.occurred_at.chars().take(10).collect();
            add_daily_usage(
                &mut daily,
                &mut daily_sessions,
                &date,
                &session.id,
                &event.usage,
            );

            let project_key = event
                .project_path
                .clone()
                .unwrap_or_else(|| "Unknown project".to_string());
            add_project_usage(
                &mut projects,
                &mut project_sessions,
                &project_key,
                &event.project_name,
                Some(event.occurred_at.clone()),
                &session.id,
                &event.usage,
            );
        }
    }

    summary.projects = projects.len() as u64;

    let mut project_usage: Vec<_> = projects.into_values().collect();
    project_usage.sort_by(|a, b| b.total_tokens.cmp(&a.total_tokens));

    let mut daily_usage: Vec<_> = daily.into_values().collect();
    daily_usage.sort_by(|a, b| a.date.cmp(&b.date));

    DashboardData {
        summary,
        daily_usage,
        project_usage,
        sessions,
        scanned_files,
        parsed_files,
        unchanged_files,
        skipped_files,
        codex_home: codex_home.to_string_lossy().to_string(),
        database_path: db_path.to_string_lossy().to_string(),
        last_imported_at: imported_at,
    }
}

fn source_file_import(path: &Path, session_id: Option<String>) -> SourceFileImport {
    let metadata = fs::metadata(path).ok();
    SourceFileImport {
        source_path: path.to_string_lossy().to_string(),
        session_id,
        modified_at: metadata
            .as_ref()
            .and_then(|metadata| metadata.modified().ok())
            .map(system_time_key)
            .unwrap_or_else(|| "unknown".to_string()),
        size_bytes: metadata.map(|metadata| metadata.len()).unwrap_or(0),
    }
}

fn system_time_key(time: SystemTime) -> String {
    match time.duration_since(UNIX_EPOCH) {
        Ok(duration) => format!("{}.{:09}", duration.as_secs(), duration.subsec_nanos()),
        Err(error) => {
            let duration = error.duration();
            format!("-{}.{:09}", duration.as_secs(), duration.subsec_nanos())
        }
    }
}

fn add_daily_usage(
    daily: &mut BTreeMap<String, DailyUsage>,
    daily_sessions: &mut HashMap<String, HashSet<String>>,
    date: &str,
    session_id: &str,
    usage: &TokenUsage,
) {
    let entry = daily.entry(date.to_string()).or_insert(DailyUsage {
        date: date.to_string(),
        total_tokens: 0,
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        sessions: 0,
    });
    entry.total_tokens += usage.total_tokens;
    entry.input_tokens += usage.input_tokens;
    entry.output_tokens += usage.output_tokens;
    entry.cached_tokens += usage.cached_tokens;

    let sessions = daily_sessions.entry(date.to_string()).or_default();
    sessions.insert(session_id.to_string());
    entry.sessions = sessions.len() as u64;
}

fn add_project_usage(
    projects: &mut HashMap<String, ProjectUsage>,
    project_sessions: &mut HashMap<String, HashSet<String>>,
    project_path: &str,
    project_name: &str,
    updated_at: Option<String>,
    session_id: &str,
    usage: &TokenUsage,
) {
    let project = projects
        .entry(project_path.to_string())
        .or_insert(ProjectUsage {
            project_path: project_path.to_string(),
            project_name: project_name.to_string(),
            total_tokens: 0,
            input_tokens: 0,
            output_tokens: 0,
            cached_tokens: 0,
            sessions: 0,
            updated_at: updated_at.clone(),
        });

    project.total_tokens += usage.total_tokens;
    project.input_tokens += usage.input_tokens;
    project.output_tokens += usage.output_tokens;
    project.cached_tokens += usage.cached_tokens;

    let sessions = project_sessions
        .entry(project_path.to_string())
        .or_default();
    sessions.insert(session_id.to_string());
    project.sessions = sessions.len() as u64;

    if updated_at.as_deref() > project.updated_at.as_deref() {
        project.updated_at = updated_at;
    }
}

fn safe_session_files(codex_home: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();

    for directory_name in ["sessions", "archived_sessions"] {
        let root = codex_home.join(directory_name);
        if !root.exists() {
            continue;
        }

        for entry in WalkDir::new(root)
            .follow_links(false)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|entry| entry.file_type().is_file())
        {
            let path = entry.into_path();
            let file_name = path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("");
            let is_jsonl = path.extension().and_then(|ext| ext.to_str()) == Some("jsonl");
            if is_jsonl && file_name.starts_with("rollout-") {
                files.push(path);
            }
        }
    }

    files.sort();
    files
}

fn load_session_titles(codex_home: &Path) -> HashMap<String, String> {
    let mut titles = HashMap::new();
    let path = codex_home.join("session_index.jsonl");
    let Ok(content) = fs::read_to_string(path) else {
        return titles;
    };

    for line in content
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
    {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            continue;
        };
        if let (Some(id), Some(title)) = (
            string_at(&value, &["id"]),
            string_at(&value, &["thread_name"]),
        ) {
            titles.insert(id, title);
        }
    }

    titles
}

fn token_usage_from_value(value: &Value) -> TokenUsage {
    let input_tokens = u64_at(value, &["input_tokens"]);
    let output_tokens = u64_at(value, &["output_tokens"]);
    let cached_tokens =
        u64_at(value, &["cached_input_tokens"]).max(u64_at(value, &["cached_tokens"]));
    let reasoning_output_tokens = u64_at(value, &["reasoning_output_tokens"]);
    let total_tokens = u64_at(value, &["total_tokens"]).max(input_tokens + output_tokens);

    TokenUsage {
        input_tokens,
        output_tokens,
        cached_tokens,
        reasoning_output_tokens,
        total_tokens,
    }
}

fn string_at(value: &Value, path: &[&str]) -> Option<String> {
    let mut current = value;
    for key in path {
        current = current.get(*key)?;
    }
    current.as_str().map(ToOwned::to_owned)
}

fn u64_at(value: &Value, path: &[&str]) -> u64 {
    let mut current = value;
    for key in path {
        let Some(next) = current.get(*key) else {
            return 0;
        };
        current = next;
    }
    current.as_u64().unwrap_or(0)
}

fn session_id_from_filename(path: &Path) -> Option<String> {
    let stem = path.file_stem()?.to_str()?;
    if stem.len() >= 36 {
        let candidate = &stem[stem.len() - 36..];
        let hyphen_positions = [8, 13, 18, 23];
        let looks_like_uuid = candidate.chars().enumerate().all(|(index, value)| {
            if hyphen_positions.contains(&index) {
                value == '-'
            } else {
                value.is_ascii_hexdigit()
            }
        });

        if looks_like_uuid {
            return Some(candidate.to_string());
        }
    }

    stem.rsplit_once('-')
        .map(|(_, id)| id.to_string())
        .filter(|id| !id.is_empty())
}

fn title_from_filename(path: &Path) -> Option<String> {
    let stem = path.file_stem()?.to_str()?;
    Some(stem.replace("rollout-", "").replace('-', " "))
}

fn project_name_from_path(path: &str) -> String {
    Path::new(path)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.trim().is_empty())
        .unwrap_or(path)
        .to_string()
}

fn session_date(session: &SessionUsage) -> Option<String> {
    let timestamp = session
        .updated_at
        .as_deref()
        .or(session.started_at.as_deref())?;
    Some(timestamp.chars().take(10).collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn parses_session_meta_and_latest_total_token_count() {
        let content = r#"{"timestamp":"2026-06-15T01:00:00.000Z","type":"session_meta","payload":{"id":"session-1","timestamp":"2026-06-15T00:59:00.000Z","cwd":"D:\\Projects\\alpha","model":"gpt-5.4"}}
{"timestamp":"2026-06-15T01:01:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":1200,"cached_input_tokens":300,"output_tokens":80,"reasoning_output_tokens":20,"total_tokens":1280},"last_token_usage":{"input_tokens":1200,"cached_input_tokens":300,"output_tokens":80,"reasoning_output_tokens":20,"total_tokens":1280},"model_context_window":258400}}}"#;

        let session = parse_session_jsonl(Path::new("rollout-session-1.jsonl"), content).unwrap();

        assert_eq!(session.id, "session-1");
        assert_eq!(session.project_path.as_deref(), Some("D:\\Projects\\alpha"));
        assert_eq!(session.model.as_deref(), Some("gpt-5.4"));
        assert_eq!(
            session.started_at.as_deref(),
            Some("2026-06-15T00:59:00.000Z")
        );
        assert_eq!(
            session.updated_at.as_deref(),
            Some("2026-06-15T01:01:00.000Z")
        );
        assert_eq!(session.usage.input_tokens, 1200);
        assert_eq!(session.usage.cached_tokens, 300);
        assert_eq!(session.usage.output_tokens, 80);
        assert_eq!(session.usage.reasoning_output_tokens, 20);
        assert_eq!(session.usage.total_tokens, 1280);
        assert_eq!(session.token_events, 1);
    }

    #[test]
    fn imports_only_safe_codex_session_sources_and_skips_auth() {
        let temp = tempfile::tempdir().unwrap();
        let codex_home = temp.path();
        let sessions = codex_home
            .join("sessions")
            .join("2026")
            .join("06")
            .join("15");
        fs::create_dir_all(&sessions).unwrap();
        fs::write(
            sessions.join("rollout-2026-06-15T01-00-00-session-2.jsonl"),
            r#"{"timestamp":"2026-06-15T01:00:00.000Z","type":"session_meta","payload":{"id":"session-2","timestamp":"2026-06-15T01:00:00.000Z","cwd":"D:\\Projects\\beta","model":"gpt-5.4-mini"}}
{"timestamp":"2026-06-15T01:02:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":50,"cached_input_tokens":10,"output_tokens":15,"reasoning_output_tokens":0,"total_tokens":65}}}}"#,
        )
        .unwrap();
        fs::write(codex_home.join("auth.json"), r#"{"secret":"do-not-read"}"#).unwrap();
        fs::write(
            codex_home.join("history.jsonl"),
            r#"{"session_id":"history-only","ts":1781499600,"text":"hello"}"#,
        )
        .unwrap();

        let result = import_codex_sessions(codex_home);

        assert_eq!(result.sessions.len(), 1);
        assert_eq!(result.sessions[0].id, "session-2");
        assert!(!result.sessions[0].source_path.ends_with("auth.json"));
        assert_eq!(result.scanned_files, 1);
        assert_eq!(result.skipped_files, 0);
    }

    #[test]
    fn daily_and_project_breakdowns_use_last_token_usage_events() {
        let content = r#"{"timestamp":"2026-06-14T23:59:00.000Z","type":"session_meta","payload":{"id":"session-3","timestamp":"2026-06-14T23:58:00.000Z","cwd":"D:\\Projects\\alpha","model":"gpt-5.4"}}
{"timestamp":"2026-06-14T23:59:30.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":100,"cached_input_tokens":20,"output_tokens":10,"reasoning_output_tokens":1,"total_tokens":110},"last_token_usage":{"input_tokens":100,"cached_input_tokens":20,"output_tokens":10,"reasoning_output_tokens":1,"total_tokens":110}}}}
{"timestamp":"2026-06-15T00:02:00.000Z","type":"turn_context","payload":{"cwd":"D:\\Projects\\beta","model":"gpt-5.4"}}
{"timestamp":"2026-06-15T00:03:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":300,"cached_input_tokens":80,"output_tokens":40,"reasoning_output_tokens":5,"total_tokens":340},"last_token_usage":{"input_tokens":200,"cached_input_tokens":60,"output_tokens":30,"reasoning_output_tokens":4,"total_tokens":230}}}}"#;

        let session = parse_session_jsonl(Path::new("rollout-session-3.jsonl"), content).unwrap();
        let dashboard = build_dashboard(
            vec![session],
            1,
            1,
            0,
            0,
            Path::new("C:\\Users\\phili\\.codex"),
            Path::new("ledger.sqlite"),
            "2026-06-15T00:04:00Z".to_string(),
        );

        assert_eq!(dashboard.summary.total_tokens, 340);
        assert_eq!(dashboard.daily_usage.len(), 2);
        assert_eq!(dashboard.daily_usage[0].date, "2026-06-14");
        assert_eq!(dashboard.daily_usage[0].total_tokens, 110);
        assert_eq!(dashboard.daily_usage[1].date, "2026-06-15");
        assert_eq!(dashboard.daily_usage[1].total_tokens, 230);
        assert_eq!(dashboard.project_usage.len(), 2);
        assert_eq!(dashboard.project_usage[0].project_name, "beta");
        assert_eq!(dashboard.project_usage[0].total_tokens, 230);
        assert_eq!(dashboard.project_usage[1].project_name, "alpha");
        assert_eq!(dashboard.project_usage[1].total_tokens, 110);
    }

    #[test]
    fn refresh_removes_sessions_missing_from_the_current_scan() {
        let temp = tempfile::tempdir().unwrap();
        let codex_home = temp.path().join("codex");
        let db_path = temp.path().join("ledger.sqlite");
        let sessions = codex_home
            .join("sessions")
            .join("2026")
            .join("06")
            .join("15");
        fs::create_dir_all(&sessions).unwrap();
        let session_path = sessions.join("rollout-2026-06-15T01-00-00-session-4.jsonl");
        fs::write(
            &session_path,
            r#"{"timestamp":"2026-06-15T01:00:00.000Z","type":"session_meta","payload":{"id":"session-4","timestamp":"2026-06-15T01:00:00.000Z","cwd":"D:\\Projects\\alpha","model":"gpt-5.4"}}
{"timestamp":"2026-06-15T01:01:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":10,"cached_input_tokens":0,"output_tokens":5,"reasoning_output_tokens":0,"total_tokens":15},"last_token_usage":{"input_tokens":10,"cached_input_tokens":0,"output_tokens":5,"reasoning_output_tokens":0,"total_tokens":15}}}}"#,
        )
        .unwrap();

        let first = refresh_database(&db_path, &codex_home).unwrap();
        assert_eq!(first.sessions.len(), 1);

        fs::remove_file(session_path).unwrap();
        let second = refresh_database(&db_path, &codex_home).unwrap();
        assert_eq!(second.sessions.len(), 0);
        assert_eq!(second.summary.total_tokens, 0);
    }

    #[test]
    fn refresh_parses_only_new_or_changed_rollout_files() {
        let temp = tempfile::tempdir().unwrap();
        let codex_home = temp.path().join("codex");
        let db_path = temp.path().join("ledger.sqlite");
        let sessions = codex_home
            .join("sessions")
            .join("2026")
            .join("06")
            .join("15");
        fs::create_dir_all(&sessions).unwrap();
        let session_path = sessions.join("rollout-2026-06-15T01-00-00-session-5.jsonl");
        fs::write(
            &session_path,
            r#"{"timestamp":"2026-06-15T01:00:00.000Z","type":"session_meta","payload":{"id":"session-5","timestamp":"2026-06-15T01:00:00.000Z","cwd":"D:\\Projects\\alpha","model":"gpt-5.4"}}
{"timestamp":"2026-06-15T01:01:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":10,"cached_input_tokens":0,"output_tokens":5,"reasoning_output_tokens":0,"total_tokens":15},"last_token_usage":{"input_tokens":10,"cached_input_tokens":0,"output_tokens":5,"reasoning_output_tokens":0,"total_tokens":15}}}}"#,
        )
        .unwrap();

        let first = refresh_database(&db_path, &codex_home).unwrap();
        assert_eq!(first.scanned_files, 1);
        assert_eq!(first.parsed_files, 1);
        assert_eq!(first.unchanged_files, 0);

        let second = refresh_database(&db_path, &codex_home).unwrap();
        assert_eq!(second.scanned_files, 1);
        assert_eq!(second.parsed_files, 0);
        assert_eq!(second.unchanged_files, 1);
        assert_eq!(second.summary.total_tokens, 15);

        fs::write(
            &session_path,
            r#"{"timestamp":"2026-06-15T01:00:00.000Z","type":"session_meta","payload":{"id":"session-5","timestamp":"2026-06-15T01:00:00.000Z","cwd":"D:\\Projects\\alpha","model":"gpt-5.5"}}
{"timestamp":"2026-06-15T01:02:00.000Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":30,"cached_input_tokens":10,"output_tokens":7,"reasoning_output_tokens":1,"total_tokens":37},"last_token_usage":{"input_tokens":30,"cached_input_tokens":10,"output_tokens":7,"reasoning_output_tokens":1,"total_tokens":37}}}}"#,
        )
        .unwrap();

        let third = refresh_database(&db_path, &codex_home).unwrap();
        assert_eq!(third.parsed_files, 1);
        assert_eq!(third.unchanged_files, 0);
        assert_eq!(third.summary.total_tokens, 37);
        assert_eq!(third.sessions[0].model.as_deref(), Some("gpt-5.5"));
    }
}
