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

// Cache the Online Store publication ID in memory across invocations
let cachedPublicationId: string | null = null

async function getOnlineStorePublicationId(accessToken: string): Promise<string | null> {
  if (cachedPublicationId) return cachedPublicationId

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: `{
        publications(first: 20) {
          edges {
            node {
              id
              name
              supportsFuturePublishing
            }
          }
        }
      }`,
    }),
  })

  const data = await response.json().catch(() => null)
  const publications = data?.data?.publications?.edges || []
  
  // Find the Online Store publication
  for (const edge of publications) {
    const name = (edge.node.name || '').toLowerCase()
    if (name === 'online store') {
      cachedPublicationId = edge.node.id
      return cachedPublicationId
    }
  }
  
  console.log('Available publications:', publications.map((e: any) => e.node.name))
  return null
}

async function publishToOnlineStore(accessToken: string, productId: string, publicationId: string) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: `
        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable { availablePublicationsCount { count } }
            userErrors { field message }
          }
        }
      `,
      variables: {
        id: productId,
        input: [{ publicationId }],
      },
    }),
  })

  const data = await response.json().catch(() => null)
  const rawErrors = data?.errors
  const gqlErrors: any[] = Array.isArray(rawErrors) ? rawErrors : rawErrors ? [rawErrors] : []
  if (gqlErrors.length > 0) {
    return { ok: false, error: gqlErrors.map((e) => e?.message).filter(Boolean).join('; ') || 'graphql_error' }
  }

  const userErrors = data?.data?.publishablePublish?.userErrors || []
  if (userErrors.length > 0) {
    // "Resource is already published" is actually success
    const allAlreadyPublished = userErrors.every((e: any) => 
      (e.message || '').toLowerCase().includes('already published')
    )
    if (allAlreadyPublished) return { ok: true }
    return { ok: false, error: userErrors.map((e: any) => e?.message).filter(Boolean).join('; ') || 'publish failed' }
  }

  return { ok: true }
}

function getNumericProductId(productGid: string): number | null {
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

    // 1) Try publishing to the Online Store publication directly (correct channel for Storefront API)
    const publicationId = await getOnlineStorePublicationId(shopifyAccessToken)
    if (publicationId) {
      const publishResult = await publishToOnlineStore(shopifyAccessToken, productId, publicationId)
      if (publishResult.ok) {
        return json({ success: true, productId, method: 'online_store_publication' })
      }
      console.log('publishablePublish failed:', publishResult.error)
      
      // If permissions issue, fall back to REST
      const message = (publishResult.error || '').toLowerCase()
      if (!message.includes('access denied') && !message.includes('write_publications')) {
        return json({ success: false, error: publishResult.error || 'publish_failed' }, { status: 400 })
      }
    } else {
      console.log('Could not find Online Store publication, falling back to REST')
    }

    // 2) Fallback: publish via REST API
    const restResult = await publishViaRest(shopifyAccessToken, productId)
    if (restResult.ok) {
      return json({ success: true, productId, method: 'rest' })
    }
    return json({ success: false, error: restResult.error || 'publish_failed' }, { status: 400 })
  } catch (e) {
    console.error('Publish error:', e)
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
})
