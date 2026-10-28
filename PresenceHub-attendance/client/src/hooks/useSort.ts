import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';
export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

type SortValue = string | number | null | undefined;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Sort a list by named accessors. Clicking the active column flips direction. */
export function useSort<T, K extends string>(
  items: T[],
  accessors: Record<K, (item: T) => SortValue>,
  initial: SortState<NoInfer<K>>
) {
  const [sort, setSort] = useState<SortState<K>>(initial);

  const sorted = useMemo(() => {
    const get = accessors[sort.key];
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return collator.compare(String(va), String(vb)) * factor;
    });
    // accessors are static per component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sort]);

  const toggle = (key: K) =>
    setSort((prev) =>
      prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );

  return { sorted, sort, toggle };
}
