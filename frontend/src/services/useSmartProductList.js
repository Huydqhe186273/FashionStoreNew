import { useEffect, useState } from 'react';
import { queryProducts } from './filterService';

/* -----------------------------------------------------------------------------
 * Thuan-owned smart product query hook.
 *
 * Wraps the backend GET /api/customer/products call with the
 * full smart-filter param set (hasImage, hasDescription,
 * minDiscountPercent, minSoldCount, minSizeCount, ...).
 *
 * The existing Cuộc-owned customerProductService.getProducts() does
 * NOT forward these params, so any page that wants the smart
 * filter to actually narrow the result set must use this hook
 * instead.
 *
 * Returns { data, loading, error, totalElements, totalPages } and
 * re-fetches whenever the `filters` ref changes.
 * -------------------------------------------------------------------------- */
export function useSmartProductList(filters, page = 0, size = 12, sortBy = 'newest') {
  const [data, setData] = useState({ content: [], page: 0, size, totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Re-fetch on any filter / page change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await queryProducts({
          ...filters,
          page,
          size,
          sortBy,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.keyword,
    filters?.categoryId,
    filters?.gender,
    filters?.minPrice,
    filters?.maxPrice,
    filters?.color,
    filters?.size,
    filters?.inStockOnly,
    filters?.hasImage,
    filters?.hasDescription,
    filters?.hasDiscount,
    filters?.completeOnly,
    filters?.minDiscountPercent,
    filters?.minSoldCount,
    filters?.minViewCount,
    filters?.minSizeCount,
    filters?.minColorCount,
    page,
    size,
    sortBy,
  ]);

  return {
    content: data.content || [],
    loading,
    error,
    page: data.page ?? page,
    size: data.size ?? size,
    totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0,
  };
}
