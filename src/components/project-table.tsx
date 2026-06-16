import { useMemo, useState } from "react";
import type { ProjectUsage } from "../usage-model";
import { formatDateTime, formatTokens } from "../usage-model";
import {
  filterRows,
  getPageRows,
  getTableRange,
  nextSort,
  PaginationControls,
  SortHeader,
  sortRows,
  TableToolbar,
  useTablePageReset,
  type SortState,
} from "./table-controls";

interface ProjectTableProps {
  projects: ProjectUsage[];
  onSelectProject?: (projectPath: string) => void;
}

export function ProjectTable({ projects, onSelectProject }: ProjectTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState<ProjectSortKey>>({
    key: "total_tokens",
    direction: "desc",
  });
  const filteredRows = useMemo(
    () =>
      filterRows(projects, query, (project) =>
        [project.project_name, project.project_path].join(" "),
      ),
    [projects, query],
  );
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, getProjectSortValue),
    [filteredRows, sort],
  );
  const { start, end, totalPages } = getTableRange(sortedRows.length, page, pageSize);
  const pageRows = useMemo(() => getPageRows(sortedRows, page, pageSize), [page, pageSize, sortedRows]);

  useTablePageReset([query, pageSize, projects], () => setPage(1));

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>Project Breakdown</h2>
          <p>Grouped by Codex working directory.</p>
        </div>
      </div>
      <TableToolbar
        count={filteredRows.length}
        itemLabel="projects"
        onPageSizeChange={setPageSize}
        onQueryChange={setQuery}
        pageSize={pageSize}
        query={query}
        total={projects.length}
      />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th><SortHeader label="Project" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="project_name" /></th>
              <th><SortHeader label="Sessions" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="sessions" /></th>
              <th><SortHeader label="Total" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="total_tokens" /></th>
              <th><SortHeader label="Input" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="input_tokens" /></th>
              <th><SortHeader label="Output" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="output_tokens" /></th>
              <th><SortHeader label="Cached" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="cached_tokens" /></th>
              <th><SortHeader label="Last Seen" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="updated_at" /></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((project) => (
              <tr key={project.project_path}>
                <td>
                  <button
                    className="row-button"
                    onClick={() => onSelectProject?.(project.project_path)}
                    type="button"
                  >
                    {project.project_name}
                  </button>
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
            {pageRows.length === 0 ? (
              <tr>
                <td className="empty-row" colSpan={7}>No projects match the current table filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <PaginationControls
        end={end}
        onPageChange={setPage}
        page={page}
        pageSize={pageSize}
        start={start}
        total={sortedRows.length}
        totalPages={totalPages}
      />
    </section>
  );
}

type ProjectSortKey =
  | "project_name"
  | "sessions"
  | "total_tokens"
  | "input_tokens"
  | "output_tokens"
  | "cached_tokens"
  | "updated_at";

function getProjectSortValue(project: ProjectUsage, key: ProjectSortKey) {
  switch (key) {
    case "project_name":
      return project.project_name;
    case "sessions":
      return project.sessions;
    case "total_tokens":
      return project.total_tokens;
    case "input_tokens":
      return project.input_tokens;
    case "output_tokens":
      return project.output_tokens;
    case "cached_tokens":
      return project.cached_tokens;
    case "updated_at":
      return project.updated_at;
  }
}
