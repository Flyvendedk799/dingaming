import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'
const DELAY_BETWEEN_PRODUCTS_MS = 700

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getOnlineStorePublicationId(
  accessToken: string,
  shopifyAdminUrl: string,
  supabase: any,
): Promise<string | null> {
  const CACHE_KEY = 'shopify_online_store_publication_id'

  try {
    const { data: cached } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', CACHE_KEY)
      .maybeSingle()

    const raw = cached?.value as unknown
    const cachedId =
      typeof raw === 'string' ? raw.replace(/^"|"$/g, '') : (typeof raw === 'number' ? String(raw) : null)

    if (cachedId && cachedId.startsWith('gid://shopify/Publication/')) return cachedId
  } catch {
    // ignore cache errors
  }

  try {
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

    if (!response.ok) return null
    const data = await response.json().catch(() => null)
    const edges: any[] = data?.data?.publications?.edges || []
    const onlineStore = edges.find((e) => (e?.node?.name || '').toLowerCase().includes('online store'))?.node
    const publicationId = onlineStore?.id as string | undefined
    if (!publicationId) return null

    await supabase.from('store_settings').upsert({ key: CACHE_KEY, value: publicationId }, { onConflict: 'key' })
    return publicationId
  } catch (e) {
    console.warn('Failed to fetch publications:', e)
    return null
  }
}

