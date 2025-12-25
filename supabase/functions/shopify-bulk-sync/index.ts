import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'dingaming-js6x0.myshopify.com'
const SHOPIFY_API_VERSION = '2025-07'

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

    // Check for existing bulk operation status
    if (action === 'status') {
      const status = await checkBulkOperationStatus(shopifyAccessToken)
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
    const { count } = await supabase
      .from('kinguin_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
      .is('shopify_product_id', null)

    console.log(`Found ${count} products to bulk sync`)

    if (!count || count === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No products to sync',
        count: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch all products to sync (in batches to avoid memory issues)
    const batchSize = 5000
    let allProducts: any[] = []
    let offset = 0

    while (true) {
      const { data: products, error } = await supabase
        .from('kinguin_products')
        .select('*')
        .eq('is_available', true)
        .is('shopify_product_id', null)
        .order('kinguin_id', { ascending: true })
        .range(offset, offset + batchSize - 1)

      if (error) throw error
      if (!products || products.length === 0) break

      allProducts = [...allProducts, ...products]
      offset += batchSize
      console.log(`Fetched ${allProducts.length} products so far...`)
      
      if (products.length < batchSize) break
    }

    console.log(`Total products to sync: ${allProducts.length}`)

    // Generate JSONL content for bulk mutation
    const jsonlLines = allProducts.map(product => {
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

    console.log(`Generated JSONL with ${allProducts.length} lines`)

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

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Bulk operation started',
      operationId: bulkResult.operationId,
      productsCount: allProducts.length,
      estimatedTime: `${Math.ceil(allProducts.length / 100)} minutes`
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

  // Create staged upload
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
  
  console.log('Staged target:', JSON.stringify(target, null, 2))
  
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
    return { success: false, error: `Upload failed: ${uploadResponse.status} - ${errorText}` }
  }

  console.log('File uploaded successfully')

  // Find the 'key' parameter - this is what Shopify needs for the bulk mutation
  const keyParam = target.parameters.find((p: {name: string; value: string}) => p.name === 'key')
  if (!keyParam) {
    console.error('No key parameter found in staged upload response')
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

async function checkBulkOperationStatus(accessToken: string): Promise<any> {
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
  return data.data?.currentBulkOperation || { status: 'NO_OPERATION' }
}
