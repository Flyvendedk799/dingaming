import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-01'

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

    if (shopifyAccessToken.startsWith('shpss_')) {
      return json(
        { error: 'Access denied: SHOPIFY_ACCESS_TOKEN looks like a Storefront token. Please use an Admin API token.' },
        { status: 401 },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const limitRaw = parseInt(url.searchParams.get('limit') || '500')
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 500

    console.log(`Syncing DB products to Shopify - limit ${limit}`)

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
        reconciled: 0,
        failed: 0,
        total: 0,
        remaining: 0,
        done: true,
        message: 'No more products to sync',
      })
    }

    console.log(`Found ${products.length} products to sync`)

    // BATCH STEP 1: Check which products already exist in Shopify by fetching all handles starting with 'kinguin-'
    // This dramatically reduces API calls by doing one bulk query instead of N individual queries
    const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
    
    // Build a map of kinguin_id to product for quick lookup
    const productsByKinguinId = new Map<number, any>()
    for (const p of products) {
      productsByKinguinId.set(p.kinguin_id, p)
    }
    
    // Get SKUs we're looking for
    const skusToCheck = products.map(p => `KINGUIN-${p.kinguin_id}`)
    
    // Batch check existing products - search in chunks to avoid query limits
    const existingProducts = new Map<string, string>() // SKU -> shopify_product_id
    const chunkSize = 50
    
    for (let i = 0; i < skusToCheck.length; i += chunkSize) {
      const chunk = skusToCheck.slice(i, i + chunkSize)
      const searchQuery = chunk.map(sku => `sku:${sku}`).join(' OR ')
      
      const searchResponse = await fetch(shopifyAdminUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyAccessToken,
        },
        body: JSON.stringify({
          query: `
            query searchProducts($query: String!) {
              products(first: 50, query: $query) {
                edges {
                  node {
                    id
                    variants(first: 1) {
                      edges {
                        node { sku }
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: { query: searchQuery }
        }),
      })
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        const edges = searchData?.data?.products?.edges || []
        for (const edge of edges) {
          const sku = edge?.node?.variants?.edges?.[0]?.node?.sku
          if (sku && edge?.node?.id) {
            existingProducts.set(sku, edge.node.id)
          }
        }
      }
      
      // Small delay between search batches
      if (i + chunkSize < skusToCheck.length) {
        await delay(200)
      }
    }
    
    console.log(`Found ${existingProducts.size} products already in Shopify`)
    
    // BATCH STEP 2: Reconcile existing products in our database
    const reconcileUpdates: { kinguin_id: number; shopify_product_id: string }[] = []
    const productsToCreate: any[] = []
    
    for (const product of products) {
      const sku = `KINGUIN-${product.kinguin_id}`
      const existingId = existingProducts.get(sku)
      
      if (existingId) {
        reconcileUpdates.push({ kinguin_id: product.kinguin_id, shopify_product_id: existingId })
      } else {
        productsToCreate.push(product)
      }
    }
    
    // Bulk update reconciled products
    if (reconcileUpdates.length > 0) {
      const updatePromises = reconcileUpdates.map(u =>
        supabase
          .from('kinguin_products')
          .update({
            shopify_product_id: u.shopify_product_id,
            last_synced_to_shopify: new Date().toISOString(),
          })
          .eq('kinguin_id', u.kinguin_id)
      )
      await Promise.all(updatePromises)
      console.log(`Reconciled ${reconcileUpdates.length} existing products`)
    }
    
    // BATCH STEP 3: Create new products with concurrent requests (respecting rate limits)
    let synced = 0
    let failed = 0
    const concurrency = 4 // Process 4 products at a time
    
    for (let i = 0; i < productsToCreate.length; i += concurrency) {
      const batch = productsToCreate.slice(i, i + concurrency)
      
      const results = await Promise.all(
        batch.map(product => createProduct(product, shopifyAccessToken, globalMargin, eurToDkkRate, supabase, shopifyAdminUrl))
      )
      
      for (const result of results) {
        if (result.success) synced++
        else {
          failed++
          if (result.error) console.error(result.error)
        }
      }
      
      // Delay between batches to respect rate limits (~2 req/sec per API)
      if (i + concurrency < productsToCreate.length) {
        await delay(500)
      }
    }

    // Re-check remaining
    const { count: remaining } = await supabase
      .from('kinguin_products')
      .select('id', { count: 'exact', head: true })
      .is('shopify_product_id', null)

    const remainingCount = typeof remaining === 'number' ? remaining : null

    console.log(`Finished: ${synced} new, ${reconcileUpdates.length} reconciled, ${failed} failed. Remaining: ${remainingCount ?? 'unknown'}`)

    return json({
      success: true,
      synced,
      reconciled: reconcileUpdates.length,
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

async function createProduct(
  product: any,
  accessToken: string,
  globalMargin: number,
  eurToDkkRate: number,
  supabase: any,
  shopifyAdminUrl: string,
): Promise<{ success: boolean; shopifyId?: string; error?: string }> {
  const sku = `KINGUIN-${product.kinguin_id}`
  const margin = product.margin_percent ?? globalMargin
  const priceWithMargin = product.sell_price * (1 + margin / 100)
  const priceInDkk = priceWithMargin * eurToDkkRate
  const regionTag = product.region_id === 3 ? 'Worldwide' : 'Europe'
  const cleanTitle = (product.name || 'Untitled Product').substring(0, 255)
  const handle = `kinguin-${product.kinguin_id}`

  const mutation = `
    mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
      productSet(input: $input, synchronous: $synchronous) {
        product { id }
        userErrors { field message }
      }
    }
  `

  try {
    const createResponse = await fetch(shopifyAdminUrl, {
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
            productOptions: [{ name: 'Title', values: [{ name: 'Default Title' }] }],
            variants: [{
              optionValues: [{ optionName: 'Title', name: 'Default Title' }],
              price: priceInDkk.toFixed(2),
              sku,
              inventoryPolicy: 'CONTINUE',
            }],
            metafields: [
              { namespace: 'kinguin', key: 'kinguin_id', value: product.kinguin_id.toString(), type: 'number_integer' },
              { namespace: 'kinguin', key: 'original_price_eur', value: product.sell_price.toString(), type: 'number_decimal' },
              { namespace: 'kinguin', key: 'margin_percent', value: margin.toString(), type: 'number_decimal' },
            ],
          },
        },
      }),
    })

    const createText = await createResponse.text()
    let createData: any = null
    try { 
      createData = JSON.parse(createText) 
    } catch { 
      return { success: false, error: `Non-JSON: ${createText.substring(0, 100)}` }
    }

    if (!createResponse.ok) {
      return { success: false, error: `HTTP ${createResponse.status}` }
    }

    if (createData?.errors) {
      const msg = Array.isArray(createData.errors) 
        ? createData.errors.map((e: any) => e?.message).join('; ') 
        : String(createData.errors)
      return { success: false, error: msg }
    }

    const userErrors = createData?.data?.productSet?.userErrors
    if (userErrors?.length > 0) {
      const msg = userErrors.map((e: any) => `${e?.field}: ${e?.message}`).join('; ')
      return { success: false, error: msg }
    }

    const createdProduct = createData?.data?.productSet?.product
    if (createdProduct?.id) {
      await supabase
        .from('kinguin_products')
        .update({
          shopify_product_id: createdProduct.id,
          last_synced_to_shopify: new Date().toISOString(),
        })
        .eq('kinguin_id', product.kinguin_id)

      // Add image async (fire and forget)
      if (product.cover_image) {
        addProductImageAsync(createdProduct.id, product.cover_image, cleanTitle, accessToken, shopifyAdminUrl)
      }

      return { success: true, shopifyId: createdProduct.id }
    }

    return { success: false, error: 'No product ID in response' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function addProductImageAsync(productId: string, imageUrl: string, altText: string, accessToken: string, shopifyAdminUrl: string): void {
  const mutation = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { ... on MediaImage { id } }
        mediaUserErrors { field message }
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
        media: [{ originalSource: imageUrl, alt: altText, mediaContentType: 'IMAGE' }],
      },
    }),
  }).catch((err) => console.error(`Image upload failed for ${productId}:`, err))
}
