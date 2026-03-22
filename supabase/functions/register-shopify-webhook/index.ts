import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!

    const shopDomain = 'dingaming-js6x0.myshopify.com'
    const callbackUrl = `${supabaseUrl}/functions/v1/shopify-order-webhook`

    // Use Shopify Admin REST API to create webhook
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shopifyAccessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'orders/paid',
          address: callbackUrl,
          format: 'json',
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Failed to register webhook:', data)
      return new Response(JSON.stringify({ error: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Webhook registered:', data.webhook?.id)

    return new Response(JSON.stringify({ 
      success: true, 
      webhookId: data.webhook?.id,
      topic: data.webhook?.topic,
      address: data.webhook?.address
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error registering webhook:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
