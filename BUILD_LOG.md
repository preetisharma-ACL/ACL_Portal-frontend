# Build Log

ACL Education Portal frontend. SolidStart 1.x (SSR), TypeScript, Tailwind v4.

- Phase 0: SolidStart SSR scaffold (1.3.2), Tailwind v4 tokens as swappable CSS variables, app shell (header/footer/meta), typed API client with VITE_USE_MOCK fixture layer, Seo + Breadcrumbs helpers. Build clean; dev server renders server-side HTML with canonical and JSON-LD. ✓
- Phase 1: Full file-based route skeleton with `query`+`createAsync` server loaders for every page type (home, stream, course, listing, exam, college + 4 sub-routes, search, legal, 404). slug-id parsing, top-level dispatcher (stream vs `-course`), exam `-exam` suffix matching. Catch-all returns real HTTP 404; ErrorBoundary degrades thrown API errors to NotFound. Typecheck + build clean; all routes verified to return SSR HTML with correct canonicals. ✓
