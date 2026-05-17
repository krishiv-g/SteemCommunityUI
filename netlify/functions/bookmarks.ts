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
  const query = event.queryStringParameters || {};
  const parts = event.path.split('/').filter(Boolean); // ["api","bookmarks",...]
  const segments = parts.slice(2);

  try {
    // GET /api/bookmarks?username=
    if (method === 'GET') {
      if (!query.username) return fail(400, 'username is required');
      const { data: rows } = await supabase.from('bookmarks')
        .select('*')
        .eq('username', query.username)
        .order('created_at', { ascending: false });
      return ok(rows || []);
    }

    // POST /api/bookmarks
    if (method === 'POST' && segments.length === 0) {
      const { username, author, permlink, title, cover_image } = JSON.parse(event.body || '{}');
      if (!username || !author || !permlink || !title) {
        return fail(400, 'username, author, permlink, and title are required');
      }
      const { data: rows, error } = await supabase.from('bookmarks')
        .upsert(
          { username, author, permlink, title, cover_image: cover_image || '' },
          { onConflict: 'username,author,permlink', ignoreDuplicates: true }
        )
        .select().single();
      if (error) return fail(500, error.message);
      return ok(rows || { already_exists: true });
    }

    // DELETE /api/bookmarks/:id
    if (method === 'DELETE' && segments.length === 1) {
      await supabase.from('bookmarks').delete().eq('id', segments[0]);
      return ok({ ok: true });
    }

    return fail(404, 'Not found');
  } catch (e: any) {
    console.error('Bookmarks error:', e);
    return fail(500, e.message);
  }
};
