import { Config } from 'netlify:edge';

const SDS_BASE = 'https://sds.steemworld.org';
const AVATAR_BASE = 'https://extcnd.blazedit.xyz/steemit/u';

async function steemRpc(nodes: string[], method: string, params: unknown) {
  const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
  for (const node of nodes) {
    try {
      const r = await fetch(node, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(10000),
      });
      const json = await r.json();
      if (json.result !== undefined) return json.result;
    } catch { /* try next */ }
  }
  throw new Error('All RPC nodes failed');
}

async function buildMemberList(communityId: string, rpcNodes: string[]) {
  // Fetch subscriber names and community roles in parallel
  const [subscribersJson, roles] = await Promise.all([
    fetch(`${SDS_BASE}/communities_api/getCommunitySubscribers/${communityId}`, {
      signal: AbortSignal.timeout(20000),
    }).then(r => r.json()).catch(() => ({ code: -1 })),
    steemRpc(rpcNodes, 'bridge.list_community_roles', { community: communityId })
      .catch(() => [] as [string, string, string][]),
  ]);

  const all: string[] = subscribersJson.code === 0 && Array.isArray(subscribersJson.result)
    ? subscribersJson.result
    : [];

  if (all.length === 0) return [];

  // Build title map from [account, role, title]
  const titles = new Map<string, string>();
  for (const row of roles as [string, string, string][]) {
    if (row[2]) titles.set(row[0], row[2]);
  }

  // Fetch display names in batches of 50
  const displayNames = new Map<string, string>();
  const BATCH = 50;
  for (let i = 0; i < all.length; i += BATCH) {
    try {
      const slice = all.slice(i, i + BATCH);
      const accs = await steemRpc(rpcNodes, 'condenser_api.get_accounts', [slice]) as any[];
      for (const acc of accs) {
        try {
          const meta = JSON.parse(acc.posting_json_metadata || acc.json_metadata || '{}');
          displayNames.set(acc.name, meta?.profile?.name || '');
        } catch { /* ignore */ }
      }
    } catch { /* ignore batch failure */ }
  }

  return all.map((account) => ({
    account,
    displayName: displayNames.get(account) || '',
    avatarUrl: `${AVATAR_BASE}/${account}/avatar`,
    ...(titles.has(account) ? { title: titles.get(account) } : {}),
  }));
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const communityId = Deno.env.get('VITE_COMMUNITY_ID') || '';
  const rpcNodes = (Deno.env.get('VITE_STEEM_RPC_NODES') || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!communityId) {
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const members = await buildMemberList(communityId, rpcNodes);

    // /api/search/members?q= — filter results
    if (url.pathname.startsWith('/api/search/members')) {
      const q = (url.searchParams.get('q') || '').trim().toLowerCase();
      const results = q
        ? members.filter(m => m.account.includes(q) || m.displayName.toLowerCase().includes(q)).slice(0, 8)
        : members.slice(0, 8);
      return new Response(JSON.stringify(results), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    // /api/community/members — full list
    return new Response(JSON.stringify(members), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Community members error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config: Config = {
  path: ['/api/community/members', '/api/search/members'],
};
