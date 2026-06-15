export type DateRange = "7d" | "30d" | "all";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_output_tokens: number;
  total_tokens: number;
}

export interface UsageEvent {
  event_index: number;
  occurred_at: string;
  project_path: string | null;
  project_name: string;
  usage: TokenUsage;
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
  usage_events: UsageEvent[];
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
  parsed_files: number;
  unchanged_files: number;
  skipped_files: number;
  codex_home: string;
  database_path: string;
  last_imported_at: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface UsageFilterOptions {
  projects: SelectOption[];
  models: SelectOption[];
  sessions: SelectOption[];
}

export interface UsageFilters {
  range: DateRange;
  nowIso: string;
  query: string;
  projectPath: string;
  model: string;
  sessionId: string;
}

export interface TokenRateCard {
  input_per_million: number;
  cached_input_per_million: number;
  output_per_million: number;
}

export interface ModelPricing {
  model: string;
  api_usd: TokenRateCard | null;
  codex_credits: TokenRateCard | null;
}

export interface EstimatedCost {
  model: string;
  has_pricing: boolean;
  api_usd: number;
  codex_credits: number;
  billable_input_tokens: number;
}

export interface ModelUsage {
  model: string;
  sessions: number;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  total_tokens: number;
  api_usd: number;
  codex_credits: number;
  has_pricing: boolean;
  last_used_at: string | null;
}

export interface DailyModelUsage {
  date: string;
  sessions: number;
  top_model: string;
  models: string[];
  total_tokens: number;
  input_tokens: number;
  cached_tokens: number;
  output_tokens: number;
  api_usd: number;
  codex_credits: number;
}

export const PRICING_SNAPSHOT_DATE = "2026-06-15";
export const PRICING_SOURCE_URL = "https://developers.openai.com/api/docs/pricing";
export const CODEX_PRICING_SOURCE_URL = "https://developers.openai.com/codex/pricing";

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-5.5": {
    model: "gpt-5.5",
    api_usd: {
      input_per_million: 5,
      cached_input_per_million: 0.5,
      output_per_million: 30,
    },
    codex_credits: {
      input_per_million: 125,
      cached_input_per_million: 12.5,
      output_per_million: 750,
    },
  },
  "gpt-5.4": {
    model: "gpt-5.4",
    api_usd: {
      input_per_million: 2.5,
      cached_input_per_million: 0.25,
      output_per_million: 15,
    },
    codex_credits: {
      input_per_million: 62.5,
      cached_input_per_million: 6.25,
      output_per_million: 375,
    },
  },
  "gpt-5.4-mini": {
    model: "gpt-5.4-mini",
    api_usd: {
      input_per_million: 0.75,
      cached_input_per_million: 0.075,
      output_per_million: 4.5,
    },
    codex_credits: {
      input_per_million: 18.75,
      cached_input_per_million: 1.875,
      output_per_million: 113,
    },
  },
  "gpt-5.4-nano": {
    model: "gpt-5.4-nano",
    api_usd: {
      input_per_million: 0.2,
      cached_input_per_million: 0.02,
      output_per_million: 1.25,
    },
    codex_credits: null,
  },
  "gpt-5.3-codex": {
    model: "gpt-5.3-codex",
    api_usd: {
      input_per_million: 1.75,
      cached_input_per_million: 0.175,
      output_per_million: 14,
    },
    codex_credits: null,
  },
};

export function formatTokens(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 10 ? 2 : 3,
  }).format(value);
}

export function formatCredits(value: number): string {
  return `${trimDecimal(value, value >= 100 ? 1 : 3)} credits`;
}

