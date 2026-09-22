import { useEffect } from 'react';

/**
 * Tiny SEO/UX hook: set document.title on mount, restore the
 * previous title on unmount so nested routes don't accumulate.
 *
 * Use it at the top of any customer-facing page component:
 *
 *   useDocumentTitle('Sản phẩm — Fashion Store');
 *
 * Optional `suffix` defaults to the site name. Set it to '' to
 * use the title verbatim.
 */
export default function useDocumentTitle(title, suffix = 'Fashion Store') {
  useEffect(() => {
    const prev = document.title;
    document.title = suffix ? `${title} — ${suffix}` : title;
    return () => { document.title = prev; };
  }, [title, suffix]);
}
