# CrawlerPro — Advanced Web Scraping Platform

A full-stack web application for crawling websites, extracting structured data with custom CSS selectors, and exporting results to Google Sheets or CSV. Features real-time progress updates, a Bull/Redis job queue, proxy usage analytics, and role-based authentication.

## Live Demo

[http://crawler.onthis.website/](http://crawler.onthis.website/)

---

## Feature Highlights

- **Multi-URL crawling** with custom CSS selector configurations
- **Real-time status updates** via Socket.IO — watch each URL complete live
- **3-step crawl wizard** — create or edit crawls at any step, no need to finish the wizard to save
- **Bull/Redis job queue** with queue status monitoring
- **Data export** to Google Sheets or CSV/Excel
- **Proxy usage analytics** — per-crawl and global statistics with cost analysis
- **Stuck crawl recovery** — worker restarts automatically reset `in-progress` crawls
- **Role-based auth** — `user`, `admin`, `superadmin`
- **Change detection** — compare crawl runs to identify changed content

---

## Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| Vue 3 | `^3.4` | UI framework (Composition API / `<script setup>`) |
| Pinia | `^2.2` | State management |
| Vue Router | `^4` | Client-side routing |
| Tailwind CSS | `^3.4` | Styling — only CSS framework used |
| Axios | `^1.7` | HTTP client |
| Socket.IO Client | `^4.7` | Real-time crawl progress |
| Vite | `^5.4` | Build tool and dev server |

> **Note:** Vuetify has been fully removed. All UI is implemented with Tailwind CSS utility classes.

### Backend

| Technology | Role |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Data persistence |
| Bull + Redis | Job queue for crawl tasks |
| Socket.IO | Real-time event broadcasting |
| Playwright | Headless browser scraping |
| Cheerio | HTML parsing |

---

## Project Structure

```
crawler-advanced/
├── client/                       # Vue 3 frontend
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router.js
│   │   ├── index.css             # Tailwind directives
│   │   ├── components/
│   │   │   ├── features/crawl/   # Domain-specific crawl UI
│   │   │   ├── forms/            # Standalone form components
│   │   │   ├── layout/           # App shell (Navbar, ModalWrapper, StatsWrapper…)
│   │   │   ├── modals/           # All modal dialogs
│   │   │   ├── pages/            # Route-level page components
│   │   │   └── ui/               # Generic UI primitives (table, status pill, slide-over…)
│   │   ├── composables/          # Reusable Composition API logic
│   │   ├── constants/            # Shared constant objects
│   │   ├── stores/               # Pinia stores (crawl, auth, statsBar)
│   │   └── utils/                # Pure helper functions
│   ├── FRONTEND.md               # Frontend developer documentation
│   └── package.json
│
└── server/                       # Node.js backend
    └── src/
        ├── controllers/          # Express route handlers
        ├── middleware/           # Auth, error handling
        ├── models/               # Mongoose schemas (Crawl, CrawlData, User…)
        ├── routes/               # Express router definitions
        ├── services/             # Business logic services
        ├── utils/                # Server-side helpers
        └── worker.js             # Bull queue worker process
```

---

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local or managed)
- npm

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/crawler-advanced.git
cd crawler-advanced

# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Environment variables

**`server/.env`**

```env
MONGODB_URI=mongodb://localhost:27017/crawler
REDIS_URL=redis://localhost:6379
PORT=3001
WORKER_PORT=3002
JWT_SECRET=your_jwt_secret
```

**`client/.env`**

```env
VITE_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3002
```

### 3. Run in development

```bash
# Terminal 1 — API server
cd server && npm run dev

# Terminal 2 — Vue dev server
cd client && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Worker / Socket | http://localhost:3002 |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Register |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/verify` | Verify token |
| `GET` | `/api/auth/profile` | Get profile |
| `PUT` | `/api/auth/profile` | Update profile |
| `PUT` | `/api/auth/change-password` | Change password |
| `GET` | `/api/getallcrawlers` | List crawls (paginated, searchable) |
| `GET` | `/api/getcrawler/:id` | Get single crawl with aggregated data |
| `POST` | `/api/createcrawler` | Create crawl |
| `PUT` | `/api/updatecrawl/:id` | Update crawl |
| `DELETE` | `/api/deletecrawl/:id` | Delete crawl |
| `POST` | `/api/startcrawl` | Queue crawl job(s) |
| `POST` | `/api/runallcrawls` | Queue all enabled crawls |
| `DELETE` | `/api/deletecrawldata/:id` | Clear all scraped data for a crawl |
| `DELETE` | `/api/deletecrawldata/:id/urls` | Clear data for specific URLs |
| `DELETE` | `/api/clearqueue/:id` | Clear Bull queue for a crawl |
| `GET` | `/api/queuestatus/:id` | Get queue job counts |
| `GET` | `/api/proxy-stats/crawl/:id` | Per-crawl proxy usage stats |
| `GET` | `/api/proxy-stats/global` | System-wide proxy stats |
| `GET` | `/api/proxy-stats/cost-analysis` | Cost analysis with date range |

---

## Architecture Overview

### Frontend

```
App.vue
 ├── NotificationWrapper   (toast provider)
 │    ├── Navbar
 │    ├── StatsWrapper      (auth-only — wraps router-view with a bottom stats bar)
 │    │    └── StatsBottomBar  → GlobalStatsBar | CrawlDetailsStatsBar
 │    ├── <router-view>     (unauthenticated fallback)
 │    └── ModalWrapper      (renders all global modals, reads crawlStore flags)
```

**Modal system**: All modals are rendered centrally in `ModalWrapper`. Components open modals by calling `crawlStore.open*Modal()`. Saves are handled in `ModalWrapper`, which updates the store and fires `crawlStore.triggerRefresh()` to notify any watching component to re-fetch.

**Real-time**: `CrawlDetailsView` connects to a Socket.IO room keyed by `crawlId`. Incoming `crawlLog` events update `liveStatusDictionary` and append to `aggregatedData` without a round-trip API call.

### Backend / Worker

The Express API and the Bull worker run as **two separate Node processes**:

- **API server** (`PORT=3001`) — CRUD, auth, export
- **Worker** (`WORKER_PORT=3002`) — processes Bull jobs, runs Playwright, emits Socket.IO events

On startup the worker:
1. Connects to MongoDB
2. Scans for any `in-progress` crawls (stuck from a previous crash) and resets them to `pending`
3. Listens for new jobs and re-queues stalled ones

---

## Frontend Developer Docs

See **[`client/FRONTEND.md`](client/FRONTEND.md)** for:

- Full component catalogue with props/emits
- All composables documented with usage examples
- Pinia store API reference
- Styling conventions and copy-paste patterns
- Data flow diagrams
- Checklist for adding new features

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Follow the conventions in `client/FRONTEND.md`
4. Open a pull request with a description of what changed and why

---

## License

ISC
