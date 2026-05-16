CREATE TABLE public.steem_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  first_login_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.steem_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read steem_users" ON public.steem_users
  FOR SELECT USING (true);