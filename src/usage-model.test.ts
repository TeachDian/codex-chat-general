import { describe, expect, it } from "vitest";
import {
  applyUsageFilters,
  applyDashboardRange,
  buildDailyModelUsage,
  buildModelUsage,
  buildUsageFilterOptions,
  estimateTokenCost,
  deriveDashboardFromSessions,
  filterSessionsByRange,
  formatCurrency,
  formatTokens,
  normalizeModelName,
  type DashboardData,
  type SessionUsage,
} from "./usage-model";

const makeSession = (id: string, updatedAt: string): SessionUsage => ({
  id,
  title: `Session ${id}`,
  project_path: `D:\\Projects\\${id}`,
  project_name: id,
  model: "gpt-5.4",
  started_at: updatedAt,
  updated_at: updatedAt,
  source_path: `${id}.jsonl`,
  usage: {
    input_tokens: 0,
    output_tokens: 0,
    cached_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 0,
  },
  token_events: 1,
  usage_events: [],
});

describe("usage model helpers", () => {
  it("formats token totals compactly for dashboard tables", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(12_400)).toBe("12,400");
    expect(formatTokens(1_250_000)).toBe("1,250,000");
  });

  it("filters sessions by the selected rolling date range", () => {
    const sessions = [
      makeSession("recent", "2026-06-14T12:00:00.000Z"),
      makeSession("old", "2026-05-01T12:00:00.000Z"),
    ];

    expect(filterSessionsByRange(sessions, "7d", "2026-06-15T00:00:00.000Z").map((s) => s.id)).toEqual([
      "recent",
    ]);
    expect(filterSessionsByRange(sessions, "all", "2026-06-15T00:00:00.000Z").map((s) => s.id)).toEqual([
      "recent",
      "old",
    ]);
  });

  it("recomputes summary totals after applying a date range", () => {
    const sessions = [
      {
        ...makeSession("recent", "2026-06-14T12:00:00.000Z"),
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          cached_tokens: 80,
          reasoning_output_tokens: 5,
          total_tokens: 120,
        },
      },
      {
        ...makeSession("old", "2026-05-01T12:00:00.000Z"),
        usage: {
          input_tokens: 200,
          output_tokens: 30,
          cached_tokens: 70,
          reasoning_output_tokens: 10,
          total_tokens: 230,
        },
      },
    ];
    const dashboard: DashboardData = {
      summary: {
        total_tokens: 350,
        input_tokens: 300,
        output_tokens: 50,
        cached_tokens: 150,
        reasoning_output_tokens: 15,
        sessions: 2,
        projects: 2,
      },
      daily_usage: [
        { date: "2026-05-01", total_tokens: 230, input_tokens: 200, output_tokens: 30, cached_tokens: 70, sessions: 1 },
        { date: "2026-06-14", total_tokens: 120, input_tokens: 100, output_tokens: 20, cached_tokens: 80, sessions: 1 },
      ],
      project_usage: [
        { project_path: "D:\\Projects\\recent", project_name: "recent", total_tokens: 120, input_tokens: 100, output_tokens: 20, cached_tokens: 80, sessions: 1, updated_at: "2026-06-14T12:00:00.000Z" },
        { project_path: "D:\\Projects\\old", project_name: "old", total_tokens: 230, input_tokens: 200, output_tokens: 30, cached_tokens: 70, sessions: 1, updated_at: "2026-05-01T12:00:00.000Z" },
      ],
      sessions,
      scanned_files: 2,
      parsed_files: 2,
      unchanged_files: 0,
      skipped_files: 0,
      codex_home: "C:\\Users\\phili\\.codex",
      database_path: "token-ledger.sqlite",
      last_imported_at: "2026-06-15T00:00:00.000Z",
    };

    const filtered = applyDashboardRange(dashboard, "7d", "2026-06-15T00:00:00.000Z");

    expect(filtered.summary.total_tokens).toBe(120);
    expect(filtered.summary.input_tokens).toBe(100);
    expect(filtered.sessions).toHaveLength(1);
    expect(filtered.project_usage).toHaveLength(1);
    expect(filtered.daily_usage.map((day) => day.date)).toEqual(["2026-06-14"]);
  });

  it("keeps aggregate cards and tables aligned with a filtered session set", () => {
    const sessions = [
      {
        ...makeSession("recent", "2026-06-14T12:00:00.000Z"),
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          cached_tokens: 80,
          reasoning_output_tokens: 5,
          total_tokens: 120,
        },
      },
      {
        ...makeSession("old", "2026-05-01T12:00:00.000Z"),
        usage: {
          input_tokens: 200,
          output_tokens: 30,
          cached_tokens: 70,
          reasoning_output_tokens: 10,
          total_tokens: 230,
        },
      },
    ];
    const base: DashboardData = {
      summary: {
        total_tokens: 350,
        input_tokens: 300,
        output_tokens: 50,
        cached_tokens: 150,
        reasoning_output_tokens: 15,
        sessions: 2,
        projects: 2,
      },
      daily_usage: [],
      project_usage: [],
      sessions,
      scanned_files: 2,
      parsed_files: 2,
      unchanged_files: 0,
      skipped_files: 0,
      codex_home: "C:\\Users\\phili\\.codex",
      database_path: "token-ledger.sqlite",
      last_imported_at: "2026-06-15T00:00:00.000Z",
    };

    const filtered = deriveDashboardFromSessions(base, [sessions[1]]);

    expect(filtered.summary.total_tokens).toBe(230);
    expect(filtered.summary.sessions).toBe(1);
    expect(filtered.project_usage[0].project_name).toBe("old");
    expect(filtered.daily_usage[0].date).toBe("2026-05-01");
  });

  it("builds project model and session filter options with all choices first", () => {
    const sessions = [
      { ...makeSession("alpha-a", "2026-06-14T12:00:00.000Z"), model: "GPT 5.5", project_path: "D:\\Projects\\alpha", project_name: "alpha" },
      { ...makeSession("alpha-b", "2026-06-14T13:00:00.000Z"), model: "gpt-5.4", project_path: "D:\\Projects\\alpha", project_name: "alpha" },
      { ...makeSession("beta-a", "2026-06-14T14:00:00.000Z"), model: "gpt-5.4", project_path: "D:\\Projects\\beta", project_name: "beta" },
    ];

    const options = buildUsageFilterOptions(sessions);

    expect(options.projects.map((project) => project.value)).toEqual([
      "all",
      "D:\\Projects\\alpha",
      "D:\\Projects\\beta",
    ]);
    expect(options.models.map((model) => model.value)).toEqual(["all", "gpt-5.4", "gpt-5.5"]);
    expect(options.sessions[0]).toEqual({ value: "all", label: "All matching sessions" });
  });

  it("filters dashboards by project model and single session while preserving all-session mode", () => {
    const sessions = [
      {
        ...makeSession("alpha-gpt55", "2026-06-14T12:00:00.000Z"),
        model: "gpt-5.5",
        project_path: "D:\\Projects\\alpha",
        project_name: "alpha",
        usage: { input_tokens: 100, output_tokens: 20, cached_tokens: 10, reasoning_output_tokens: 3, total_tokens: 120 },
      },
      {
        ...makeSession("alpha-gpt54", "2026-06-14T13:00:00.000Z"),
        model: "gpt-5.4",
        project_path: "D:\\Projects\\alpha",
        project_name: "alpha",
        usage: { input_tokens: 200, output_tokens: 30, cached_tokens: 20, reasoning_output_tokens: 4, total_tokens: 230 },
      },
      {
        ...makeSession("beta-gpt54", "2026-06-14T14:00:00.000Z"),
        model: "gpt-5.4",
        project_path: "D:\\Projects\\beta",
        project_name: "beta",
        usage: { input_tokens: 300, output_tokens: 40, cached_tokens: 30, reasoning_output_tokens: 5, total_tokens: 340 },
      },
    ];
    const dashboard: DashboardData = {
      summary: { total_tokens: 690, input_tokens: 600, output_tokens: 90, cached_tokens: 60, reasoning_output_tokens: 12, sessions: 3, projects: 2 },
      daily_usage: [],
      project_usage: [],
      sessions,
      scanned_files: 3,
      parsed_files: 3,
      unchanged_files: 0,
      skipped_files: 0,
      codex_home: "C:\\Users\\phili\\.codex",
      database_path: "token-ledger.sqlite",
      last_imported_at: "2026-06-15T00:00:00.000Z",
    };

    const allAlpha = applyUsageFilters(dashboard, {
      range: "all",
      nowIso: "2026-06-15T00:00:00.000Z",
      query: "",
      projectPath: "D:\\Projects\\alpha",
      model: "all",
      sessionId: "all",
    });
    const oneSession = applyUsageFilters(dashboard, {
      range: "all",
      nowIso: "2026-06-15T00:00:00.000Z",
      query: "",
      projectPath: "D:\\Projects\\alpha",
      model: "gpt-5.4",
      sessionId: "alpha-gpt54",
    });

    expect(allAlpha.sessions.map((session) => session.id)).toEqual(["alpha-gpt55", "alpha-gpt54"]);
    expect(allAlpha.summary.total_tokens).toBe(350);
    expect(oneSession.sessions.map((session) => session.id)).toEqual(["alpha-gpt54"]);
    expect(oneSession.summary.total_tokens).toBe(230);
  });

  it("estimates API dollars and Codex credits from official per-million token rates", () => {
    expect(normalizeModelName("GPT-5.5")).toBe("gpt-5.5");
    expect(normalizeModelName("gpt-5.4 mini")).toBe("gpt-5.4-mini");

    const gpt55 = estimateTokenCost("gpt-5.5", {
      input_tokens: 1_000_000,
      cached_tokens: 500_000,
      output_tokens: 250_000,
      reasoning_output_tokens: 0,
      total_tokens: 1_250_000,
    });

    expect(gpt55.api_usd).toBe(10.25);
    expect(gpt55.codex_credits).toBe(256.25);
    expect(formatCurrency(gpt55.api_usd)).toBe("$10.25");
  });

  it("builds model and date pricing breakdowns from sessions", () => {
    const sessions = [
      {
        ...makeSession("gpt55", "2026-06-14T12:00:00.000Z"),
        model: "gpt-5.5",
        usage: {
          input_tokens: 1_000_000,
          cached_tokens: 0,
          output_tokens: 100_000,
          reasoning_output_tokens: 0,
          total_tokens: 1_100_000,
        },
      },
      {
        ...makeSession("gpt54", "2026-06-13T12:00:00.000Z"),
        model: "gpt-5.4",
        usage: {
          input_tokens: 1_000_000,
          cached_tokens: 0,
          output_tokens: 100_000,
          reasoning_output_tokens: 0,
          total_tokens: 1_100_000,
        },
      },
    ];

    const modelUsage = buildModelUsage(sessions);
    const dailyModelUsage = buildDailyModelUsage(sessions);

    expect(modelUsage.map((row) => row.model)).toEqual(["gpt-5.5", "gpt-5.4"]);
    expect(modelUsage[0].api_usd).toBe(8);
    expect(modelUsage[1].api_usd).toBe(4);
    expect(dailyModelUsage.map((row) => row.date)).toEqual(["2026-06-14", "2026-06-13"]);
    expect(dailyModelUsage[0].top_model).toBe("gpt-5.5");
  });
});
