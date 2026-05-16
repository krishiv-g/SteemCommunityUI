import { supabase } from '@/integrations/supabase/client';
import { withFooter } from '@/lib/postFooter';

export interface DbPoll {
  id: string;
  permlink: string;
  author: string;
  title: string;
  description: string;
  tags: string[];
  ends_at: string;
  created_at: string;
  steem_tx_id: string | null;
  options: DbPollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
}

export interface DbPollOption {
  id: string;
  label: string;
  position: number;
  votes: number;
}

/** Fetch all polls with options and vote counts */
export async function fetchPolls(voter?: string): Promise<DbPoll[]> {
  const { data: polls, error } = await supabase
    .from('polls')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !polls) return [];

  const pollIds = polls.map(p => p.id);

  // Fetch options
  const { data: options } = await supabase
    .from('poll_options')
    .select('*')
    .in('poll_id', pollIds)
    .order('position', { ascending: true });

  // Fetch vote counts per option
  const { data: votes } = await supabase
    .from('poll_votes')
    .select('poll_id, option_id, voter')
    .in('poll_id', pollIds);

  const optionsByPoll = new Map<string, DbPollOption[]>();
  const voteCounts = new Map<string, number>(); // option_id -> count
  const userVotes = new Map<string, string>(); // poll_id -> option_id

  for (const opt of options || []) {
    const list = optionsByPoll.get(opt.poll_id) || [];
    list.push({ id: opt.id, label: opt.label, position: opt.position, votes: 0 });
    optionsByPoll.set(opt.poll_id, list);
  }

  for (const v of votes || []) {
    voteCounts.set(v.option_id, (voteCounts.get(v.option_id) || 0) + 1);
    if (voter && v.voter === voter) {
      userVotes.set(v.poll_id, v.option_id);
    }
  }

  // Apply vote counts to options
  for (const [, opts] of optionsByPoll) {
    for (const opt of opts) {
      opt.votes = voteCounts.get(opt.id) || 0;
    }
  }

  return polls.map(p => {
    const opts = optionsByPoll.get(p.id) || [];
    const totalVotes = opts.reduce((sum, o) => sum + o.votes, 0);
    return {
      id: p.id,
      permlink: p.permlink,
      author: p.author,
      title: p.title,
      description: p.description || '',
      tags: p.tags || [],
      ends_at: p.ends_at,
      created_at: p.created_at,
      steem_tx_id: p.steem_tx_id,
      options: opts,
      totalVotes,
      userVotedOptionId: userVotes.get(p.id),
    };
  });
}

/** Fetch a single poll by permlink */
export async function fetchPollByPermlink(permlink: string, voter?: string): Promise<DbPoll | null> {
  const { data: poll, error } = await supabase
    .from('polls')
    .select('*')
    .eq('permlink', permlink)
    .maybeSingle();

  if (error || !poll) return null;

  const { data: options } = await supabase
    .from('poll_options')
    .select('*')
    .eq('poll_id', poll.id)
    .order('position', { ascending: true });

  const { data: votes } = await supabase
    .from('poll_votes')
    .select('option_id, voter')
    .eq('poll_id', poll.id);

  const voteCounts = new Map<string, number>();
  let userVotedOptionId: string | undefined;

  for (const v of votes || []) {
    voteCounts.set(v.option_id, (voteCounts.get(v.option_id) || 0) + 1);
    if (voter && v.voter === voter) userVotedOptionId = v.option_id;
  }

  const opts: DbPollOption[] = (options || []).map(o => ({
    id: o.id,
    label: o.label,
    position: o.position,
    votes: voteCounts.get(o.id) || 0,
  }));

  const totalVotes = opts.reduce((sum, o) => sum + o.votes, 0);

  return {
    id: poll.id,
    permlink: poll.permlink,
    author: poll.author,
    title: poll.title,
    description: poll.description || '',
    tags: poll.tags || [],
    ends_at: poll.ends_at,
    created_at: poll.created_at,
    steem_tx_id: poll.steem_tx_id,
    options: opts,
    totalVotes,
    userVotedOptionId,
  };
}

/** Create a poll (step 1 — saves to DB, returns poll with permlink) */
export async function createPoll(params: {
  author: string;
  title: string;
  description: string;
  options: string[];
  endsAt: string;
  tags: string[];
}): Promise<DbPoll> {
  const permlink = generatePollPermlink(params.title);

  const { data: poll, error } = await supabase
    .from('polls')
    .insert({
      permlink,
      author: params.author,
      title: params.title,
      description: params.description,
      tags: params.tags,
      ends_at: params.endsAt,
    })
    .select()
    .single();

  if (error || !poll) throw new Error(error?.message || 'Failed to create poll');

  // Insert options
  const optionRows = params.options.map((label, i) => ({
    poll_id: poll.id,
    label,
    position: i,
  }));

  const { data: options, error: optErr } = await supabase
    .from('poll_options')
    .insert(optionRows)
    .select();

  if (optErr) throw new Error(optErr.message);

  return {
    id: poll.id,
    permlink: poll.permlink,
    author: poll.author,
    title: poll.title,
    description: poll.description || '',
    tags: poll.tags || [],
    ends_at: poll.ends_at,
    created_at: poll.created_at,
    steem_tx_id: null,
    options: (options || []).map(o => ({ id: o.id, label: o.label, position: o.position, votes: 0 })),
    totalVotes: 0,
  };
}

/** Delete a poll and its options (used to clean up after a failed broadcast) */
export async function deletePoll(pollId: string): Promise<void> {
  await supabase.from('poll_options').delete().eq('poll_id', pollId);
  await supabase.from('polls').delete().eq('id', pollId);
}

/** Cast a poll vote — only call this AFTER a successful Steem broadcast */
export async function castPollVote(pollId: string, optionId: string, voter: string): Promise<void> {
  const { error } = await supabase
    .from('poll_votes')
    .insert({ poll_id: pollId, option_id: optionId, voter });

  if (error) throw new Error(error.message);
}

/** Generate a permlink for the poll */
function generatePollPermlink(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  const suffix = Date.now().toString(36);
  return `wox-poll-${slug}-${suffix}`;
}

/** Build the Steem post body that redirects to WoX */
export function buildPollSteemBody(poll: DbPoll, siteUrl: string): string {
  const optionsList = poll.options
    .sort((a, b) => a.position - b.position)
    .map((o, i) => `${i + 1}. ${o.label}`)
    .join('\n');

  const body = `# 📊 ${poll.title}

${poll.description || ''}

**Poll Options:**
${optionsList}

---

🗳️ **[Vote on this poll at World of Xpilar](${siteUrl}/polls/${poll.permlink})**

*This poll is hosted on World of Xpilar. Click the link above to cast your vote.*`;

  return withFooter(body);
}

/** Build json_metadata for poll Steem post */
export function buildPollJsonMetadata(tags: string[]): string {
  return JSON.stringify({
    tags: [...tags],
    app: 'wox/polls',
    format: 'markdown',
  });
}
