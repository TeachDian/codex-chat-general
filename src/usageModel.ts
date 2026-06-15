export type DateRange = "7d" | "30d" | "all";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_output_tokens: number;
  total_tokens: number;
}

export interface SessionUsage {
  id: string;
  title: string;
  project_path: string | null;
  project_name: string;
  model: string | null;
  started_at: string | null;
  updated_at: string | null;
  source_path: string;
  usage: TokenUsage;
  token_events: number;
}

export interface SummaryStats {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_output_tokens: number;
  sessions: number;
  projects: number;
}

export interface DailyUsage {
  date: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  sessions: number;
}

export interface ProjectUsage {
  project_path: string;
  project_name: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  sessions: number;
  updated_at: string | null;
}

export interface DashboardData {
  summary: SummaryStats;
  daily_usage: DailyUsage[];
  project_usage: ProjectUsage[];
  sessions: SessionUsage[];
  scanned_files: number;
  skipped_files: number;
  codex_home: string;
  database_path: string;
  last_imported_at: string;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${trimDecimal(value / 1_000_000, 2)}M`;
  }
  if (value >= 10_000) {
    return `${trimDecimal(value / 1_000, 1)}K`;
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function filterSessionsByRange(
  sessions: SessionUsage[],
  range: DateRange,
  nowIso: string,
): SessionUsage[] {
  if (range === "all") {
    return sessions;
  }

  const now = new Date(nowIso).getTime();
  const days = range === "7d" ? 7 : 30;
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  return sessions.filter((session) => {
    const timestamp = session.updated_at ?? session.started_at;
    if (!timestamp) {
      return false;
    }
    return new Date(timestamp).getTime() >= cutoff;
  });
}

function trimDecimal(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(isoDate: string | null): string {
  if (!isoDate) {
    return "Unknown";
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function applyDashboardRange(data: DashboardData, range: DateRange, nowIso: string): DashboardData {
  if (range === "all") {
    return data;
  }

  const sessions = filterSessionsByRange(data.sessions, range, nowIso);
  return deriveDashboardFromSessions(data, sessions);
}

export function deriveDashboardFromSessions(
  data: DashboardData,
  sessions: SessionUsage[],
): DashboardData {
  return {
    ...data,
    sessions,
    daily_usage: aggregateDaily(sessions),
    project_usage: aggregateProjects(sessions),
    summary: aggregateSummary(sessions),
  };
}

function aggregateSummary(sessions: SessionUsage[]): SummaryStats {
  const projects = new Set(sessions.map((session) => session.project_path ?? "Unknown project"));
  return sessions.reduce<SummaryStats>(
    (summary, session) => ({
      total_tokens: summary.total_tokens + session.usage.total_tokens,
      input_tokens: summary.input_tokens + session.usage.input_tokens,
      output_tokens: summary.output_tokens + session.usage.output_tokens,
      cached_tokens: summary.cached_tokens + session.usage.cached_tokens,
      reasoning_output_tokens:
        summary.reasoning_output_tokens + session.usage.reasoning_output_tokens,
      sessions: summary.sessions + 1,
      projects: projects.size,
    }),
    {
      total_tokens: 0,
      input_tokens: 0,
      output_tokens: 0,
      cached_tokens: 0,
      reasoning_output_tokens: 0,
      sessions: 0,
      projects: projects.size,
    },
  );
}

function aggregateDaily(sessions: SessionUsage[]): DailyUsage[] {
  const daily = new Map<string, DailyUsage>();

  for (const session of sessions) {
    const timestamp = session.updated_at ?? session.started_at;
    if (!timestamp) {
      continue;
    }
    const date = timestamp.slice(0, 10);
    const current =
      daily.get(date) ??
      ({
        date,
        total_tokens: 0,
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        sessions: 0,
      } satisfies DailyUsage);

    current.total_tokens += session.usage.total_tokens;
    current.input_tokens += session.usage.input_tokens;
    current.output_tokens += session.usage.output_tokens;
    current.cached_tokens += session.usage.cached_tokens;
    current.sessions += 1;
    daily.set(date, current);
  }

  return Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateProjects(sessions: SessionUsage[]): ProjectUsage[] {
  const projects = new Map<string, ProjectUsage>();

  for (const session of sessions) {
    const key = session.project_path ?? "Unknown project";
    const current =
      projects.get(key) ??
      ({
        project_path: key,
        project_name: session.project_name,
        total_tokens: 0,
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        sessions: 0,
        updated_at: null,
      } satisfies ProjectUsage);

    current.total_tokens += session.usage.total_tokens;
    current.input_tokens += session.usage.input_tokens;
    current.output_tokens += session.usage.output_tokens;
    current.cached_tokens += session.usage.cached_tokens;
    current.sessions += 1;
    if (!current.updated_at || (session.updated_at && session.updated_at > current.updated_at)) {
      current.updated_at = session.updated_at;
    }
    projects.set(key, current);
  }

  return Array.from(projects.values()).sort((a, b) => b.total_tokens - a.total_tokens);
}
