import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  pageSize?: number;
}

export function useInfiniteScroll<T>({ items, pageSize = 4 }: UseInfiniteScrollOptions<T>) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && visibleCount < items.length && !loadingMore) {
            setLoadingMore(true);
            setTimeout(() => {
              setVisibleCount((c) => Math.min(c + pageSize, items.length));
              setLoadingMore(false);
            }, 600);
          }
        },
        { rootMargin: '200px' }
      );
      observerRef.current.observe(node);
    },
    [visibleCount, items.length, loadingMore, pageSize]
  );

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items.length, pageSize]);

  return {
    visibleItems: items.slice(0, visibleCount),
    loadingMore,
    hasMore: visibleCount < items.length,
    sentinelRef,
  };
}
