import { steemRpc } from './steem.rpc';
import { fetchSbdPrice } from './sbd-price';
import { stripFooter } from '@/lib/postFooter';
import type { Comment } from './api.interface';

interface SteemReply {
  id: number;
  author: string;
  permlink: string;
  parent_author: string;
  parent_permlink: string;
  body: string;
  created: string;
  children: number;
  net_votes: number;
  active_votes: { voter: string; rshares: string }[];
  pending_payout_value: string;
  total_payout_value: string;
  curator_payout_value: string;
  author_reputation: number | string;
}

function mapReply(raw: SteemReply, sbdToUsd: number, currentUsername?: string, nestedReplies: Comment[] = []): Comment {
  const pending = parseFloat(raw.pending_payout_value) || 0;
  const paid = parseFloat(raw.total_payout_value) + parseFloat(raw.curator_payout_value) || 0;
  const payout = (pending + paid) * sbdToUsd;

  let userVote = 0;
  if (currentUsername && raw.active_votes) {
    const myVote = raw.active_votes.find(v => v.voter === currentUsername);
    if (myVote) userVote = Number(myVote.rshares) >= 0 ? 1 : -1;
  }

  return {
    id: `${raw.author}/${raw.permlink}`,
    postId: `${raw.parent_author}/${raw.parent_permlink}`,
    author: {
      id: raw.author,
      username: raw.author,
      displayName: raw.author,
      avatar: `https://steemitimages.com/u/${raw.author}/avatar`,
      bio: '',
      joinedDate: '',
      reputation: Math.round(
        Number(raw.author_reputation) > 1e15
          ? Math.log10(Number(raw.author_reputation)) * 9 - 56
          : Number(raw.author_reputation),
      ),
      followers: 0,
      following: 0,
      postCount: 0,
      steemPower: 0,
      steemBalance: 0,
      sbdBalance: 0,
    },
    body: stripFooter(raw.body),
    createdAt: raw.created + 'Z',
    votes: raw.net_votes ?? raw.active_votes?.length ?? 0,
    userVote,
    replies: nestedReplies,
    payout,
  };
}

/**
 * Recursively fetch comment replies for a given author/permlink.
 * Only recurses when `children > 0`.
 */
async function fetchRepliesRecursive(
  author: string,
  permlink: string,
  sbdToUsd: number,
  currentUsername?: string,
  maxDepth = 6,
  depth = 0,
): Promise<Comment[]> {
  if (depth >= maxDepth) return [];

  const rawReplies = await steemRpc<SteemReply[]>(
    'condenser_api.get_content_replies',
    [author, permlink],
  );

  if (!rawReplies || rawReplies.length === 0) return [];

  const comments = await Promise.all(
    rawReplies.map(async (raw) => {
      const hasMoreReplies = raw.children > 0 && depth + 1 >= maxDepth;
      let nested: Comment[] = [];
      if (raw.children > 0 && depth + 1 < maxDepth) {
        try {
          nested = await fetchRepliesRecursive(
            raw.author,
            raw.permlink,
            sbdToUsd,
            currentUsername,
            maxDepth,
            depth + 1,
          );
        } catch {
          // one failed reply branch doesn't kill the whole tree
        }
      }
      const comment = mapReply(raw, sbdToUsd, currentUsername, nested);
      if (hasMoreReplies) comment.hasMoreReplies = true;
      return comment;
    }),
  );

  return comments;
}

/**
 * Fetch all comments for a post, with recursive nested replies.
 */
export async function fetchComments(
  author: string,
  permlink: string,
  currentUsername?: string,
): Promise<Comment[]> {
  const sbdToUsd = await fetchSbdPrice();
  return fetchRepliesRecursive(author, permlink, sbdToUsd, currentUsername);
}

/**
 * Load deeper replies for a specific comment (used for "Load more" button).
 */
export async function fetchDeeperReplies(
  author: string,
  permlink: string,
  currentUsername?: string,
): Promise<Comment[]> {
  const sbdToUsd = await fetchSbdPrice();
  return fetchRepliesRecursive(author, permlink, sbdToUsd, currentUsername, 6, 0);
}
