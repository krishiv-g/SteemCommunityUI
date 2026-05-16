
-- Polls table
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permlink TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  steem_tx_id TEXT DEFAULT NULL
);

-- Poll options
CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);

-- Poll votes
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, voter)
);

-- RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can read polls and options
CREATE POLICY "Anyone can read polls" ON public.polls FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read poll options" ON public.poll_options FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read poll votes" ON public.poll_votes FOR SELECT TO public USING (true);

-- Anyone can insert polls, options, and votes (auth handled at app level via Steem)
CREATE POLICY "Anyone can insert polls" ON public.polls FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can insert poll options" ON public.poll_options FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can insert poll votes" ON public.poll_votes FOR INSERT TO public WITH CHECK (true);
