import { Activity, Database, FileJson, FolderOpen, TimerReset } from "lucide-react";
import type { SessionUsage } from "../usage-model";
import { formatDateTime, formatTokens } from "../usage-model";

interface SessionDetailProps {
  session: SessionUsage | null;
  sessions: SessionUsage[];
}

export function SessionDetail({ session, sessions }: SessionDetailProps) {
  if (!session) {
    const totals = sessions.reduce(
      (usage, current) => ({
        input_tokens: usage.input_tokens + current.usage.input_tokens,
        output_tokens: usage.output_tokens + current.usage.output_tokens,
        cached_tokens: usage.cached_tokens + current.usage.cached_tokens,
        reasoning_output_tokens:
          usage.reasoning_output_tokens + current.usage.reasoning_output_tokens,
        total_tokens: usage.total_tokens + current.usage.total_tokens,
      }),
      {
        input_tokens: 0,
        output_tokens: 0,
        cached_tokens: 0,
        reasoning_output_tokens: 0,
        total_tokens: 0,
      },
    );

    return (
      <aside className="detail-panel empty-detail">
        <Activity />
        <h2>All Matching Sessions</h2>
        <p>{sessions.length} sessions are combined in the current report scope.</p>
        <div className="detail-stats">
          <div>
            <span>Total</span>
            <strong>{formatTokens(totals.total_tokens)}</strong>
          </div>
          <div>
            <span>Input</span>
            <strong>{formatTokens(totals.input_tokens)}</strong>
          </div>
          <div>
            <span>Output</span>
            <strong>{formatTokens(totals.output_tokens)}</strong>
          </div>
          <div>
            <span>Cached</span>
            <strong>{formatTokens(totals.cached_tokens)}</strong>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="detail-heading">
        <span>Selected Session</span>
        <h2>{session.title}</h2>
        <p>{session.id}</p>
      </div>

      <div className="detail-stats">
        <div>
          <span>Total</span>
          <strong>{formatTokens(session.usage.total_tokens)}</strong>
        </div>
        <div>
          <span>Input</span>
          <strong>{formatTokens(session.usage.input_tokens)}</strong>
        </div>
        <div>
          <span>Output</span>
          <strong>{formatTokens(session.usage.output_tokens)}</strong>
        </div>
        <div>
          <span>Cached</span>
          <strong>{formatTokens(session.usage.cached_tokens)}</strong>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <FolderOpen aria-hidden="true" />
          <dt>Project</dt>
          <dd>{session.project_path ?? "Unknown project"}</dd>
        </div>
        <div>
          <Database aria-hidden="true" />
          <dt>Model</dt>
          <dd>{session.model ?? "Unknown model"}</dd>
        </div>
        <div>
          <TimerReset aria-hidden="true" />
          <dt>Updated</dt>
          <dd>{formatDateTime(session.updated_at)}</dd>
        </div>
        <div>
          <FileJson aria-hidden="true" />
          <dt>Source</dt>
          <dd>{session.source_path}</dd>
        </div>
      </dl>
    </aside>
  );
}
