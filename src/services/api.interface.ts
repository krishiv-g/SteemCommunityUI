export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postCount: number;
  joinedDate: string;
  reputation: number;
  steemPower: number;
  steemBalance: number;
  sbdBalance: number;
  communityTitle?: string;
  communityRole?: string;
  // Steem blockchain balance fields
  balance?: string;
  savingsBalance?: string;
  sbdBalanceStr?: string;
  savingsSbdBalance?: string;
  vestingShares?: string;
  delegatedVestingShares?: string;
  receivedVestingShares?: string;
  rewardVestingBalance?: string;
  rewardVestingSteem?: string;
  vestingBalance?: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  coverImage: string;
  author: User;
  tags: string[];
  createdAt: string;
  readingTime: number;
  votes: number;
  userVote: number; // -1, 0, 1
  commentCount: number;
  bookmarked: boolean;
  pending?: boolean;
  payout: number;
  /** Post type detected from json_metadata app field */
  postType?: 'post' | 'poll' | 'forum';
  /** Poll options (when postType === 'poll') */
  pollOptions?: { label: string; votes: number }[];
  pollTotalVotes?: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  body: string;
  createdAt: string;
  votes: number;
  userVote: number;
  replies: Comment[];
  pending?: boolean;
  payout: number;
  /** True when deeper replies exist but weren't fetched due to depth limit */
  hasMoreReplies?: boolean;
}

export interface Tag {
  name: string;
  postCount: number;
  trending: boolean;
}

export interface Notification {
  id: string;
  type: 'vote' | 'mention' | 'reply' | 'follow' | 'resteem';
  actor: User;
  postId?: string;
  postTitle?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'author_reward' | 'curation_reward' | 'transfer';
  amount: string;
  currency: string;
  timestamp: string;
  memo?: string;
}

export interface Community {
  name: string;
  title: string;
  description: string;
  members: number;
  pendingRewards: string;
  activePosters: number;
  subscribers: number;
  flagText?: string;
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  author: User;
  createdAt: string;
  replyCount: number;
  lastReplyAt: string;
  pinned: boolean;
  tags: string[];
  votes: number;
}

export interface ForumReply {
  id: string;
  threadId: string;
  author: User;
  body: string;
  createdAt: string;
  votes: number;
  userVote: number;
  replies: ForumReply[];
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  author: User;
  createdAt: string;
  endsAt: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
  closed: boolean;
  payout: number;
  commentCount: number;
  votes: number;
  userVote: number;
  tags: string[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface ApiService {
  getPosts(tag?: string, sort?: string): Promise<Post[]>;
  getPostById(id: string): Promise<Post>;
  createPost(post: Partial<Post>): Promise<Post>;
  votePost(postId: string, weight: number): Promise<void>;
  getComments(postId: string): Promise<Comment[]>;
  addComment(postId: string, body: string, parentId?: string): Promise<Comment>;
  getUser(username: string): Promise<User>;
  getUserPosts(username: string): Promise<Post[]>;
  getTags(): Promise<Tag[]>;
  getNotifications(username?: string): Promise<Notification[]>;
  getWalletHistory(): Promise<WalletTransaction[]>;
  getCommunity(): Promise<Community>;
  getCommunityMembers(): Promise<User[]>;
  getTopContentCreators(): Promise<User[]>;
  toggleBookmark(postId: string): Promise<void>;
  followUser(username: string): Promise<void>;
  getForumThreads(): Promise<ForumThread[]>;
  getForumThread(id: string): Promise<ForumThread>;
  getForumReplies(threadId: string): Promise<ForumReply[]>;
  addForumReply(threadId: string, body: string, parentId?: string): Promise<ForumReply>;
  createForumThread(data: Partial<ForumThread>): Promise<ForumThread>;
  getPolls(): Promise<Poll[]>;
  getPoll(id: string): Promise<Poll>;
  createPoll(data: { title: string; description: string; options: string[]; endsAt: string; tags?: string[] }): Promise<Poll>;
  votePoll(pollId: string, optionId: string): Promise<Poll>;
}
