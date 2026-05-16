import { supabase } from '@/integrations/supabase/client';
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
  const { data, error } = await (supabase as any)
    .from('forum_threads')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as unknown as DbThread[];
}

/** Fetch a single thread by permlink */
export async function fetchThreadByPermlink(permlink: string): Promise<DbThread | null> {
  const { data, error } = await (supabase as any)
    .from('forum_threads')
    .select('*')
    .eq('permlink', permlink)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as DbThread;
}

/** Save thread to DB — call before broadcasting to Steem */
export async function createThread(params: {
  author: string;
  title: string;
  tags: string[];
}): Promise<DbThread> {
  const permlink = generateThreadPermlink(params.title);

  const { data, error } = await (supabase as any)
    .from('forum_threads')
    .insert({
      permlink,
      author: params.author,
      title: params.title,
      tags: params.tags,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create thread');
  return data as unknown as DbThread;
}

/** Delete a thread — call on broadcast failure to clean up orphaned DB record */
export async function deleteThread(threadId: string): Promise<void> {
  await (supabase as any).from('forum_threads').delete().eq('id', threadId);
}

/** Build Steem post body for a forum thread */
export function buildThreadBody(body: string): string {
  return withFooter(body);
}

/** Build json_metadata marking the post as a WoX forum thread */
export function buildThreadJsonMetadata(tags: string[]): string {
  return JSON.stringify({
    app: 'worldofxpilar/1.0',
    format: 'markdown',
    tags,
    wox_type: 'forum_thread',
  });
}

function generateThreadPermlink(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  const suffix = Date.now().toString(36);
  return `wox-forum-${slug}-${suffix}`;
}
