import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, type PaginationState } from '../../hooks/usePagination';
import { formatNumber } from '../../utils/format';
import { IconButton } from './Button';

interface PaginationProps {
  state: PaginationState;
  noun?: string;
}

/** Footer for paginated tables: range summary, page size, prev/next. */
export function Pagination({ state, noun = 'results' }: PaginationProps) {
  const { page, pageSize, pageCount, total, setPage, setPageSize } = state;
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13px] text-fg-muted">
      <p aria-live="polite">
        <span className="font-medium text-fg tabular-nums">
          {formatNumber(from)}–{formatNumber(to)}
        </span>{' '}
        of <span className="tabular-nums">{formatNumber(total)}</span> {noun}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-line bg-card px-2 text-[13px] text-fg focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand-ring"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <IconButton label="Previous page" icon={<ChevronLeft />} size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)} />
          <span className="min-w-16 text-center tabular-nums">
            {page} / {pageCount}
          </span>
          <IconButton label="Next page" icon={<ChevronRight />} size="sm" variant="secondary" disabled={page >= pageCount} onClick={() => setPage(page + 1)} />
        </div>
      </div>
    </nav>
  );
}
