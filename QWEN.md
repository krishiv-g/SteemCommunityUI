# SteemDev — QWEN Context

## Project Overview

**SteemDev** is a community web application for the Steem blockchain community **SteemDev** (`hive-xxxxx`), focused on developers, programming, and technology. It's a full-featured SPA with blockchain read/write integration, server-side OG meta tags, and live token price data.

**Live site:** https://your-site.example.com

### Architecture

The application has three main layers:

1. **Frontend SPA** — React 18 + Vite + TypeScript, served from `src/`
2. **Express API server** — Node.js server in `server/` for database-backed features (polls, forums, bookmarks, drafts, auth)
3. **Netlify Edge Functions** — Deno runtime functions in `netlify/edge-functions/` for OG meta tags and SBD price

### Key Technologies

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 + TypeScript |
| UI | shadcn/ui (Radix UI primitives) + Tailwind CSS |
| Theming | next-themes — dark mode default, no system preference |
| State | Zustand (`useAppStore`) |
| Data fetching | TanStack Query v5 |
| Routing | React Router v6 |
| Forms | react-hook-form + Zod |
| Markdown editor | @uiw/react-md-editor |
| Blockchain crypto | @noble/secp256k1 + @noble/hashes + bs58 |
| Backend API | Express 5 |
| Database | Supabase (PostgreSQL) via Supabase JS client |
| OG / SSR | Netlify Edge Functions (Deno runtime) |
| Deployment | Netlify |
| Analytics | Umami Analytics |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## Building and Running

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Neon recommended) — provisioned via `npx netlify db init`

### Commands

```bash
# Install dependencies
npm install

# Start dev server (Express API on port 3001 + Vite frontend on port 5000)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview

# Run linting
npm run lint

# Run unit tests (Vitest)
npm run test

# Run tests in watch mode
npm run test:watch

# Open Drizzle Studio (database browser) — deprecated, use Supabase dashboard instead
# npm run db:studio
```

### Development Notes
- `npm run dev` starts both the Express API server (`server/index.ts`) and the Vite dev server concurrently using `&`
- Vite proxies `/api` requests to the Express server on `localhost:3001`
- Dev server binds to `0.0.0.0:5000`

---

## Database — Supabase (PostgreSQL)

Managed via **Supabase JS client** (`@supabase/supabase-js`). The schema is managed directly in Supabase (via SQL editor or dashboard).

### Supabase Clients

- **Server-side** — `server/supabase.ts` (used by Express API server)
- **Client-side** — `src/lib/supabase.ts` (for frontend use with RLS)
- **Netlify function** — `netlify/functions/steem-auth.ts` (serverless auth)

### Environment Variables

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_YOUR_KEY_HERE
VITE_SUPABASE_SERVICE_ROLE_KEY=   # Server-side only — bypasses RLS
```

### Tables

| Table | Description |
|---|---|
| `steem_users` | Logged-in users (username, login timestamps) |
| `polls` | Poll metadata (title, description, tags, ends_at) |
| `poll_options` | Poll options (label, position) |
| `poll_votes` | Poll votes (voter, option_id) — unique per voter |
| `forum_threads` | Forum thread index (title, tags, pinned) |
| `bookmarks` | Saved/bookmarked posts per user |
| `drafts` | Saved draft posts (title, body, tags) |

---

## Project Structure

```
├── src/
│   ├── components/       # Reusable UI components (shadcn/ui + custom)
│   ├── config/           # Community configuration from env vars
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Third-party integrations
│   ├── lib/              # Utility libraries
│   ├── pages/            # Route-level page components
│   ├── services/         # Steem blockchain API layer
│   ├── store/            # Zustand global state (auth session)
│   ├── test/             # Vitest test setup and tests
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # App entry point
│   └── index.css         # Tailwind theme (HSL color vars)
├── server/
│   ├── index.ts          # Express API server (polls, forums, auth, bookmarks, drafts)
│   ├── supabase.ts       # Supabase client for server-side database access
│   ├── db.ts             # Re-exports Supabase client (legacy compat)
│   └── schema.ts         # Legacy Drizzle schema (reference only, no longer used)
├── netlify/
│   └── edge-functions/   # Deno edge functions (OG tags, SBD price)
├── public/               # Static assets
├── db/                   # Legacy Drizzle setup for Netlify DB (deprecated)
├── attached_assets/      # Attached/static assets
├── vite.config.ts        # Vite configuration (port 5000, API proxy to :3001)
├── vitest.config.ts      # Vitest configuration (jsdom environment)
├── playwright.config.ts  # Playwright E2E test configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── drizzle.config.ts     # Drizzle ORM configuration
├── netlify.toml          # Netlify build config, edge functions, SPA redirects
├── tsconfig.json         # Root TypeScript configuration
├── tsconfig.app.json     # App-specific TypeScript config
├── tsconfig.node.json    # Node-specific TypeScript config
└── tsconfig.server.json  # Server-specific TypeScript config
```

---

## Steem Blockchain Integration

The app connects directly to Steem RPC nodes — no intermediary API server for blockchain reads.

### RPC Node Failover
All RPC calls fire to all configured nodes simultaneously via `Promise.any` — whichever responds first wins.

Configured in `.env`:
```
VITE_STEEM_RPC_NODES=https://rpc-node1.example.com,https://rpc-node2.example.com
VITE_STEEM_RPC_TIMEOUT=8000
```

### Authentication
Two login methods:
- **Steem Keychain** — Browser extension. Signs transactions via `window.steem_keychain.requestBroadcast()`
- **Posting Key (WIF)** — User pastes private posting key, stored in `sessionStorage` only. App signs transactions in-browser using `@noble/secp256k1`

### Broadcasting
Votes, posts, and comments are broadcast as signed Steem transactions using the standard signing pipeline:
1. Fetch `get_dynamic_global_properties` for block reference data
2. Serialize operation to binary (Steem custom format, little-endian)
3. SHA-256 hash `chainId + serialized transaction`
4. Sign digest with secp256k1 private key (`lowS: true`)
5. POST to `condenser_api.broadcast_transaction_synchronous`

---

## Environment Variables

### `.env` (local development)

```env
# Community
VITE_COMMUNITY_ID=hive-xxxxx
VITE_COMMUNITY_TAGLINE=Community for Developers
VITE_COMMUNITY_LOGO=https://api.dicebear.com/9.x/bottts-neutral/svg?seed=xxxxx

