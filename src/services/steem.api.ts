import type { ApiService, Post, Comment, User, Tag, Notification, WalletTransaction, Community, ForumThread, ForumReply, Poll } from './api.interface';
import { steemRpc } from './steem.rpc';
import { fetchAccounts, fetchFollowCount } from './steem.accounts';
import { fetchRankedPosts, fetchAccountPosts, type RankedSort } from './steem.posts';
import { fetchComments } from './steem.comments';
import { getAvatarUrl } from './avatar';
import { fetchCommunity } from './steem.community';

interface RawNotification {
  id: number;
  time: number;         // Unix timestamp (seconds)
  type: string;         // "vote" | "mention" | "reply" | "follow" | "resteem"
  is_read: number;      // 0 = unread, 1 = read
  account: string;      // actor (who triggered the notification)
  author: string;       // post author (empty for follows)
  permlink: string;     // post permlink (empty for follows)
  link_depth: number;
  voted_rshares: number;
}

function buildMessage(type: string): string {
  switch (type) {
    case 'vote':    return 'voted on your post';
    case 'mention': return 'mentioned you in a post';
    case 'reply':   return 'replied to your post';
    case 'follow':  return 'followed you';
    case 'resteem': return 'resteemed your post';
    default:        return type;
  }
}

function mapNotification(raw: RawNotification): Notification {
  const actor: User = {
    id: raw.account,
    username: raw.account,
    displayName: raw.account,
    avatar: getAvatarUrl(raw.account),
    bio: '', followers: 0, following: 0, postCount: 0,
    joinedDate: '', reputation: 0, steemPower: 0,
    steemBalance: 0, sbdBalance: 0,
  };

  const postId = raw.author && raw.permlink
    ? `${raw.author}/${raw.permlink}`
    : undefined;

  return {
    id: String(raw.id),
    type: raw.type as Notification['type'],
    actor,
    postId,
    message: buildMessage(raw.type),
    createdAt: new Date(raw.time * 1000).toISOString(),
    read: raw.is_read === 1,
  };
}

interface RawAccount {
  name: string;
  reputation: string | number;
  posting_json_metadata: string;
  json_metadata: string;
  created: string;
  balance: string;
  savings_balance: string;
  sbd_balance: string;
  savings_sbd_balance: string;
  vesting_shares: string;
  delegated_vesting_shares: string;
  received_vesting_shares: string;
  reward_vesting_balance: string;
  reward_vesting_steem: string;
  vesting_balance: string;
  post_count: number;
}

function parseBalanceNumber(balanceStr: string): number {
  const parts = balanceStr.trim().split(' ');
  return parseFloat(parts[0]) || 0;
}

function parseProfile(raw: RawAccount): User {
  let profile: Record<string, string> = {};

  try {
    const parsed = JSON.parse(raw.posting_json_metadata || raw.json_metadata || '{}');
    profile = parsed.profile || {};
  } catch {
    try {
      const parsed = JSON.parse(raw.json_metadata || '{}');
      profile = parsed.profile || {};
    } catch { /* ignore */ }
  }

  const repLog = Math.log10(Math.abs(Number(raw.reputation)) || 1);
  const repScore = Math.max(Math.round((repLog - 9) * 9 + 25), 0);

  const steemPower = parseBalanceNumber(raw.vesting_shares);
  const steemBalance = parseBalanceNumber(raw.balance);
  const sbdBalance = parseBalanceNumber(raw.sbd_balance);

  return {
    id: raw.name,
    username: raw.name,
    displayName: profile.name || raw.name,
    avatar: getAvatarUrl(raw.name),
    bio: profile.about || '',
    followers: 0,
    following: 0,
    postCount: raw.post_count || 0,
    joinedDate: raw.created,
    reputation: repScore,
    steemPower,
    steemBalance,
    sbdBalance,
    // Raw balance strings from blockchain
    balance: raw.balance,
    savingsBalance: raw.savings_balance,
    sbdBalanceStr: raw.sbd_balance,
    savingsSbdBalance: raw.savings_sbd_balance,
    vestingShares: raw.vesting_shares,
    delegatedVestingShares: raw.delegated_vesting_shares,
    receivedVestingShares: raw.received_vesting_shares,
    rewardVestingBalance: raw.reward_vesting_balance,
    rewardVestingSteem: raw.reward_vesting_steem,
    vestingBalance: raw.vesting_balance,
  };
}