export function normalizeModelName(model: string | null): string {
  if (!model?.trim()) {
    return "unknown";
  }
  return model.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

export function estimateTokenCost(model: string | null, usage: TokenUsage): EstimatedCost {
  const normalized = normalizeModelName(model);
  const pricing = MODEL_PRICING[normalized];
  const cachedTokens = Math.min(usage.cached_tokens, usage.input_tokens);
  const billableInputTokens = Math.max(usage.input_tokens - cachedTokens, 0);

  return {
    model: normalized,
    has_pricing: Boolean(pricing?.api_usd || pricing?.codex_credits),
    api_usd: pricing?.api_usd ? estimateFromRateCard(pricing.api_usd, usage, billableInputTokens) : 0,
    codex_credits: pricing?.codex_credits
      ? estimateFromRateCard(pricing.codex_credits, usage, billableInputTokens)
      : 0,
    billable_input_tokens: billableInputTokens,
  };
}

export function buildModelUsage(sessions: SessionUsage[]): ModelUsage[] {
  const byModel = new Map<string, ModelUsage>();

  for (const session of sessions) {
    const model = normalizeModelName(session.model);
    const existing =
      byModel.get(model) ??
      ({
        model,
        sessions: 0,
        input_tokens: 0,
        cached_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        api_usd: 0,
        codex_credits: 0,
        has_pricing: Boolean(MODEL_PRICING[model]),
        last_used_at: null,
      } satisfies ModelUsage);
    const estimate = estimateTokenCost(model, session.usage);

    existing.sessions += 1;
    existing.input_tokens += session.usage.input_tokens;
    existing.cached_tokens += session.usage.cached_tokens;
    existing.output_tokens += session.usage.output_tokens;
    existing.total_tokens += session.usage.total_tokens;
    existing.api_usd += estimate.api_usd;
    existing.codex_credits += estimate.codex_credits;
    existing.has_pricing = existing.has_pricing || estimate.has_pricing;
    if (!existing.last_used_at || (session.updated_at && session.updated_at > existing.last_used_at)) {
      existing.last_used_at = session.updated_at;
    }

    byModel.set(model, existing);
  }

  return Array.from(byModel.values()).sort((a, b) => b.total_tokens - a.total_tokens);
}

export function buildDailyModelUsage(sessions: SessionUsage[]): DailyModelUsage[] {
  const byDate = new Map<string, DailyModelUsage & { modelTotals: Map<string, number> }>();

  for (const session of sessions) {
    const timestamp = session.updated_at ?? session.started_at;
    if (!timestamp) {
      continue;
    }
    const date = timestamp.slice(0, 10);
    const model = normalizeModelName(session.model);
    const estimate = estimateTokenCost(model, session.usage);
    const current =
      byDate.get(date) ??
      ({
        date,
        sessions: 0,
        top_model: model,
        models: [],
        total_tokens: 0,
        input_tokens: 0,
        cached_tokens: 0,
        output_tokens: 0,
        api_usd: 0,
        codex_credits: 0,
        modelTotals: new Map<string, number>(),
      } satisfies DailyModelUsage & { modelTotals: Map<string, number> });

    current.sessions += 1;
    current.total_tokens += session.usage.total_tokens;
    current.input_tokens += session.usage.input_tokens;
    current.cached_tokens += session.usage.cached_tokens;
    current.output_tokens += session.usage.output_tokens;
    current.api_usd += estimate.api_usd;
    current.codex_credits += estimate.codex_credits;
    current.modelTotals.set(model, (current.modelTotals.get(model) ?? 0) + session.usage.total_tokens);
    current.models = Array.from(current.modelTotals.keys()).sort();
    current.top_model = Array.from(current.modelTotals.entries()).sort((a, b) => b[1] - a[1])[0][0];
    byDate.set(date, current);
  }

  return Array.from(byDate.values())
    .map(({ modelTotals: _modelTotals, ...daily }) => daily)
    .sort((a, b) => b.date.localeCompare(a.date));
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

export function buildUsageFilterOptions(sessions: SessionUsage[]): UsageFilterOptions {
  const projects = new Map<string, SelectOption>();
  const models = new Set<string>();

  for (const session of sessions) {
    const projectValue = session.project_path ?? "Unknown project";
    if (!projects.has(projectValue)) {
      projects.set(projectValue, {
        value: projectValue,
        label: session.project_name || projectValue,
      });
    }
    models.add(normalizeModelName(session.model));
  }

  const sessionOptions = sessions.map((session) => ({
    value: session.id,
    label: `${session.title} (${session.project_name})`,
  }));

  return {
    projects: [
      { value: "all", label: "All projects" },
      ...Array.from(projects.values()).sort((a, b) => a.label.localeCompare(b.label)),
    ],
    models: [
      { value: "all", label: "All models" },
      ...Array.from(models)
        .sort()
        .map((model) => ({ value: model, label: model })),
    ],
    sessions: [{ value: "all", label: "All matching sessions" }, ...sessionOptions],
  };
}

export function applyUsageFilters(data: DashboardData, filters: UsageFilters): DashboardData {
  const ranged = applyDashboardRange(data, filters.range, filters.nowIso);
  const normalizedQuery = filters.query.trim().toLowerCase();
  const normalizedModel = normalizeModelName(filters.model);

  const sessions = ranged.sessions.filter((session) => {
    if (filters.projectPath !== "all" && (session.project_path ?? "Unknown project") !== filters.projectPath) {
      return false;
    }
    if (filters.model !== "all" && normalizeModelName(session.model) !== normalizedModel) {
      return false;
    }
    if (filters.sessionId !== "all" && session.id !== filters.sessionId) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return [session.title, session.project_name, session.project_path, session.model, session.id]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(normalizedQuery));
  });

  return deriveDashboardFromSessions(ranged, sessions);
}

function estimateFromRateCard(
  rates: TokenRateCard,
  usage: TokenUsage,
  billableInputTokens: number,
): number {
  const cachedTokens = Math.min(usage.cached_tokens, usage.input_tokens);
  return roundMoney(
    (billableInputTokens / 1_000_000) * rates.input_per_million +
      (cachedTokens / 1_000_000) * rates.cached_input_per_million +
      (usage.output_tokens / 1_000_000) * rates.output_per_million,
  );
}

function roundMoney(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
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
  const dailySessions = new Map<string, Set<string>>();

  for (const session of sessions) {
    if (session.usage_events?.length) {
      for (const event of session.usage_events) {
        addDailyUsage(daily, dailySessions, event.occurred_at.slice(0, 10), session.id, event.usage);
      }
      continue;
    }

    const timestamp = session.updated_at ?? session.started_at;
    if (!timestamp) {
      continue;
    }
    addDailyUsage(daily, dailySessions, timestamp.slice(0, 10), session.id, session.usage);
  }

  return Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateProjects(sessions: SessionUsage[]): ProjectUsage[] {
  const projects = new Map<string, ProjectUsage>();
  const projectSessions = new Map<string, Set<string>>();

  for (const session of sessions) {
    if (session.usage_events?.length) {
      for (const event of session.usage_events) {
        addProjectUsage(
          projects,
          projectSessions,
          event.project_path ?? "Unknown project",
          event.project_name,
          event.occurred_at,
          session.id,
          event.usage,
        );
      }
      continue;
    }

    const key = session.project_path ?? "Unknown project";
    addProjectUsage(projects, projectSessions, key, session.project_name, session.updated_at, session.id, session.usage);
  }

  return Array.from(projects.values()).sort((a, b) => b.total_tokens - a.total_tokens);
}

function addDailyUsage(
  daily: Map<string, DailyUsage>,
  dailySessions: Map<string, Set<string>>,
  date: string,
  sessionId: string,
  usage: TokenUsage,
) {
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
  current.total_tokens += usage.total_tokens;
  current.input_tokens += usage.input_tokens;
  current.output_tokens += usage.output_tokens;
  current.cached_tokens += usage.cached_tokens;
  const sessions = dailySessions.get(date) ?? new Set<string>();
  sessions.add(sessionId);
  dailySessions.set(date, sessions);
  current.sessions = sessions.size;
  daily.set(date, current);
}

function addProjectUsage(
  projects: Map<string, ProjectUsage>,
  projectSessions: Map<string, Set<string>>,
  projectPath: string,
  projectName: string,
  updatedAt: string | null,
  sessionId: string,
  usage: TokenUsage,
) {
  const current =
    projects.get(projectPath) ??
    ({
      project_path: projectPath,
      project_name: projectName,
      total_tokens: 0,
      input_tokens: 0,
      output_tokens: 0,
      cached_tokens: 0,
      sessions: 0,
      updated_at: null,
    } satisfies ProjectUsage);

  current.total_tokens += usage.total_tokens;
  current.input_tokens += usage.input_tokens;
  current.output_tokens += usage.output_tokens;
  current.cached_tokens += usage.cached_tokens;
  const sessions = projectSessions.get(projectPath) ?? new Set<string>();
  sessions.add(sessionId);
  projectSessions.set(projectPath, sessions);
  current.sessions = sessions.size;
  if (!current.updated_at || (updatedAt && updatedAt > current.updated_at)) {
    current.updated_at = updatedAt;
  }
  projects.set(projectPath, current);
}