# Steem RPC
VITE_STEEM_RPC_NODES=https://rpc-node1.example.com,https://rpc-node2.example.com
VITE_STEEM_RPC_TIMEOUT=8000

# Site URL
VITE_SITE_URL=https://your-site.example.com
SITE_URL=https://your-site.example.com

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_YOUR_KEY_HERE
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # server-side only

# API Keys (optional)
JWT_SECRET=your-jwt-secret-change-in-production
COINMARKETCAP_API_KEY=your-cmc-api-key-optional
```

---

## API Endpoints (Express Server)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/steem-auth` | Authenticate a Steem user, return JWT |
| `GET` | `/api/sbd-price` | Live SBD/USD price from CoinMarketCap |
| `GET` | `/api/polls` | List all polls (with voter info) |
| `GET` | `/api/polls/:permlink` | Get single poll details |
| `POST` | `/api/polls` | Create a new poll |
| `DELETE` | `/api/polls/:id` | Delete a poll |
| `POST` | `/api/polls/:pollId/vote` | Vote on a poll option |
| `GET` | `/api/forums` | List all forum threads |
| `GET` | `/api/forums/:permlink` | Get single forum thread |
| `POST` | `/api/forums` | Create a new forum thread |
| `DELETE` | `/api/forums/:id` | Delete a forum thread |
| `GET` | `/api/tags` | Get top post tags (cached 1 hour) |
| `GET` | `/api/community/members` | Get community members (cached 30 min) |
| `GET` | `/api/search/members` | Search community members |
| `GET` | `/api/bookmarks` | Get user's bookmarks |
| `POST` | `/api/bookmarks` | Add a bookmark |
| `DELETE` | `/api/bookmarks/:id` | Remove a bookmark |
| `GET` | `/api/drafts` | Get user's drafts |
| `POST` | `/api/drafts` | Create a draft |
| `PUT` | `/api/drafts/:id` | Update a draft |
| `DELETE` | `/api/drafts/:id` | Delete a draft |

---

## Testing

### Unit Tests (Vitest)
- Configuration: `vitest.config.ts`
- Environment: jsdom
- Setup file: `src/test/setup.ts` (includes `@testing-library/jest-dom` and `matchMedia` polyfill)
- Pattern: `src/**/*.{test,spec}.{ts,tsx}`

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

### E2E Tests (Playwright)
- Configuration: `playwright.config.ts`
- Fixture: `playwright-fixture.ts`

---

## Development Conventions

- **TypeScript** — Strict mode, path aliases via `@/` (resolves to `./src/`)
- **UI Components** — shadcn/ui pattern with Radix UI primitives, styled with Tailwind CSS
- **Color Theme** — Ocean blue / whale theme using HSL CSS custom properties in `src/index.css`. Dark mode is the default (`defaultTheme="dark"`, `enableSystem={false}`)
- **State Management** — Zustand for global state (auth session), TanStack Query for server state
- **Forms** — react-hook-form + Zod validation
- **Database** — Schema managed in Supabase dashboard / SQL editor. Use Supabase JS client for all queries.
- **Path imports** — Use `@/` alias for all imports under `src/` (e.g., `@/components/...`)

---

## Deployment

Hosted on **Netlify**. Every push to `main` triggers an automatic deploy.

- **Build command:** `npm run build`
- **Publish directory:** `dist/`
- **SPA routing:** Catch-all redirect to `/index.html`
- **Edge functions:** Auto-deployed from `netlify/edge-functions/`

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Index | Community post feed (trending/hot/created/payout tabs) |
| `/post/:author/:permlink` | ArticlePage | Full post view with comments and voting |
| `/write` | WritePage | Markdown editor to publish a new post |
| `/user/:username` | ProfilePage | User profile with posts, followers, following |
| `/community` | CommunityPage | Community info, description, team |
| `/community/members` | MembersPage | Full subscriber/member list |
| `/tag/:tag` | TagPage | Posts filtered by tag |
| `/forums` | ForumsPage | Community forum threads list |
| `/forums/new` | CreateForumPage | Create a new forum thread |
| `/forums/:id` | ForumThreadPage | Individual forum thread |
| `/polls` | PollsPage | Community polls list |
| `/polls/new` | CreatePollPage | Create a new poll |
| `/polls/:id` | PollDetailPage | Individual poll view |
| `/wallet` | WalletPage | User wallet and balances |
| `/notifications` | NotificationsPage | Activity notifications |
| `/saved` | SavedPage | Saved/bookmarked posts |
| `/login` | LoginPage | Authentication |
| `/settings` | SettingsPage | User settings |
