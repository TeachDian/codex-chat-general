import {
  CODEX_PRICING_SOURCE_URL,
  MODEL_PRICING,
  PRICING_SNAPSHOT_DATE,
  PRICING_SOURCE_URL,
  buildModelUsage,
  formatCredits,
  formatCurrency,
  formatDateTime,
  formatTokens,
  type SessionUsage,
} from "../usage-model";

interface ModelCostTableProps {
  sessions: SessionUsage[];
}

export function ModelCostTable({ sessions }: ModelCostTableProps) {
  const rows = buildModelUsage(sessions);

  return (
    <section className="panel table-panel">
      <div className="panel-heading split-heading">
        <div>
          <h2>Model Cost Breakdown</h2>
          <p>Estimated from OpenAI per-million-token rates, snapshot {PRICING_SNAPSHOT_DATE}.</p>
        </div>
        <div className="pricing-links">
          <a href={PRICING_SOURCE_URL} rel="noreferrer" target="_blank">
            API USD
          </a>
          <a href={CODEX_PRICING_SOURCE_URL} rel="noreferrer" target="_blank">
            Codex credits
          </a>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Sessions</th>
              <th>Total</th>
              <th>Input</th>
              <th>Cached</th>
              <th>Output</th>
              <th>API est.</th>
              <th>Codex est.</th>
              <th>Last Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pricing = MODEL_PRICING[row.model];
              return (
                <tr key={row.model}>
                  <td>
                    <strong>{row.model}</strong>
                    <span>
                      {pricing?.api_usd
                        ? `$${pricing.api_usd.input_per_million}/$${pricing.api_usd.cached_input_per_million}/$${pricing.api_usd.output_per_million} per 1M`
                        : "No built-in price"}
                    </span>
                  </td>
                  <td>{row.sessions}</td>
                  <td>{formatTokens(row.total_tokens)}</td>
                  <td>{formatTokens(row.input_tokens)}</td>
                  <td>{formatTokens(row.cached_tokens)}</td>
                  <td>{formatTokens(row.output_tokens)}</td>
                  <td>{row.has_pricing ? formatCurrency(row.api_usd) : "Unpriced"}</td>
                  <td>{row.codex_credits ? formatCredits(row.codex_credits) : "Unpriced"}</td>
                  <td>{formatDateTime(row.last_used_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
