import { Config } from 'netlify:edge';

const SDS_BASE = 'https://sds.steemworld.org';

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const communityId = Deno.env.get('VITE_COMMUNITY_ID') || '';
  if (!communityId) {
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const r = await fetch(
      `${SDS_BASE}/post_tags_api/getTopPostTagsByCommunity/${communityId}`,
      { signal: AbortSignal.timeout(15000) }
    );
    const json = await r.json();
    // response: { code:0, result: { cols:{tag:0,count:1}, rows:[["tag",count],...] } }
    const rows: [string, number][] = json?.result?.rows ?? [];
    const tags = rows.map((row) => row[0]);
    return new Response(JSON.stringify(tags), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Tags error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const config: Config = { path: '/api/tags' };
