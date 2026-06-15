import { RefreshCw } from "lucide-react";

const metricSkeletons = ["total", "input", "output", "cached"];
const chartSkeletons = ["input", "output", "cached", "sessions", "model", "project", "daily"];
const rowSkeletons = ["one", "two", "three", "four", "five"];

export function BootSkeleton() {
  return (
    <section className="boot-skeleton" aria-label="Scanning Codex usage" aria-live="polite" aria-busy="true" role="status">
      <div className="boot-skeleton-header">
        <div className="boot-skeleton-copy">
          <span className="loading-orbit" aria-hidden="true">
            <RefreshCw size={18} />
          </span>
          <div>
            <h2>Scanning local usage</h2>
            <p>Reading session records and preparing the dashboard.</p>
          </div>
        </div>
        <div className="loading-steps" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="skeleton-filter-grid" aria-hidden="true">
        <span className="skeleton-block" />
        <span className="skeleton-block short" />
        <span className="skeleton-block wide" />
      </div>

      <div className="skeleton-metric-grid" aria-hidden="true">
        {metricSkeletons.map((item) => (
          <div className="skeleton-card skeleton-metric" key={item}>
            <span className="skeleton-icon" />
            <div>
              <span className="skeleton-line short" />
              <span className="skeleton-line strong" />
              <span className="skeleton-line" />
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton-content-grid" aria-hidden="true">
        <div className="skeleton-panel skeleton-chart">
          <div className="skeleton-panel-heading">
            <span className="skeleton-line title" />
            <span className="skeleton-line short" />
          </div>
          <div className="skeleton-chart-bars">
            {chartSkeletons.map((item, index) => (
              <span className={`skeleton-chart-bar bar-${index + 1}`} key={item} />
            ))}
          </div>
        </div>

        <div className="skeleton-panel skeleton-detail-card">
          <span className="skeleton-line title" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
          <div className="skeleton-detail-grid">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="skeleton-panel skeleton-table" aria-hidden="true">
        <div className="skeleton-panel-heading">
          <span className="skeleton-line title" />
          <span className="skeleton-line short" />
        </div>
        {rowSkeletons.map((row) => (
          <div className="skeleton-row" key={row}>
            <span className="skeleton-line strong" />
            <span className="skeleton-line" />
            <span className="skeleton-line short" />
          </div>
        ))}
      </div>
    </section>
  );
}
