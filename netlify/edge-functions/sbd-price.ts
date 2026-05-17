import { Config } from 'netlify:edge';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

async function fetchFromCoinGecko() {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=steem-dollars&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
    { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = await res.json();
  const sbd = data['steem-dollars'];
  if (!sbd?.usd) throw new Error('SBD data not found in CoinGecko response');
  return {
    symbol: 'SBD',
    name: 'Steem Dollars',
    price_usd: sbd.usd,
    percent_change_24h: sbd.usd_24h_change ?? null,
    market_cap: sbd.usd_market_cap ?? null,
    volume_24h: sbd.usd_24h_vol ?? null,
    last_updated: new Date().toISOString(),
  };
}

async function fetchFromCoinMarketCap(apiKey: string) {
  const res = await fetch(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SBD&convert=USD',
    {
      headers: { 'X-CMC_PRO_API_KEY': apiKey, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000),
    }
  );
  if (!res.ok) throw new Error(`CoinMarketCap error: ${res.status}`);
  const data = await res.json();
  const sbdData = data?.data?.SBD;
  if (!sbdData) throw new Error('SBD data not found in CoinMarketCap response');
  const quote = sbdData.quote?.USD;
  return {
    symbol: 'SBD',
    name: sbdData.name,
    price_usd: quote?.price,
    percent_change_24h: quote?.percent_change_24h ?? null,
    market_cap: quote?.market_cap ?? null,
    volume_24h: quote?.volume_24h ?? null,
    last_updated: quote?.last_updated,
  };
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const apiKey = Deno.env.get('COINMARKETCAP_API_KEY');
    const result = apiKey
      ? await fetchFromCoinMarketCap(apiKey).catch(() => fetchFromCoinGecko())
      : await fetchFromCoinGecko();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error fetching SBD price:', error);
    // Return fallback so the UI always gets a usable value
    return new Response(
      JSON.stringify({ symbol: 'SBD', name: 'Steem Dollars', price_usd: 1.0, percent_change_24h: null, market_cap: null, volume_24h: null, last_updated: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export const config: Config = {
  path: '/api/sbd-price',
};
