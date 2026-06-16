import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { useEffect } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

type ComparableValue = string | number | null | undefined;

interface SortHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
}

interface TableToolbarProps {
  count: number;
  itemLabel: string;
  pageSize: number;
  query: string;
  total: number;
  onPageSizeChange: (pageSize: number) => void;
  onQueryChange: (query: string) => void;
}

interface PaginationControlsProps {
  end: number;
  page: number;
  pageSize: number;
  start: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const pageSizeOptions = [10, 25, 50, 100];

export function useTablePageReset(dependencies: unknown[], resetPage: () => void) {
  useEffect(() => {
    resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

export function filterRows<T>(
  rows: T[],
  query: string,
  getSearchText: (row: T) => string,
): T[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return rows;
  }

  return rows.filter((row) => getSearchText(row).toLowerCase().includes(normalized));
}

export function sortRows<T, K extends string>(
  rows: T[],
  sort: SortState<K>,
  getValue: (row: T, key: K) => ComparableValue,
): T[] {
  return [...rows].sort((first, second) => {
    const comparison = compareValues(getValue(first, sort.key), getValue(second, sort.key));
    return sort.direction === "asc" ? comparison : -comparison;
  });
}

export function getPageRows<T>(rows: T[], page: number, pageSize: number): T[] {
  return rows.slice((page - 1) * pageSize, page * pageSize);
}

export function getTableRange(total: number, page: number, pageSize: number) {
  if (total === 0) {
    return { start: 0, end: 0, totalPages: 1 };
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    start: (safePage - 1) * pageSize + 1,
    end: Math.min(safePage * pageSize, total),
    totalPages,
  };
}

export function SortHeader<K extends string>({ label, sortKey, sort, onSort }: SortHeaderProps<K>) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <button
      aria-label={`Sort by ${label}`}
      aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
      className={`sort-header ${active ? "active" : ""}`}
      onClick={() => onSort(sortKey)}
      type="button"
    >
      <span>{label}</span>
      <Icon size={13} />
    </button>
  );
}

export function TableToolbar({
  count,
  itemLabel,
  pageSize,
  query,
  total,
  onPageSizeChange,
  onQueryChange,
}: TableToolbarProps) {
  return (
    <div className="table-toolbar">
      <label className="table-search">
        <Search size={14} />
        <input
          aria-label={`Filter ${itemLabel}`}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={`Filter ${itemLabel}...`}
          value={query}
        />
      </label>
      <div className="table-count">
        <strong>{count}</strong>
        <span>of {total}</span>
      </div>
      <label className="page-size-control">
        <span>Rows</span>
        <select onChange={(event) => onPageSizeChange(Number(event.target.value))} value={pageSize}>
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function PaginationControls({
  end,
  page,
  pageSize,
  start,
  total,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  return (
    <div className="pagination-bar">
      <span>
        Showing {start}-{end} of {total} rows
      </span>
      <div className="pagination-actions">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
          <ChevronLeft size={15} />
          Prev
        </button>
        <strong>
          Page {Math.min(page, totalPages)} of {totalPages}
        </strong>
        <button disabled={page >= totalPages || total <= pageSize} onClick={() => onPageChange(page + 1)} type="button">
          Next
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export function nextSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  if (current.key !== key) {
    return { key, direction: "desc" };
  }

  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

function compareValues(first: ComparableValue, second: ComparableValue): number {
  if (first == null && second == null) {
    return 0;
  }

  if (first == null) {
    return 1;
  }

  if (second == null) {
    return -1;
  }

  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  return String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
