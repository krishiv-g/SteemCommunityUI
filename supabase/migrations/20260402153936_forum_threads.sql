-- Forum threads index table
-- Body and replies live on the Steem blockchain. This table is just the index.
CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permlink TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forum_threads" ON public.forum_threads FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert forum_threads" ON public.forum_threads FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete forum_threads" ON public.forum_threads FOR DELETE TO public USING (true);
