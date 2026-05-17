# SteemDev — Community App

A Steem blockchain community web application for **SteemDev** (`hive-xxxxx`) — a community focused on developers, programming, and technology. Built as a single-page application with full blockchain read/write integration, server-side OG meta tags, and live token price data.

**Live:** https://your-site.example.com

---

## Tech Stack

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
| Backend functions | Supabase Edge Functions (Deno runtime) |
| OG / SSR | Netlify Edge Functions (Deno runtime) |
| Deployment | Netlify |
| Analytics | Umami Analytics |

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
| `/forums` | ForumsPage | Community forum threads |
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

---

## Steem Blockchain Integration

The app connects directly to Steem RPC nodes — no intermediary API server.

### RPC nodes (failover race)

All RPC calls fire to all configured nodes simultaneously via `Promise.any` — whichever responds first wins. Configured in `.env`:

```
VITE_STEEM_RPC_NODES=https://rpc-node1.example.com,https://rpc-node2.example.com
VITE_STEEM_RPC_TIMEOUT=8000
```

### API calls used

| API | Method | Used for |
|---|---|---|
| condenser_api | `get_accounts` | Profile data, avatar, cover image, balances |
| condenser_api | `get_content` | Single post fetch |
| condenser_api | `get_content_replies` | Comment thread (recursive) |
| condenser_api | `get_dynamic_global_properties` | Chain state for transaction signing |
| condenser_api | `broadcast_transaction_synchronous` | Votes, posts, comments |
| bridge | `get_ranked_posts` | Feed tabs (trending/hot/created/payout/promoted) |
| bridge | `get_account_posts` | User profile post list |
| bridge | `get_community` | Community metadata |
| bridge | `list_community_roles` | Moderator/member roles |
| bridge | `list_subscribers` | Community subscriber list |
| follow_api | `get_follow_count` | Follower/following counts |
| follow_api | `get_followers` | Paginated follower list |
| follow_api | `get_following` | Paginated following list |

### Authentication

Two login methods:

**Steem Keychain** — Browser extension. The app never touches private keys. Signs transactions via `window.steem_keychain.requestBroadcast()`.

**Posting Key (WIF)** — User pastes their private posting key. Stored in `sessionStorage` only (never persisted to disk or sent to any server). App signs transactions in-browser using `@noble/secp256k1`.

Login flow (two-step):
1. Set fallback avatar immediately from `steemitimages.com/u/{username}/avatar` so UI is instant
2. Fetch real `profile_image` from `condenser_api.get_accounts` and update store

Session keys: `wox_user`, `wox_jwt` in `sessionStorage`.

### Broadcasting

Votes, posts, and comments are broadcast as signed Steem transactions. The signing pipeline (posting key path):

1. Fetch `get_dynamic_global_properties` for `refBlockNum`, `refBlockPrefix`, `expiration`
2. Serialize operation to binary (Steem custom format, little-endian)
3. SHA-256 hash `chainId (32 zero bytes) + serialized transaction`
4. Sign digest with secp256k1 private key (`lowS: true`)
5. POST to `condenser_api.broadcast_transaction_synchronous`

**Vote weight:** `-10000` to `10000` (basis points). `0` = remove vote. `10000` = 100% upvote.

**Posts:** `comment` operation with `parent_author = ""`, `parent_permlink = "hive-185836"` (community ID).

**Replies:** `comment` operation with `parent_author` and `parent_permlink` set to the target post/comment.

**Beneficiaries:** bundled as `comment_options` operation in the same transaction as `comment`.

---

## Database — Netlify DB (Powered by Neon)

The app uses **Netlify DB** (PostgreSQL powered by Neon) for storing polls, forum threads, and user sessions.

### Setup (One Command)

```bash
npx netlify db init
```

This provisions a PostgreSQL database and automatically configures:
- Connection string (`DATABASE_URL`)
- Drizzle ORM
- Drizzle Studio

### Migrations

```bash
# Push schema to database
npm run db:push

# Open Drizzle Studio to browse data
npx drizzle-kit studio
```

### Tables

| Table | Description |
|---|---|
| `steem_users` | Logged-in users (username, login timestamps) |
| `polls` | Poll metadata (title, description, tags, ends_at) |
| `poll_options` | Poll options (label, position) |
| `poll_votes` | Poll votes (voter, option_id) — unique per voter |
| `forum_threads` | Forum thread index (title, tags, pinned) |

---

## Netlify Edge Functions

Deployed automatically with Netlify. Source in `netlify/edge-functions/`.

### `steem-auth` — User Authentication

**Endpoint:** `POST /api/steem-auth`  
**Body:** `{ "username": "alice" }`

Authenticates a Steem user by username. Creates or updates a record in the `steem_users` table, then returns a signed JWT valid for 7 days.

**Environment Variables:**
- `JWT_SECRET` — Secret key for signing JWTs (set in Netlify Dashboard)

### `sbd-price` — Live SBD Price

**Endpoint:** `GET /api/sbd-price`

