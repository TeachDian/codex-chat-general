import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Database,
  FolderGit2,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  Search,
  ServerCog,
  Settings,
  Sparkles,
} from "lucide-react";
import "./App.css";
import { MetricCard } from "./components/MetricCard";
import { ProjectTable } from "./components/ProjectTable";
import { SessionDetail } from "./components/SessionDetail";
import { SessionTable } from "./components/SessionTable";
import { UsageChart } from "./components/UsageChart";
import { loadUsage, refreshUsage } from "./tauriApi";
import {
  applyDashboardRange,
  deriveDashboardFromSessions,
  formatDateTime,
  formatTokens,
  type DashboardData,
  type DateRange,
  type SessionUsage,
} from "./usageModel";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true, disabled: false },
  { label: "Projects", icon: FolderGit2, active: false, disabled: true },
  { label: "Sessions", icon: Activity, active: false, disabled: true },
  { label: "Daily Usage", icon: CalendarDays, active: false, disabled: true },
  { label: "Settings", icon: Settings, active: false, disabled: true },
];

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("30d");
  const [query, setQuery] = useState("");
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
        setSelectedSessionId(dashboard.sessions[0]?.id ?? null);
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

  const visibleData = useMemo(() => {
    if (!data) {
      return null;
    }

    const ranged = applyDashboardRange(data, range, new Date().toISOString());
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return ranged;
    }

    const sessions = ranged.sessions.filter((session) =>
      [session.title, session.project_name, session.project_path, session.model, session.id]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );

    return deriveDashboardFromSessions(ranged, sessions);
  }, [data, query, range]);

  const selectedSession = useMemo(() => {
    const sessions = visibleData?.sessions ?? [];
    return sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null;
  }, [selectedSessionId, visibleData]);

  async function handleRefresh() {
    setStatus("refreshing");
    setError(null);
    try {
      const dashboard = await refreshUsage();
      setData(dashboard);
      setSelectedSessionId(dashboard.sessions[0]?.id ?? null);
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus("error");
    }
  }

  function handleSelectSession(session: SessionUsage) {
    setSelectedSessionId(session.id);
  }

  const dashboard = visibleData ?? data;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Gauge size={22} />
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
                aria-current={item.active ? "page" : undefined}
                className={item.active ? "nav-item active" : "nav-item"}
                disabled={item.disabled}
                key={item.label}
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

        <section className="toolbar">
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

            <section className="content-grid">
              <div className="main-column">
                <UsageChart data={dashboard.daily_usage} />
                <ProjectTable projects={dashboard.project_usage.slice(0, 10)} />
                <SessionTable
                  onSelect={handleSelectSession}
                  selectedId={selectedSession?.id ?? null}
                  sessions={dashboard.sessions.slice(0, 50)}
                />
              </div>
              <SessionDetail session={selectedSession} />
            </section>
          </>
        ) : (
          <section className="loading-panel">
            <RefreshCw size={22} />
            <h2>Loading local usage</h2>
            <p>Reading safe Codex session indexes and building the local ledger.</p>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
