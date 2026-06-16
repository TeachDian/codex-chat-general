import type { ReactNode } from "react";
import { useMemo } from "react";
import { Gauge, Layers3, PieChart, TrendingUp } from "lucide-react";
import {
  buildModelUsage,
  formatCurrency,
  formatDateLabel,
  formatDateTime,
  formatTokens,
  type DashboardData,
} from "../usage-model";

interface ReportBreakdownProps {
  dashboard: DashboardData;
  estimatedApiCost: number;
}

export function ReportBreakdown({ dashboard, estimatedApiCost }: ReportBreakdownProps) {
  const summary = dashboard.summary;
  const modelUsage = useMemo(() => buildModelUsage(dashboard.sessions), [dashboard.sessions]);
  const topModel = modelUsage[0];
  const topProject = dashboard.project_usage[0];
  const peakDay = useMemo(
    () => [...dashboard.daily_usage].sort((a, b) => b.total_tokens - a.total_tokens)[0],
    [dashboard.daily_usage],
  );
  const latestSession = useMemo(
    () =>
      [...dashboard.sessions].sort((a, b) =>
        (b.updated_at ?? b.started_at ?? "").localeCompare(a.updated_at ?? a.started_at ?? ""),
      )[0],
    [dashboard.sessions],
  );

  const cacheRate = percentage(summary.cached_tokens, summary.input_tokens);
  const outputShare = percentage(summary.output_tokens, summary.total_tokens);
  const reasoningShare = percentage(summary.reasoning_output_tokens, summary.output_tokens);
  const averageTokens = summary.sessions ? Math.round(summary.total_tokens / summary.sessions) : 0;
  const averageCost = summary.sessions ? estimatedApiCost / summary.sessions : 0;

  return (
    <section className="panel breakdown-panel" aria-label="Report breakdown">
      <div className="panel-heading">
        <div>
          <h2>Breakdown</h2>
          <p>Fast read on cache reuse, output shape, peak day, and dominant model.</p>
        </div>
      </div>
      <div className="breakdown-grid">
        <BreakdownItem
          detail={`${formatTokens(summary.cached_tokens)} cached input tokens`}
          icon={<PieChart size={18} />}
          label="Cache rate"
          value={cacheRate}
        />
        <BreakdownItem
          detail={`${formatTokens(summary.output_tokens)} output tokens`}
          icon={<Layers3 size={18} />}
          label="Output share"
          value={outputShare}
        />
        <BreakdownItem
          detail={`${formatTokens(summary.reasoning_output_tokens)} reasoning output tokens`}
          icon={<Gauge size={18} />}
          label="Reasoning share"
          value={reasoningShare}
        />
        <BreakdownItem
          detail={`${formatCurrency(averageCost)} estimated API cost per session`}
          icon={<TrendingUp size={18} />}
          label="Avg tokens/session"
          value={formatTokens(averageTokens)}
        />
        <BreakdownItem
          detail={peakDay ? `${peakDay.sessions} sessions on ${peakDay.date}` : "No daily activity in scope"}
          label="Peak day"
          value={peakDay ? formatDateLabel(peakDay.date) : "None"}
        />
        <BreakdownItem
          detail={topModel ? `${topModel.sessions} sessions, ${formatTokens(topModel.total_tokens)} tokens` : "No model data in scope"}
          label="Top model"
          value={topModel?.model ?? "Unknown"}
        />
        <BreakdownItem
          detail={topProject ? topProject.project_path : "No project data in scope"}
          label="Top project"
          value={topProject?.project_name ?? "Unknown"}
        />
        <BreakdownItem
          detail={latestSession ? latestSession.title : "No sessions in scope"}
          label="Latest session"
          value={latestSession ? formatDateTime(latestSession.updated_at ?? latestSession.started_at) : "None"}
        />
      </div>
    </section>
  );
}

function BreakdownItem({
  detail,
  icon,
  label,
  value,
}: {
  detail: string;
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="breakdown-item">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      {icon ? <div className="breakdown-icon">{icon}</div> : null}
      <p>{detail}</p>
    </div>
  );
}

function percentage(value: number, total: number): string {
  if (!total) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}
