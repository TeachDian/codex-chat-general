import { Activity, Database, FileJson, FolderOpen, TimerReset } from "lucide-react";
import type { SessionUsage } from "../usageModel";
import { formatDateTime, formatTokens } from "../usageModel";

interface SessionDetailProps {
  session: SessionUsage | null;
}

export function SessionDetail({ session }: SessionDetailProps) {
  if (!session) {
    return (
      <aside className="detail-panel empty-detail">
        <Activity />
        <h2>No Session Selected</h2>
        <p>Select a row to inspect the source file, project, model, and token breakdown.</p>
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
