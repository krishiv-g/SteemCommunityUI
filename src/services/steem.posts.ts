import { communityConfig } from '@/config/community';
import { steemRpc } from './steem.rpc';
import { fetchAccounts } from './steem.accounts';
import { fetchSbdPrice } from './sbd-price';
import { stripFooter } from '@/lib/postFooter';
import { getAvatarUrl } from './avatar';
import type { Post } from './api.interface';

/** Raw post from bridge.get_ranked_posts */
interface SteemRankedPost {
  post_id: number;
  author: string;
  permlink: string;
  title: string;
  body: string;
  json_metadata: string | { tags?: string[]; image?: string[]; links?: string[] };
  created: string;
  children: number;
  net_rshares: number;
  payout: number;
  pending_payout_value: string;
  author_reputation: number | string;
  stats?: { total_votes: number; is_pinned: boolean };
  net_votes?: number;
  active_votes: { voter: string; rshares: string }[];
  beneficiaries: { account: string; weight: number }[];
  url: string;
  community?: string;
  community_title?: string;
  author_role?: string;
  author_title?: string;
}

function extractImage(post: SteemRankedPost, meta: PostMeta): string {
  if (meta.image && meta.image.length > 0) {
    return meta.image[0];
  }
  const imgMatch = post.body.match(/https?:\/\/[^\s")<]+\.(?:jpg|jpeg|png|gif|webp)/i);
  return imgMatch ? imgMatch[0] : 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600';
}

function extractTags(meta: PostMeta): string[] {
  return (meta.tags || []).filter(t => t !== communityConfig.communityId);
}

interface PostMeta {
  tags?: string[];
  image?: string[];
  app?: string;
  wox_type?: string;
  polls?: { question: string; options: string[]; end_time?: string; preferred_interpretation?: string }[];
}

function parseMeta(post: SteemRankedPost): PostMeta {
  if (typeof post.json_metadata === 'string') {
    try { return JSON.parse(post.json_metadata); } catch { return {}; }
  }
  return post.json_metadata as any || {};
}

function detectPostType(meta: PostMeta): 'post' | 'poll' | 'forum' {
  if (meta.polls && meta.polls.length > 0) return 'poll';
  if (meta.wox_type === 'forum_thread') return 'forum';
  return 'post';
}

function extractExcerpt(body: string): string {
  // Strip HTML and markdown, take first 200 chars
  const plain = body
    .replace(/<[^>]+>/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/[#*_~`>|\\-]{1,3}/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 200 ? plain.slice(0, 200) + '…' : plain;
}

function estimateReadingTime(body: string): number {
  const words = body.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function mapPost(raw: SteemRankedPost, sbdToUsd: number, currentUsername?: string): Post {
  const payout = parseFloat(raw.pending_payout_value) || raw.payout || 0;
  const meta = parseMeta(raw);
  const postType = detectPostType(meta);
  const body = stripFooter(raw.body);

  let userVote = 0;
  if (currentUsername && raw.active_votes) {
    const myVote = raw.active_votes.find(v => v.voter === currentUsername);
    if (myVote) userVote = Number(myVote.rshares) >= 0 ? 1 : -1;
  }

  // Extract poll options from metadata if this is a poll post
  let pollOptions: { label: string; votes: number }[] | undefined;
  let pollTotalVotes: number | undefined;
  if (postType === 'poll' && meta.polls?.[0]?.options) {
    pollOptions = meta.polls[0].options.map((label: string) => ({ label, votes: 0 }));
    pollTotalVotes = 0;
  }

  return {
    id: `${raw.author}/${raw.permlink}`,
    title: raw.title,
    body,
    excerpt: extractExcerpt(body),
    coverImage: extractImage(raw, meta),
    author: {
      id: raw.author,
      username: raw.author,
      displayName: raw.author,
      avatar: getAvatarUrl(raw.author),
      bio: '',
      joinedDate: '',
      reputation: Math.round(Number(raw.author_reputation) > 1e15 ? Math.log10(Number(raw.author_reputation)) * 9 - 56 : Number(raw.author_reputation)),
      followers: 0,
      following: 0,
      postCount: 0,
      steemPower: 0,
      steemBalance: 0,
      sbdBalance: 0,
      communityTitle: raw.author_title || undefined,
      communityRole: raw.author_role || undefined,
    },
    tags: extractTags(meta),
    createdAt: raw.created + 'Z',
    readingTime: estimateReadingTime(raw.body),
    votes: raw.stats?.total_votes ?? raw.net_votes ?? raw.active_votes?.length ?? 0,
    userVote,
    commentCount: raw.children,
    bookmarked: false,
    payout: payout * sbdToUsd,
    postType,
    pollOptions,
    pollTotalVotes,
  };
}

/** Enrich posts with real profile display names from account data */
async function enrichPostsWithProfiles(posts: Post[]): Promise<Post[]> {
  const uniqueAuthors = [...new Set(posts.map(p => p.author.username))];
  if (uniqueAuthors.length === 0) return posts;

  try {
    const profiles = await fetchAccounts(uniqueAuthors);
    const profileMap = new Map(profiles.map(p => [p.account, p]));

    return posts.map(post => {
      const profile = profileMap.get(post.author.username);
      if (profile) {
        return {
          ...post,
          author: {
            ...post.author,
            displayName: profile.name || post.author.username,
            avatar: profile.profileImage || post.author.avatar,
            reputation: profile.reputation,
          },
        };
      }
      return post;
    });
  } catch {
    return posts; // fallback to unenriched
  }
}

export type RankedSort = 'trending' | 'created' | 'hot' | 'promoted' | 'payout';

/** Fetch ranked posts from the community */
export async function fetchRankedPosts(
  sort: RankedSort = 'trending',
  limit = 20,
  observer?: string | null,
): Promise<Post[]> {
  const [raw, sbdToUsd] = await Promise.all([
    steemRpc<SteemRankedPost[]>('bridge.get_ranked_posts', {
      sort,
      tag: communityConfig.communityId,
      observer: observer ?? null,
      limit: limit + 10,
    }),
    fetchSbdPrice(),
  ]);
  const posts = raw.filter(r => !r.stats?.is_pinned).slice(0, limit).map(r => mapPost(r, sbdToUsd, observer ?? undefined));
  return enrichPostsWithProfiles(posts);
}

/** Fetch posts filtered by a specific tag */
export async function fetchPostsByTag(
  tag: string,
  sort: RankedSort = 'trending',
  limit = 20,
): Promise<Post[]> {
  const [raw, sbdToUsd] = await Promise.all([
    steemRpc<SteemRankedPost[]>('bridge.get_ranked_posts', {
      sort,
      tag,
      observer: null,
      limit,
    }),
    fetchSbdPrice(),
  ]);
  const posts = raw.map(r => mapPost(r, sbdToUsd));
  return enrichPostsWithProfiles(posts);
}

/** Fetch only pinned posts from the community */
export async function fetchPinnedPosts(observer?: string | null): Promise<Post[]> {
  const [raw, sbdToUsd] = await Promise.all([
    steemRpc<SteemRankedPost[]>('bridge.get_ranked_posts', {
      sort: 'trending',
      tag: communityConfig.communityId,
      observer: observer ?? null,
      limit: 50,
    }),
    fetchSbdPrice(),
  ]);
  const posts = raw.filter(r => r.stats?.is_pinned).map(r => mapPost(r, sbdToUsd, observer ?? undefined));
  return enrichPostsWithProfiles(posts);
}

/** Fetch a single post by author/permlink */
export async function fetchPost(author: string, permlink: string, observer?: string | null): Promise<Post> {
  const [raw, sbdToUsd] = await Promise.all([
    steemRpc<SteemRankedPost>('condenser_api.get_content', [author, permlink]),
    fetchSbdPrice(),
  ]);
  const post = mapPost(raw, sbdToUsd, observer ?? undefined);
  const enriched = await enrichPostsWithProfiles([post]);
  return enriched[0];
}

/** Fetch posts by a specific account, filtered to our community */
export async function fetchAccountPosts(
  account: string,
  limit = 100,
  observer?: string | null,
): Promise<Post[]> {
  const [raw, sbdToUsd] = await Promise.all([
    steemRpc<SteemRankedPost[]>('bridge.get_account_posts', {
      sort: 'posts',
      account,
      limit,
    }),
    fetchSbdPrice(),
  ]);
  const communityPosts = raw.filter(r => r.community === communityConfig.communityId);
  return communityPosts.map(r => mapPost(r, sbdToUsd, observer ?? undefined));
}