Fetches live SBD/USD price from CoinMarketCap API. Returns price, 24h change, market cap, volume.

**Environment Variables:**
- `COINMARKETCAP_API_KEY` — CoinMarketCap Pro API key (optional, falls back to $1 if not set)

### `og` — Server-side OG Meta Tags

Intercepts requests from social crawlers (Facebook, Twitter, LinkedIn, Telegram, WhatsApp, Slack, Discord, bots) and returns a pre-rendered HTML page with correct `og:*` and `twitter:*` meta tags. Real users always receive the SPA.

**Routes handled:**
- `/` — Community summary
- `/community` — Community summary  
- `/post/:author/:permlink` — Post with image
- `/user/:username` — User profile

**Debug:** Append `?_og=1` to any URL to see the OG HTML output in browser.

### Deploy Edge Functions

Netlify automatically deploys edge functions on push to `main` branch. No additional setup needed!

**Test locally:** `netlify dev`

---

## Environment Variables

### `.env` (local development)

```env
# Community
VITE_COMMUNITY_ID=hive-xxxxx
VITE_COMMUNITY_TAGLINE=Community for Developers

# Steem RPC
VITE_STEEM_RPC_NODES=https://rpc-node1.example.com,https://rpc-node2.example.com
VITE_STEEM_RPC_TIMEOUT=8000

# Site URL
VITE_SITE_URL=https://your-site.example.com
SITE_URL=https://your-site.example.com

# Logo
VITE_COMMUNITY_LOGO=https://api.dicebear.com/9.x/bottts-neutral/svg?seed=xxxxx

# Database (Netlify DB — auto-set after running `netlify db init`)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# API Keys (optional)
JWT_SECRET=your-jwt-secret-change-in-production
COINMARKETCAP_API_KEY=your-cmc-api-key-optional
```

### Netlify Dashboard — Environment Variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-set by `netlify db init` |
| `SITE_URL` | `https://your-site.example.com` |
| `COMMUNITY_ID` | `hive-xxxxx` |
| `JWT_SECRET` | Your JWT secret for auth |
| `COINMARKETCAP_API_KEY` | CoinMarketCap Pro API key (optional) |

---

## Deployment

Hosted on **Netlify**. Every push to `main` triggers an automatic deploy.

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"
```

SPA routing is handled by a catch-all redirect:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# App runs at http://localhost:8080

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

---

## Project Structure

```
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── VoteButtons.tsx     # Upvote/downvote with weight slider
│   │   ├── CommentThread.tsx   # Threaded comments with reply/vote
│   │   ├── Navbar.tsx          # Top navigation
│   │   └── AppLogo.tsx         # App logo (code SVG)
│   ├── pages/              # Route-level page components
│   ├── services/           # Steem API layer
│   │   ├── steem.rpc.ts        # Core RPC caller (Promise.any race)
│   │   ├── steem.posts.ts      # Post fetching (bridge API)
│   │   ├── steem.accounts.ts   # Account/profile fetching
│   │   ├── steem.broadcast.ts  # Transaction signing and broadcasting
│   │   ├── steem.comments.ts   # Comment thread fetching
│   │   ├── steem.community.ts  # Community metadata
│   │   ├── steem.auth.ts       # WIF key verification
│   │   └── sbd-price.ts        # Live SBD/USD price
│   ├── store/
│   │   └── useAppStore.ts      # Zustand global state (auth session)
│   ├── config/
│   │   └── community.ts        # Community config from env vars
│   └── index.css           # Tailwind theme (all HSL color vars)
├── server/
│   ├── index.ts            # Express API server
│   ├── db.ts               # Database connection (Drizzle ORM)
│   └── schema.ts           # Database schema (Drizzle)
├── netlify/
│   └── edge-functions/
│       └── og.ts               # Server-side OG meta tag renderer
├── public/
│   └── favicon.svg             # Favicon (code SVG)
├── index.html              # App entry point with static OG tags + analytics
├── drizzle.config.ts       # Drizzle Kit configuration
└── netlify.toml            # Build config, edge function routing, SPA redirect
```

---

## Theming

All colors are defined as HSL CSS custom properties in [src/index.css](src/index.css). Dark mode is the default (`defaultTheme="dark"`, `enableSystem={false}`).

The color palette is an ocean blue / whale theme:
- **Dark background:** `212 55% 22%` (deep ocean blue)
- **Primary:** `196 100% 60%` (bright cyan)
- **Light background:** `210 28% 95%`

To retheme: change the HSL hue/saturation/lightness values in `src/index.css` — everything updates automatically.

---

## Analytics

- **Umami Analytics** — privacy-friendly, self-hosted compatible. Script loaded in `index.html`.
  - Website ID: `0c23be9a-4b19-4528-b9f0-fb2b2156e474`
  - Hosted at: `https://cloud.umami.is`

---

## Community

- **Community ID:** `hive-xxxxx`
- **Community name:** SteemDev
- **Tagline:** A Community for Developers
- **Focus:** Programming, technology, and blockchain development on Steem
