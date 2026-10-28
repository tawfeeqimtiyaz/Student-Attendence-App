import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50];

/** Client-side pagination. Resets to page 1 when `resetKey` changes (filters, search). */
export function usePagination<T>(items: T[], resetKey: unknown = null, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  return {
    page: safePage,
    pageSize,
    pageCount,
    total: items.length,
    pageItems,
    setPage,
    setPageSize,
  };
}

export type PaginationState = ReturnType<typeof usePagination>;
