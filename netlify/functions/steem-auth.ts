import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: 'ok' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { username } = JSON.parse(event.body || '{}');

    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 16) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Valid Steem username required (3-16 chars)' }),
      };
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    if (!supabaseKey) throw new Error('Supabase key not configured. Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const lowerUsername = username.toLowerCase();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('steem_users')
      .select('id, username')
      .eq('username', lowerUsername)
      .maybeSingle();

    if (existingUser) {
      // Update last login
      await supabase
        .from('steem_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('username', lowerUsername);
    } else {
      // Create new user
      await supabase
        .from('steem_users')
        .insert({ username: lowerUsername });
    }

    // Sign JWT
    const jwtSecret = process.env.JWT_SECRET || 'wox-dev-secret-change-in-production';
    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({
      sub: lowerUsername,
      role: 'authenticated',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, username: lowerUsername }),
    };
  } catch (error: any) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
