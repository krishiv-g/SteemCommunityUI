import { createClient } from '@supabase/supabase-js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

function db() {
  const url = process.env.VITE_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
  return createClient(url, key);
}

function ok(data: unknown) {
  return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

function fail(status: number, msg: string) {
  return { statusCode: status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: msg }) };
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: 'ok' };

  const supabase = db();
  const method = event.httpMethod;
  const parts = event.path.split('/').filter(Boolean); // ["api","forums",...]
  const segments = parts.slice(2);

  try {
    // GET /api/forums
    if (method === 'GET' && segments.length === 0) {
      const { data: threads } = await supabase.from('forum_threads')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      return ok(threads || []);
    }

    // GET /api/forums/:permlink
    if (method === 'GET' && segments.length === 1) {
      const { data: thread } = await supabase.from('forum_threads').select('*').eq('permlink', segments[0]).single();
      if (!thread) return fail(404, 'Thread not found');
      return ok(thread);
    }

    // POST /api/forums
    if (method === 'POST' && segments.length === 0) {
      const { author, title, tags } = JSON.parse(event.body || '{}');
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180);
      const permlink = `wox-forum-${slug}-${Date.now().toString(36)}`;
      const { data: thread, error } = await supabase.from('forum_threads')
        .insert({ permlink, author, title, tags })
        .select().single();
      if (error || !thread) return fail(500, error?.message || 'Insert failed');
      return ok(thread);
    }

    // DELETE /api/forums/:id
    if (method === 'DELETE' && segments.length === 1) {
      await supabase.from('forum_threads').delete().eq('id', segments[0]);
      return ok({ ok: true });
    }

    return fail(404, 'Not found');
  } catch (e: any) {
    console.error('Forums error:', e);
    return fail(500, e.message);
  }
};
