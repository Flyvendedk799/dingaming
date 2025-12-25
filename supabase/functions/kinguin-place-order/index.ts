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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { products, email, externalOrderId } = await req.json()

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('Products array is required')
    }

    console.log('Placing order with products:', products)

    // Prepare order payload for Kinguin
    const orderPayload = {
      products: products.map((p: any) => ({
        kinguinId: p.kinguinId,
        qty: p.qty || 1,
        price: p.price // Original Kinguin price, not our sell price
      })),
      orderExternalId: externalOrderId || `order_${Date.now()}`
    }

    console.log('Kinguin order payload:', JSON.stringify(orderPayload))

    // Place order with Kinguin
    const response = await fetch(`${KINGUIN_API_URL}/order`, {
      method: 'POST',
      headers: {
        'X-Api-Key': kinguinApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kinguin order error:', response.status, errorText)
      throw new Error(`Kinguin API error: ${response.status} - ${errorText}`)
    }

    const orderData = await response.json()
    console.log('Kinguin order response:', orderData)

    // Calculate total sell price (with margin)
    const MARGIN = 1.30
    const totalSellPrice = products.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.price) * MARGIN * (p.qty || 1)), 0
    )

    // Store order in our database
    const { error: dbError } = await supabase
      .from('kinguin_orders')
      .insert({
        order_id: orderData.orderId,
        order_external_id: orderPayload.orderExternalId,
        status: orderData.status || 'processing',
        total_price: totalSellPrice,
        user_email: email,
        products: orderData.products || products
      })

    if (dbError) {
      console.error('Error storing order:', dbError)
      // Don't throw - order was placed successfully with Kinguin
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: orderData.orderId,
      status: orderData.status,
      totalPrice: totalSellPrice
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Order error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
