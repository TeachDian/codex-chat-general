import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Copy,
  Database,
  Download,
  FolderGit2,
  LayoutDashboard,
  RefreshCw,
  Search,
  ServerCog,
  Settings,
  Sparkles,
} from "lucide-react";
import "./app.css";
import { MetricCard } from "./components/metric-card";
import { DailyCostTable } from "./components/daily-cost-table";
import { BootSkeleton } from "./components/boot-skeleton";
import { ModelCostTable } from "./components/model-cost-table";
import { ModelShareChart } from "./components/model-share-chart";
import { ProjectTable } from "./components/project-table";
import { SessionDetail } from "./components/session-detail";
import { SessionTable } from "./components/session-table";
import { UsageChart } from "./components/usage-chart";
import { loadUsage, refreshUsage } from "./tauri-api";
import {
  applyUsageFilters,
  buildUsageFilterOptions,
  formatDateTime,
  formatCurrency,
  formatTokens,
  buildModelUsage,
  type DashboardData,
  type DateRange,
  type SessionUsage,
} from "./usage-model";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "sessions", label: "Sessions", icon: Activity },
  { id: "daily-usage", label: "Daily Usage", icon: CalendarDays },
  { id: "settings", label: "Settings", icon: Settings },
];

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState("all");
  const [selectedProjectPath, setSelectedProjectPath] = useState("all");
  const [selectedModel, setSelectedModel] = useState("all");
  const [range, setRange] = useState<DateRange>("30d");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState<"loading" | "ready" | "refreshing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loadUsage()
      .then((dashboard) => {
        if (!mounted) {
          return;
        }
        setData(dashboard);
        setSelectedSessionId("all");
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (!mounted) {
          return;
        }
        setError(cause instanceof Error ? cause.message : String(cause));
        setStatus("error");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filterOptions = useMemo(() => buildUsageFilterOptions(data?.sessions ?? []), [data]);
  const sessionPickerOptions = useMemo(() => {
    if (!data) {
      return filterOptions.sessions;
    }

    return buildUsageFilterOptions(
      applyUsageFilters(data, {
        range,
        nowIso: new Date().toISOString(),
        query: deferredQuery,
        projectPath: selectedProjectPath,
        model: selectedModel,
        sessionId: "all",
      }).sessions,
    ).sessions;
  }, [data, deferredQuery, filterOptions.sessions, range, selectedModel, selectedProjectPath]);

  useEffect(() => {
    const projectValues = new Set(filterOptions.projects.map((option) => option.value));
    const modelValues = new Set(filterOptions.models.map((option) => option.value));
    const sessionValues = new Set(sessionPickerOptions.map((option) => option.value));

    if (!projectValues.has(selectedProjectPath)) {
      setSelectedProjectPath("all");
    }
    if (!modelValues.has(selectedModel)) {
      setSelectedModel("all");
    }
    if (!sessionValues.has(selectedSessionId)) {
      setSelectedSessionId("all");
    }
  }, [filterOptions, selectedModel, selectedProjectPath, selectedSessionId, sessionPickerOptions]);

  const visibleData = useMemo(() => {
    if (!data) {
      return null;
    }

    return applyUsageFilters(data, {
      range,
      nowIso: new Date().toISOString(),
      query: deferredQuery,
      projectPath: selectedProjectPath,
      model: selectedModel,
      sessionId: selectedSessionId,
    });
  }, [data, deferredQuery, range, selectedModel, selectedProjectPath, selectedSessionId]);

  const selectedSession = useMemo(() => {
    if (selectedSessionId === "all") {
      return null;
    }
    return (visibleData?.sessions ?? []).find((session) => session.id === selectedSessionId) ?? null;
  }, [selectedSessionId, visibleData]);

  const estimatedApiCost = useMemo(() => {
    return buildModelUsage(visibleData?.sessions ?? []).reduce((total, row) => total + row.api_usd, 0);
  }, [visibleData]);

  async function handleRefresh() {
    setStatus("refreshing");
    setError(null);
    try {
      const dashboard = await refreshUsage();
      setData(dashboard);
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus("error");
    }
  }

  function handleSelectSession(session: SessionUsage) {
    setSelectedSessionId(session.id);
  }

  function handleShowAllSessions() {
    setSelectedSessionId("all");
  }

  function handleNavClick(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleExportCsv() {
    if (!dashboard) {
      return;
    }
    const csv = buildSessionCsv(dashboard.sessions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `token-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopySummary() {
    if (!dashboard) {
      return;
    }
    const text = [
      `Token Ledger report`,
      `Sessions: ${dashboard.summary.sessions}`,
      `Projects: ${dashboard.summary.projects}`,
      `Total tokens: ${formatTokens(dashboard.summary.total_tokens)}`,
      `Input tokens: ${formatTokens(dashboard.summary.input_tokens)}`,
      `Output tokens: ${formatTokens(dashboard.summary.output_tokens)}`,
      `Cached tokens: ${formatTokens(dashboard.summary.cached_tokens)}`,
      `Estimated API cost: ${formatCurrency(estimatedApiCost)}`,
    ].join("\n");
    await navigator.clipboard?.writeText(text);
  }

  const dashboard = visibleData ?? data;
  const activeScopeLabel =
    selectedSessionId === "all"
      ? "All matching sessions"
      : selectedSession?.title ?? "Selected session";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <img alt="" src="/token-ledger-app-icon.png" />
          </div>
          <div>
            <strong>Token Ledger</strong>
            <span>Codex usage tracker</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className="nav-item"
                key={item.label}
                onClick={() => handleNavClick(item.id)}
                type="button"
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Sparkles size={16} />
          <div>
            <strong>Local only</strong>
            <span>No auth files imported</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyeline">Device usage</p>
            <h1>Codex Token Usage</h1>
            <span>
              Imports rollout JSONL sessions when opened and stores summaries in local SQLite.
            </span>
          </div>

          <div className="topbar-actions">
            <div className="status-pill">
              <span className={`status-dot ${status}`} />
              {status === "refreshing" ? "Importing sessions" : status === "loading" ? "Loading" : status === "error" ? "Needs attention" : "Synced"}
            </div>
            <div className="range-control" aria-label="Date range">
              {(["7d", "30d", "all"] as DateRange[]).map((option) => (
                <button
                  className={range === option ? "active" : ""}
                  key={option}
                  onClick={() => setRange(option)}
                  type="button"
                >
                  {option === "all" ? "All" : option.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="primary-button" disabled={status === "refreshing"} onClick={handleRefresh} type="button">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <section className="error-banner">
            <ServerCog size={18} />
            <span>{error}</span>
          </section>
        ) : null}

        <section className="toolbar" id="overview">
          <label className="search-box">
            <Search size={16} />
            <input
              aria-label="Search sessions and projects"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sessions, projects, models..."
              value={query}
            />
          </label>
          <div className="source-meta">
            <span>{dashboard?.codex_home ?? "Resolving Codex home"}</span>
            <strong>Last import {dashboard ? formatDateTime(dashboard.last_imported_at) : "pending"}</strong>
          </div>
        </section>

        {dashboard ? (
          <>
            <section className="filter-panel" aria-label="Report filters">
              <label>
                <span>Project</span>
                <select
                  value={selectedProjectPath}
                  onChange={(event) => {
                    setSelectedProjectPath(event.target.value);
                    setSelectedSessionId("all");
                  }}
                >
                  {filterOptions.projects.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Model</span>
                <select
                  value={selectedModel}
                  onChange={(event) => {
                    setSelectedModel(event.target.value);
                    setSelectedSessionId("all");
                  }}
                >
                  {filterOptions.models.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Session scope</span>
                <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
                  {sessionPickerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="filter-actions">
                <button onClick={handleShowAllSessions} type="button">
                  All sessions
                </button>
                <button onClick={handleCopySummary} type="button">
                  <Copy size={15} />
                  Copy
                </button>
                <button onClick={handleExportCsv} type="button">
                  <Download size={15} />
                  CSV
                </button>
              </div>
            </section>

            <section className="scope-strip">
              <strong>{activeScopeLabel}</strong>
              <span>
                {dashboard.summary.sessions} sessions · {dashboard.summary.projects} projects · {formatTokens(dashboard.summary.total_tokens)} tokens
              </span>
            </section>

            <section className="metric-grid">
              <MetricCard
                detail={`${dashboard.summary.sessions} sessions across ${dashboard.summary.projects} projects`}
                icon={<BarChart3 size={20} />}
                label="Total tokens"
                value={dashboard.summary.total_tokens}
              />
              <MetricCard
                detail="Prompt, tools, and context"
                icon={<Activity size={20} />}
                label="Input tokens"
                tone="blue"
                value={dashboard.summary.input_tokens}
              />
              <MetricCard
                detail="Assistant and reasoning output"
                icon={<Sparkles size={20} />}
                label="Output tokens"
                tone="green"
                value={dashboard.summary.output_tokens}
              />
              <MetricCard
                detail={`${formatTokens(dashboard.summary.reasoning_output_tokens)} reasoning output`}
                icon={<Database size={20} />}
                label="Cached tokens"
                tone="orange"
                value={dashboard.summary.cached_tokens}
              />
            </section>

            <section className="pricing-summary">
              <div>
                <span>Estimated API cost</span>
                <strong>{formatCurrency(estimatedApiCost)}</strong>
              </div>
              <p>
                Uses OpenAI standard short-context rates as a local estimate. Cached input is
                billed separately from non-cached input to avoid double-counting.
              </p>
            </section>

            <section className="content-grid">
              <div className="main-column">
                <div id="daily-usage">
                  <UsageChart data={dashboard.daily_usage} />
                </div>
                <ModelShareChart sessions={dashboard.sessions} />
                <ModelCostTable sessions={dashboard.sessions} />
                <DailyCostTable sessions={dashboard.sessions} />
                <div id="projects">
                  <ProjectTable
                    onSelectProject={(projectPath) => {
                      setSelectedProjectPath(projectPath);
                      setSelectedSessionId("all");
                    }}
                    projects={dashboard.project_usage.slice(0, 50)}
                  />
                </div>
                <div id="sessions">
                  <SessionTable
                    onSelect={handleSelectSession}
                    selectedId={selectedSession?.id ?? null}
                    sessions={dashboard.sessions.slice(0, 250)}
                  />
                </div>
                <section className="panel settings-panel" id="settings">
                  <div className="panel-heading">
                    <div>
                      <h2>Settings & Scanner Status</h2>
                      <p>Local cache, read-only source policy, and incremental scan counters.</p>
                    </div>
                  </div>
                  <div className="settings-grid">
                    <div>
                      <span>Codex home</span>
                      <strong>{dashboard.codex_home}</strong>
                    </div>
                    <div>
                      <span>Local database</span>
                      <strong>{dashboard.database_path}</strong>
                    </div>
                    <div>
                      <span>Scanned rollout files</span>
                      <strong>{formatTokens(dashboard.scanned_files)}</strong>
                    </div>
                    <div>
                      <span>Parsed this scan</span>
                      <strong>{formatTokens(dashboard.parsed_files)}</strong>
                    </div>
                    <div>
                      <span>Unchanged cache hits</span>
                      <strong>{formatTokens(dashboard.unchanged_files)}</strong>
                    </div>
                    <div>
                      <span>Skipped files</span>
                      <strong>{formatTokens(dashboard.skipped_files)}</strong>
                    </div>
                  </div>
                  <p className="settings-note">
                    The scanner only reads Codex rollout session JSONL files under sessions and
                    archived_sessions. Auth, sandbox secret, and prompt history files are not
                    imported or modified.
                  </p>
                </section>
              </div>
              <SessionDetail session={selectedSession} sessions={dashboard.sessions} />
            </section>
          </>
        ) : (
          <BootSkeleton />
        )}
      </section>
    </main>
  );
}

function buildSessionCsv(sessions: SessionUsage[]): string {
  const headers = [
    "session_id",
    "title",
    "project_name",
    "project_path",
    "model",
    "started_at",
    "updated_at",
    "total_tokens",
    "input_tokens",
    "output_tokens",
    "cached_tokens",
    "reasoning_output_tokens",
    "source_path",
  ];
  const rows = sessions.map((session) =>
    [
      session.id,
      session.title,
      session.project_name,
      session.project_path ?? "",
      session.model ?? "",
      session.started_at ?? "",
      session.updated_at ?? "",
      session.usage.total_tokens,
      session.usage.input_tokens,
      session.usage.output_tokens,
      session.usage.cached_tokens,
      session.usage.reasoning_output_tokens,
      session.source_path,
    ].map(csvCell),
  );

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default App;
