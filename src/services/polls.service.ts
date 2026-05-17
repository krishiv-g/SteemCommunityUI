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
  const url = voter ? `/api/polls?voter=${encodeURIComponent(voter)}` : '/api/polls';
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

/** Fetch a single poll by permlink */
export async function fetchPollByPermlink(permlink: string, voter?: string): Promise<DbPoll | null> {
  const url = voter
    ? `/api/polls/${encodeURIComponent(permlink)}?voter=${encodeURIComponent(voter)}`
    : `/api/polls/${encodeURIComponent(permlink)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
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
  const res = await fetch('/api/polls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create poll');
  }
  return res.json();
}

/** Delete a poll and its options (used to clean up after a failed broadcast) */
export async function deletePoll(pollId: string): Promise<void> {
  await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
}

/** Cast a poll vote — only call this AFTER a successful Steem broadcast */
export async function castPollVote(pollId: string, optionId: string, voter: string): Promise<void> {
  const res = await fetch(`/api/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId, voter }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to cast vote');
  }
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

🗳️ **[Vote on this poll at SteemDev](${siteUrl}/polls/${poll.permlink})**

*This poll is hosted on SteemDev. Click the link above to cast your vote.*`;

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
