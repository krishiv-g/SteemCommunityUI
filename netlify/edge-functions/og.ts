import type { Config, Context } from "https://edge.netlify.com";

const BOT_AGENTS =
  /twitterbot|facebookexternalhit|facebot|whatsapp|telegrambot|telegram|linkedinbot|discordbot|slackbot|applebot|googlebot|bingbot|pinterest|embedly|rogerbot|quora|outbrain|W3C_Validator|ia_archiver|semrushbot|ahrefsbot/i;

const RPC_NODES = [
  "https://rpc-node1.example.com",
  "https://rpc-node2.example.com",
];

const SITE_NAME = "SteemDev";
const SITE_URL = Deno.env.get("SITE_URL") || "https://your-site.example.com";
const COMMUNITY_ID = Deno.env.get("COMMUNITY_ID") || "hive-xxxxx";
// Use DiceBear logo for OG images (SVG not supported by some crawlers)
const LOGO_IMAGE = Deno.env.get("VITE_COMMUNITY_LOGO") || "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=xxxxx";
const FALLBACK_IMAGE = LOGO_IMAGE;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[#*_~`>|\\-]{1,3}/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toHttps(url: string): string {
  return url ? url.replace(/^http:\/\//i, "https://") : url;
}

/** Race all RPC nodes — first successful response wins */
async function rpcRace<T>(method: string, params: unknown): Promise<T | null> {
  try {
    return await Promise.any(
      RPC_NODES.map(async (node) => {
        const res = await fetch(node, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
          signal: AbortSignal.timeout(6000),
        });
        const json = await res.json();
        if (json.error || !json.result) throw new Error("no result");
        return json.result as T;
      })
    );
  } catch {
    return null;
  }
}

async function fetchPost(author: string, permlink: string) {
  const result = await rpcRace<any>("condenser_api.get_content", [author, permlink]);
  return result?.title ? result : null;
}

async function fetchAccount(username: string) {
  const result = await rpcRace<any[]>("condenser_api.get_accounts", [[username]]);
  return result?.[0] || null;
}

async function fetchCommunity() {
  const result = await rpcRace<any>("bridge.get_community", { name: COMMUNITY_ID });
  return result?.title ? result : null;
}

function parseProfile(raw: any) {
  let profile: Record<string, string> = {};
  try {
    // posting_json_metadata is more up to date than json_metadata
    const posting = JSON.parse(raw.posting_json_metadata || "{}");
    profile = posting.profile || {};
    if (!profile.profile_image) {
      const legacy = JSON.parse(raw.json_metadata || "{}");
      profile = { ...legacy.profile, ...profile };
    }
  } catch { /* ignore */ }

  // Avoid steemitimages redirect URLs — crawlers don't follow them
  // Use cdn.steemitimages.com direct format instead
  const rawImage = profile.profile_image || "";
  const profileImage = rawImage
    ? toHttps(rawImage)
    : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=xxxxx`;

  return {
    name: profile.name || raw.name,
    about: profile.about || "",
    profileImage,
    coverImage: toHttps(profile.cover_image || ""),
  };
}

function buildHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  twitterCreator?: string;
  twitterCard?: "summary" | "summary_large_image";
}): string {
  const { title, description, image, url, twitterCreator = "", twitterCard = "summary_large_image" } = opts;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta name="twitter:card" content="${twitterCard}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  ${twitterCreator ? `<meta name="twitter:creator" content="@${escapeHtml(twitterCreator)}" />` : ""}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
</head>
<body><p><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></p></body>
</html>`;
}

export default async function handler(req: Request, context: Context) {
  const ua = req.headers.get("user-agent") || "";
  const url = new URL(req.url);

  // Allow ?_og=1 to test without a real crawler UA
  const isBot = BOT_AGENTS.test(ua) || url.searchParams.get("_og") === "1";
  if (!isBot) return context.next();

  const { pathname } = url;

  // ── /post/author/permlink ──────────────────────────────────────
  const postMatch = pathname.match(/^\/post\/([^/]+)\/(.+)$/);
  if (postMatch) {
    const [, author, permlink] = postMatch;
    const postUrl = `${SITE_URL}/post/${author}/${permlink}`;
    const post = await fetchPost(author, permlink);

    if (!post) {
      return new Response(
        buildHtml({ title: SITE_NAME, description: "SteemDev — A developer community on Steem blockchain.", image: FALLBACK_IMAGE, url: postUrl }),
        { headers: { "Content-Type": "text/html;charset=utf-8" } }
      );
    }

    let image = FALLBACK_IMAGE;
    try {
      const meta = JSON.parse(post.json_metadata || "{}");
      if (meta.image?.[0]) image = toHttps(meta.image[0]);
    } catch { /* ignore */ }

    return new Response(
      buildHtml({
        title: post.title,
        description: stripMarkdown(post.body || "").slice(0, 200),
        image,
        url: postUrl,
        twitterCreator: author,
        twitterCard: "summary_large_image",
      }),
      { headers: { "Content-Type": "text/html;charset=utf-8" } }
    );
  }

  // ── /user/username ─────────────────────────────────────────────
  const userMatch = pathname.match(/^\/user\/([^/]+)\/?$/);
  if (userMatch) {
    const [, username] = userMatch;
    const profileUrl = `${SITE_URL}/user/${username}`;
    const raw = await fetchAccount(username);

    if (!raw) {
      return new Response(
        buildHtml({ title: SITE_NAME, description: "SteemDev — A developer community on Steem blockchain.", image: FALLBACK_IMAGE, url: profileUrl }),
        { headers: { "Content-Type": "text/html;charset=utf-8" } }
      );
    }

    const profile = parseProfile(raw);
    const image = profile.profileImage || profile.coverImage || FALLBACK_IMAGE;
    const description = profile.about
      ? profile.about.slice(0, 200)
      : `View @${username}'s profile on SteemDev.`;

    return new Response(
      buildHtml({
        title: `${profile.name} (@${username}) — ${SITE_NAME}`,
        description,
        image,
        url: profileUrl,
        twitterCreator: username,
        twitterCard: "summary",
      }),
      { headers: { "Content-Type": "text/html;charset=utf-8" } }
    );
  }

  // ── / and /community ───────────────────────────────────────────
  if (pathname === "/" || pathname === "/community" || pathname === "/community/") {
    const communityUrl = pathname === "/" ? SITE_URL : `${SITE_URL}/community`;
    const community = await fetchCommunity();

    if (!community) {
      return new Response(
        buildHtml({ title: SITE_NAME, description: "SteemDev — A developer community on Steem blockchain.", image: LOGO_IMAGE, url: communityUrl }),
        { headers: { "Content-Type": "text/html;charset=utf-8" } }
      );
    }

    const memberCount = (community.subscribers || 0).toLocaleString("en-US");
    const description = `${community.about || community.description || ""} · ${memberCount} members`.trim().slice(0, 200);

    return new Response(
      buildHtml({
        title: `${community.title} — ${SITE_NAME}`,
        description,
        image: LOGO_IMAGE,
        url: communityUrl,
        twitterCard: "summary",
      }),
      { headers: { "Content-Type": "text/html;charset=utf-8" } }
    );
  }

  return context.next();
}

export const config: Config = {
  path: ["/post/*", "/user/*", "/community", "/community/"],
};
