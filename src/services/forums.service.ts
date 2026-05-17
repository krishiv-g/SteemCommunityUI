import { withFooter } from '@/lib/postFooter';

export interface DbThread {
  id: string;
  permlink: string;
  author: string;
  title: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
}

/** Fetch all forum threads ordered by newest first */
export async function fetchThreads(): Promise<DbThread[]> {
  const res = await fetch('/api/forums');
  if (!res.ok) return [];
  return res.json();
}

/** Fetch a single thread by permlink */
export async function fetchThreadByPermlink(permlink: string): Promise<DbThread | null> {
  const res = await fetch(`/api/forums/${encodeURIComponent(permlink)}`);
  if (!res.ok) return null;
  return res.json();
}

/** Save thread to DB — call before broadcasting to Steem */
export async function createThread(params: {
  author: string;
  title: string;
  tags: string[];
}): Promise<DbThread> {
  const res = await fetch('/api/forums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create thread');
  }
  return res.json();
}

/** Delete a thread — call on broadcast failure to clean up orphaned DB record */
export async function deleteThread(threadId: string): Promise<void> {
  await fetch(`/api/forums/${threadId}`, { method: 'DELETE' });
}

/** Build Steem post body for a forum thread */
export function buildThreadBody(body: string): string {
  return withFooter(body);
}

/** Build json_metadata marking the post as a forum thread */
export function buildThreadJsonMetadata(tags: string[]): string {
  return JSON.stringify({
    app: 'steemdev/1.0',
    format: 'markdown',
    tags,
    wox_type: 'forum_thread',
  });
}
