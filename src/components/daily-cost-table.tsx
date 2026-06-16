import { useMemo, useState } from "react";
import {
  buildDailyModelUsage,
  formatCredits,
  formatCurrency,
  formatDateLabel,
  formatTokens,
  type DailyModelUsage,
  type SessionUsage,
} from "../usage-model";
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

interface DailyCostTableProps {
  sessions: SessionUsage[];
}

export function DailyCostTable({ sessions }: DailyCostTableProps) {
  const rows = useMemo(() => buildDailyModelUsage(sessions), [sessions]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<SortState<DailySortKey>>({
    key: "date",
    direction: "desc",
  });
  const filteredRows = useMemo(
    () =>
      filterRows(rows, query, (row) =>
        [row.date, row.top_model, ...row.models].join(" "),
      ),
    [query, rows],
  );
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, getDailySortValue),
    [filteredRows, sort],
  );
  const { start, end, totalPages } = getTableRange(sortedRows.length, page, pageSize);
  const pageRows = useMemo(() => getPageRows(sortedRows, page, pageSize), [page, pageSize, sortedRows]);

  useTablePageReset([query, pageSize, sessions], () => setPage(1));

  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>Daily Cost Estimate</h2>
          <p>Date-level token and model mix, based on session timestamps.</p>
        </div>
      </div>
      <TableToolbar
        count={filteredRows.length}
        itemLabel="daily rows"
        onPageSizeChange={setPageSize}
        onQueryChange={setQuery}
        pageSize={pageSize}
        query={query}
        total={rows.length}
      />
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th><SortHeader label="Date" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="date" /></th>
              <th><SortHeader label="Top Model" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="top_model" /></th>
              <th>Models</th>
              <th><SortHeader label="Sessions" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="sessions" /></th>
              <th><SortHeader label="Total" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="total_tokens" /></th>
              <th><SortHeader label="Input" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="input_tokens" /></th>
              <th><SortHeader label="Cached" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="cached_tokens" /></th>
              <th><SortHeader label="Output" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="output_tokens" /></th>
              <th><SortHeader label="API est." onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="api_usd" /></th>
              <th><SortHeader label="Codex est." onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="codex_credits" /></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
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
            {pageRows.length === 0 ? (
              <tr>
                <td className="empty-row" colSpan={10}>No daily rows match the current table filter.</td>
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

type DailySortKey =
  | "date"
  | "top_model"
  | "sessions"
  | "total_tokens"
  | "input_tokens"
  | "cached_tokens"
  | "output_tokens"
  | "api_usd"
  | "codex_credits";

function getDailySortValue(row: DailyModelUsage, key: DailySortKey) {
  return row[key];
}
