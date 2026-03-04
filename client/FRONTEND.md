# Frontend Developer Documentation

> Vue 3 · Pinia · Tailwind CSS · Socket.IO · Vite

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Architecture](#architecture)
4. [Entry Points](#entry-points)
5. [Routing](#routing)
6. [Pages](#pages)
7. [Component Catalogue](#component-catalogue)
8. [Stores (Pinia)](#stores-pinia)
9. [Composables](#composables)
10. [Utilities](#utilities)
11. [Constants](#constants)
12. [Styling Conventions](#styling-conventions)
13. [Data Flow Patterns](#data-flow-patterns)
14. [Real-time (Socket.IO)](#real-time-socketio)
15. [Authentication Flow](#authentication-flow)
16. [Adding New Features — Checklist](#adding-new-features--checklist)

---

## Overview

The frontend is a **Vue 3 SPA** built with the Composition API (`<script setup>`). All UI is implemented with **Tailwind CSS** — there are no Vuetify dependencies remaining. State is managed with **Pinia**. Real-time crawl updates are received over a **Socket.IO** connection.

```
client/
├── src/
│   ├── App.vue                  # Root component
│   ├── main.js                  # App bootstrap
│   ├── router.js                # Vue Router config
│   ├── index.css                # Tailwind directives
│   ├── style.css                # Global base styles
│   ├── assets/
│   ├── components/
│   │   ├── features/            # Domain-specific feature components
│   │   ├── forms/               # Standalone form components
│   │   ├── layout/              # App-shell / wrapper components
│   │   ├── modals/              # Modal dialogs
│   │   ├── pages/               # Route-level page components
│   │   └── ui/                  # Generic, reusable UI primitives
│   ├── composables/             # Vue composables (business logic)
│   ├── constants/               # Shared constant objects
│   ├── stores/                  # Pinia stores
│   └── utils/                   # Pure helper functions
└── package.json
```

---

## Directory Structure

### `components/`

| Sub-directory | Purpose |
|---|---|
| `features/crawl/` | Components tightly coupled to the crawl domain (view result, URL display) |
| `forms/` | Standalone form components (`LoginForm`, `RegisterForm`, `CssSelector`) |
| `layout/` | App-shell wrappers: `Navbar`, `ModalWrapper`, `NotificationWrapper`, `StatsWrapper` |
| `modals/` | All modal dialogs — each one is a self-contained `<div>` with its own script |
| `pages/` | One component per route: `HomePage`, `LandingPage`, `CrawlDetailsView`, `GeneralDashboard` |
| `pages/components/` | Sub-components owned exclusively by a single page component |
| `ui/data/` | Generic table / status display primitives (`CrawlerTable`, `StatusPill`) |
| `ui/stats/` | Stats bar system — `StatsBottomBar` + context-specific bars |

### `composables/`

Composables hold reusable business logic. They are **not** components — they return reactive state and functions to be consumed inside `<script setup>`. See [Composables](#composables) for the full catalogue.

### `stores/`

Three Pinia stores:

| Store | Purpose |
|---|---|
| `crawlStore.js` | Master list of crawls, all modal open/close flags, refresh trigger |
| `authStore.js` | User session, token, login/logout/profile actions |
| `statsBarStore.js` | Context data for the bottom stats bar (switches between global and per-crawl views) |

### `utils/`

Pure functions with no Vue reactivity. Import them directly wherever needed.

| File | Purpose |
|---|---|
| `formattingUtils.js` | `formatDate`, `formatNumber`, `formatPercentage`, `getRelativeTime`, etc. |
| `urlUtils.js` | URL normalisation and display helpers |
| `validationUtils.js` | Form/field validation helpers |
| `fileUtils.js` | Export metadata persistence (`localStorage`) |
| `fileExportUtils.js` | CSV / Excel file generation |
| `environmentUtils.js` | `getApiUrl()`, `getSocketUrl()` — reads `import.meta.env` |
| `performanceUtils.js` | `memoize`, `debounce`, `throttle`, `shallowEqual` |
| `tableUtils.js` | Sort toggle, table data processing helpers |
| `tableOperationsUtils.js` | Higher-level table row/column configuration builders |
| `statusUtils.js` | Status string → badge class mapping |
| `crawlStatusUtils.js` | Crawl-specific status helpers |
| `dataTransformUtils.js` | API response → component-friendly shape transformations |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ App.vue                                                  │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ Navbar       │  │ StatsWrapper│  │ ModalWrapper     │ │
│  │  (layout)    │  │  (layout)  │  │  (layout)        │ │
│  └──────────────┘  │            │  └──────────────────┘ │
│                    │ <router-   │                        │
│  ┌──────────────┐  │  view />   │  ┌──────────────────┐ │
│  │Notification  │  └────────────┘  │ NotificationWrapper│
│  │Wrapper       │                  └──────────────────┘ │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘

Pages (via router-view):
  /             → HomePage  (or LandingPage when unauthenticated)
  /crawl/:id    → CrawlDetailsView
```

### Key architectural decisions

**ModalWrapper is the single mount point for all global dialogs.**
All modal components are rendered inside `ModalWrapper.vue`, which reads their open/close state directly from `crawlStore`. Components that need to open a modal call the corresponding store action (e.g., `crawlStore.openCreateModal(crawl)`). The `ModalWrapper` listens for the modal's emit events and handles side-effects (store updates, notifications).

**The stats bar is context-aware.**
`StatsWrapper` renders `StatsBottomBar`, which delegates rendering to either `GlobalStatsBar` or `CrawlDetailsStatsBar` based on the active context set in `statsBarStore`. Pages write context data to the store via `useCrawlData` (for the crawl details page) or `useStatsBarContext`.

**`refreshTrigger` is the cross-component refresh bus.**
When a crawl is created or updated, `crawlStore.triggerRefresh()` increments `refreshTrigger`. Any component that needs to re-fetch after a save watches this value:

```js
watch(() => crawlStore.refreshTrigger, () => {
  fetchCrawlData(crawlId.value)
})
```

---

## Entry Points

### `main.js`

```js
createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app')
```

No global component registration — all components are imported locally.

### `App.vue`

Wraps the entire app in `<NotificationWrapper>` (which provides the toast notification system), renders the `<Navbar>`, the authenticated `<StatsWrapper>` (contains `<router-view>`), the unauthenticated `<router-view>`, and `<ModalWrapper>`.

---

## Routing

File: `src/router.js`

| Path | Name | Auth required | Component |
|---|---|---|---|
| `/` | `HomePage` | No | `HomePage.vue` |
| `/crawl/:crawlId` | `CrawlDetails` | Yes | `CrawlDetailsView.vue` |

**Navigation guard**: Before each navigation, `authStore.initializeAuth()` is called to verify the stored token. If a protected route is accessed without a valid session, the user is redirected to `/` with a `?redirect=` query parameter.

**Auto-logout redirect**: `App.vue` watches `isAuthenticated`. If it transitions from `true` → `false` while on a `requiresAuth` route, the user is pushed to `/`.

---

## Pages

### `HomePage.vue`

The root page after login. Renders either `LandingPage` (unauthenticated) or `GeneralDashboard` (authenticated).

### `LandingPage.vue`

Marketing/landing page. Uses `crawlStore.openAuthModal(mode)` to trigger the login/register modal.

### `GeneralDashboard.vue`

The main dashboard for authenticated users. Hosts `CrawlerTable` (paginated list of crawls) and wires the toolbar actions.

### `CrawlDetailsView.vue`

The per-crawl detail page at `/crawl/:crawlId`. Composes:

- `CrawlDetailsHeader` — title, status, start/configure buttons
- `CrawlUrlsTable` — list of URLs with live status indicators
- `CrawlDetailsSidebar` — latest export link
- `SlideOver` + `ViewResult` — slide-in panel for viewing scraped data
- `ProxyStatsModal` — proxy usage for this crawl

**Composables used:**

| Composable | Purpose |
|---|---|
| `useCrawlData` | Fetches and holds the crawl + aggregated data |
| `useCrawlSocket` | Connects to the crawl's Socket.IO room, patches live status |
| `useCrawlExport` | Tracks the latest export link for the sidebar |
| `useCrawlDetailsView` | URL selection state (checkboxes) |
| `useCrawlActions` | Bulk delete, restart, start actions |
| `useProxyStats` | Proxy stat data for the modal |
| `useApiService` | `loading` flag for the header skeleton |

---

## Component Catalogue

### Layout

#### `Navbar.vue`
Top navigation bar. Shows authentication buttons when logged out; shows "New Crawl", a user menu (Run All, Queue Status, Logout) when logged in. Uses `useCrawlManagement` for `runAllLoading`.

#### `ModalWrapper.vue`
Renders every global modal. Reads `crawlStore.*Modal` flags. Handles `@crawl-created` by calling `crawlStore.updateCrawl` or `crawlStore.addCrawl`, then `crawlStore.triggerRefresh()`.

#### `NotificationWrapper.vue`
Provides the `showNotification` injectable and renders the toast. Prefer `useNotification()` over `inject('showNotification')` in new code.

#### `StatsWrapper.vue`
Wraps the main content area with `StatsBottomBar` at the bottom. Only rendered when the user is authenticated.

---

### Modals

All modals follow the same template pattern:

```html
<div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
  <!-- backdrop -->
  <div class="fixed inset-0 bg-black bg-opacity-50" @click="closeModal"></div>
  <!-- content -->
  <div class="relative flex min-h-screen items-center justify-center p-4">
    <div class="relative bg-white rounded-2xl shadow-2xl ...">
      ...
    </div>
  </div>
</div>
```

| Modal | Trigger | Purpose |
|---|---|---|
| `AuthModal` | `crawlStore.openAuthModal(mode)` | Login / register form |
| `CreateCrawlModal` | `crawlStore.openCreateModal(crawl?)` | Create or update a crawl (3-step wizard) |
| `ExportModal` | `crawlStore.openExportModal()` | Export crawl data to Google Sheets or CSV |
| `ProxyStatsModal` | `statsBarStore.openProxyModal()` | Per-crawl proxy usage statistics |
| `GlobalProxyStatsModal` | From nav | System-wide proxy statistics with cost analysis |
| `QueueStatusModal` | `crawlStore.openQueueStatusModal()` | Live Bull queue status |
| `ConfirmationModal` (ui/) | Via `ModalWrapper` | Generic confirm/cancel dialog |

**`CreateCrawlModal`** is a 3-step wizard:
1. Basic info (title, URLs)
2. CSS selectors (`CssSelector` sub-components)
3. Advanced settings (schedule, disabled flag)

When `crawlData` prop is provided the modal enters **edit mode** and shows an "Update Crawl" button on every step.

---

### UI Primitives

#### `StatusPill.vue`
Renders a coloured pill badge for crawl/URL statuses. Accepts a `status` prop (`pending`, `in-progress`, `completed`, `failed`, `started`).

#### `CrawlerTable.vue`
Paginated, searchable table of all crawls. Handles inline enable/disable toggle. Emits nothing — uses `crawlStore` and `useCrawlManagement` directly.

#### `SlideOver.vue`
Animated slide-in panel from the right. Uses `ANIMATION_DURATIONS` constants from `crawlDetailsConstants.js`. Emits `closeSlideOver`.

#### `StatsBottomBar.vue`
Container for the context-aware bottom bar. Delegates to `CrawlDetailsStatsBar` or `GlobalStatsBar` based on `statsBarStore.currentContext`.

---

### Feature Components

#### `ViewResult.vue`
Renders the scraped data for a single URL inside the `SlideOver`. Handles both array results (table view) and string results. Shows a URL context pill and an empty state.

#### `UrlComponent.vue`
Expandable URL row with excerpt truncation powered by `useExcerpts`.

---

### Forms

#### `CssSelector.vue`
A self-contained form row for configuring one CSS selector. Supports parent/child selectors, `container` type with nested child selector list, and "use for change detection" checkbox. All fields are native HTML — no Vuetify.

---

## Stores (Pinia)

### `crawlStore` (Options API)

The only store using Options API style (`defineStore('crawl', { state, getters, actions })`).

**State**

| Field | Type | Purpose |
|---|---|---|
| `allCrawls` | `Crawl[]` | Master list loaded from the API |
| `selectedCrawl` | `Crawl \| null` | Crawl currently in a modal (create/edit/delete) |
| `selectedCrawls` | `string[]` | IDs checked in bulk-delete mode |
| `selectedUrls` | `string[]` | URLs selected for bulk URL operations |
| `refreshTrigger` | `number` | Incremented to signal components to re-fetch |
| `show*Modal` | `boolean` | One flag per modal |
| `authModalMode` | `'login' \| 'register'` | Initial tab for `AuthModal` |

**Key getters**

- `crawlStats` — `{ totalCrawls, activeCrawls, completedCrawls, totalUrls }` derived from `allCrawls`
- `crawlsToDelete` — returns `[selectedCrawl]` for single delete or `selectedCrawls` for bulk

**Key actions**

- `openCreateModal(crawlData?)` — sets `selectedCrawl` and opens the wizard
- `confirmDeleteCrawl(crawlId)` — looks up the crawl object in `allCrawls` before storing it (so consumers get `._id` and `.title`)
- `triggerRefresh()` — increments `refreshTrigger`
- `updateCrawl(updated)` — patches the matching item in `allCrawls` in place

---

### `authStore` (Composition API)

Manages user session. Token is persisted in `localStorage` under `auth_token`.

**Key actions**

| Action | Description |
|---|---|
| `login(credentials)` | POST `/api/auth/login`, stores user + token |
| `register(userData)` | POST `/api/auth/register` |
| `logout()` | POST `/api/auth/logout`, clears local state |
| `verifyToken()` | GET `/api/auth/verify` — called on every app load |
| `updateProfile(data)` | PUT `/api/auth/profile` |
| `changePassword(data)` | PUT `/api/auth/change-password` |
| `initializeAuth()` | Calls `verifyToken()` if a token exists |

---

### `statsBarStore` (Composition API)

Controls the bottom stats bar's context.

| Action | Description |
|---|---|
| `setContext(name, data, actions?)` | Switch the bar to a named context with payload |
| `clearContext()` | Reset to `'global'` |
| `openProxyModal() / closeProxyModal()` | Toggle the proxy stats modal from the stats bar |
| `setProxyStats(stats)` | Push fresh proxy stats into the store |

**Contexts**

| Name | Set by | Data shape |
|---|---|---|
| `'global'` | Default / route change | `crawlStats` from `crawlStore` |
| `'crawl-details'` | `useCrawlData` after fetch | `{ crawlId, title, status, urls, selectors, totalUrls, completedUrls, failedUrls, hasData }` |

---

## Composables

### `useApiService()`

Provides `get`, `post`, `put`, `del`, `patch` wrappers around Axios with:
- Automatic `Authorization: Bearer <token>` header injection
- 401 → `authStore.handleAuthExpired()`
- `loading` ref updated around every request
- `error` ref with extracted human-readable message
- Optional `silent: true` option to suppress error notifications

```js
const { get, post, put, del, loading, error } = useApiService()
const data = await get('/api/getallcrawlers?page=1&limit=20')
```

---

### `useAuth()`

Thin wrapper over `authStore` that adds helper functions for components:

```js
const { isAuthenticated, userFullName, logout, withAuth } = useAuth()
// withAuth(fn, fallback) — executes fn() only if authenticated
```

---

### `useCrawlManagement()`

Handles the crawl list page: fetch with pagination/search, run all crawls, enable/disable toggle.

```js
const { isSearching, runAllLoading, disableLoadingId, fetchCrawls, runAllCrawls, toggleDisableCrawl } = useCrawlManagement()
```

- `runAllLoading` is a **computed** from `useLoadingState` — do not assign to it directly. Use `setLoading(LOADING_KEYS.START_CRAWL, true/false)`.

---

### `useCrawlActions()`

Centralised crawl operation handlers. Components call `confirm*` functions; the actual API calls (`delete*`, `clear*`, etc.) are invoked from `ModalWrapper` when the user confirms.

```js
const { confirmDeleteCrawl, confirmDeleteCrawlData, confirmClearCrawlQueue, startCrawl } = useCrawlActions()
confirmDeleteCrawl(crawlId)          // opens ConfirmationModal
await startCrawl(crawlId, urls, selectors)
```

---

### `useCrawlData()`

Fetches and stores a single crawl's full data, manages excerpts, `liveStatusDictionary`, and writes the stats bar context.

```js
const { crawl, fetchCrawlData, excerpts, liveStatusDictionary, updateLiveStatus, clearLiveStatusDictionary } = useCrawlData()
await fetchCrawlData(crawlId)
```

After a successful fetch it calls `statsBarStore.setContext('crawl-details', { ..., urls, selectors, ... })`.

---

### `useCrawlSocket(crawlId, crawl, liveStatusDictionary, updateLiveStatus)`

Connects to the crawl's Socket.IO room and processes incoming events:

| Event | Handler |
|---|---|
| `crawlLog` | Updates `crawl.value.status`, patches `liveStatusDictionary`, appends new `aggregatedData` |
| `queueStatus` | Updates `queueStatus` ref `{ active, waiting, delayed, total }` |

```js
const { queueStatus, connectToCrawl, disconnectFromCrawl } = useCrawlSocket(crawlId, crawl, liveStatusDictionary, updateLiveStatus)
await connectToCrawl()
```

---

### `useSocketConnection()`

Low-level Socket.IO wrapper. Manages a single socket instance per call, `joinRoom`, `on`, `off`, `emit`, `disconnect`.

---

### `useCrawlExport(crawlId)`

Tracks the latest export link by reading/writing export metadata from `localStorage`.

```js
const { latestExportLink, latestExportDate, loadExportData, handleExportSuccess } = useCrawlExport(crawlId)
```

---

### `useCrawlDetailsView(crawl)`

URL row checkbox state (select all, toggle individual URL, clear selection).

```js
const { selectedUrls, selectAll, toggleSelectAll, toggleUrlSelection } = useCrawlDetailsView(crawl)
```

---

### `useNotification()`

Single notification composable. **Use this everywhere** — do not use `inject('showNotification')` in new code.

```js
const { showNotification, showSuccess, showError, showWarning, showInfo, handleApiError } = useNotification()
showNotification('Saved!', 'success')
handleApiError(err, 'profile update')
```

---

### `useLoadingState()`

Key-based loading state map. Used by composables that manage multiple concurrent operations.

```js
const { setLoading, isLoading, isAnyLoading } = useLoadingState()
setLoading(LOADING_KEYS.DELETE_CRAWL, true)
// ...
setLoading(LOADING_KEYS.DELETE_CRAWL, false)
const busy = isLoading(LOADING_KEYS.DELETE_CRAWL)  // boolean
```

---

### `useProxyStats()`

Fetches per-crawl and global proxy usage statistics and cost analysis. Returns pre-formatted helpers:

```js
const { proxyStats, globalStats, costAnalysis, fetchCrawlProxyStats, fetchGlobalProxyStats, formatNumber, formatPercentage, getRelativeTime } = useProxyStats()
```

---

### `useStatsBarContext()`

Sets the stats bar context based on the current route. Called once in `StatsWrapper` or page components that need it.

---

### `useExcerpts(textRef, length?)`

Creates a truncated excerpt with expand/collapse toggle.

```js
const { excerpt, isExpanded, toggleExpand } = useExcerpts(ref(url), 30)
```

---

## Utilities

### `formattingUtils.js`

| Function | Signature |
|---|---|
| `formatDate(date, options?)` | → `"Jan 1, 2025, 12:00 AM"` |
| `formatNumber(value, options?)` | → `"1,234"` |
| `formatCost(cost, currency?, decimals?)` | → `"$0.0012"` |
| `formatPercentage(value, decimals?)` | → `"95.3%"` |
| `getRelativeTime(date)` | → `"3h ago"` |
| `truncateText(text, maxLength?, suffix?)` | → `"Hello wor..."` |
| `formatStatus(status)` | → `"In Progress"` |

### `environmentUtils.js`

```js
getApiUrl()    // reads VITE_BASE_URL, falls back to http://localhost:3001
getSocketUrl() // reads VITE_SOCKET_URL, falls back to http://localhost:3002
```

### `fileUtils.js`

Stores / retrieves export metadata (sheet URL + date) per crawl in `localStorage`.

### `performanceUtils.js`

`memoize(fn, keyFn?)`, `debounce(fn, ms)`, `throttle(fn, ms)`, `shallowEqual(a, b)`.

---

## Constants

### `crawlDetailsConstants.js`

| Export | Purpose |
|---|---|
| `CRAWL_STATUSES` | `{ PENDING, IN_PROGRESS, COMPLETED, FAILED, ... }` |
| `URL_STATUSES` | `{ PENDING, STARTED, SUCCESS, FAILED }` |
| `ANIMATION_DURATIONS` | `{ FAST: 'duration-150', NORMAL: 'duration-200', SLOW: 'duration-300' }` |
| `SLIDE_OVER_DURATION_MS` | `300` — numeric mirror of `ANIMATION_DURATIONS.SLOW` |
| `LOADING_KEYS` | See `useLoadingState.js` |
| `STATUS_COLORS`, `STATUS_LABELS` | Status → colour / display string maps |
| `BUTTON_VARIANTS` | Pre-built Tailwind button class strings |

---

## Styling Conventions

The project uses **Tailwind CSS** exclusively. No Vuetify components remain.

### Card pattern

```html
<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
```

### Modal pattern

```html
<div class="fixed inset-0 z-50 overflow-y-auto">
  <div class="fixed inset-0 bg-black bg-opacity-50" @click="closeModal"></div>
  <div class="relative flex min-h-screen items-center justify-center p-4">
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
      <!-- header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <!-- body -->
      <div class="p-6">
      <!-- footer -->
      <div class="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
```

### Status badge pattern

```html
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Completed
</span>
```

### Table pattern

```html
<table class="min-w-full divide-y divide-gray-200">
  <thead class="bg-gray-50">
    <tr>
      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  <tbody class="bg-white divide-y divide-gray-200">
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-4 py-3 text-sm text-gray-700">
```

### Input pattern

```html
<input
  type="text"
  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
<select class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
```

### Primary button

```html
<button class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm">
```

---

## Data Flow Patterns

### Opening a modal

```
Component
  └─ crawlStore.openCreateModal(crawl)
       └─ sets selectedCrawl + showCreateModal = true
            └─ ModalWrapper renders CreateCrawlModal
                 └─ emits 'crawl-created' with updated crawl
                      └─ ModalWrapper.handleCrawlCreated()
                           ├─ crawlStore.updateCrawl(crawl)  // or addCrawl
                           ├─ crawlStore.triggerRefresh()
                           └─ showNotification('Saved', 'success')
```

### Cross-component refresh

Any component that needs to re-fetch after a save:

```js
watch(() => crawlStore.refreshTrigger, () => {
  fetchData()
})
```

### Confirmation dialogs

```
Component
  └─ useCrawlActions().confirmDeleteCrawl(crawlId)
       └─ crawlStore.setSelectedCrawl(crawl)
       └─ crawlStore.openDeleteCrawlConfirm()
            └─ ModalWrapper renders ConfirmationModal
                 └─ @confirm → ModalWrapper.confirmDeleteCrawl()
                      └─ useCrawlActions().deleteCrawl(id)
```

---

## Real-time (Socket.IO)

The server runs a separate worker process on `VITE_SOCKET_URL` (default `http://localhost:3002`).

### Connection lifecycle

```
CrawlDetailsView.onMounted
  └─ useCrawlSocket.connectToCrawl()
       └─ useSocketConnection.joinRoom(crawlId)
            └─ socket.emit('join', crawlId)
       └─ setupSocketListeners()
            ├─ on('crawlLog', handler)
            └─ on('queueStatus', handler)

CrawlDetailsView.onUnmounted
  └─ useCrawlSocket.disconnectFromCrawl()
```

### `crawlLog` event payload

```json
{
  "url": "https://example.com",
  "status": "success | failed | started | completed",
  "result": { ... },
  "message": "..."
}
```

### `queueStatus` event payload

```json
{ "active": 3, "waiting": 12, "delayed": 0 }
```

`queueStatus` in `useCrawlSocket` is updated automatically and exposed for components to bind to.

---

## Authentication Flow

1. `main.js` boots → `router.beforeEach` calls `authStore.initializeAuth()`
2. `initializeAuth` reads `localStorage['auth_token']`; if present, calls `verifyToken()` → `GET /api/auth/verify`
3. On success, `user` ref is populated; `isAuthenticated` becomes `true`
4. On 401 at any point during the session, the Axios interceptor in `useApiService` calls `authStore.handleAuthExpired()` which clears the session and triggers the router guard

**Login/register** is handled by `AuthModal` → `LoginForm` / `RegisterForm` → `authStore.login()` / `authStore.register()`.

**Logout** is in the Navbar user menu → `handleLogout()` → `authStore.logout()` → `POST /api/auth/logout` → `clearAuthData()`.

---

## Adding New Features — Checklist

### New page/route

- [ ] Create `src/components/pages/MyPage.vue`
- [ ] Add route to `src/router.js` (add `meta: { requiresAuth: true }` if auth-gated)
- [ ] Set stats bar context in `useCrawlData` or call `statsBarStore.setContext(...)` on mount

### New modal

- [ ] Create `src/components/modals/MyModal.vue` following the modal pattern
- [ ] Add a `show*Modal` flag to `crawlStore` state
- [ ] Add `open*Modal` / `close*Modal` actions to `crawlStore`
- [ ] Import and render the modal inside `ModalWrapper.vue`
- [ ] Open it from wherever needed via `crawlStore.openMyModal()`

### New API call

- [ ] Use `useApiService()` — never import Axios directly in a component
- [ ] Prefer `put(url, data)` for updates (not `post` with `method: 'PUT'`)
- [ ] Use `{ silent: true }` option for fire-and-forget calls that shouldn't toast on error

### New composable

- [ ] Export a single named function (`export function useMyThing() { ... }`)
- [ ] Return reactive state and functions from the function
- [ ] Use `useNotification()` — not `inject('showNotification')`
- [ ] Use `useLoadingState()` + `LOADING_KEYS` for loading flags that span multiple operations

### Adding a new status type

- [ ] Add the value to `CRAWL_STATUSES` or `URL_STATUSES` in `crawlDetailsConstants.js`
- [ ] Add the colour mapping to `STATUS_COLORS`
- [ ] Add the label mapping to `STATUS_LABELS`
- [ ] Update `StatusPill.vue` if a new colour class is needed
