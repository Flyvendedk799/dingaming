import { requireAdmin } from '../_shared/adminAuth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Hands out purchased game keys and can return them to Kinguin, which is a
  // financial action — never open this to unauthenticated callers.
  const auth = await requireAdmin(req, corsHeaders)
  if (!auth.ok) return auth.response!

  try {
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    const url = new URL(req.url)
    const orderId = url.searchParams.get('orderId')
    const action = url.searchParams.get('action') || 'download' // download or return
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '100'

    if (!orderId) {
      throw new Error('orderId is required')
    }

    if (action === 'return') {
      // Return keys endpoint
      console.log('Returning keys for order:', orderId)

      const response = await fetch(`${KINGUIN_API_URL}/order/${orderId}/keys/return`, {
        method: 'POST',
        headers: {
          'X-Api-Key': kinguinApiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Kinguin API error:', response.status, errorText)
        throw new Error(`Kinguin API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Return result:', data)

      return new Response(JSON.stringify({
        success: true,
        keys: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      // Download keys endpoint
      console.log('Downloading keys for order:', orderId)

      const response = await fetch(`${KINGUIN_API_URL}/order/${orderId}/keys?page=${page}&limit=${limit}`, {
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
      console.log('Keys count:', data.length)

      return new Response(JSON.stringify({
        keys: data || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Keys error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
