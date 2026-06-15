import type { ProjectUsage } from "../usageModel";
import { formatDateTime, formatTokens } from "../usageModel";

interface ProjectTableProps {
  projects: ProjectUsage[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>Project Breakdown</h2>
          <p>Grouped by Codex working directory.</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Sessions</th>
              <th>Total</th>
              <th>Input</th>
              <th>Output</th>
              <th>Cached</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.project_path}>
                <td>
                  <strong>{project.project_name}</strong>
                  <span>{project.project_path}</span>
                </td>
                <td>{project.sessions}</td>
                <td>{formatTokens(project.total_tokens)}</td>
                <td>{formatTokens(project.input_tokens)}</td>
                <td>{formatTokens(project.output_tokens)}</td>
                <td>{formatTokens(project.cached_tokens)}</td>
                <td>{formatDateTime(project.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
