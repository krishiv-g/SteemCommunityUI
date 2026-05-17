import { Config } from 'netlify:edge';

const SDS_BASE = 'https://sds.steemworld.org';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(request.url);
  const account = url.searchParams.get('account')?.trim().toLowerCase();
  if (!account) return json({ error: 'account is required' }, 400);

  // /api/notifications/count → unread count only
  if (url.pathname.endsWith('/count')) {
    try {
      const r = await fetch(
        `${SDS_BASE}/notifications_api/getUnreadCount/${account}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await r.json();
      return json({ count: data.code === 0 ? data.result : 0 });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // /api/notifications → notification list
  const status = url.searchParams.get('status') || 'new';
  try {
    const r = await fetch(
      `${SDS_BASE}/notifications_api/getNotificationsByStatus/${account}/${status}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await r.json();

    if (data.code !== 0 || !data.result) {
      return json({ error: 'SDS API returned an error' }, 502);
    }

    const { cols, rows } = data.result as {
      cols: Record<string, number>;
      rows: unknown[][];
    };

    const notifications = rows.map((row) => {
      const obj: Record<string, unknown> = {};
      for (const [key, idx] of Object.entries(cols)) {
        obj[key] = row[idx];
      }
      return obj;
    });

    return json(notifications);
  } catch (err: any) {
    console.error('Notifications error:', err.message);
    return json({ error: err.message }, 500);
  }
}

export const config: Config = {
  path: ['/api/notifications', '/api/notifications/count'],
};
