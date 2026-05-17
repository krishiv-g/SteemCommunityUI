# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server + Express API concurrently (tsx server/index.ts & vite)
npm run build        # Production build (Vite)
npm run lint         # Run ESLint
npm run test         # Run Vitest once
npm run test:watch   # Run Vitest in watch mode
npm run preview      # Preview production build locally
```

To run a single test file: `npx vitest run src/path/to/file.test.ts`

## Architecture

This is a **Steem blockchain community web app** — a React SPA that reads/writes directly to the Steem blockchain while using a PostgreSQL database (Supabase/Neon) for supplemental features.

### Stack

- **Frontend:** React 18 + Vite + TypeScript, shadcn/ui (Radix) + Tailwind CSS, TanStack React Query v5, Zustand, React Router v6
- **Backend:** Express 5 (`server/index.ts`) serving `/api/*` routes
- **Database:** PostgreSQL via Supabase (`@supabase/supabase-js`)
- **Blockchain:** Direct JSON-RPC to Steem nodes; in-browser signing via `@noble/secp256k1`
- **Deployment:** Netlify (SPA + edge functions)

### Key Layers

**`src/services/`** — All external data access. Steem blockchain services (`steem.rpc.ts`, `steem.posts.ts`, `steem.accounts.ts`, `steem.broadcast.ts`, `steem.comments.ts`, `steem.community.ts`) and database-backed services (`polls.service.ts`, `forums.service.ts`, `bookmarks.service.ts`).

**`src/config/community.ts`** — Reads all `VITE_*` env vars (community ID, RPC nodes, site URL, Supabase credentials). Single source of truth for configuration.

**`src/store/useAppStore.ts`** — Zustand store for auth state (username, JWT, posting key). Session data is stored only in `sessionStorage` — posting keys are never persisted beyond the browser session.

**`src/pages/`** — One file per route. Routes defined in `src/App.tsx`.

**`server/index.ts`** — Express API. Handles `/api/steem-auth` (JWT issuance), `/api/polls`, `/api/forums`, `/api/bookmarks`, `/api/drafts`, `/api/tags`, `/api/community`, `/search/members`.

**`netlify/edge-functions/`** — Deno runtime. `og.ts` intercepts social crawler requests and pre-renders OG meta tags. `sbd-price.ts` proxies CoinMarketCap for live SBD/USD price.

### Steem RPC Pattern

All blockchain reads use `Promise.any()` across all configured RPC nodes — whichever node responds first wins. The RPC call logic is centralized in `src/services/steem.rpc.ts`. Writes go through `src/services/steem.broadcast.ts` which:
1. Fetches `get_dynamic_global_properties` for block reference
2. Serializes the operation to Steem binary format
3. Signs with SHA256 + secp256k1 (chainId = 32 zero bytes)
4. Broadcasts via `broadcast_transaction_synchronous`

### Authentication

Two paths:
1. **Steem Keychain** (browser extension) — keys never leave the extension
2. **WIF posting key** — stored only in `sessionStorage`, used by `@noble/secp256k1` for in-browser signing

Backend issues a JWT (7-day expiry) upon authentication. JWT stored in `sessionStorage` as `wox_jwt`.

### Database Schema (PostgreSQL)

Tables: `steem_users`, `polls`, `poll_options`, `poll_votes` (unique per voter+poll), `forum_threads`, `bookmarks` (unique per username+author+permlink), `drafts`.

### Environment Variables

Frontend (`.env`, prefixed `VITE_`):
- `VITE_COMMUNITY_ID` — e.g. `hive-xxxxx`
- `VITE_STEEM_RPC_NODES` — comma-separated node URLs
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SITE_URL`, `VITE_COMMUNITY_TAGLINE`, `VITE_COMMUNITY_LOGO`

Backend (`.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET`
- `COINMARKETCAP_API_KEY` (optional, for live SBD price)

See `sample-env` for the full template.

### Styling

Dark-mode-first. Colors defined as HSL CSS custom properties in `src/index.css`. Ocean blue / cyan theme. Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (code).
