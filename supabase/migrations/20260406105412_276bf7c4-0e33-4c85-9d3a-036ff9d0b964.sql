
-- Chat messages table (community + DM)
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sender text NOT NULL,
  content text NOT NULL,
  channel text NOT NULL DEFAULT 'community',
  recipient text,
  deleted boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages" ON public.chat_messages
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update chat messages" ON public.chat_messages
  FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Chat mutes table
CREATE TABLE public.chat_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  username text NOT NULL,
  muted_by text NOT NULL,
  expires_at timestamptz,
  reason text
);

ALTER TABLE public.chat_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat mutes" ON public.chat_mutes
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert chat mutes" ON public.chat_mutes
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can delete chat mutes" ON public.chat_mutes
  FOR DELETE TO public USING (true);

-- Indexes
CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel, created_at DESC);
CREATE INDEX idx_chat_messages_dm ON public.chat_messages(sender, recipient, created_at DESC);
CREATE INDEX idx_chat_mutes_username ON public.chat_mutes(username);

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
