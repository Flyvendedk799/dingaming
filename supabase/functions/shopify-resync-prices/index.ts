import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    if (!shopifyAccessToken) {
      return json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' }, { status: 500 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const limitRaw = parseInt(url.searchParams.get('limit') || '200')
    const limit = Math.min(Math.max(limitRaw, 1), 1000)
    const offsetRaw = parseInt(url.searchParams.get('offset') || '0')
    const offset = Math.max(offsetRaw, 0)

    // Get current settings
    const { data: settingsData } = await supabase
      .from('store_settings')
      .select('key, value')
      .in('key', ['global_margin_percent', 'eur_to_dkk_rate'])

    let globalMargin = 30
    let eurToDkkRate = 7.46

    if (settingsData) {
      for (const s of settingsData) {
        if (s.key === 'global_margin_percent') globalMargin = Number(s.value) || 30
        if (s.key === 'eur_to_dkk_rate') eurToDkkRate = Number(s.value) || 7.46
      }
    }

    console.log(`Re-syncing prices with margin=${globalMargin}%, rate=${eurToDkkRate}`)

    // Fetch products that have been synced to Shopify
    const { data: products, error: fetchError } = await supabase
      .from('kinguin_products')
      .select('kinguin_id, sell_price, margin_percent, shopify_product_id')
      .not('shopify_product_id', 'is', null)
      .order('kinguin_id', { ascending: true })
      .range(offset, offset + limit - 1)

    if (fetchError) throw fetchError
    if (!products || products.length === 0) {
      return json({ success: true, updated: 0, message: 'No products to update' })
    }

    const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
    let updated = 0
    let failed = 0
    const concurrency = 4

    for (let i = 0; i < products.length; i += concurrency) {
      const batch = products.slice(i, i + concurrency)

      const results = await Promise.all(
        batch.map(async (product) => {
          const margin = product.margin_percent ?? globalMargin
          const priceInDkk = product.sell_price * (1 + margin / 100) * eurToDkkRate
          const sku = `KINGUIN-${product.kinguin_id}`

          try {
            const response = await fetch(shopifyAdminUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyAccessToken,
              },
              body: JSON.stringify({
                query: `
                  mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
                    productSet(input: $input, synchronous: $synchronous) {
                      product { id }
                      userErrors { field message }
                    }
                  }
                `,
                variables: {
                  synchronous: true,
                  input: {
                    id: product.shopify_product_id,
                    productOptions: [{ name: 'Title', values: [{ name: 'Default Title' }] }],
                    variants: [{
                      optionValues: [{ optionName: 'Title', name: 'Default Title' }],
                      price: priceInDkk.toFixed(2),
                      sku,
                    }],
                  },
                },
              }),
            })

            const data = await response.json().catch(() => null)
            const userErrors = data?.data?.productSet?.userErrors || []
            if (userErrors.length > 0) {
              console.warn(`Price update failed for ${product.kinguin_id}:`, userErrors)
              return false
            }
            return true
          } catch (e) {
            console.error(`Error updating price for ${product.kinguin_id}:`, e)
            return false
          }
        })
      )

      for (const ok of results) {
        if (ok) updated++
        else failed++
      }

      if (i + concurrency < products.length) {
        await delay(500)
      }
    }

    console.log(`Price re-sync done: ${updated} updated, ${failed} failed`)

    return json({
      success: true,
      updated,
      failed,
      total: products.length,
      settings: { globalMargin, eurToDkkRate },
    })
  } catch (error) {
    console.error('Price resync error:', error)
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
})
