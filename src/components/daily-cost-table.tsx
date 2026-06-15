import {
  buildDailyModelUsage,
  formatCredits,
  formatCurrency,
  formatDateLabel,
  formatTokens,
  type SessionUsage,
} from "../usage-model";

interface DailyCostTableProps {
  sessions: SessionUsage[];
}

export function DailyCostTable({ sessions }: DailyCostTableProps) {
  const rows = buildDailyModelUsage(sessions);

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>Daily Cost Estimate</h2>
          <p>Date-level token and model mix, based on session timestamps.</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Top Model</th>
              <th>Models</th>
              <th>Sessions</th>
              <th>Total</th>
              <th>Input</th>
              <th>Cached</th>
              <th>Output</th>
              <th>API est.</th>
              <th>Codex est.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td>
                  <strong>{formatDateLabel(row.date)}</strong>
                  <span>{row.date}</span>
                </td>
                <td>{row.top_model}</td>
                <td>{row.models.join(", ")}</td>
                <td>{row.sessions}</td>
                <td>{formatTokens(row.total_tokens)}</td>
                <td>{formatTokens(row.input_tokens)}</td>
                <td>{formatTokens(row.cached_tokens)}</td>
                <td>{formatTokens(row.output_tokens)}</td>
                <td>{formatCurrency(row.api_usd)}</td>
                <td>{row.codex_credits ? formatCredits(row.codex_credits) : "Unpriced"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
