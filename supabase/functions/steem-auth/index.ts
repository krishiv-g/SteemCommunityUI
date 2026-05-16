const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'npm:@supabase/supabase-js@2';
import { SignJWT } from 'npm:jose@5';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 16) {
      return new Response(
        JSON.stringify({ error: 'Valid Steem username required (3-16 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('steem_users')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      await supabase
        .from('steem_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('username', username.toLowerCase());
    } else {
      const { error: insertError } = await supabase
        .from('steem_users')
        .insert({ username: username.toLowerCase() });

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // Sign JWT using service role key as signing secret
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!jwtSecret) {
      console.error('No JWT signing secret available');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({
      sub: username.toLowerCase(),
      role: 'authenticated',
      iss: 'supabase',
      aud: 'authenticated',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    return new Response(
      JSON.stringify({ token, username: username.toLowerCase() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
