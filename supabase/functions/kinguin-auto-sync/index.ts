import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KINGUIN_API_URL = 'https://gateway.kinguin.net/esa/api/v1'
const ALLOWED_REGIONS = [3, 1] // Worldwide, Europe
const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'
const DELAY_BETWEEN_SHOPIFY_CALLS_MS = 600

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const kinguinApiKey = Deno.env.get('KINGUIN_API_KEY')
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    
    if (!kinguinApiKey) {
      throw new Error('KINGUIN_API_KEY not configured')
    }

    // Check if auto-sync is enabled
    const { data: autoSyncSetting } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'auto_sync_enabled')
      .maybeSingle()

    if (autoSyncSetting?.value === false) {
      console.log('Auto-sync is disabled, skipping')
      return new Response(JSON.stringify({ skipped: true, reason: 'Auto-sync disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check sync lock to prevent overlapping runs
    const { data: lockData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'sync_lock')
      .maybeSingle()

    const lock = lockData?.value || { locked: false }
    
    if (lock.locked) {
      const lockAge = Date.now() - new Date(lock.started_at).getTime()
      const MAX_LOCK_AGE_MS = 30 * 60 * 1000 // 30 minutes max

      if (lockAge < MAX_LOCK_AGE_MS) {
        console.log(`Sync already in progress (started ${Math.round(lockAge / 1000)}s ago), skipping`)
        return new Response(JSON.stringify({ 
          skipped: true, 
          reason: 'Sync already in progress',
          started_at: lock.started_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        console.log('Stale lock detected (>30 min), proceeding anyway')
      }
    }

    // Acquire lock
    await supabase
      .from('store_settings')
      .update({ 
        value: { 
          locked: true, 
          started_at: new Date().toISOString(),
          function: 'kinguin-auto-sync'
        }
      })
      .eq('key', 'sync_lock')

    // Get settings
    const { data: settings } = await supabase
      .from('store_settings')
      .select('key, value')
      .in('key', ['last_kinguin_sync_timestamp', 'global_margin_percent', 'eur_to_dkk_rate'])

    let lastSyncTimestamp = '2020-01-01T00:00:00Z'
    let globalMargin = 30
    let eurToDkkRate = 7.46

    if (settings) {
      for (const s of settings) {
        if (s.key === 'last_kinguin_sync_timestamp') {
          lastSyncTimestamp = String(s.value).replace(/"/g, '')
        } else if (s.key === 'global_margin_percent') {
          globalMargin = Number(s.value) || 30
        } else if (s.key === 'eur_to_dkk_rate') {
          eurToDkkRate = Number(s.value) || 7.46
        }
      }
    }

    console.log(`Starting incremental sync. Last sync: ${lastSyncTimestamp}`)

    let totalNewProducts = 0
    let totalUpdatedProducts = 0
    let totalShopifySynced = 0
    let newestTimestamp = lastSyncTimestamp
    const limit = 100
    const maxPages = 50 // Safety limit

    // Fetch products sorted by updatedAt DESC, stop when we hit old products
    for (const regionId of ALLOWED_REGIONS) {
      let page = 1
      let foundOldProducts = false

      while (page <= maxPages && !foundOldProducts) {
        const kinguinUrl = `${KINGUIN_API_URL}/products?regionId=${regionId}&page=${page}&limit=${limit}&sortBy=updatedAt&sortType=desc`
        
        console.log(`Fetching region ${regionId}, page ${page}`)
        
        const response = await fetch(kinguinUrl, {
          headers: {
            'X-Api-Key': kinguinApiKey,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.error(`Kinguin API error: ${response.status}`)
          break
        }

        const data = await response.json()
        const products = data.results || data.products || data || []
        
        if (products.length === 0) {
          break
        }

        for (const product of products) {
          const productUpdatedAt = product.updatedAt || product.updated_at || '2020-01-01T00:00:00Z'
          
          // If this product is older than our last sync, we're done with this region
          if (new Date(productUpdatedAt) <= new Date(lastSyncTimestamp)) {
            foundOldProducts = true
            console.log(`Found old product (${productUpdatedAt}), stopping region ${regionId}`)
            break
          }

          // Track newest timestamp
          if (new Date(productUpdatedAt) > new Date(newestTimestamp)) {
            newestTimestamp = productUpdatedAt
          }

          // Check if product exists
          const { data: existing } = await supabase
            .from('kinguin_products')
            .select('id, shopify_product_id, margin_percent')
            .eq('kinguin_id', product.kinguinId)
            .maybeSingle()

          const price = parseFloat(product.price || 0)
          const qty = product.qty || 0
          
          const productData = {
            kinguin_id: product.kinguinId,
            product_id: product.productId,
            name: product.name,
            description: product.description,
            cover_image: product.coverImage || product.images?.cover?.url,
            screenshots: product.screenshots?.map((s: any) => s.url) || [],
            original_price: price,
            sell_price: price,
            platform: product.platform,
            genres: product.genres || [],
            release_date: product.releaseDate,
            region_id: product.regionId,
            region_name: product.region?.name || (product.regionId === 3 ? 'Worldwide' : 'Europe'),
            is_available: qty > 0,
            qty: qty,
            updated_at: new Date().toISOString()
          }

          const { error } = await supabase
            .from('kinguin_products')
            .upsert(productData, { onConflict: 'kinguin_id' })

          if (error) {
            console.error(`Error upserting product ${product.kinguinId}:`, error)
            continue
          }

          if (existing) {
            totalUpdatedProducts++
            
            // Update Shopify if linked
            if (existing.shopify_product_id && shopifyAccessToken) {
              const margin = existing.margin_percent ?? globalMargin
              const priceInDkk = price * (1 + margin / 100) * eurToDkkRate
              
              await updateShopifyPrice(existing.shopify_product_id, priceInDkk, qty > 0, shopifyAccessToken)
              await delay(DELAY_BETWEEN_SHOPIFY_CALLS_MS)
            }
          } else {
            totalNewProducts++
            
            // Create in Shopify for new products
            if (shopifyAccessToken) {
              const shopifyId = await createShopifyProduct(productData, globalMargin, eurToDkkRate, shopifyAccessToken)
              
              if (shopifyId) {
                await supabase
                  .from('kinguin_products')
                  .update({ 
                    shopify_product_id: shopifyId,
                    last_synced_to_shopify: new Date().toISOString()
                  })
                  .eq('kinguin_id', product.kinguinId)
                
                totalShopifySynced++
              }
              
              await delay(DELAY_BETWEEN_SHOPIFY_CALLS_MS)
            }
          }
        }

        if (products.length < limit) {
          break
        }
        
        page++
      }
    }

    // Update last sync timestamp
    await supabase
      .from('store_settings')
      .update({ value: JSON.stringify(newestTimestamp) })
      .eq('key', 'last_kinguin_sync_timestamp')

    // Release lock
    await supabase
      .from('store_settings')
      .update({ value: { locked: false, started_at: null, function: null } })
      .eq('key', 'sync_lock')

    console.log(`Sync complete. New: ${totalNewProducts}, Updated: ${totalUpdatedProducts}, Shopify: ${totalShopifySynced}`)

    return new Response(JSON.stringify({
      success: true,
      newProducts: totalNewProducts,
      updatedProducts: totalUpdatedProducts,
      shopifySynced: totalShopifySynced,
      lastSyncTimestamp: newestTimestamp
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Auto-sync error:', error)
    
    // Release lock on error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase
        .from('store_settings')
        .update({ value: { locked: false, started_at: null, function: null } })
        .eq('key', 'sync_lock')
    } catch (e) {
      console.error('Failed to release lock:', e)
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function createShopifyProduct(
  product: any,
  globalMargin: number,
  eurToDkkRate: number,
  accessToken: string
): Promise<string | null> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  const priceInDkk = product.sell_price * (1 + globalMargin / 100) * eurToDkkRate
  const handle = `kinguin-${product.kinguin_id}`
  const cleanTitle = (product.name || 'Untitled').substring(0, 255)
  const regionTag = product.region_id === 3 ? 'Worldwide' : 'Europe'

  const mutation = `
    mutation productSet($input: ProductSetInput!, $synchronous: Boolean!) {
      productSet(input: $input, synchronous: $synchronous) {
        product { id }
        userErrors { field message }
      }
    }
  `

  try {
    const response = await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
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
            tags: [product.platform || 'Steam', regionTag, 'Digital'],
            status: product.is_available ? 'ACTIVE' : 'DRAFT',
            productOptions: [{ name: 'Title', values: [{ name: 'Default Title' }] }],
            variants: [{
              optionValues: [{ optionName: 'Title', name: 'Default Title' }],
              price: priceInDkk.toFixed(2),
              sku: `KINGUIN-${product.kinguin_id}`,
              inventoryPolicy: 'CONTINUE'
            }]
          }
        }
      })
    })

    const data = await response.json()
    
    if (data.errors || data.data?.productSet?.userErrors?.length > 0) {
      console.error(`Shopify error for ${product.kinguin_id}:`, data.errors || data.data?.productSet?.userErrors)
      return null
    }

    const productId = data.data?.productSet?.product?.id
    
    // Add image async
    if (productId && product.cover_image) {
      addProductImageAsync(productId, product.cover_image, cleanTitle, accessToken)
    }

    return productId
  } catch (err) {
    console.error(`Failed to create Shopify product:`, err)
    return null
  }
}

async function updateShopifyPrice(shopifyProductId: string, priceInDkk: number, isAvailable: boolean, accessToken: string) {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  try {
    // Get variant ID first
    const getVariantQuery = `
      query getProduct($id: ID!) {
        product(id: $id) {
          variants(first: 1) { edges { node { id } } }
        }
      }
    `

    const variantRes = await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: getVariantQuery, variables: { id: shopifyProductId } })
    })

    const variantData = await variantRes.json()
    const variantId = variantData.data?.product?.variants?.edges?.[0]?.node?.id

    if (!variantId) return

    // Update variant price
    await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: `mutation productVariantUpdate($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            productVariant { id }
            userErrors { field message }
          }
        }`,
        variables: { input: { id: variantId, price: priceInDkk.toFixed(2) } }
      })
    })

    // Update product status
    await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: `mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id }
            userErrors { field message }
          }
        }`,
        variables: { input: { id: shopifyProductId, status: isAvailable ? 'ACTIVE' : 'DRAFT' } }
      })
    })
  } catch (err) {
    console.error(`Failed to update Shopify price:`, err)
  }
}

function addProductImageAsync(productId: string, imageUrl: string, altText: string, accessToken: string): void {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: `mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media { ... on MediaImage { id } }
          mediaUserErrors { field message }
        }
      }`,
      variables: {
        productId,
        media: [{ originalSource: imageUrl, alt: altText, mediaContentType: 'IMAGE' }]
      }
    })
  }).catch(err => console.error(`Image upload failed:`, err))
}
