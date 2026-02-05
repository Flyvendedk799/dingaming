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

async function getPublicationIds(accessToken: string, shopifyAdminUrl: string, supabase: any): Promise<{ ids: string[] | null; error?: string }> {
  const CACHE_KEY = 'shopify_publication_ids'

  try {
    const { data: cached } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', CACHE_KEY)
      .maybeSingle()

    const raw = cached?.value as unknown
    const cachedId = typeof raw === 'string'
      ? raw.replace(/^"|"$/g, '')
      : (typeof raw === 'number' ? String(raw) : null)

    if (Array.isArray(raw)) {
      const ids = raw.filter((v) => typeof v === 'string' && v.startsWith('gid://shopify/Publication/')) as string[]
       if (ids.length > 0) return { ids }
    }

     if (cachedId && cachedId.startsWith('gid://shopify/Publication/')) return { ids: [cachedId] }
  } catch {
    // ignore
  }

  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: `
        query Publications($first: Int!) {
          publications(first: $first) {
            edges { node { id name } }
          }
        }
      `,
      variables: { first: 50 },
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return { ids: null, error: text || `http_${response.status}` }
  }

  const data = await response.json().catch(() => null)
  const gqlErrors: any[] = data?.errors || []
  if (gqlErrors.length > 0) {
    const message = gqlErrors.map((e) => e?.message).filter(Boolean).join('; ') || 'graphql_error'
    return { ids: null, error: message }
  }

  const edges: any[] = data?.data?.publications?.edges || []
  const ids = edges
    .map((e) => e?.node?.id)
    .filter((id) => typeof id === 'string' && id.startsWith('gid://shopify/Publication/')) as string[]

  if (ids.length === 0) return { ids: null, error: 'publications_not_found' }

  try {
    await supabase.from('store_settings').upsert({ key: CACHE_KEY, value: ids }, { onConflict: 'key' })
  } catch {
    // ignore cache write errors
  }

  return { ids }
}

async function publishToPublications(accessToken: string, shopifyAdminUrl: string, productId: string, publicationIds: string[]) {
  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: `
        mutation Publish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            userErrors { field message }
          }
        }
      `,
        variables: {
          id: productId,
          input: publicationIds.map((publicationId) => ({ publicationId })),
        },
    }),
  })

  const data = await response.json().catch(() => null)
  const userErrors = data?.data?.publishablePublish?.userErrors || []
  if (userErrors.length > 0) {
    return { ok: false, error: userErrors.map((e: any) => e?.message).filter(Boolean).join('; ') || 'publish failed' }
  }

  return { ok: response.ok }
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
    const publicationLookup = await getPublicationIds(shopifyAccessToken, shopifyAdminUrl, supabase)
    const publicationIds = publicationLookup.ids
    if (!publicationIds || publicationIds.length === 0) {
      return json({ success: false, error: publicationLookup.error || 'publications_not_found' }, { status: 500 })
    }

    const publishResult = await publishToPublications(shopifyAccessToken, shopifyAdminUrl, productId, publicationIds)
    if (!publishResult.ok) {
      return json({ success: false, error: publishResult.error || 'publish_failed' }, { status: 400 })
    }

    return json({ success: true, productId, publicationIds })
  } catch (e) {
    console.error('Publish error:', e)
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
})
