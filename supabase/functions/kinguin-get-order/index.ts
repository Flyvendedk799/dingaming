import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const orderId = url.searchParams.get('orderId')

    if (!orderId) {
      throw new Error('orderId is required')
    }

    console.log('Fetching order:', orderId)

    // Fetch order from Kinguin
    const response = await fetch(`${KINGUIN_API_URL}/order/${orderId}`, {
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

    const orderData = await response.json()
    console.log('Order data:', orderData)

    // Update local database with latest status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract keys if order is completed
    let keys = null
    if (orderData.status === 'completed' && orderData.products) {
      keys = orderData.products.flatMap((p: any) => 
        p.keys?.map((k: any) => ({
          productName: p.name,
          key: k.serial || k.value,
          type: k.type || 'text'
        })) || []
      )
    }

    await supabase
      .from('kinguin_orders')
      .update({
        status: orderData.status,
        keys: keys
      })
      .eq('order_id', orderId)

    return new Response(JSON.stringify({
      orderId: orderData.orderId,
      status: orderData.status,
      products: orderData.products,
      keys: keys,
      totalPrice: orderData.totalPrice
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Get order error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
