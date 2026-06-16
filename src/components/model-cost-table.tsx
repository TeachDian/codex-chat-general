import { useMemo, useState } from "react";
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
  type ModelUsage,
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

interface ModelCostTableProps {
  sessions: SessionUsage[];
}

export function ModelCostTable({ sessions }: ModelCostTableProps) {
  const rows = useMemo(() => buildModelUsage(sessions), [sessions]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<SortState<ModelSortKey>>({
    key: "total_tokens",
    direction: "desc",
  });
  const filteredRows = useMemo(
    () => filterRows(rows, query, (row) => [row.model, row.has_pricing ? "priced" : "unpriced"].join(" ")),
    [query, rows],
  );
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sort, getModelSortValue),
    [filteredRows, sort],
  );
  const { start, end, totalPages } = getTableRange(sortedRows.length, page, pageSize);
  const pageRows = useMemo(() => getPageRows(sortedRows, page, pageSize), [page, pageSize, sortedRows]);

  useTablePageReset([query, pageSize, sessions], () => setPage(1));

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
      <TableToolbar
        count={filteredRows.length}
        itemLabel="models"
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
              <th><SortHeader label="Model" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="model" /></th>
              <th><SortHeader label="Sessions" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="sessions" /></th>
              <th><SortHeader label="Total" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="total_tokens" /></th>
              <th><SortHeader label="Input" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="input_tokens" /></th>
              <th><SortHeader label="Cached" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="cached_tokens" /></th>
              <th><SortHeader label="Output" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="output_tokens" /></th>
              <th><SortHeader label="API est." onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="api_usd" /></th>
              <th><SortHeader label="Codex est." onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="codex_credits" /></th>
              <th><SortHeader label="Last Used" onSort={(key) => setSort(nextSort(sort, key))} sort={sort} sortKey="last_used_at" /></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
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
            {pageRows.length === 0 ? (
              <tr>
                <td className="empty-row" colSpan={9}>No models match the current table filter.</td>
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

type ModelSortKey =
  | "model"
  | "sessions"
  | "total_tokens"
  | "input_tokens"
  | "cached_tokens"
  | "output_tokens"
  | "api_usd"
  | "codex_credits"
  | "last_used_at";

function getModelSortValue(row: ModelUsage, key: ModelSortKey) {
  return row[key];
}
