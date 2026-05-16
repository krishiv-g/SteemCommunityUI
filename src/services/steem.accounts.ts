import { steemRpc } from './steem.rpc';

/** Profile data parsed from posting_json_metadata */
export interface SteemProfile {
  account: string;
  name: string;
  about: string;
  profileImage: string;
  coverImage: string;
  location: string;
  website: string;
  reputation: number;
  created: string;
  accountAge: string;
}

interface RawAccount {
  name: string;
  reputation: string | number;
  posting_json_metadata: string;
  json_metadata: string;
  created: string;
}

function formatAccountAge(created: string): string {
  const now = new Date();
  const createdDate = new Date(created + 'Z');
  let years = now.getFullYear() - createdDate.getFullYear();
  let months = now.getMonth() - createdDate.getMonth();
  let days = now.getDate() - createdDate.getDate();
  let hours = now.getHours() - createdDate.getHours();
  let minutes = now.getMinutes() - createdDate.getMinutes();

  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months < 0) { months += 12; years--; }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`);
  return parts.join(' and ') || 'Less than a month';
}

function toHttps(url: string): string {
  return url ? url.replace(/^http:\/\//i, 'https://') : url;
}

function parseProfile(raw: RawAccount): SteemProfile {
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

  // Steem reputation is a big number; convert to readable score
  const repLog = Math.log10(Math.abs(Number(raw.reputation)) || 1);
  const repScore = Math.max(Math.round((repLog - 9) * 9 + 25), 0);

  return {
    account: raw.name,
    name: profile.name || raw.name,
    about: profile.about || '',
    profileImage: toHttps(profile.profile_image || `https://steemitimages.com/u/${raw.name}/avatar`),
    coverImage: toHttps(profile.cover_image || ''),
    location: profile.location || '',
    website: profile.website || '',
    reputation: repScore,
    created: raw.created,
    accountAge: formatAccountAge(raw.created),
  };
}

/** Fetch enriched profile data for a list of Steem accounts */
export async function fetchAccounts(usernames: string[]): Promise<SteemProfile[]> {
  if (usernames.length === 0) return [];
  const raw = await steemRpc<RawAccount[]>('condenser_api.get_accounts', [usernames]);
  return raw.map(parseProfile);
}

/** Fetch follower and following counts for an account */
export async function fetchFollowCount(account: string): Promise<{ follower_count: number; following_count: number }> {
  const result = await steemRpc<{ follower_count: number; following_count: number }>(
    'follow_api.get_follow_count',
    { account },
  );
  return result;
}

export interface FollowEntry {
  follower: string;
  following: string;
  reputation: number;
  what: string[];
}

/** Fetch followers list (paginated) */
export async function fetchFollowers(account: string, start = '', limit = 50): Promise<FollowEntry[]> {
  return steemRpc<FollowEntry[]>('follow_api.get_followers', { account, start, type: 'blog', limit });
}

/** Fetch following list (paginated) */
export async function fetchFollowing(account: string, start = '', limit = 50): Promise<FollowEntry[]> {
  return steemRpc<FollowEntry[]>('follow_api.get_following', { account, start, type: 'blog', limit });
}
