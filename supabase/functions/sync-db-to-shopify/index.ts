import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-01'

// Shopify rate limit: ~2 requests/second for queries - use 600ms to be safe
const DELAY_BETWEEN_PRODUCTS_MS = 600

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
        {
          error: 'Access denied: SHOPIFY_ACCESS_TOKEN looks like a Storefront token (shpss_...). Please use an Admin API access token (shpca_/shpat_).',
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

    let synced = 0
    let reconciled = 0
    let failed = 0

    // Process sequentially with delay to respect rate limits
    for (const product of products) {
      try {
        const result = await syncProduct(product, shopifyAccessToken, globalMargin, eurToDkkRate, supabase)

        if (result.fatalError) {
          console.error(`Fatal error: ${result.fatalError}`)
          break // Stop on fatal errors
        }

        if (result.reconciled) {
          reconciled++
        } else if (result.success) {
          synced++
        } else {
          failed++
          if (result.error) {
            console.error(`Failed ${product.kinguin_id}: ${result.error}`)
          }
        }

        await delay(DELAY_BETWEEN_PRODUCTS_MS)
      } catch (err) {
        console.error(`Failed to sync product ${product.kinguin_id}:`, err)
        failed++
      }
    }

    // Re-check remaining
    const { count: remaining } = await supabase
      .from('kinguin_products')
      .select('id', { count: 'exact', head: true })
      .is('shopify_product_id', null)

    const remainingCount = typeof remaining === 'number' ? remaining : null

    console.log(`Finished: ${synced} new, ${reconciled} reconciled, ${failed} failed. Remaining: ${remainingCount ?? 'unknown'}`)

    return json({
      success: true,
      synced,
      reconciled,
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

async function syncProduct(
  product: any,
  accessToken: string,
  globalMargin: number,
  eurToDkkRate: number,
  supabase: any,
): Promise<{ success: boolean; reconciled?: boolean; shopifyId?: string; fatalError?: string; error?: string }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  const sku = `KINGUIN-${product.kinguin_id}`

  // STEP 1: Check if product already exists in Shopify by SKU
  const searchQuery = `
    query searchProduct($query: String!) {
      products(first: 1, query: $query) {
        edges {
          node {
            id
            handle
          }
        }
      }
    }
  `

  try {
    const searchResponse = await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: searchQuery,
        variables: { query: `sku:${sku}` }
      }),
    })

    if (!searchResponse.ok) {
      if (searchResponse.status === 401 || searchResponse.status === 403) {
        return { success: false, fatalError: `Auth error: ${searchResponse.status}` }
      }
      return { success: false, error: `Search failed: HTTP ${searchResponse.status}` }
    }

    const searchData = await searchResponse.json()
    
    if (searchData?.errors) {
      const msg = Array.isArray(searchData.errors) 
        ? searchData.errors.map((e: any) => e?.message).join('; ') 
        : String(searchData.errors)
      return { success: false, error: `Search error: ${msg}` }
    }

    const existingProduct = searchData?.data?.products?.edges?.[0]?.node

    if (existingProduct) {
      // Product exists - reconcile by updating our database
      await supabase
        .from('kinguin_products')
        .update({
          shopify_product_id: existingProduct.id,
          last_synced_to_shopify: new Date().toISOString(),
        })
        .eq('kinguin_id', product.kinguin_id)

      return { success: true, reconciled: true, shopifyId: existingProduct.id }
    }

    // STEP 2: Product doesn't exist - create it
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
      return { success: false, error: `Non-JSON response: ${createText.substring(0, 100)}` }
    }

    if (!createResponse.ok) {
      if (createResponse.status === 401 || createResponse.status === 403) {
        return { success: false, fatalError: `Auth error: ${createResponse.status}` }
      }
      return { success: false, error: `Create HTTP ${createResponse.status}` }
    }

    if (createData?.errors) {
      const msg = Array.isArray(createData.errors) 
        ? createData.errors.map((e: any) => e?.message).join('; ') 
        : String(createData.errors)
      if (msg.toUpperCase().includes('THROTTLED')) {
        return { success: false, fatalError: msg }
      }
      return { success: false, error: msg }
    }

    const userErrors = createData?.data?.productSet?.userErrors
    if (userErrors?.length > 0) {
      const msg = userErrors.map((e: any) => `${e?.field}: ${e?.message}`).join('; ')
      
      // If handle is taken, try to find existing product by handle
      if (msg.includes('Handle') && msg.includes('already')) {
        // Search by handle instead
        const handleSearchResponse = await fetch(shopifyAdminUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({
            query: searchQuery,
            variables: { query: `handle:${handle}` }
          }),
        })
        
        const handleSearchData = await handleSearchResponse.json()
        const existingByHandle = handleSearchData?.data?.products?.edges?.[0]?.node
        
        if (existingByHandle) {
          await supabase
            .from('kinguin_products')
            .update({
              shopify_product_id: existingByHandle.id,
              last_synced_to_shopify: new Date().toISOString(),
            })
            .eq('kinguin_id', product.kinguin_id)

          return { success: true, reconciled: true, shopifyId: existingByHandle.id }
        }
      }
      
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

      // Add image async
      if (product.cover_image) {
        addProductImageAsync(createdProduct.id, product.cover_image, cleanTitle, accessToken)
      }

      return { success: true, shopifyId: createdProduct.id }
    }

    return { success: false, error: 'No product ID in response' }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, error: errorMsg }
  }
}

function addProductImageAsync(productId: string, imageUrl: string, altText: string, accessToken: string): void {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

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
