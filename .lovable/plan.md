

# Plan: Seamlessly Sync All 35,578 Missing Products to Shopify

## Current Situation
- 55,130 products in your database
- 19,552 already on Shopify
- **35,578 products need to be synced**

## The Problem
The sync isn't working because of two issues:
1. Missing configuration for some backend functions
2. The Shopify token you provided (`shpss_...`) is a **Storefront token** (for reading product data on your website), but we need an **Admin API token** (for creating/managing products)

---

## The Solution

### Step 1: Fix Backend Configuration
Add the missing function configuration so the sync functions can be called properly.

**Technical details:**
- Add `[functions.shopify-bulk-sync]` with `verify_jwt = false` to config.toml
- Deploy the updated functions

### Step 2: Get the Correct Token
You need to provide an **Admin API access token** from your Shopify store:

1. Go to your Shopify Admin → Settings → Apps and sales channels → Develop apps
2. Create or select an app with these **scopes**:
   - `read_products`
   - `write_products`
3. Generate an **Admin API access token** (starts with `shpat_`)
4. Share this token when prompted

### Step 3: Automated Full Sync
Once the token is correct, I'll run a fully automated sync that:
- Processes products in batches of 50 to respect rate limits
- Shows real-time progress
- Handles errors gracefully (retries failed products)
- Continues automatically until all 35,578 products are on Shopify

**Estimated time:** 3-4 hours (running in the background)

---

## What You'll Get
- All products synced to Shopify automatically
- Each product will have:
  - Title, description, and cover image
  - Price calculated in DKK with your margin
  - SKU linked to Kinguin ID
  - Proper tags (platform, region, etc.)
- Database updated with Shopify product IDs for future reference

---

## Technical Changes

```text
+-------------------+     +------------------+     +------------------+
|  kinguin_products |     |  sync-db-to-     |     |    Shopify       |
|  (35,578 missing) | --> |  shopify edge    | --> |    Store         |
|                   |     |  function        |     |                  |
+-------------------+     +------------------+     +------------------+
        ^                        |
        |                        v
        +--- Update shopify_product_id after each successful sync
```

**Files to modify:**
1. `supabase/config.toml` - Add missing function config
2. `supabase/functions/sync-db-to-shopify/index.ts` - Ensure robust error handling
3. `src/pages/AdminPage.tsx` - Add "Full Auto Sync" button that runs until complete

---

## Next Steps After Approval
1. I'll fix the configuration
2. I'll prompt you for the correct Admin API token
3. I'll start the sync and it will run automatically until complete