async function publishToOnlineStore(
  accessToken: string,
  shopifyAdminUrl: string,
  productId: string,
  publicationId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
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
          input: [{ publicationId }],
        },
      }),
    })

    const data = await response.json().catch(() => null)
    const userErrors = data?.data?.publishablePublish?.userErrors || []
    if (userErrors.length > 0) {
      const msg = userErrors.map((e: any) => e?.message).filter(Boolean).join('; ')
      return { ok: false, error: msg || 'publishablePublish failed' }
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// Background sync task - runs after response is sent
async function runBackgroundSync(batchSize: number, maxBatches: number) {
  const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  if (!shopifyAccessToken) {
    console.error('[Background Sync] Missing SHOPIFY_ACCESS_TOKEN')
    return
  }

  const onlineStorePublicationId = await getOnlineStorePublicationId(shopifyAccessToken, shopifyAdminUrl, supabase)

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

  let totalSynced = 0
  let totalFailed = 0
  let totalSkipped = 0
  let batchNumber = 0

  console.log(`[Background Sync] Starting - batchSize: ${batchSize}, maxBatches: ${maxBatches}`)

  while (batchNumber < maxBatches) {
    batchNumber++
    
    // Fetch next batch - only products without shopify_product_id AND available
    const { data: products, error: fetchError } = await supabase
      .from('kinguin_products')
      .select('*')
      .is('shopify_product_id', null)
      .eq('is_available', true)
      .order('kinguin_id', { ascending: true })
      .limit(batchSize)

    if (fetchError) {
      console.error(`[Background Sync] Fetch error:`, fetchError)
      break
    }

    if (!products || products.length === 0) {
      console.log(`[Background Sync] No more products to sync. Done!`)
      break
    }

    console.log(`[Background Sync] Batch ${batchNumber}: Processing ${products.length} products`)

    // Process products sequentially
    for (const product of products) {
      try {
         const result = await createOrUpdateShopifyProduct(
           product,
           shopifyAccessToken,
           globalMargin,
           eurToDkkRate,
           supabase,
           onlineStorePublicationId,
         )
        
        if (result.fatalError) {
          console.error(`[Background Sync] Fatal error: ${result.fatalError}`)
          return // Stop on fatal errors (auth issues, etc.)
        }

        if (result.success) {
          totalSynced++
        } else if (result.skipped) {
          totalSkipped++
        } else {
          totalFailed++
          console.error(`[Background Sync] Failed ${product.kinguin_id}: ${result.error}`)
        }

        await delay(DELAY_BETWEEN_PRODUCTS_MS)
      } catch (err) {
        console.error(`[Background Sync] Error syncing ${product.kinguin_id}:`, err)
        totalFailed++
      }
    }

    console.log(`[Background Sync] Batch ${batchNumber} complete. Synced: ${totalSynced}, Failed: ${totalFailed}, Skipped: ${totalSkipped}`)
  }

  // Log final progress to database
  await supabase
    .from('store_settings')
    .upsert({
      key: 'background_sync_last_run',
      value: JSON.stringify({
        timestamp: new Date().toISOString(),
        synced: totalSynced,
        failed: totalFailed,
        skipped: totalSkipped,
        batches: batchNumber
      })
    }, { onConflict: 'key' })

  console.log(`[Background Sync] Finished - ${totalSynced} synced, ${totalFailed} failed, ${totalSkipped} skipped in ${batchNumber} batches`)
}

async function createOrUpdateShopifyProduct(
  product: any,
  accessToken: string,
  globalMargin: number,
  eurToDkkRate: number,
  supabase: any,
  onlineStorePublicationId: string | null,
): Promise<{ success: boolean; shopifyId?: string; fatalError?: string; skipped?: boolean; error?: string }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const margin = product.margin_percent ?? globalMargin
  const priceWithMargin = product.sell_price * (1 + margin / 100)
  const priceInDkk = priceWithMargin * eurToDkkRate

  const regionTag = product.region_id === 3 ? 'Worldwide' : 'Europe'
  const cleanTitle = (product.name || 'Untitled Product').substring(0, 255)
  const handle = `kinguin-${product.kinguin_id}`
  const sku = `KINGUIN-${product.kinguin_id}`

  // First check if product already exists by SKU
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

    const searchData = await searchResponse.json()
    const existingProduct = searchData?.data?.products?.edges?.[0]?.node

    if (existingProduct) {
      // Product already exists - just update our database with the Shopify ID
      await supabase
        .from('kinguin_products')
        .update({
          shopify_product_id: existingProduct.id,
          last_synced_to_shopify: new Date().toISOString(),
        })
        .eq('kinguin_id', product.kinguin_id)

      // Ensure product is visible in Storefront (best-effort)
      if (onlineStorePublicationId) {
        const publishResult = await publishToOnlineStore(accessToken, shopifyAdminUrl, existingProduct.id, onlineStorePublicationId)
        if (!publishResult.ok) {
          console.warn(`Publish failed for ${existingProduct.id}:`, publishResult.error)
        }
      }

      return { success: true, shopifyId: existingProduct.id, skipped: false }
    }

    // Product doesn't exist - create it using productSet (supports variants in 2025-07)
    const mutation = `
      mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
        productSet(input: $input, synchronous: $synchronous) {
          product { id }
          userErrors { field message code }
        }
      }
    `

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
            status: 'ACTIVE',
            productOptions: [{
              name: 'Title',
              values: [{ name: 'Default Title' }]
            }],
            variants: [{
              optionValues: [{ optionName: 'Title', name: 'Default Title' }],
              price: priceInDkk.toFixed(2),
              sku: sku,
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

    const text = await response.text()
    let data: any = null
    try { 
      data = JSON.parse(text) 
    } catch { 
      return { success: false, error: `Non-JSON response (HTTP ${response.status}): ${text.substring(0, 200)}` }
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, fatalError: `Auth error: ${response.status}` }
      }
      return { success: false, error: `HTTP ${response.status}: ${text.substring(0, 200)}` }
    }

    const topErrors = data?.errors
    if (topErrors) {
      const msg = Array.isArray(topErrors) ? topErrors.map((e: any) => e?.message).join('; ') : String(topErrors)
      if (msg.toUpperCase().includes('ACCESS_DENIED') || msg.toUpperCase().includes('THROTTLED')) {
        return { success: false, fatalError: msg }
      }
      return { success: false, error: msg }
    }

    const userErrors = data?.data?.productSet?.userErrors
    if (userErrors?.length > 0) {
      const msg = userErrors.map((e: any) => `${e?.field}: ${e?.message}`).join('; ')
      
      // If handle is taken, try to find and link the existing product
      if (msg.toLowerCase().includes('handle') && (msg.toLowerCase().includes('taken') || msg.toLowerCase().includes('already in use'))) {
        const handle = `kinguin-${product.kinguin_id}`
        const searchResponse = await fetch(shopifyAdminUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({
            query: `query getByHandle($handle: String!) { productByHandle(handle: $handle) { id } }`,
            variables: { handle }
          }),
        })
        
        const searchData = await searchResponse.json().catch(() => null)
        const existingId = searchData?.data?.productByHandle?.id
        
        if (existingId) {
          // Link existing product
          await supabase
            .from('kinguin_products')
            .update({
              shopify_product_id: existingId,
              last_synced_to_shopify: new Date().toISOString(),
            })
            .eq('kinguin_id', product.kinguin_id)
          
          return { success: true, shopifyId: existingId }
        }
        
        return { success: false, skipped: true, error: 'Handle exists but could not find product' }
      }
      
      if (msg.toUpperCase().includes('ACCESS_DENIED')) {
        return { success: false, fatalError: msg }
      }
      return { success: false, error: msg }
    }

    const createdProduct = data?.data?.productSet?.product
    if (createdProduct?.id) {
      await supabase
        .from('kinguin_products')
        .update({
          shopify_product_id: createdProduct.id,
          last_synced_to_shopify: new Date().toISOString(),
        })
        .eq('kinguin_id', product.kinguin_id)

      // Ensure product is visible in Storefront (best-effort)
      if (onlineStorePublicationId) {
        const publishResult = await publishToOnlineStore(accessToken, shopifyAdminUrl, createdProduct.id, onlineStorePublicationId)
        if (!publishResult.ok) {
          console.warn(`Publish failed for ${createdProduct.id}:`, publishResult.error)
        }
      }

      // Add image async (fire and forget)
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

// Check current progress
async function getProgress() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { count: remaining } = await supabase
    .from('kinguin_products')
    .select('id', { count: 'exact', head: true })
    .is('shopify_product_id', null)
    .eq('is_available', true)

  const { count: synced } = await supabase
    .from('kinguin_products')
    .select('id', { count: 'exact', head: true })
    .not('shopify_product_id', 'is', null)

  const { data: lastRun } = await supabase
    .from('store_settings')
    .select('value')
    .eq('key', 'background_sync_last_run')
    .single()

  return {
    remaining: remaining || 0,
    synced: synced || 0,
    lastRun: lastRun?.value || null,
    done: (remaining || 0) === 0
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'start'

    if (action === 'status') {
      const progress = await getProgress()
      return json(progress)
    }

    if (action === 'start') {
      const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
      
      if (!shopifyAccessToken) {
        return json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' }, { status: 500 })
      }

      // Get current progress first
      const progress = await getProgress()
      
      if (progress.done) {
        return json({ 
          success: true, 
          message: 'All products are already synced!',
          ...progress
        })
      }

      // Parse batch parameters
      const batchSize = Math.min(Math.max(parseInt(url.searchParams.get('batchSize') || '50'), 10), 100)
      const maxBatches = Math.min(Math.max(parseInt(url.searchParams.get('maxBatches') || '10'), 1), 100)

      // Start background sync using waitUntil
      // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(runBackgroundSync(batchSize, maxBatches))

      return json({
        success: true,
        message: `Background sync started! Processing up to ${batchSize * maxBatches} products.`,
        batchSize,
        maxBatches,
        estimatedProducts: batchSize * maxBatches,
        currentProgress: progress
      })
    }

    return json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return json({ error: errorMessage }, { status: 500 })
  }
})
