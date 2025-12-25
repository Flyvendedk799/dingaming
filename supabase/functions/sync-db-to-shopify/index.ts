import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

// Shopify rate limit: ~2 requests/second for mutations - use 500ms to be safe
const DELAY_BETWEEN_PRODUCTS_MS = 500

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function extractShopifyTopError(data: any): string | undefined {
  const topErrors = data?.errors

  if (Array.isArray(topErrors)) {
    return topErrors.map((e: any) => e?.message ?? String(e)).join('; ')
  }

  if (typeof topErrors === 'string') {
    return topErrors
  }

  if (topErrors) {
    try {
      return JSON.stringify(topErrors)
    } catch {
      return String(topErrors)
    }
  }

  return undefined
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

    // Common pitfall: `shpss_...` is a Storefront token, not an Admin API token.
    // Storefront tokens cannot create/update products.
    if (shopifyAccessToken.startsWith('shpss_')) {
      return json(
        {
          error:
            'Access denied: SHOPIFY_ACCESS_TOKEN looks like a Storefront token (shpss_...). Please use an Admin API access token (shpca_/shpat_) with at least read_products + write_products scopes.',
        },
        { status: 401 },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const limitRaw = parseInt(url.searchParams.get('limit') || '100')
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 250) : 100

    console.log(`Syncing DB products to Shopify (sequential) - limit ${limit}`)

    // Get settings
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

    // Fetch products from local DB that are NOT yet on Shopify
    // NOTE: We intentionally do NOT filter by `is_available` here so the sync truly covers all DB products.
    const { data: products, error: fetchError } = await supabase
      .from('kinguin_products')
      .select('*')
      .is('shopify_product_id', null)
      .order('kinguin_id', { ascending: true })
      .limit(limit)

    if (fetchError) {
      throw fetchError
    }

    if (!products || products.length === 0) {
      return json({
        success: true,
        synced: 0,
        failed: 0,
        total: 0,
        remaining: 0,
        done: true,
        message: 'No more products to sync',
      })
    }

    console.log(`Found ${products.length} products to sync sequentially`) 

    let shopifySynced = 0
    let failed = 0

    // Process sequentially with delay to respect rate limits
    for (const product of products) {
      try {
        const result = await createOrUpdateShopifyProduct(product, shopifyAccessToken, globalMargin, eurToDkkRate, supabase)

        if (result.fatalError) {
          throw new Error(result.fatalError)
        }

        if (result.success) {
          shopifySynced++
        } else {
          failed++
        }

        await delay(DELAY_BETWEEN_PRODUCTS_MS)
      } catch (err) {
        console.error(`Failed to sync product ${product.kinguin_id}:`, err)
        failed++
      }
    }

    // Re-check remaining after this batch so the caller can run until it truly reaches 0.
    const { count: remaining, error: remainingError } = await supabase
      .from('kinguin_products')
      .select('id', { count: 'exact', head: true })
      .is('shopify_product_id', null)

    if (remainingError) {
      console.error('Failed to count remaining products:', remainingError)
    }

    const remainingCount = typeof remaining === 'number' ? remaining : null

    console.log(`Finished batch: ${shopifySynced} synced, ${failed} failed. Remaining: ${remainingCount ?? 'unknown'}`)

    return json({
      success: true,
      synced: shopifySynced,
      failed,
      total: products.length,
      remaining: remainingCount,
      done: remainingCount === 0,
    })
  } catch (error) {
    console.error('Sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return json({ error: errorMessage }, { status: 500 })
  }
})

