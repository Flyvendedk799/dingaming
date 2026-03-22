

## Why you see "Produktet er ikke tilgængeligt i butikken endnu"

The products exist in Shopify's Admin but are **not published to the Online Store sales channel**, so the Storefront API can't see them. When you click "Køb", the code tries to auto-publish and then waits up to ~5 seconds for propagation. If it doesn't propagate in time, you get the error. Clicking again won't retry because it remembers the attempt (a `publishAttempted` Set in memory).

Usually the second or third try works because by then Shopify has finished propagating.

## Plan: Fix the add-to-cart reliability

### Step 1: Remove the single-attempt guard
Remove the `publishAttempted` Set that prevents retries. Instead, always attempt to publish if the product isn't visible, so clicking "Køb" again actually retries.

### Step 2: Increase retry patience
Extend the retry delays from `[800, 1500, 2500]` to `[1000, 2000, 3000, 5000]` to give Shopify more time to propagate after publishing.

### Step 3: Show a "publishing..." toast instead of an error
When the publish is triggered, show an info toast like "Gør produktet klar..." so the user knows it's working rather than seeing an error.

### Technical details

**File: `src/lib/shopify.ts`**
- Remove the `publishAttempted` Set and its usage
- Change retry delays to `[1000, 2000, 3000, 5000]`
- Keep the fallback error for genuine failures (PUBLISH_PERMISSION, etc.)

**Files: `src/components/KinguinProductCard.tsx`, `src/pages/ProductPage.tsx`, `src/components/QuickViewModal.tsx`**
- No changes needed — the error handling already covers the codes correctly. Once the shopify.ts function is more resilient, these will "just work."

