# Backend Developer Documentation

> Node.js · Express · MongoDB · Bull · Redis · Socket.IO · Playwright

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Architecture](#architecture)
4. [Process Architecture — Two Processes](#process-architecture--two-processes)
5. [Environment Variables](#environment-variables)
6. [Entry Points](#entry-points)
7. [Routes](#routes)
8. [Controllers](#controllers)
9. [Middleware](#middleware)
10. [Models](#models)
11. [Services](#services)
12. [Queues](#queues)
13. [Worker](#worker)
14. [Classes](#classes)
15. [Utilities](#utilities)
16. [Scripts](#scripts)
17. [Seeders](#seeders)
18. [Error Handling Patterns](#error-handling-patterns)
19. [Authentication & Authorization](#authentication--authorization)
20. [Data Flow — Crawl Lifecycle](#data-flow--crawl-lifecycle)
21. [Adding New Features — Checklist](#adding-new-features--checklist)

---

## Overview

The backend is split into **two separate Node.js processes**:

| Process | Entry | Default Port | Role |
|---|---|---|---|
| **API server** | `src/app.js` | `3001` | REST API, auth, export |
| **Worker** | `src/worker.js` | `3002` | Bull job processing, Playwright, Socket.IO |

Both processes connect to the same MongoDB and Redis instances. The API server enqueues jobs; the worker pops them, scrapes pages with Playwright, saves results to MongoDB, and broadcasts live updates over Socket.IO.

```
server/
├── src/
│   ├── app.js                  # Express app bootstrap
│   ├── worker.js               # Bull worker process
│   ├── classes/                # Playwright/scraping classes
│   ├── controllers/            # Route handler functions
│   ├── middleware/             # auth, asyncHandler, errorHandler
│   ├── models/                 # Mongoose schemas
│   ├── queues/                 # Bull queue factory
│   ├── routes/                 # Express router definitions
│   ├── scripts/                # One-off admin/migration scripts
│   ├── seeders/                # Domain selector seed data
│   ├── services/               # Business-logic services
│   └── utils/                  # Pure helper functions
└── utils/                      # Legacy root-level utilities (kept for backward compat)
```

---

## Directory Structure

### `src/classes/`

| File | Purpose |
|---|---|
| `Seed.js` | Playwright browser automation — loads a URL, handles retries, proxy enabling |
| `ErrorHandler.js` | Analyses Playwright errors (HTTP codes, anti-bot, network failures) |
| `BaseModel.js` | Legacy base model class (not actively used) |
| `CrawlModel.js` | Legacy class wrapper around the `Crawl` Mongoose model |
| `CrawlDataModel.js` | Legacy class wrapper around the `CrawlData` Mongoose model |
| `SelectorModel.js` | Legacy class wrapper around the `Selectors` Mongoose model |

### `src/controllers/`

One file — `crawlerController.js`. All crawl CRUD, queue management, and proxy stat endpoints live here.

### `src/middleware/`

| File | Exports |
|---|---|
| `auth.js` | `authenticate`, `optionalAuth`, `requireAdmin`, `requireSuperAdmin`, `generateToken`, `verifyToken` |
| `errorHandler.js` | `asyncHandler`, `errorHandler`, `notFound` |

### `src/models/`

| Model | Collection | Key Fields |
|---|---|---|
| `Crawl` | `crawls` | `title`, `urls[]`, `selectors[]`, `userId`, `status`, `results[]`, `logs[]` |
| `CrawlData` | `crawldatas` | `crawlId`, `url`, `data`, `status`, `runId` |
| `User` | `users` | `email`, `password`, `firstName`, `lastName`, `role`, `isActive` |
| `ProxyUsage` | `proxyusages` | `crawlId`, `url`, `proxyId`, `proxyLocation`, `successCount`, `failureCount` |
| `Selectors` | `selectors` | `domain`, `selectors[]`, `htmlChecksum`, `lastChecked` |

### `src/queues/`

| File | Purpose |
|---|---|
| `getCrawlQueue.js` | Factory + cache — returns a Bull `Queue` instance for a given `crawlId`, caching instances in a `Map` |

### `src/routes/`

| File | Mount point | Auth |
|---|---|---|
| `authRoutes.js` | `/api/auth` | Mixed — most require `authenticate` |
| `crawlerRoutes.js` | `/api` | All routes use `authenticate` via `router.use(authenticate)` |
| `exportRoutes.js` | `/api/export` | All data routes require `authenticate` |
| `oauth2Routes.js` | `/api/oauth2` | All routes require `authenticate` |

### `src/scripts/`

One-off admin and migration scripts. All are guarded with `require.main === module` so they only run when executed directly.

### `src/seeders/`

Per-domain CSS selector seed files. Each file inserts or upserts a `Selectors` document for a specific domain. Run manually to populate the `selectors` collection.

### `src/services/`

| Service | Purpose |
|---|---|
| `AuthService` | User registration, login, profile, password management |
| `BaseService` | Generic CRUD mixin — all other services extend this |
| `ChangeDetectionService` | Compares crawl runs by `runId`, detects new/changed/removed URLs |
| `ProxyUsageService` | Tracks and aggregates Oxylabs proxy usage per-crawl and globally |
| `GoogleSheetsOAuth2Service` | Exports crawl data to Google Sheets via OAuth2 |

### `src/utils/`

| File | Purpose |
|---|---|
| `aggregationPipelines.js` | Pre-built MongoDB aggregation stages and pipeline builders for proxy stats |
| `checksum.js` | MD5 checksum of HTML content (used for change detection) |
| `databaseOptimization.js` | Diagnostic utilities — `analyzeQuery`, `getCollectionStats`, `cleanupOldData`, `optimizeDatabase` |
| `errorHandler.js` | `AppError` class, `ErrorTypes` enum, `ErrorSeverity` enum |
| `responseUtils.js` | Standardised response helpers — `sendSuccess`, `sendError`, `sendNotFound`, `sendValidationError`, etc. |
| `validationUtils.js` | Joi validation schemas (`schemas.user.*`, `schemas.crawl.*`) and `validate` middleware factory |

### `utils/` (root-level)

Legacy utilities kept for backward compatibility with the worker and scripts. The canonical location for new utilities is `src/utils/`.

| File | Purpose |
|---|---|
| `helperFunctions.js` | `extractHtml` (Cheerio scraping), `aggregateDashboard`, `determineCrawlStatus`, `getCleanHtml`, `sanitizeFilename` |
| `socket.js` | `initializeSocket(server)`, `getSocket()` — singleton Socket.IO instance |

---

## Architecture

```
Client (Vue SPA)
       │ HTTP REST         │ WebSocket (Socket.IO)
       ▼                   ▼
┌─────────────────┐   ┌────────────────────────────┐
│  app.js         │   │  worker.js                 │
│  Express :3001  │   │  Bull processor :3002       │
│  ├─ authRoutes  │   │  ├─ Playwright (Seed.js)   │
│  ├─ crawlRoutes │   │  ├─ CrawlData.save()       │
│  ├─ exportRoutes│   │  └─ Socket.IO.emit()       │
│  └─ oauth2Routes│   └────────────┬───────────────┘
└────────┬────────┘                │
         │ Crawl.findByIdAndUpdate │ CrawlData.save
         ▼                        ▼
    ┌──────────┐            ┌──────────┐
    │ MongoDB  │            │  Redis   │
    │          │◄───────────│  Bull Q  │
    └──────────┘            └──────────┘
```

**Request flow** for starting a crawl:

1. Client calls `POST /api/startcrawl` with `{ crawlId, urls }`
2. API calls `POST http://localhost:3002/processor/:crawlId` to wake up the worker for this crawl
3. API adds one Bull job per URL to the `crawl:<crawlId>` queue
4. Worker pops each job, creates a `Seed` instance, fetches the page with Playwright
5. Worker calls `extractHtml(html, selectors)` (Cheerio), saves a `CrawlData` document
6. Worker emits `crawlLog` over Socket.IO to the room `crawlId`
7. When `completed + failed + stalled === total`, worker updates `Crawl.status` to `completed` or `failed`

---

## Process Architecture — Two Processes

The two processes are intentionally isolated so that a Playwright crash in the worker does not bring down the API.

```bash
# Start API server
node src/app.js        # or: npm run dev (uses nodemon)

# Start worker
node src/worker.js     # or: npm run worker
```

The worker exposes two internal HTTP endpoints **on port 3002** (not part of the public API):

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/processor/:crawlId` | Wake up Bull processor for a specific crawlId |
| `GET` | `/queue-status/:crawlId` | Internal queue stats (active/waiting/completed/failed) |
| `DELETE` | `/queue-clear/:crawlId` | Clear all jobs for a crawlId |

**Startup recovery** — on each MongoDB connection the worker runs `recoverStuckCrawls()` which finds any crawl still stuck at `in-progress` from a previous crash and resets it to `pending`.

---

## Environment Variables

Create `server/.env`:

```env
# Required
MONGO_URI=mongodb://localhost:27017/crawler_db
JWT_SECRET=change-me-in-production

# Optional (defaults shown)
PORT=3001
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_EXPIRES_IN=7d
NODE_ENV=development
ORIGIN=http://localhost:5173
CRAWL_CONCURRENCY=3

# Worker port
PORT=3002   # set this when starting worker.js

# Proxy (Oxylabs)
OXYLAB_SERVER=...
OXYLAB_USERNAME=...
OXYLAB_PASSWORD=...

# Google Sheets OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
GOOGLE_GLOBAL_EXPORT_SHEET_ID=...
```

> **Warning:** If `JWT_SECRET` is not set, the server will log a fatal warning and fall back to an insecure default. **Always set this in production.**

---

## Entry Points

### `src/app.js`

- Loads all four route files with fallback error handling for broken imports
- Applies CORS (dev only), `express.json()`, request logging
- Mounts routes in specificity order: `/api/auth` → `/api/export` → `/api/oauth2` → `/api`
- Connects to MongoDB
- Mounts `notFound` and `errorHandler` middleware last

### `src/worker.js`

- Bootstraps a minimal Express app + Socket.IO on `PORT` (default 3002)
- Connects to MongoDB, then calls `recoverStuckCrawls()`
- Exposes `ensureProcessor(crawlId)` — called once per crawl to register Bull event listeners and start the processor
- Manages per-crawl throttling (`p-throttle`, 1 req / 2 s) to avoid overloading targets

---

## Routes

### Auth — `GET/POST /api/auth/*`

All routes are rate-limited to 5 requests / 15 min per IP.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create a new admin user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `POST` | `/api/auth/logout` | ✓ | Client-side token removal |
| `GET` | `/api/auth/profile` | ✓ | Get own profile |
| `PUT` | `/api/auth/profile` | ✓ | Update own profile |
| `PUT` | `/api/auth/change-password` | ✓ | Change password |
| `GET` | `/api/auth/verify` | ✓ | Verify token, return user |
| `GET` | `/api/auth/users` | ✓ superadmin | List all users |
| `POST` | `/api/auth/create-superadmin` | ✓ superadmin | Promote a user to superadmin |

### Crawls — `* /api/*`

All routes require `authenticate`. Non-superadmin users can only access their own crawls.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/getallcrawlers` | List crawls (paginated, searchable) |
| `GET` | `/api/getcrawler/:id` | Single crawl with aggregated stats |
| `POST` | `/api/createcrawler` | Create crawl |
| `PUT` | `/api/updatecrawl/:id` | Update crawl (ownership checked) |
| `DELETE` | `/api/deletecrawl/:id` | Delete crawl + CrawlData + queue jobs |
| `DELETE` | `/api/deletecrawldata/:id` | Clear all scraped data for a crawl |
| `DELETE` | `/api/deletecrawldata/:id/urls` | Clear data for specific URLs |
| `POST` | `/api/startcrawl` | Queue crawl job(s) |
| `POST` | `/api/runallcrawls` | Queue all non-disabled crawls |
| `GET` | `/api/queuestatus/:crawlId` | Bull queue counts (active/waiting/delayed/failed) |
| `DELETE` | `/api/clearqueue/:crawlId` | Empty Bull queue for a crawl |
| `DELETE` | `/api/clearallqueues` | Empty all queues for the user |
| `GET` | `/api/allqueuesstatus` | Status of all queues across the user's crawls |
| `GET` | `/api/selectors/:domain` | Domain selector lookup |
| `GET` | `/api/crawls/:id/proxy-stats` | Per-crawl proxy usage statistics |
| `GET` | `/api/proxy-stats/global` | Global proxy usage statistics |
| `GET` | `/api/proxy-stats/url` | Usage for a specific URL |
| `GET` | `/api/proxy-stats/cost-analysis` | Cost analysis with date range filter |
| `DELETE` | `/api/proxy-stats/cleanup` | Remove old proxy usage records |

### Export — `* /api/export/*`

All routes require `authenticate`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/export/google-sheets/:crawlId` | Export a single crawl to Google Sheets |
| `POST` | `/api/export/google-sheets/multiple` | Export multiple crawls to one sheet |
| `POST` | `/api/export/google-sheets/global` | Export all crawls globally |
| `GET` | `/api/export/changes/:crawlId` | Get change analysis between runs |
| `GET` | `/api/export/csv/:crawlId` | Download change data as CSV |
| `GET` | `/api/export/crawls` | List crawls available for comparison |
| `GET` | `/api/export/google-sheet-id` | Get configured global sheet ID |
| `GET` | `/api/export/google-storage` | Google Drive storage quota |

### OAuth2 — `* /api/oauth2/*`

All routes require `authenticate`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/oauth2/auth` | Get Google OAuth2 redirect URL |
| `GET` | `/api/oauth2/callback` | Exchange OAuth2 code for tokens |
| `GET` | `/api/oauth2/status` | Check if OAuth2 is authenticated |

---

## Controllers

All controller functions are wrapped with `asyncHandler` — unhandled promise rejections are automatically forwarded to `errorHandler` middleware; no boilerplate `try/catch` is needed.

```javascript
// Pattern used throughout crawlerController.js
const myHandler = asyncHandler(async (req, res) => {
    const result = await SomeModel.doSomething();
    sendSuccess(res, { result }, 'Operation successful');
});
```

**`buildUserQuery(user)`** — a local helper that returns the Mongoose query filter appropriate for the user's role:

```javascript
// superadmin → {} (all documents)
// admin      → { $or: [{ userId: ObjectId }, { userId: string }] }
```

**`startCrawl(crawlId, urls)`** — extracted shared helper used by both `crawlWebsite` and `runAllCrawls`. Returns `{ alreadyRunning }`, `{ alreadyQueued }`, or `{ started }`.

---

## Middleware

### `authenticate`

Reads the `Authorization: Bearer <token>` header, verifies the JWT, fetches the full `User` document from MongoDB, and attaches it to `req.user`. Returns `401` if missing or invalid.

> Every route in `crawlerRoutes.js` passes through this middleware via `router.use(authenticate)`.

### `optionalAuth`

Same as `authenticate` but silently continues without `req.user` if no token is present. Used by export routes where unauthenticated responses return empty data instead of an error.

### `asyncHandler`

```javascript
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

Eliminates repetitive `try/catch` in controller functions.

### `errorHandler`

Central Express error middleware (4-arg `(err, req, res, next)`). Normalises Mongoose `CastError`, duplicate key errors, JWT errors, and validation errors into consistent `{ success, error, code }` JSON responses. Includes the `stack` trace in development mode.

### `notFound`

Catches unmatched routes and creates a `404 AppError` forwarded to `errorHandler`.

---

## Models

### `Crawl`

```
{
  title:               String (required)
  urls:                [String] (required)
  selectors:           [selectorSchema]
  advancedSelectors:   [String]
  comparisonSelectors: Mixed  // { [containerKey]: [childFieldName, ...] }
  userId:              ObjectId → User (required)
  status:              'pending' | 'in-progress' | 'completed' | 'failed'
  disabled:            Boolean
  results:             [ObjectId → CrawlData]
  logs:                [{ message, level: 'info'|'warn'|'error', timestamp }]
  error:               String
  startTime:           Date
  endTime:             Date
  createdAt:           Date
  updatedAt:           Date
  proxyUsageStats:     { totalProxyRequests, uniqueProxiesUsed, lastProxyUsed,
                         proxyCostEstimate, averageProxySuccessRate }
}
```

**Indexes:** `{ userId: 1 }`

**Selector sub-schema:**

```
{
  target_element:  String (required)   // human-readable label
  selector_value:  String (required)   // CSS selector
  type:            'text' | 'link' | 'image' | 'table' | 'list' | 'container'
  attribute:       String | null
  childSelectors:  [{ target_element, selector_value, type, attribute }]
}
```

### `CrawlData`

```
{
  crawlId:    ObjectId → Crawl (required)
  url:        String (required)
  data:       Mixed   // extracted key-value pairs from CSS selectors
  status:     'pending' | 'success' | 'failed'
  error:      String
  runId:      String (required)  // timestamp string, groups docs by crawl run
  createdAt:  Date   // managed by { timestamps: true }
  updatedAt:  Date
}
```

**Post-save hook** — pushes `doc._id` onto the parent `Crawl.results` array and calls `determineCrawlStatus` to check if all URLs have finished.

### `User`

```
{
  email:      String (unique, lowercase)
  password:   String (bcrypt-hashed via pre-save hook)
  firstName:  String
  lastName:   String
  role:       'admin' | 'superadmin'
  isActive:   Boolean
  lastLogin:  Date
  createdAt:  Date   // managed by { timestamps: true }
  updatedAt:  Date
}
```

**Instance methods:** `comparePassword(candidate)`, `getProfile()`, `isSuperAdmin()`, `isAdmin()`
**Static methods:** `findByEmail(email)`
**Indexes:** `{ email: 1 }`, `{ role: 1 }`

### `ProxyUsage`

Tracks per-request proxy usage for cost and performance analysis.

```
{
  crawlId:             ObjectId → Crawl (required)
  url:                 String (required)
  proxyId:             String (required)
  proxyLocation:       String (required)
  firstUsed / lastUsed: Date
  totalRequests:       Number
  successCount:        Number
  failureCount:        Number
  averageResponseTime: Number  // ms
  status:              'active' | 'blocked' | 'slow'
  costPerRequest:      Number  // USD
  totalCost:           Number  // USD
}
```

**Compound indexes:** `{ crawlId, proxyId }`, `{ url, proxyId }`, `{ lastUsed: -1 }`

**Static methods:** `getCrawlSummary(crawlId)`, `getGlobalSummary(user)`
**Instance methods:** `updateUsage(success, responseTime)`

### `Selectors`

Per-domain reusable selector configurations.

```
{
  domain:       String (unique, required)
  selectors:    [{ name, selector, type, attribute, childSelectors[] }]
  htmlChecksum: String   // MD5 of last scraped HTML
  lastChecked:  Date
}
```

**Instance methods:** `hasHtmlChanged(newHtml)`, `updateHtmlChecksum(html)`

---

## Services

### `AuthService` (static class)

| Method | Description |
|---|---|
| `register(userData)` | Validates with `schemas.user.register`, hashes password, creates `User` |
| `login(loginData)` | Validates, verifies password, updates `lastLogin`, returns JWT |
| `getProfile(userId)` | Returns user profile without password |
| `updateProfile(userId, data)` | Updates `firstName`/`lastName` only |
| `changePassword(userId, current, new)` | Verifies current, hashes and saves new |
| `createSuperAdmin(userData)` | Same as `register` but with `role: 'superadmin'` |
| `getAllUsers(options)` | Paginated user list (superadmin only) |

### `BaseService` (extended by `ProxyUsageService`)

Provides: `create`, `findById`, `find`, `findOne`, `updateById`, `updateMany`, `deleteById`, `deleteMany`, `count`, `aggregate`, `paginate`, `bulkCreate`, `bulkUpdate`.

All methods re-throw errors after logging — upstream code is responsible for catching them via `asyncHandler`.

### `ChangeDetectionService` (singleton)

Groups `CrawlData` records by `runId` to identify the current and previous runs, then compares them URL-by-URL.

| Method | Description |
|---|---|
| `detectChanges(crawlId, compareWith?)` | Returns full change analysis: new/changed/removed/unchanged URLs |
| `analyzeChanges(current, previous)` | Field-level diff between two data maps |
| `generateSummary(changes)` | Counts and change percentage (division-by-zero safe) |
| `prepareForGoogleSheets(changes, title, comparisonSelectors)` | Formats data into 2D array rows for Sheets export |
| `getPreviousRunData(crawlId, allData)` | Groups by `runId`, returns the second-newest run's records |

### `ProxyUsageService` (extends `BaseService`, singleton)

| Method | Description |
|---|---|
| `trackProxyUsage(crawlId, url, proxyId, ...)` | Upserts a `ProxyUsage` record and updates `Crawl.proxyUsageStats` |
| `getCrawlProxyStats(crawlId)` | Summary + per-proxy performance + detailed usage |
| `getGlobalProxyStats(user)` | Aggregated summary, top proxies, recent usage — scoped to user |
| `getTopProxies(user, limit)` | Top proxies by request count, scoped to user's crawl IDs |
| `getCostAnalysis(crawlId, start, end, user)` | Daily cost breakdown. Uses `crawlId` scope OR `user` scope — not both |
| `getUserCrawlIds(user)` | Returns `_id[]` for all crawls owned by the user (or all for superadmin) |

### `GoogleSheetsOAuth2Service` (singleton)

Manages a single OAuth2 token stored in memory. Key methods: `getAuthUrl()`, `getTokensFromCode(code)`, `isAuthenticated()`, `exportCrawlWithChanges(crawlId, opts)`, `exportMultipleCrawls(crawlIds, opts)`, `exportGlobalChanges(opts)`.

---

## Queues

### `getCrawlQueue(crawlId)`

Returns a cached Bull `Queue` instance for `crawl:<crawlId>`. Subsequent calls with the same `crawlId` return the same object rather than opening a new Redis connection.

```javascript
const getCrawlQueue = require('./queues/getCrawlQueue');
const q = getCrawlQueue(crawlId); // cached
```

**Configuration:**
- Limiter: 5 jobs / 3 seconds (Bull rate-limiter, separate from per-crawl Seed throttle)
- `removeOnComplete: 100` — keep last 100 completed jobs
- `removeOnFail: 50` — keep last 50 failed jobs
- `attempts: 1` — retries are handled internally by `Seed.loadHTMLContent()`

**`evictCrawlQueue(crawlId)`** — removes an instance from the cache. Called when a crawl is cleaned up after completion.

---

## Worker

`src/worker.js` is an IIFE (`(async () => { ... })()`) to allow top-level `await` for the dynamic `p-throttle` import (ESM).

**Per-crawl state (`activeJobs` Map):**

```javascript
{ total: Number, completed: Number }
```

`total` is set to `crawl.urls.length`. `completed` is initialised from `CrawlData.distinct('url', { crawlId })` so a restarted worker picks up where it left off.

**Completion check** — after every `completed`, `failed`, or `stalled` event:

```javascript
if (state.completed === state.total) {
  // determine final status, update Crawl, emit crawlLog, cleanupCrawl()
}
```

**Stalled job guard** — the `stalled` handler increments `completed` only if `completed < total` to prevent double-counting when Bull re-queues a stalled job that then completes normally.

**Per-crawl throttle** — each crawl gets its own `p-throttle` instance (1 request / 2 s). This limits Playwright page loads per crawl without affecting other crawls running concurrently.

---

## Classes

### `Seed`

```javascript
const seed = new Seed({ url, advancedSelectors });
await seed.loadHTMLContent();      // returns clean HTML string
seed.isValid();                     // URL validity check
seed.enableProxy(proxyConfig?);    // enable Oxylabs proxy for next attempt
seed.getProxyStatus();             // { enabled, config }
```

`loadHTMLContent` retries up to 2 times. On the first failure, if `errorAnalysis.retryWithProxy` is true, it automatically enables proxy before the second attempt.

### `ErrorHandler`

Analyses a Playwright error or page content and returns a structured `errorAnalysis` object:

```javascript
{
  isBlocking: Boolean,        // should we abort the crawl?
  retryWithProxy: Boolean,    // should next attempt use proxy?
  message: String,
  errorType: String           // 'HTTP_ERROR' | 'ANTI_BOT' | 'NETWORK' | ...
}
```

---

## Utilities

### `responseUtils.js`

All controller responses should use these helpers for consistency:

```javascript
sendSuccess(res, data, message, statusCode = 200)
sendError(res, message, code, statusCode = 500, details)
sendNotFound(res, resource = 'Resource')
sendValidationError(res, message, errors)
sendUnauthorized(res, message)
sendForbidden(res, message)
sendPaginated(res, data, pagination, message)
```

`sendSuccess` correctly includes falsy values (`[]`, `false`, `0`) in the `data` field.

### `validationUtils.js`

```javascript
const { schemas, validate, validateObjectId } = require('./validationUtils');

// Use as Express middleware
router.post('/register', validate(schemas.user.register), handler);
router.get('/crawl/:id', validateObjectId('id'), handler);
```

Available schemas: `schemas.user.{register, login, update, changePassword}`, `schemas.crawl.{create, update, start}`, `schemas.query.{pagination, search, dateRange}`.

### `aggregationPipelines.js`

Pre-built MongoDB aggregation building blocks to avoid duplicating pipeline stages across services:

```javascript
const { buildProxyPerformancePipeline, buildSummaryPipeline, createCrawlMatch } = require('./aggregationPipelines');

const pipeline = buildProxyPerformancePipeline({
    matchStage: createCrawlMatch(crawlId),
    limit: 10,
    sortBy: 'successRate'  // 'requests' | 'successRate' | 'lastUsed'
});
```

### `errorHandler.js` (utils)

```javascript
const { AppError, ErrorTypes, ErrorSeverity } = require('./errorHandler');

throw new AppError('Not found', ErrorTypes.NOT_FOUND, ErrorSeverity.LOW);
```

`ErrorTypes`: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL`

### `helperFunctions.js` (root `utils/`)

| Function | Description |
|---|---|
| `extractHtml(html, selectors)` | Cheerio — extracts key-value pairs from HTML using the selector schema |
| `determineCrawlStatus(crawlDataArray)` | Returns `{ status: 'completed' | 'failed' }` based on the proportion of failed records |
| `aggregateDashboard(crawl)` | Builds aggregated stats for the crawl detail view |
| `getCleanHtml(html)` | Strips `<script>` and `<style>` tags from HTML |
| `sanitizeFilename(url)` | Makes a URL safe to use as a file name |

---

## Scripts

All scripts in `src/scripts/` connect to MongoDB directly and should be run from the `server/` directory:

```bash
node src/scripts/createSuperAdmin.js
node src/scripts/migrateSelectors.js
```

| Script | Purpose |
|---|---|
| `createSuperAdmin.js` | Creates the initial superadmin account |
| `migrateSelectors.js` | Normalises selector schema (adds `type`, `childSelectors` to existing records) |
| `migrateProxyUsage.js` | Adds `proxyUsageStats` subdocument to crawls lacking it |
| `migrateCreatedAt.js` | Backfills `createdAt` on crawls using `startTime` as a fallback |
| `clearAllCrawlData.js` | Removes all `CrawlData` records (destructive — use carefully) |
| `exportDatabase.js` | Dumps all collections to JSON files |
| `importDatabase.js` | Restores collections from JSON dump files |
| `optimizeDatabase.js` | Runs `databaseOptimization.optimizeDatabase()` (cleanup old records) |

---

## Seeders

Each file in `src/seeders/` seeds the `Selectors` collection for a specific real-estate / commercial property domain. Run a seeder to pre-populate CSS selector configurations:

```bash
node src/seeders/amazonSelectorsSeeder.js
```

Seeders use `upsert` so they are safe to re-run.

---

## Error Handling Patterns

### Controller (preferred)

```javascript
const doSomething = asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) return sendNotFound(res, 'Item');

    if (!req.user.isSuperAdmin() && item.userId.toString() !== req.user._id.toString()) {
        return sendError(res, 'Access denied', 'FORBIDDEN', 403);
    }

    const result = await item.doWork();
    sendSuccess(res, { result }, 'Done');
});
```

### Service (re-throw pattern)

Services use `BaseService.handleError` which logs and re-throws. The controller's `asyncHandler` catches and forwards to `errorHandler`.

### Custom AppError

```javascript
throw new AppError('Custom message', ErrorTypes.BAD_REQUEST, ErrorSeverity.LOW);
// → errorHandler maps this to a 400 response automatically
```

---

## Authentication & Authorization

### Token lifecycle

1. Client sends credentials to `POST /api/auth/login`
2. `AuthService.login()` validates, checks `isActive`, returns `{ user, token }`
3. Client stores token and sends it as `Authorization: Bearer <token>` on every subsequent request
4. `authenticate` middleware verifies the JWT and re-fetches the `User` document from MongoDB on every request

### Role checks

```javascript
req.user.isSuperAdmin()   // role === 'superadmin'
req.user.isAdmin()        // role === 'admin' || 'superadmin'
```

**Ownership pattern** (applied in `deleteCrawler`, `deleteCrawlData`, `getCrawler`, `updateCrawler`):

```javascript
if (!req.user.isSuperAdmin() && doc.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied.' });
}
```

### `buildUserQuery(user)`

Returns a Mongoose filter that scopes queries to the current user's documents. Used in list endpoints (`getAllCrawlers`, `runAllCrawls`, `clearAllQueues`, etc.).

---

## Data Flow — Crawl Lifecycle

```
1. CREATE
   POST /api/createcrawler
   → crawlerController.createCrawler()
   → new Crawl({ ..., userId: req.user._id, status: 'pending' }).save()

2. START
   POST /api/startcrawl { crawlId, urls }
   → startCrawl(crawlId, urls)        // shared helper
   → Crawl.status = 'in-progress'
   → axios.post('localhost:3002/processor/:crawlId')   // wake worker
   → q.add({ url, crawlId, runId }) × N

3. PROCESS  (inside worker.js)
   q.process() picks a job
   → new Seed({ url }).loadHTMLContent()   // Playwright
   → extractHtml(html, crawl.selectors)     // Cheerio
   → new CrawlData({ url, data, crawlId, runId, status: 'success' }).save()
   → io.to(crawlId).emit('crawlLog', { url, status, result })

4. COMPLETE
   completed === total (tracked in activeJobs Map)
   → determineCrawlStatus(allCrawlData)
   → Crawl.status = 'completed' | 'failed'
   → io.to(crawlId).emit('crawlLog', { status })
   → cleanupCrawl(crawlId)

5. VIEW
   GET /api/getcrawler/:id
   → Crawl.findById(id).populate('results')
   → aggregateDashboard(crawlerData)   // counts, stats
   → res.json(aggregatedCrawlObj)
```

---

## Adding New Features — Checklist

### New API endpoint

- [ ] Add handler to `crawlerController.js` wrapped with `asyncHandler`
- [ ] Use `sendSuccess` / `sendNotFound` / `sendError` from `responseUtils.js`
- [ ] Add ownership check (`req.user.isSuperAdmin() || doc.userId === req.user._id`) if the resource is user-owned
- [ ] Register the route in the appropriate `routes/*.js` file
- [ ] Add `authenticate` (or `optionalAuth`) middleware to the route
- [ ] Document the new endpoint in this file under [Routes](#routes)

### New service method

- [ ] Add to the appropriate service class (or create a new one extending `BaseService`)
- [ ] Use `this.handleError` in `catch` blocks, or let `asyncHandler` handle re-throws
- [ ] If it runs aggregations, add reusable stages to `aggregationPipelines.js`

### New model

- [ ] Define schema in `src/models/`
- [ ] Add indexes directly to the schema (not via `databaseOptimization.js`)
- [ ] Use `{ timestamps: true }` in schema options instead of manual `createdAt`/`updatedAt` fields
- [ ] Add `enum` constraints on all status/type fields
- [ ] Export the model and import it wherever needed

### New migration script

- [ ] Put it in `src/scripts/`
- [ ] Wrap execution in `if (require.main === module)` to prevent accidental execution on `require()`
- [ ] Use `process.env.MONGO_URI` (with `mongodb://localhost:27017/crawler_db` as fallback, **not** `crawler`)

### New seeder

- [ ] Put it in `src/seeders/`
- [ ] Use `Selectors.findOneAndUpdate({ domain }, data, { upsert: true })` so re-runs are idempotent
