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

async function publishToCurrentChannel(accessToken: string, shopifyAdminUrl: string, productId: string) {
  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: `
        mutation PublishToCurrentChannel($id: ID!) {
          publishablePublishToCurrentChannel(id: $id) {
            userErrors { field message }
          }
        }
      `,
        variables: {
          id: productId,
        },
    }),
  })

  const data = await response.json().catch(() => null)
  const gqlErrors: any[] = data?.errors || []
  if (gqlErrors.length > 0) {
    return { ok: false, error: gqlErrors.map((e) => e?.message).filter(Boolean).join('; ') || 'graphql_error' }
  }

  const userErrors = data?.data?.publishablePublishToCurrentChannel?.userErrors || []
  if (userErrors.length > 0) {
    return { ok: false, error: userErrors.map((e: any) => e?.message).filter(Boolean).join('; ') || 'publish failed' }
  }

  return { ok: response.ok }
}

function getNumericProductId(productGid: string): number | null {
  // gid://shopify/Product/123
  const match = /gid:\/\/shopify\/Product\/(\d+)/.exec(productGid)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

async function publishViaRest(accessToken: string, productGid: string) {
  const numericId = getNumericProductId(productGid)
  if (!numericId) return { ok: false, error: 'invalid_product_gid' }

  const restUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/products/${numericId}.json`
  const response = await fetch(restUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      product: {
        id: numericId,
        status: 'active',
        // Setting published_at publishes to the Online Store sales channel
        published_at: new Date().toISOString(),
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return { ok: false, error: text || `http_${response.status}` }
  }

  return { ok: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    if (!shopifyAccessToken) return json({ success: false, error: 'SHOPIFY_ACCESS_TOKEN not configured' }, { status: 500 })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const url = new URL(req.url)
    const kinguinId = Number(body.kinguinId ?? url.searchParams.get('kinguinId') ?? NaN)
    const explicitProductId = (body.productId ?? url.searchParams.get('productId') ?? null) as string | null

    let productId = explicitProductId
    if (!productId) {
      if (!Number.isFinite(kinguinId)) {
        return json({ success: false, error: 'kinguinId or productId required' }, { status: 400 })
      }

      const { data: row, error } = await supabase
        .from('kinguin_products')
        .select('shopify_product_id')
        .eq('kinguin_id', kinguinId)
        .maybeSingle()

      if (error) return json({ success: false, error: error.message }, { status: 500 })
      if (!row?.shopify_product_id) return json({ success: false, error: 'product_not_synced' }, { status: 404 })
      productId = row.shopify_product_id
    }

    if (!productId) {
      return json({ success: false, error: 'productId_missing' }, { status: 400 })
    }

    const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

    // 1) Try publish via the app's current channel (works for channel apps)
    const publishResult = await publishToCurrentChannel(shopifyAccessToken, shopifyAdminUrl, productId)
    if (publishResult.ok) {
      return json({ success: true, productId, method: 'current_channel' })
    }

    const message = (publishResult.error || '').toLowerCase()
    const shouldFallbackToRest =
      message.includes('channel does not exist') ||
      message.includes('write_publications') ||
      message.includes('access denied')

    // 2) Fallback: publish to Online Store via REST (works for custom apps without a sales channel)
    if (shouldFallbackToRest) {
      const restResult = await publishViaRest(shopifyAccessToken, productId)
      if (restResult.ok) {
        return json({ success: true, productId, method: 'rest' })
      }
      return json({ success: false, error: restResult.error || 'publish_failed' }, { status: 400 })
    }

    return json({ success: false, error: publishResult.error || 'publish_failed' }, { status: 400 })
  } catch (e) {
    console.error('Publish error:', e)
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
})
