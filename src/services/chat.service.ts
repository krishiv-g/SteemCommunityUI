import { supabase } from '@/integrations/supabase/client';
import { fetchCommunityRoles } from '@/services/steem.community';

export interface ChatMessage {
  id: string;
  created_at: string;
  sender: string;
  content: string;
  channel: string;
  recipient: string | null;
  deleted: boolean;
  pinned: boolean;
}

export interface ChatMute {
  id: string;
  created_at: string;
  username: string;
  muted_by: string;
  expires_at: string | null;
  reason: string | null;
}

const chatDb = supabase as any;

// ─── Messages ───────────────────────────────────────────────

/** Fetch recent community chat messages */
export async function fetchCommunityMessages(limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await chatDb
    .from('chat_messages')
    .select('*')
    .eq('channel', 'community')
    .eq('deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) { console.error('[Chat] fetch community:', error); return []; }
  return (data ?? []) as ChatMessage[];
}

/** Fetch DM conversation between two users */
export async function fetchDmMessages(userA: string, userB: string, limit = 100): Promise<ChatMessage[]> {
  const { data, error } = await chatDb
    .from('chat_messages')
    .select('*')
    .eq('channel', 'dm')
    .eq('deleted', false)
    .or(`and(sender.eq.${userA},recipient.eq.${userB}),and(sender.eq.${userB},recipient.eq.${userA})`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) { console.error('[Chat] fetch DMs:', error); return []; }
  return (data ?? []) as ChatMessage[];
}

/** Fetch list of DM contacts (unique users who have sent/received messages with the given user) */
export async function fetchDmContacts(username: string): Promise<string[]> {
  // Get sent messages
  const { data: sent } = await chatDb
    .from('chat_messages')
    .select('recipient')
    .eq('channel', 'dm')
    .eq('sender', username)
    .eq('deleted', false);

  const { data: received } = await chatDb
    .from('chat_messages')
    .select('sender')
    .eq('channel', 'dm')
    .eq('recipient', username)
    .eq('deleted', false);

  const contacts = new Set<string>();
  (sent ?? []).forEach((m: any) => m.recipient && contacts.add(m.recipient));
  (received ?? []).forEach((m: any) => m.sender && contacts.add(m.sender));
  return Array.from(contacts);
}

/** Send a message */
export async function sendMessage(params: {
  sender: string;
  content: string;
  channel: 'community' | 'dm';
  recipient?: string;
}): Promise<ChatMessage | null> {
  const { data, error } = await chatDb
    .from('chat_messages')
    .insert({
      sender: params.sender,
      content: params.content,
      channel: params.channel,
      recipient: params.recipient ?? null,
    })
    .select()
    .single();

  if (error) { console.error('[Chat] send:', error); return null; }
  return data as ChatMessage;
}

/** Soft-delete a message (mod action) */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const { error } = await chatDb
    .from('chat_messages')
    .update({ deleted: true })
    .eq('id', messageId);

  return !error;
}

/** Toggle pin on a message */
export async function togglePinMessage(messageId: string, pinned: boolean): Promise<boolean> {
  const { error } = await chatDb
    .from('chat_messages')
    .update({ pinned })
    .eq('id', messageId);

  return !error;
}

/** Fetch pinned messages */
export async function fetchPinnedMessages(channel = 'community'): Promise<ChatMessage[]> {
  const { data, error } = await chatDb
    .from('chat_messages')
    .select('*')
    .eq('channel', channel)
    .eq('pinned', true)
    .eq('deleted', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as ChatMessage[];
}

// ─── Mutes ──────────────────────────────────────────────────

/** Check if a user is currently muted */
export async function isUserMuted(username: string): Promise<boolean> {
  const { data } = await chatDb
    .from('chat_mutes')
    .select('id, expires_at')
    .eq('username', username);

  if (!data || data.length === 0) return false;
  // Check if any active mute exists
  return data.some((m: ChatMute) => !m.expires_at || new Date(m.expires_at) > new Date());
}

/** Mute a user */
export async function muteUser(params: {
  username: string;
  muted_by: string;
  expires_at?: string;
  reason?: string;
}): Promise<boolean> {
  const { error } = await chatDb
    .from('chat_mutes')
    .insert({
      username: params.username,
      muted_by: params.muted_by,
      expires_at: params.expires_at ?? null,
      reason: params.reason ?? null,
    });

  return !error;
}

/** Unmute a user */
export async function unmuteUser(username: string): Promise<boolean> {
  const { error } = await chatDb
    .from('chat_mutes')
    .delete()
    .eq('username', username);

  return !error;
}

/** Fetch all active mutes */
export async function fetchActiveMutes(): Promise<ChatMute[]> {
  const { data } = await chatDb
    .from('chat_mutes')
    .select('*')
    .order('created_at', { ascending: false });

  return ((data ?? []) as ChatMute[]).filter(
    (m) => !m.expires_at || new Date(m.expires_at) > new Date()
  );
}

// ─── Realtime ───────────────────────────────────────────────

/** Subscribe to new community messages */
export function subscribeToCommunityChat(onMessage: (msg: ChatMessage) => void) {
  const channel = supabase
    .channel('community-chat')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: 'channel=eq.community',
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: 'channel=eq.community',
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/** Subscribe to DM messages for a user */
export function subscribeToDms(username: string, onMessage: (msg: ChatMessage) => void) {
  const channel = supabase
    .channel(`dm-${username}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: 'channel=eq.dm',
      },
      (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.sender === username || msg.recipient === username) {
          onMessage(msg);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─── Role checking ──────────────────────────────────────────

let cachedRoles: Map<string, string> | null = null;

export async function getUserCommunityRole(username: string): Promise<string | null> {
  if (!cachedRoles) {
    const roles = await fetchCommunityRoles();
    cachedRoles = new Map(roles.map((r) => [r.account, r.role]));
  }
  return cachedRoles.get(username) ?? null;
}

export function isModerator(role: string | null): boolean {
  return role === 'admin' || role === 'mod' || role === 'owner';
}

export function clearRoleCache() {
  cachedRoles = null;
}