function toHttps(url: string): string {
  return url ? url.replace(/^http:\/\//i, 'https://') : url;
}

export const steemApi: ApiService = {
  async getPosts(tag?: string, sort?: string): Promise<Post[]> {
    return fetchRankedPosts((sort as RankedSort) || 'trending');
  },

  async getPostById(id: string): Promise<Post> {
    const posts = await fetchRankedPosts('trending', 100);
    const post = posts.find(p => p.id === id);
    if (!post) throw new Error(`Post ${id} not found`);
    return post;
  },

  async createPost(post: Partial<Post>): Promise<Post> {
    // TODO: Implement with steem.broadcast
    throw new Error('Not implemented');
  },

  async votePost(postId: string, weight: number): Promise<void> {
    // TODO: Implement with steem.broadcast
    throw new Error('Not implemented');
  },

  async getComments(postId: string): Promise<Comment[]> {
    return fetchComments(postId);
  },

  async addComment(postId: string, body: string, parentId?: string): Promise<Comment> {
    // TODO: Implement with steem.broadcast
    throw new Error('Not implemented');
  },

  async getUser(username: string): Promise<User> {
    const rawAccounts = await steemRpc<RawAccount[]>('condenser_api.get_accounts', [[username]]);
    if (!rawAccounts || rawAccounts.length === 0) {
      throw new Error(`Account ${username} not found`);
    }

    const user = parseProfile(rawAccounts[0]);

    // Fetch follow counts
    try {
      const followCount = await fetchFollowCount(username);
      user.followers = followCount.follower_count;
      user.following = followCount.following_count;
    } catch {
      // Ignore follow count errors
    }

    return user;
  },

  async getUserPosts(username: string): Promise<Post[]> {
    return fetchAccountPosts(username);
  },

  async getTags(): Promise<Tag[]> {
    // TODO: Implement with tags_api
    return [];
  },

  async getNotifications(username?: string): Promise<Notification[]> {
    if (!username) return [];
    const res = await fetch(`/api/notifications?account=${encodeURIComponent(username)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const raw: RawNotification[] = await res.json();
    return raw.map(mapNotification);
  },

  async getWalletHistory(): Promise<WalletTransaction[]> {
    // TODO: Implement with account_history_api
    return [];
  },

  async getCommunity(): Promise<Community> {
    return fetchCommunity();
  },

  async getCommunityMembers(): Promise<User[]> {
    const res = await fetch("/api/community/members");
    if (!res.ok) return [];
    const data: { account: string; displayName: string; avatarUrl: string }[] = await res.json();
    return data.map((m) => ({
      id: m.account,
      username: m.account,
      displayName: m.displayName || m.account,
      avatar: m.avatarUrl,
      bio: "",
      followers: 0,
      following: 0,
      postCount: 0,
      joinedDate: "",
      reputation: 0,
      steemPower: 0,
      steemBalance: 0,
      sbdBalance: 0,
    }));
  },

  async getTopContentCreators(): Promise<User[]> {
    // TODO: Implement with bridge.get_trending_accounts
    return [];
  },

  async toggleBookmark(postId: string): Promise<void> {
    // Client-side only feature
    throw new Error('Not implemented');
  },

  async followUser(username: string): Promise<void> {
    // TODO: Implement with steem.broadcast
    throw new Error('Not implemented');
  },

  async getForumThreads(): Promise<ForumThread[]> {
    // TODO: Implement
    return [];
  },

  async getForumThread(id: string): Promise<ForumThread> {
    // TODO: Implement
    throw new Error('Not implemented');
  },

  async getForumReplies(threadId: string): Promise<ForumReply[]> {
    // TODO: Implement
    return [];
  },

  async createForumThread(data: Partial<ForumThread>): Promise<ForumThread> {
    // TODO: Implement
    throw new Error('Not implemented');
  },

  async addForumReply(threadId: string, body: string, parentId?: string): Promise<ForumReply> {
    // TODO: Implement
    throw new Error('Not implemented');
  },

  async getPolls(): Promise<Poll[]> {
    // TODO: Implement
    return [];
  },

  async getPoll(id: string): Promise<Poll> {
    // TODO: Implement
    throw new Error('Not implemented');
  },

  async createPoll(data: { title: string; description: string; options: string[]; endsAt: string; tags?: string[] }): Promise<Poll> {
    // TODO: Implement
    throw new Error('Not implemented');
  },

  async votePoll(pollId: string, optionId: string): Promise<Poll> {
    // TODO: Implement
    throw new Error('Not implemented');
  },
};
