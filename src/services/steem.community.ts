import { communityConfig } from '@/config/community';
import { steemRpc } from './steem.rpc';
import { fetchSbdPrice } from './sbd-price';
import type { Community } from './api.interface';

/** Raw response shape from bridge.get_community */
interface SteemCommunityRaw {
  id: number;
  name: string;
  title: string;
  about: string;
  description: string;
  lang: string;
  subscribers: number;
  sum_pending: number;
  num_pending: number;
  num_authors: number;
  created_at: string;
  flag_text: string;
  team: [string, string, string][];
  settings: { avatar_url: string; cover_url: string };
}

/** Map raw RPC data → our Community interface */
function mapCommunity(raw: SteemCommunityRaw, sbdToUsd: number): Community {
  return {
    name: raw.name,
    title: raw.title,
    description: raw.description || raw.about,
    members: raw.subscribers,
    pendingRewards: `$${(raw.sum_pending * sbdToUsd).toFixed(2)}`,
    activePosters: raw.num_authors,
    subscribers: raw.subscribers,
    flagText: raw.flag_text || undefined,
  };
}

export interface CommunityTeamMember {
  account: string;
  role: string;
  title: string;
}

/** Fetch community info from chain */
export async function fetchCommunity(): Promise<Community> {
  const [raw, sbdToUsd] = await Promise.all([
    steemRpc<SteemCommunityRaw>('bridge.get_community', {
      name: communityConfig.communityId,
    }),
    fetchSbdPrice(),
  ]);
  return mapCommunity(raw, sbdToUsd);
}

/** Extract team/moderators from the community data */
export async function fetchCommunityTeam(): Promise<CommunityTeamMember[]> {
  const raw = await steemRpc<SteemCommunityRaw>('bridge.get_community', {
    name: communityConfig.communityId,
  });
  return raw.team.map(([account, role, title]) => ({ account, role, title }));
}

/** Fetch all community roles via bridge.list_community_roles */
export async function fetchCommunityRoles(): Promise<CommunityTeamMember[]> {
  const raw = await steemRpc<[string, string, string][]>('bridge.list_community_roles', {
    community: communityConfig.communityId,
  });
  return raw.map(([account, role, title]) => ({ account, role, title }));
}

export interface CommunitySubscriber {
  account: string;
  role: string;
  title: string | null;
  subscribedAt: string;
}

/** Fetch all community subscribers via bridge.list_subscribers */
export async function fetchCommunitySubscribers(): Promise<CommunitySubscriber[]> {
  const raw = await steemRpc<[string, string, string | null, string][]>('bridge.list_subscribers', {
    community: communityConfig.communityId,
  });
  return raw.map(([account, role, title, subscribedAt]) => ({
    account,
    role,
    title,
    subscribedAt,
  }));
}
