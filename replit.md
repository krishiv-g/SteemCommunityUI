# SteemDev

A developer community web application built on the Steem blockchain.

**Community:** hive-xxxxx · **Brand:** SteemDev · **Theme:** Dark developer aesthetic (blue/indigo)

## Architecture

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js server (TypeScript via `tsx`)
- **Database**: Netlify DB (PostgreSQL powered by Neon) with Drizzle ORM
- **Auth**: Steem Keychain / WIF posting-key verification + JWT (signed server-side)
- **Blockchain**: Steem RPC calls for content, votes, and broadcasts
- **Deployment**: Netlify (frontend + edge functions + database)
- **Preview**: Replit (frontend only, no backend/database)

## Replit as Preview Site

This Replit project is now **frontend preview only**. The production backend runs on Netlify:

- ✅ Frontend preview works
- ❌ No database connection (use Netlify DB in production)
- ❌ No edge functions (deployed on Netlify)
- ❌ No API endpoints (Express server runs on Netlify)

For full functionality, deploy to Netlify.

## Project Structure

```
src/
  pages/          Route pages (Index, ArticlePage, ForumsPage, PollsPage, etc.)
  components/     UI components
    Layout.tsx        3-column layout (left nav sidebar + feed + right sidebar)
    LeftSidebar.tsx   Persistent left nav (desktop) with feeds, tags, account links
    Navbar.tsx        Top bar with logo, search, user actions
    MobileSidebar.tsx Sheet drawer for mobile nav (lg: hidden)
    ArticleCard.tsx   Developer-style card (compact, monospace tags)
    AppLogo.tsx       </> code-bracket SVG logo
    TagChip.tsx       Monospace tag pills
    RoleBadge.tsx     Developer role badges
  services/       API clients (Steem RPC + backend REST)
  store/          Zustand state (useAppStore)
  config/         communityConfig (name, communityId, tagline, rpcNodes)
server/
  index.ts        Express API routes: /api/sbd-price, /api/steem-auth, /api/polls, /api/forums
  schema.ts       Drizzle schema
  db.ts           PostgreSQL connection
drizzle.config.ts Drizzle Kit config
vite.config.ts    Vite config — port 5000, proxies /api → port 3001
tailwind.config.ts Developer theme: Inter body, Space Grotesk headings, JetBrains Mono
```

## Running

- `npm run dev` — starts both API server (port 3001) and Vite dev server (port 5000)
- `npm run db:push` — push schema changes to Netlify DB

## Setup Database

```bash
# Initialize Netlify DB (one-time setup)
npx netlify db init

# Push schema to database
npm run db:push

# Open Drizzle Studio to browse data
npx drizzle-kit studio
```

## UI Design

- **Theme**: Dark by default (blue/indigo palette — developer aesthetic)
- **Layout**: 3-column — 256px left nav + fluid center + 288px right sidebar
- **Responsive**: Mobile (hamburger sheet) → Tablet (no left sidebar) → Desktop (3-col) → 32" (max-w-screen-2xl)
- **Typography**: Space Grotesk (headings), Inter (body), JetBrains Mono (tags, code, dates)
- **Logo**: `</>` SVG code brackets in blue

## Environment Variables

Set these in Netlify Dashboard → Environment Variables:

- `DATABASE_URL` — auto-provisioned by Netlify DB (`npx netlify db init`)
- `COINMARKETCAP_API_KEY` — optional, for live SBD price data
- `JWT_SECRET` — secret for signing login JWTs
- `VITE_COMMUNITY_ID=hive-xxxxx`
- `VITE_COMMUNITY_TAGLINE=A Steem Community for Developers`
- `VITE_STEEM_RPC_NODES=https://rpc-node1.example.com,https://rpc-node2.example.com`
- `VITE_STEEM_RPC_TIMEOUT=8000`
- `VITE_SITE_URL=https://your-site.example.com`
- `SITE_URL=https://your-site.example.com`
- `COMMUNITY_ID=hive-xxxxx`

## Database Tables

- `steem_users` — logged-in Steem users (username, first/last login)
- `polls` + `poll_options` + `poll_votes` — community polling system
- `forum_threads` — forum thread index (body lives on Steem blockchain)

## Notes

- All data goes through the Express backend + Netlify DB (PostgreSQL)
- The SBD price endpoint gracefully falls back to $1 if no CMC API key is set
- Run `npx netlify db init` to provision your database — it's that simple
- Use `npx drizzle-kit studio` to browse and edit data visually
- The free tier of Netlify DB (Neon) is generous and suitable for prototypes through production
