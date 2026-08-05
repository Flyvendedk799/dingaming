import { requireAdmin } from '../_shared/adminAuth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Order history carries customer emails and purchased products.
  const auth = await requireAdmin(req, corsHeaders)
  if (!auth.ok) return auth.response!

  try {
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    const url = new URL(req.url)
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '25'
    const status = url.searchParams.get('status') || ''
    const orderId = url.searchParams.get('orderId') || ''
    const createdAtFrom = url.searchParams.get('createdAtFrom') || ''
    const createdAtTo = url.searchParams.get('createdAtTo') || ''

    // Build query params
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('limit', limit)
    if (status) params.set('status', status)
    if (orderId) params.set('orderId', orderId)
    if (createdAtFrom) params.set('createdAtFrom', createdAtFrom)
    if (createdAtTo) params.set('createdAtTo', createdAtTo)

    console.log('Fetching Kinguin orders:', params.toString())

    const response = await fetch(`${KINGUIN_API_URL}/order?${params.toString()}`, {
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
    console.log('Orders count:', data.item_count)

    return new Response(JSON.stringify({
      orders: data.results || [],
      total: data.item_count || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Orders error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
