import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

// Process 3000 products per bulk operation to stay within memory limits
const CHUNK_SIZE = 3000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN')
    if (!shopifyAccessToken) {
      throw new Error('SHOPIFY_ACCESS_TOKEN not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'start'

    // Reconcile - fetch existing Shopify products and update our DB
    if (action === 'reconcile') {
      const result = await reconcileShopifyProducts(shopifyAccessToken, supabase)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check for existing bulk operation status
    if (action === 'status') {
      const status = await checkBulkOperationStatus(shopifyAccessToken, supabase)
      
      // Add remaining products count to status
      const { count: remainingProducts } = await supabase
        .from('kinguin_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true)
        .is('shopify_product_id', null)
      
      status.remainingProducts = remainingProducts || 0
      
      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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

    // Get count of products to sync
    const { count: totalRemaining } = await supabase
      .from('kinguin_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
      .is('shopify_product_id', null)

    console.log(`Total products remaining to sync: ${totalRemaining}`)

    if (!totalRemaining || totalRemaining === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No products to sync',
        count: 0,
        done: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch ONE chunk of products (3000 max to stay within memory)
    const { data: products, error: fetchError } = await supabase
      .from('kinguin_products')
      .select('*')
      .eq('is_available', true)
      .is('shopify_product_id', null)
      .order('kinguin_id', { ascending: true })
      .limit(CHUNK_SIZE)

    if (fetchError) throw fetchError

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No products to sync',
        count: 0,
        done: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing chunk of ${products.length} products`)

    // Generate JSONL content for this chunk
    const jsonlLines = products.map(product => {
      const margin = product.margin_percent ?? globalMargin
      const priceWithMargin = product.sell_price * (1 + margin / 100)
      const priceInDkk = priceWithMargin * eurToDkkRate
      const regionTag = product.region_id === 3 ? 'Worldwide' : 'Europe'
      const cleanTitle = (product.name || 'Untitled Product').substring(0, 255)
      const handle = `kinguin-${product.kinguin_id}`

      return JSON.stringify({
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
            sku: `KINGUIN-${product.kinguin_id}`,
            inventoryPolicy: 'CONTINUE'
          }],
          metafields: [{
            namespace: 'kinguin',
            key: 'kinguin_id',
            value: product.kinguin_id.toString(),
            type: 'number_integer'
          }]
        }
      })
    }).join('\n')

    console.log(`Generated JSONL with ${products.length} lines`)

    // Step 1: Stage the JSONL file
    const stagedUploadResult = await stageUpload(shopifyAccessToken, jsonlLines)
    
    if (!stagedUploadResult.success) {
      throw new Error(`Failed to stage upload: ${stagedUploadResult.error}`)
    }

    console.log('Staged upload successful, starting bulk mutation...')

    // Step 2: Start bulk mutation
    const bulkResult = await startBulkMutation(shopifyAccessToken, stagedUploadResult.key!)

    if (!bulkResult.success) {
      throw new Error(`Failed to start bulk mutation: ${bulkResult.error}`)
    }

    console.log(`Bulk operation started: ${bulkResult.operationId}`)

    const remainingAfterThis = totalRemaining - products.length

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Bulk operation started',
      operationId: bulkResult.operationId,
      productsInThisChunk: products.length,
      remainingProducts: remainingAfterThis,
      done: remainingAfterThis <= 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Bulk sync error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function stageUpload(accessToken: string, jsonlContent: string): Promise<{ success: boolean; key?: string; error?: string }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const stageQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const stageResponse = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: stageQuery,
      variables: {
        input: [{
          resource: 'BULK_MUTATION_VARIABLES',
          filename: 'products.jsonl',
          mimeType: 'text/jsonl',
          httpMethod: 'POST'
        }]
      }
    })
  })

  const stageData = await stageResponse.json()

  if (stageData.errors || stageData.data?.stagedUploadsCreate?.userErrors?.length > 0) {
    const error = stageData.errors?.[0]?.message || stageData.data?.stagedUploadsCreate?.userErrors?.[0]?.message
    return { success: false, error }
  }

  const target = stageData.data.stagedUploadsCreate.stagedTargets[0]
  
  console.log('Uploading file to staged location...')
  
  // Upload the file to Google Cloud Storage
  const formData = new FormData()
  for (const param of target.parameters) {
    formData.append(param.name, param.value)
  }
  formData.append('file', new Blob([jsonlContent], { type: 'text/jsonl' }), 'products.jsonl')

  const uploadResponse = await fetch(target.url, {
    method: 'POST',
    body: formData
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    console.error('Upload failed:', errorText)
    return { success: false, error: `Upload failed: ${uploadResponse.status}` }
  }

  console.log('File uploaded successfully')

  // Find the 'key' parameter
  const keyParam = target.parameters.find((p: {name: string; value: string}) => p.name === 'key')
  if (!keyParam) {
    return { success: false, error: 'No key parameter in staged upload response' }
  }

  console.log('Using staged upload key:', keyParam.value)

  return { success: true, key: keyParam.value }
}

async function startBulkMutation(accessToken: string, stagedUploadPath: string): Promise<{ success: boolean; operationId?: string; error?: string }> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const mutation = `
    mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
      bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const productSetMutation = `
    mutation productSet($input: ProductSetInput!) {
      productSet(input: $input, synchronous: false) {
        product {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        mutation: productSetMutation,
        stagedUploadPath
      }
    })
  })

  const data = await response.json()

  if (data.errors || data.data?.bulkOperationRunMutation?.userErrors?.length > 0) {
    const error = data.errors?.[0]?.message || data.data?.bulkOperationRunMutation?.userErrors?.[0]?.message
    return { success: false, error }
  }

  const operation = data.data.bulkOperationRunMutation.bulkOperation
  return { success: true, operationId: operation?.id }
}

async function checkBulkOperationStatus(accessToken: string, supabase: any): Promise<any> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const query = `
    query {
      currentBulkOperation(type: MUTATION) {
        id
        status
        errorCode
        createdAt
        completedAt
        objectCount
        fileSize
        url
        rootObjectCount
      }
    }
  `

  const response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query })
  })

  const data = await response.json()
  const operation = data.data?.currentBulkOperation || { status: 'NO_OPERATION' }
  
  // If completed and has URL, parse results and update database
  if (operation.status === 'COMPLETED' && operation.url) {
    try {
      await processCompletedBulkOperation(operation.url, supabase)
      operation.dbUpdated = true
    } catch (err) {
      console.error('Error processing bulk results:', err)
      operation.dbUpdateError = err instanceof Error ? err.message : 'Unknown error'
    }
  }
  
  return operation
}

async function processCompletedBulkOperation(resultUrl: string, supabase: any): Promise<void> {
  console.log('Downloading bulk operation results from:', resultUrl)
  
  const response = await fetch(resultUrl)
  if (!response.ok) {
    throw new Error(`Failed to download results: ${response.status}`)
  }
  
  const text = await response.text()
  const lines = text.trim().split('\n').filter(line => line.length > 0)
  
  console.log(`Processing ${lines.length} result lines`)
  
  // Log first line to understand format
  if (lines.length > 0) {
    console.log('Sample result line:', lines[0].substring(0, 500))
  }
  
  let updatedCount = 0
  const updates: { kinguin_id: number; shopify_product_id: string }[] = []
  
  for (const line of lines) {
    try {
      const result = JSON.parse(line)
      
      // Try multiple possible formats
      let shopifyId: string | null = null
      let handle: string | null = null
      
      // Format 1: Direct productSet result
      if (result.productSet?.product) {
        shopifyId = result.productSet.product.id
        handle = result.productSet.product.handle
      }
      // Format 2: Wrapped in data
      else if (result.data?.productSet?.product) {
        shopifyId = result.data.productSet.product.id
        handle = result.data.productSet.product.handle
      }
      // Format 3: Direct product at root
      else if (result.product?.id) {
        shopifyId = result.product.id
        handle = result.product.handle
      }
      // Format 4: id and handle at root level
      else if (result.id && result.handle) {
        shopifyId = result.id
        handle = result.handle
      }
      // Format 5: __parentId pattern (nested results)
      else if (result.__parentId) {
        // Skip nested items, we only care about root products
        continue
      }
      
      if (handle && shopifyId) {
        // Extract kinguin_id from handle (format: kinguin-12345)
        const match = handle.match(/kinguin-(\d+)/)
        if (match) {
          updates.push({
            kinguin_id: parseInt(match[1]),
            shopify_product_id: shopifyId
          })
        }
      }
    } catch (err) {
      console.error('Error parsing result line:', line.substring(0, 200), err)
    }
  }
  
  console.log(`Found ${updates.length} products to update in database`)
  
  // Batch update database
  if (updates.length > 0) {
    console.log(`Updating ${updates.length} products in database`)
    
    // Update in chunks of 100
    for (let i = 0; i < updates.length; i += 100) {
      const chunk = updates.slice(i, i + 100)
      
      for (const update of chunk) {
        await supabase
          .from('kinguin_products')
          .update({ 
            shopify_product_id: update.shopify_product_id,
            last_synced_to_shopify: new Date().toISOString()
          })
          .eq('kinguin_id', update.kinguin_id)
      }
      
      updatedCount += chunk.length
    }
    
    console.log(`Updated ${updatedCount} products in database`)
  }
}

// Reconcile function - use bulk query to fetch ALL products, then batch update DB
async function reconcileShopifyProducts(accessToken: string, supabase: any): Promise<any> {
  const shopifyAdminUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`
  
  console.log('Starting bulk query for reconciliation...')
  
  // Step 1: Start bulk query operation
  const bulkQueryMutation = `
    mutation {
      bulkOperationRunQuery(
        query: """
        {
          products(query: "handle:kinguin-*") {
            edges {
              node {
                id
                handle
              }
            }
          }
        }
        """
      ) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `
  
  const startResponse: Response = await fetch(shopifyAdminUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query: bulkQueryMutation })
  })
  
  const startData: any = await startResponse.json()
  
  if (startData.errors || startData.data?.bulkOperationRunQuery?.userErrors?.length > 0) {
    const error = startData.errors?.[0]?.message || startData.data?.bulkOperationRunQuery?.userErrors?.[0]?.message
    throw new Error(`Failed to start bulk query: ${error}`)
  }
  
  const operationId = startData.data?.bulkOperationRunQuery?.bulkOperation?.id
  console.log('Bulk query started:', operationId)
  
  // Step 2: Poll for completion
  let completed = false
  let resultUrl: string | null = null
  let attempts = 0
  const maxAttempts = 60 // 5 minutes max
  
  while (!completed && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    const statusQuery = `
      query {
        currentBulkOperation(type: QUERY) {
          id
          status
          errorCode
          objectCount
          url
        }
      }
    `
    
    const statusResponse: Response = await fetch(shopifyAdminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: statusQuery })
    })
    
    const statusData: any = await statusResponse.json()
    const operation = statusData.data?.currentBulkOperation
    
    console.log(`Bulk query status: ${operation?.status}, objects: ${operation?.objectCount}`)
    
    if (operation?.status === 'COMPLETED') {
      completed = true
      resultUrl = operation.url
    } else if (operation?.status === 'FAILED') {
      throw new Error(`Bulk query failed: ${operation?.errorCode}`)
    }
    
    attempts++
  }
  
  if (!resultUrl) {
    throw new Error('Bulk query timed out or no results')
  }
  
  // Step 3: Download and parse results
  console.log('Downloading bulk query results...')
  const resultsResponse = await fetch(resultUrl)
  const resultsText = await resultsResponse.text()
  const lines = resultsText.trim().split('\n').filter(line => line.length > 0)
  
  console.log(`Got ${lines.length} products from Shopify`)
  
  // Step 4: Parse all products into an array
  const updates: { kinguin_id: number; shopify_product_id: string }[] = []
  
  for (const line of lines) {
    try {
      const product = JSON.parse(line)
      const match = product.handle?.match(/kinguin-(\d+)/)
      if (match && product.id) {
        updates.push({
          kinguin_id: parseInt(match[1]),
          shopify_product_id: product.id
        })
      }
    } catch (err) {
      // Skip invalid lines
    }
  }
  
  console.log(`Parsed ${updates.length} valid products to update`)
  
  // Step 5: Batch update database using raw SQL for speed
  let totalUpdated = 0
  const batchSize = 500
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)
    const timestamp = new Date().toISOString()
    
    // Build a CASE statement for batch update
    const kinguinIds = batch.map(u => u.kinguin_id)
    
    // Update all at once using individual updates but in parallel
    const updatePromises = batch.map(update => 
      supabase
        .from('kinguin_products')
        .update({ 
          shopify_product_id: update.shopify_product_id,
          last_synced_to_shopify: timestamp
        })
        .eq('kinguin_id', update.kinguin_id)
    )
    
    await Promise.all(updatePromises)
    totalUpdated += batch.length
    
    console.log(`Updated batch ${Math.floor(i / batchSize) + 1}: ${totalUpdated}/${updates.length}`)
  }
  
  console.log(`Reconciliation complete: ${updates.length} products found, ${totalUpdated} updated in DB`)
  
  return {
    success: true,
    totalFound: updates.length,
    totalUpdated,
    message: `Found ${updates.length} Shopify products, updated ${totalUpdated} in database`
  }
}