async function createOrUpdateShopifyProduct(
  product: any,
  accessToken: string,
  globalMargin: number,
  eurToDkkRate: number,
  supabase: any,
): Promise<{ success: boolean; shopifyId?: string; fatalError?: string }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  // Calculate final price in DKK
  const margin = product.margin_percent ?? globalMargin
  const priceWithMargin = product.sell_price * (1 + margin / 100)
  const priceInDkk = priceWithMargin * eurToDkkRate

  const regionTag = product.region_id === 3 ? 'Worldwide' : 'Europe'
  const cleanTitle = (product.name || 'Untitled Product').substring(0, 255)
  const handle = `kinguin-${product.kinguin_id}`

  const mutation = `
    mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
      productSet(input: $input, synchronous: $synchronous) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const response = await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          synchronous: true,
          input: {
            handle,
            title: cleanTitle,
            descriptionHtml: product.description || '',
            vendor: 'DinGaming',
            productType: 'Game Key',
            tags: [product.platform || 'Steam', regionTag, 'Digital', 'DKK'],
            status: product.is_available ? 'ACTIVE' : 'DRAFT',
            productOptions: [
              {
                name: 'Title',
                values: [{ name: 'Default Title' }],
              },
            ],
            variants: [
              {
                optionValues: [{ optionName: 'Title', name: 'Default Title' }],
                price: priceInDkk.toFixed(2),
                sku: `KINGUIN-${product.kinguin_id}`,
                inventoryPolicy: 'CONTINUE',
              },
            ],
            metafields: [
              {
                namespace: 'kinguin',
                key: 'kinguin_id',
                value: product.kinguin_id.toString(),
                type: 'number_integer',
              },
              {
                namespace: 'kinguin',
                key: 'original_price_eur',
                value: product.sell_price.toString(),
                type: 'number_decimal',
              },
              {
                namespace: 'kinguin',
                key: 'margin_percent',
                value: margin.toString(),
                type: 'number_decimal',
              },
            ],
          },
        },
      }),
    })

    const text = await response.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      // Shopify should always return JSON; if it doesn't, treat as fatal.
      return {
        success: false,
        fatalError: `Shopify returned non-JSON response (HTTP ${response.status})`,
      }
    }

    if (!response.ok) {
      const topError = extractShopifyTopError(data)
      const msg = topError ?? `Shopify HTTP ${response.status}`

      // Unauthorized / forbidden means the token/scopes are wrong; no point retrying.
      if (response.status === 401 || response.status === 403) {
        return { success: false, fatalError: msg }
      }

      console.error(`Shopify HTTP error for ${product.kinguin_id}:`, { status: response.status, msg, body: data })
      return { success: false }
    }

    const topError = extractShopifyTopError(data)
    if (topError) {
      console.error(`Shopify API error ${product.kinguin_id}:`, topError)
      // ACCESS_DENIED at this level usually means missing scopes.
      if (String(topError).toUpperCase().includes('ACCESS_DENIED')) {
        return { success: false, fatalError: topError }
      }
      return { success: false }
    }

    const userErrors = data?.data?.productSet?.userErrors
    if (Array.isArray(userErrors) && userErrors.length > 0) {
      const msg = userErrors.map((e: any) => e?.message ?? JSON.stringify(e)).join('; ')
      console.error(`Shopify UserError ${product.kinguin_id}:`, msg)
      if (String(msg).toUpperCase().includes('ACCESS_DENIED')) {
        return { success: false, fatalError: msg }
      }
      return { success: false }
    }

    const createdProduct = data?.data?.productSet?.product
    if (createdProduct?.id) {
      // Update local DB with Shopify product ID
      await supabase
        .from('kinguin_products')
        .update({
          shopify_product_id: createdProduct.id,
          last_synced_to_shopify: new Date().toISOString(),
        })
        .eq('kinguin_id', product.kinguin_id)

      // Add image (fire and forget)
      if (product.cover_image) {
        addProductImageAsync(createdProduct.id, product.cover_image, cleanTitle, accessToken)
      }

      return { success: true, shopifyId: createdProduct.id }
    }

    return { success: false }
  } catch (err) {
    console.error(`Failed ${product.kinguin_id}:`, err)
    return { success: false }
  }
}

function addProductImageAsync(productId: string, imageUrl: string, altText: string, accessToken: string): void {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const mutation = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage {
            id
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `

  fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        productId,
        media: [
          {
            originalSource: imageUrl,
            alt: altText,
            mediaContentType: 'IMAGE',
          },
        ],
      },
    }),
  }).catch((err) => console.error(`Image upload failed for ${productId}:`, err))
}
