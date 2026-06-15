import { describe, expect, it } from "vitest";
import {
  applyDashboardRange,
  deriveDashboardFromSessions,
  filterSessionsByRange,
  formatTokens,
  type DashboardData,
  type SessionUsage,
} from "./usageModel";

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
});

describe("usage model helpers", () => {
  it("formats token totals compactly for dashboard tables", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(12_400)).toBe("12.4K");
    expect(formatTokens(1_250_000)).toBe("1.25M");
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
});
