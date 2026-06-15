import { useState } from "react";
import type { DailyUsage } from "../usage-model";
import { formatDateLabel, formatTokens } from "../usage-model";

interface UsageChartProps {
  data: DailyUsage[];
}

const chartHeight = 220;
const chartWidth = 760;
const chartPadding = { top: 16, right: 18, bottom: 34, left: 58 };
const barWidth = 12;
const barGap = 4;

export function UsageChart({ data }: UsageChartProps) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const maxValue = Math.max(1, ...data.flatMap((day) => [day.input_tokens, day.output_tokens, day.cached_tokens]));
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const groupWidth = data.length > 0 ? plotWidth / data.length : plotWidth;
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const activeDay = data.find((day) => day.date === activeDate) ?? null;
  const activeIndex = activeDay ? data.findIndex((day) => day.date === activeDay.date) : -1;
  const activeLeft =
    activeIndex >= 0
      ? `${((chartPadding.left + groupWidth * activeIndex + groupWidth / 2) / chartWidth) * 100}%`
      : "50%";

  return (
    <section className="panel usage-chart">
      <div className="panel-heading">
        <div>
          <h2>Daily Usage</h2>
          <p>Input, output, and cached token volume by session date.</p>
        </div>
      </div>
      <div className="chart-frame">
        {activeDay ? (
          <div className="chart-tooltip" style={{ left: activeLeft }}>
            <strong>{formatDateLabel(activeDay.date)}</strong>
            <span>Total {formatTokens(activeDay.total_tokens)}</span>
            <span>Input {formatTokens(activeDay.input_tokens)}</span>
            <span>Output {formatTokens(activeDay.output_tokens)}</span>
            <span>Cached {formatTokens(activeDay.cached_tokens)}</span>
            <span>{activeDay.sessions} sessions</span>
          </div>
        ) : null}
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
            const groupStart = chartPadding.left + groupWidth * index;
            const bars = [
              { key: "input", value: day.input_tokens, fill: "#2563eb", offset: -(barWidth + barGap) },
              { key: "output", value: day.output_tokens, fill: "#0f766e", offset: 0 },
              { key: "cached", value: day.cached_tokens, fill: "#f59e0b", offset: barWidth + barGap },
            ];

            return (
              <g key={day.date}>
                <rect
                  aria-label={`${day.date} total ${formatTokens(day.total_tokens)}`}
                  className="chart-hitbox"
                  fill="transparent"
                  height={plotHeight}
                  onBlur={() => setActiveDate(null)}
                  onFocus={() => setActiveDate(day.date)}
                  onMouseEnter={() => setActiveDate(day.date)}
                  onMouseLeave={() => setActiveDate(null)}
                  tabIndex={0}
                  width={Math.max(groupWidth, 28)}
                  x={groupStart}
                  y={chartPadding.top}
                />
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
