import { useMemo, useState } from "react";
import type { SessionUsage } from "../usage-model";
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

interface SessionTableProps {
  selectedId: string | null;
  sessions: SessionUsage[];
  onSelect: (session: SessionUsage) => void;
}

export function SessionTable({ selectedId, sessions, onSelect }: SessionTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState<SessionSortKey>>({
    key: "updated_at",
    direction: "desc",
  });
  const filteredRows = useMemo(
    () =>
      filterRows(sessions, query, (session) =>
        [
          session.title,
          session.project_name,
          session.project_path,
          session.model,
          session.id,
          session.source_path,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    [query, sessions],
  );
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, getSessionSortValue),
    [filteredRows, sort],
  );
  const { start, end, totalPages } = getTableRange(sortedRows.length, page, pageSize);
  const pageRows = useMemo(() => getPageRows(sortedRows, page, pageSize), [page, pageSize, sortedRows]);

  useTablePageReset([query, pageSize, sessions], () => setPage(1));

  return (
    <section className="panel table-panel session-panel">
      <div className="panel-heading">
        <div>
          <h2>Sessions</h2>
          <p>Filter, sort, and select a Codex thread for single-session review.</p>
        </div>
      </div>
      <TableToolbar
        count={filteredRows.length}
        itemLabel="sessions"
        onPageSizeChange={setPageSize}
        onQueryChange={setQuery}
        pageSize={pageSize}
        query={query}
        total={sessions.length}
      />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th><SortHeader label="Session" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="title" /></th>
              <th><SortHeader label="Project" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="project_name" /></th>
              <th><SortHeader label="Total" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="total_tokens" /></th>
              <th><SortHeader label="Input" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="input_tokens" /></th>
              <th><SortHeader label="Output" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="output_tokens" /></th>
              <th><SortHeader label="Cached" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="cached_tokens" /></th>
              <th><SortHeader label="Updated" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="updated_at" /></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((session) => (
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
            {pageRows.length === 0 ? (
              <tr>
                <td className="empty-row" colSpan={7}>No sessions match the current table filter.</td>
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

type SessionSortKey =
  | "title"
  | "project_name"
  | "total_tokens"
  | "input_tokens"
  | "output_tokens"
  | "cached_tokens"
  | "updated_at";

function getSessionSortValue(session: SessionUsage, key: SessionSortKey) {
  switch (key) {
    case "title":
      return session.title;
    case "project_name":
      return session.project_name;
    case "total_tokens":
      return session.usage.total_tokens;
    case "input_tokens":
      return session.usage.input_tokens;
    case "output_tokens":
      return session.usage.output_tokens;
    case "cached_tokens":
      return session.usage.cached_tokens;
    case "updated_at":
      return session.updated_at ?? session.started_at;
  }
}
