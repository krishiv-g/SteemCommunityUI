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
  // Segments after /api/polls/
  const parts = event.path.split('/').filter(Boolean); // ["api","polls",...]
  const segments = parts.slice(2);                     // e.g. [] | ["permlink"] | ["id","vote"]

  try {
    // GET /api/polls
    if (method === 'GET' && segments.length === 0) {
      const voter = query.voter;
      const { data: allPolls } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
      if (!allPolls || allPolls.length === 0) return ok([]);

      const pollIds = allPolls.map((p: any) => p.id);
      const [{ data: allOptions }, { data: allVotes }] = await Promise.all([
        supabase.from('poll_options').select('*').in('poll_id', pollIds).order('position'),
        supabase.from('poll_votes').select('*').in('poll_id', pollIds),
      ]);

      const voteCounts = new Map<string, number>();
      const userVotes = new Map<string, string>();
      for (const v of allVotes || []) {
        voteCounts.set(v.option_id, (voteCounts.get(v.option_id) || 0) + 1);
        if (voter && v.voter === voter) userVotes.set(v.poll_id, v.option_id);
      }
      const optsByPoll = new Map<string, any[]>();
      for (const o of allOptions || []) {
        const list = optsByPoll.get(o.poll_id) || [];
        list.push(o);
        optsByPoll.set(o.poll_id, list);
      }

      return ok(allPolls.map((p: any) => {
        const opts = (optsByPoll.get(p.id) || []).map((o: any) => ({
          id: o.id, label: o.label, position: o.position, votes: voteCounts.get(o.id) || 0,
        }));
        return {
          id: p.id, permlink: p.permlink, author: p.author, title: p.title,
          description: p.description || '', tags: p.tags || [],
          ends_at: p.ends_at, created_at: p.created_at, steem_tx_id: p.steem_tx_id,
          options: opts, totalVotes: opts.reduce((s: number, o: any) => s + o.votes, 0),
          userVotedOptionId: userVotes.get(p.id),
        };
      }));
    }

    // GET /api/polls/:permlink
    if (method === 'GET' && segments.length === 1) {
      const voter = query.voter;
      const { data: poll } = await supabase.from('polls').select('*').eq('permlink', segments[0]).single();
      if (!poll) return fail(404, 'Poll not found');

      const [{ data: opts }, { data: votes }] = await Promise.all([
        supabase.from('poll_options').select('*').eq('poll_id', poll.id).order('position'),
        supabase.from('poll_votes').select('*').eq('poll_id', poll.id),
      ]);

      const voteCounts = new Map<string, number>();
      let userVotedOptionId: string | undefined;
      for (const v of votes || []) {
        voteCounts.set(v.option_id, (voteCounts.get(v.option_id) || 0) + 1);
        if (voter && v.voter === voter) userVotedOptionId = v.option_id;
      }

      const options = (opts || []).map((o: any) => ({
        id: o.id, label: o.label, position: o.position, votes: voteCounts.get(o.id) || 0,
      }));
      return ok({
        id: poll.id, permlink: poll.permlink, author: poll.author, title: poll.title,
        description: poll.description || '', tags: poll.tags || [],
        ends_at: poll.ends_at, created_at: poll.created_at, steem_tx_id: poll.steem_tx_id,
        options, totalVotes: options.reduce((s: number, o: any) => s + o.votes, 0), userVotedOptionId,
      });
    }

    // POST /api/polls
    if (method === 'POST' && segments.length === 0) {
      const { author, title, description, options, endsAt, tags } = JSON.parse(event.body || '{}');
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180);
      const permlink = `wox-poll-${slug}-${Date.now().toString(36)}`;

      const { data: poll, error: pollError } = await supabase.from('polls')
        .insert({ permlink, author, title, description, tags, ends_at: new Date(endsAt).toISOString() })
        .select().single();
      if (pollError || !poll) return fail(500, pollError?.message || 'Insert failed');

      const { data: insertedOptions } = await supabase.from('poll_options')
        .insert((options as string[]).map((label: string, i: number) => ({ poll_id: poll.id, label, position: i })))
        .select();

      return ok({
        id: poll.id, permlink: poll.permlink, author: poll.author, title: poll.title,
        description: poll.description || '', tags: poll.tags || [],
        ends_at: poll.ends_at, created_at: poll.created_at, steem_tx_id: null,
        options: (insertedOptions || []).map((o: any) => ({ id: o.id, label: o.label, position: o.position, votes: 0 })),
        totalVotes: 0,
      });
    }

    // POST /api/polls/:pollId/vote
    if (method === 'POST' && segments.length === 2 && segments[1] === 'vote') {
      const { optionId, voter } = JSON.parse(event.body || '{}');
      await supabase.from('poll_votes').insert({ poll_id: segments[0], option_id: optionId, voter });
      return ok({ ok: true });
    }

    // DELETE /api/polls/:id
    if (method === 'DELETE' && segments.length === 1) {
      await supabase.from('poll_options').delete().eq('poll_id', segments[0]);
      await supabase.from('polls').delete().eq('id', segments[0]);
      return ok({ ok: true });
    }

    return fail(404, 'Not found');
  } catch (e: any) {
    console.error('Polls error:', e);
    return fail(500, e.message);
  }
};
