const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'regions' // regions, platforms, or genres

    let endpoint = '/regions'
    if (type === 'platforms') endpoint = '/platforms'
    if (type === 'genres') endpoint = '/genres'

    console.log('Fetching Kinguin', type)

    const response = await fetch(`${KINGUIN_API_URL}${endpoint}`, {
      headers: {
        'X-Api-Key': kinguinApiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kinguin API error:', response.status, errorText)
      throw new Error(`Kinguin API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`${type} count:`, data.length)

    return new Response(JSON.stringify({
      [type]: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Metadata error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
