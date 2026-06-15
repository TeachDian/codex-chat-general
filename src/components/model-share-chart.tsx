import {
  buildModelUsage,
  formatCurrency,
  formatTokens,
  type SessionUsage,
} from "../usage-model";

interface ModelShareChartProps {
  sessions: SessionUsage[];
}

export function ModelShareChart({ sessions }: ModelShareChartProps) {
  const rows = buildModelUsage(sessions);
  const maxValue = Math.max(1, ...rows.map((row) => row.total_tokens));

  return (
    <section className="panel model-share-panel">
      <div className="panel-heading">
        <div>
          <h2>Model Share</h2>
          <p>Exact tokens and estimated API spend by model in the current selection.</p>
        </div>
      </div>
      <div className="model-bars">
        {rows.length ? (
          rows.map((row) => (
            <div className="model-bar-row" key={row.model}>
              <div className="model-bar-label">
                <strong>{row.model}</strong>
                <span>
                  {formatTokens(row.total_tokens)} total · {formatCurrency(row.api_usd)}
                </span>
              </div>
              <div
                aria-label={`${row.model} ${formatTokens(row.total_tokens)} tokens`}
                className="model-bar-track"
                role="img"
                title={`${row.model}: ${formatTokens(row.input_tokens)} input, ${formatTokens(row.output_tokens)} output, ${formatTokens(row.cached_tokens)} cached`}
              >
                <span style={{ width: `${Math.max(4, (row.total_tokens / maxValue) * 100)}%` }} />
              </div>
            </div>
          ))
        ) : (
          <p className="empty-copy">No model usage in the current selection.</p>
        )}
      </div>
    </section>
  );
}
