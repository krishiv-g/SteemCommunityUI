const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('COINMARKETCAP_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'COINMARKETCAP_API_KEY is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SBD&convert=USD',
      {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`CoinMarketCap API error [${response.status}]: ${errorBody}`)
    }

    const data = await response.json()
    const sbdData = data?.data?.SBD
    
    if (!sbdData) {
      throw new Error('SBD data not found in CoinMarketCap response')
    }

    const quote = sbdData.quote?.USD
    const result = {
      symbol: 'SBD',
      name: sbdData.name,
      price_usd: quote?.price,
      percent_change_24h: quote?.percent_change_24h,
      market_cap: quote?.market_cap,
      volume_24h: quote?.volume_24h,
      last_updated: quote?.last_updated,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    console.error('Error fetching SBD price:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
