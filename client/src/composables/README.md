# Composables

Full documentation for every composable lives in [`client/FRONTEND.md`](../../FRONTEND.md) under the **Composables** section.

## Quick reference

| Composable | Purpose |
|---|---|
| `useApiService` | Axios HTTP client — `get`, `post`, `put`, `del`, `patch` with auth + error handling |
| `useAuth` | Thin wrapper over `authStore` with `withAuth` guard helper |
| `useCrawlManagement` | Crawl list: fetch, run all, enable/disable toggle |
| `useCrawlActions` | All crawl operation handlers — start, delete, clear data, clear queue, restart URLs |
| `useCrawlData` | Fetch and hold a single crawl's full data; writes stats bar context |
| `useCrawlSocket` | Socket.IO connection for a crawl room; patches live status and `queueStatus` |
| `useSocketConnection` | Low-level Socket.IO wrapper |
| `useCrawlExport` | Latest export link persistence |
| `useCrawlDetailsView` | URL selection state (select-all, checkboxes) |
| `useNotification` | Toast notification system — use this, not `inject('showNotification')` |
| `useLoadingState` | Key-based loading state map with `LOADING_KEYS` constants |
| `useProxyStats` | Proxy usage and cost analysis data fetching |
| `useStatsBarContext` | Sets stats bar context from the current route |
| `useExcerpts` | Expandable text truncation |
