import { createClient } from '@supabase/supabase-js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  const parts = event.path.split('/').filter(Boolean); // ["api","drafts",...]
  const segments = parts.slice(2);

  try {
    // GET /api/drafts?username=
    if (method === 'GET') {
      if (!query.username) return fail(400, 'username is required');
      const { data: rows } = await supabase.from('drafts')
        .select('*')
        .eq('username', query.username)
        .order('updated_at', { ascending: false });
      return ok(rows || []);
    }

    // POST /api/drafts
    if (method === 'POST' && segments.length === 0) {
      const { username, title, body: draftBody, tags } = JSON.parse(event.body || '{}');
      if (!username) return fail(400, 'username is required');
      const { data: row, error } = await supabase.from('drafts')
        .insert({ username, title: title || '', body: draftBody || '', tags: tags || [] })
        .select().single();
      if (error) return fail(500, error.message);
      return ok(row);
    }

    // PUT /api/drafts/:id
    if (method === 'PUT' && segments.length === 1) {
      const { title, body: draftBody, tags } = JSON.parse(event.body || '{}');
      const { data: row } = await supabase.from('drafts')
        .update({ title: title ?? '', body: draftBody ?? '', tags: tags ?? [], updated_at: new Date().toISOString() })
        .eq('id', segments[0])
        .select().single();
      if (!row) return fail(404, 'Draft not found');
      return ok(row);
    }

    // DELETE /api/drafts/:id
    if (method === 'DELETE' && segments.length === 1) {
      await supabase.from('drafts').delete().eq('id', segments[0]);
      return ok({ ok: true });
    }

    return fail(404, 'Not found');
  } catch (e: any) {
    console.error('Drafts error:', e);
    return fail(500, e.message);
  }
};
