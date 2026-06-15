import type { SessionUsage } from "../usage-model";
import { formatDateTime, formatTokens } from "../usage-model";

interface SessionTableProps {
  selectedId: string | null;
  sessions: SessionUsage[];
  onSelect: (session: SessionUsage) => void;
}

export function SessionTable({ selectedId, sessions, onSelect }: SessionTableProps) {
  return (
    <section className="panel table-panel session-panel">
      <div className="panel-heading">
        <div>
          <h2>Recent Sessions</h2>
          <p>Latest imported token totals per Codex thread.</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Session</th>
              <th>Project</th>
              <th>Total</th>
              <th>Input</th>
              <th>Output</th>
              <th>Cached</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                className={session.id === selectedId ? "selected-row" : ""}
                key={session.id}
                onClick={() => onSelect(session)}
              >
                <td>
                  <button className="row-button" type="button">
                    {session.title}
                  </button>
                  <span>{session.model ?? "Unknown model"}</span>
                </td>
                <td>{session.project_name}</td>
                <td>{formatTokens(session.usage.total_tokens)}</td>
                <td>{formatTokens(session.usage.input_tokens)}</td>
                <td>{formatTokens(session.usage.output_tokens)}</td>
                <td>{formatTokens(session.usage.cached_tokens)}</td>
                <td>{formatDateTime(session.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
