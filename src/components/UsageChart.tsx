import type { DailyUsage } from "../usageModel";
import { formatDateLabel, formatTokens } from "../usageModel";

interface UsageChartProps {
  data: DailyUsage[];
}

const chartHeight = 220;
const chartWidth = 760;
const chartPadding = { top: 16, right: 18, bottom: 34, left: 58 };
const barWidth = 12;
const barGap = 4;

export function UsageChart({ data }: UsageChartProps) {
  const maxValue = Math.max(1, ...data.flatMap((day) => [day.input_tokens, day.output_tokens, day.cached_tokens]));
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const groupWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <section className="panel usage-chart">
      <div className="panel-heading">
        <div>
          <h2>Daily Usage</h2>
          <p>Input, output, and cached token volume by session date.</p>
        </div>
      </div>
      <div className="chart-frame">
        <svg aria-label="Daily token usage chart" className="usage-svg" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {ticks.map((tick) => {
            const y = chartPadding.top + plotHeight * (1 - tick);
            return (
              <g key={tick}>
                <line className="chart-gridline" x1={chartPadding.left} x2={chartWidth - chartPadding.right} y1={y} y2={y} />
                <text className="chart-axis-label" dominantBaseline="middle" textAnchor="end" x={chartPadding.left - 10} y={y}>
                  {formatTokens(Math.round(maxValue * tick))}
                </text>
              </g>
            );
          })}

          {data.map((day, index) => {
            const groupCenter = chartPadding.left + groupWidth * index + groupWidth / 2;
            const bars = [
              { key: "input", value: day.input_tokens, fill: "#2563eb", offset: -(barWidth + barGap) },
              { key: "output", value: day.output_tokens, fill: "#0f766e", offset: 0 },
              { key: "cached", value: day.cached_tokens, fill: "#f59e0b", offset: barWidth + barGap },
            ];

            return (
              <g key={day.date}>
                {bars.map((bar) => {
                  const height = Math.max(2, (bar.value / maxValue) * plotHeight);
                  const x = groupCenter + bar.offset - barWidth / 2;
                  const y = chartPadding.top + plotHeight - height;
                  return (
                    <rect
                      className="chart-bar"
                      fill={bar.fill}
                      height={height}
                      key={bar.key}
                      rx="4"
                      width={barWidth}
                      x={x}
                      y={y}
                    />
                  );
                })}
                <text className="chart-axis-label" textAnchor="middle" x={groupCenter} y={chartHeight - 12}>
                  {formatDateLabel(day.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
