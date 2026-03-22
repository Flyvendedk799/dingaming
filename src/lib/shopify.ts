import { toast } from "sonner";

// Shopify Configuration
const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'dingaming-js6x0.myshopify.com';
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = '523bcd26a9968077f560675722a4d42a';

// Types
export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          availableForSale: boolean;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

// Storefront API helper function
export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (response.status === 402) {
    toast.error("Shopify: Payment required", {
      description: "Shopify API access requires an active Shopify billing plan."
    });
    return null;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  return data;
}

// GraphQL Queries
const STOREFRONT_PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            name
            values
          }
        }
      }
    }
  }
`;

const STOREFRONT_PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      handle
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 20) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
      options {
        name
        values
      }
    }
  }
`;

// Query to get variant ID by product ID (for checkout)
const STOREFRONT_VARIANT_BY_PRODUCT_ID_QUERY = `
  query GetVariantByProductId($id: ID!) {
    product(id: $id) {
      variants(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        discountCodes {
          code
          applicable
        }
        discountAllocations {
          discountedAmount {
            amount
            currencyCode
          }
        }
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_DISCOUNT_CODES_UPDATE_MUTATION = `
  mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        id
        checkoutUrl
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        discountCodes {
          code
          applicable
        }
        discountAllocations {
          discountedAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// API Functions
export async function fetchProducts(first: number = 20, query?: string): Promise<ShopifyProduct[]> {
  try {
    const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first, query });
    if (!data) return [];
    return data.data.products.edges;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function fetchProductByHandle(handle: string) {
  try {
    const data = await storefrontApiRequest(STOREFRONT_PRODUCT_BY_HANDLE_QUERY, { handle });
    if (!data) return null;
    return data.data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

type PublishResult =
  | { ok: true }
  | { ok: false; error: string };

async function ensurePublishedToOnlineStore(kinguinId: number): Promise<PublishResult> {
  try {
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-publish-online-store`,
      {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kinguinId }),
      },
    );

    const data = await response.json().catch(() => null);
    if (response.ok && data?.success === true) return { ok: true };
    const error = (data?.error as string | undefined) || `http_${response.status}`;
    return { ok: false, error };
  } catch (e) {
    console.error('Failed to ensure product is published:', e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch the Shopify variant ID for a product using its Shopify product ID from the database
export type VariantResolveResult =
  | { ok: true; variantId: string }
  | {
      ok: false;
      code: 'NOT_SYNCED' | 'NOT_PUBLISHED' | 'PUBLISH_PERMISSION' | 'UNKNOWN';
      details?: string;
    };

export async function getShopifyVariantId(kinguinId: number): Promise<VariantResolveResult> {
  try {
    // First, fetch the shopify_product_id from our database
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: product, error } = await supabase
      .from('kinguin_products')
      .select('shopify_product_id')
      .eq('kinguin_id', kinguinId)
      .single();
    
    if (error || !product?.shopify_product_id) {
      console.log('Product not synced to Shopify yet:', kinguinId);
      return { ok: false, code: 'NOT_SYNCED' };
    }
    
    const fetchVariant = async () => {
      const data = await storefrontApiRequest(STOREFRONT_VARIANT_BY_PRODUCT_ID_QUERY, {
        id: product.shopify_product_id,
      });

      return {
        variantId: data?.data?.product?.variants?.edges?.[0]?.node?.id as string | undefined,
        productIsNull: data?.data?.product === null,
      };
    };

    // Now use the Shopify product ID to get the variant
    let result = await fetchVariant();

    // If the product exists in Admin (we have an ID) but is invisible in Storefront,
    // it's usually not published to the Online Store channel yet.
    if (!result.variantId && result.productIsNull) {
      const toastId = toast.loading('Gør produktet klar...', { description: 'Produktet bliver tilføjet til butikken...' });

      // Publish to the Online Store channel
      const published = await ensurePublishedToOnlineStore(kinguinId);
      if (!published.ok) {
        toast.dismiss(toastId);
        const publishError = (published as { ok: false; error: string }).error;
        const lowerError = publishError.toLowerCase();
        return {
          ok: false,
          code:
            publishError === 'publications_not_found' ||
            lowerError.includes('publication_permission_denied') ||
            lowerError.includes('write_publications') ||
            lowerError.includes('access denied')
              ? 'PUBLISH_PERMISSION'
              : 'NOT_PUBLISHED',
          details: publishError,
        };
      }

      // Poll for Storefront API propagation — typically takes 2-10 seconds
      for (const ms of [1500, 2000, 3000, 4000, 5000]) {
        await delay(ms);
        result = await fetchVariant();
        if (result.variantId) break;
      }

      toast.dismiss(toastId);
      if (result.variantId) {
        toast.success('Produktet er klar!');
      }
    }

    if (!result.variantId) return { ok: false, code: 'NOT_PUBLISHED' };
    return { ok: true, variantId: result.variantId };
  } catch (error) {
    console.error('Error fetching Shopify variant ID:', error);
    return { ok: false, code: 'UNKNOWN', details: error instanceof Error ? error.message : String(error) };
  }
}

export interface CartItem {
  variantId: string;
  quantity: number;
}

export async function createStorefrontCheckout(items: CartItem[]): Promise<string> {
  try {
    const lines = items.map(item => ({
      quantity: item.quantity,
      merchandiseId: item.variantId,
    }));

    const cartData = await storefrontApiRequest(CART_CREATE_MUTATION, {
      input: { lines },
    });

    if (!cartData) {
      throw new Error('Failed to create checkout');
    }

    if (cartData.data.cartCreate.userErrors.length > 0) {
      throw new Error(`Cart creation failed: ${cartData.data.cartCreate.userErrors.map((e: { message: string }) => e.message).join(', ')}`);
    }

    const cart = cartData.data.cartCreate.cart;
    
    if (!cart.checkoutUrl) {
      throw new Error('No checkout URL returned from Shopify');
    }

    const url = new URL(cart.checkoutUrl);
    url.searchParams.set('channel', 'online_store');
    return url.toString();
  } catch (error) {
    console.error('Error creating storefront checkout:', error);
    throw error;
  }
}

export function formatPrice(amount: string | number, currency: string = 'EUR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency
  }).format(numAmount);
}

// Discount code types and functions
export interface DiscountResult {
  applicable: boolean;
  savings: number;
  cartId?: string;
  checkoutUrl?: string;
}

export async function applyDiscountCode(
  items: CartItem[],
  discountCode: string
): Promise<DiscountResult> {
  try {
    // First create a cart with the items
    const lines = items.map(item => ({
      quantity: item.quantity,
      merchandiseId: item.variantId,
    }));

    const cartData = await storefrontApiRequest(CART_CREATE_MUTATION, {
      input: { lines },
    });

    if (!cartData || cartData.data.cartCreate.userErrors.length > 0) {
      return { applicable: false, savings: 0 };
    }

    const cartId = cartData.data.cartCreate.cart.id;
    const subtotal = parseFloat(cartData.data.cartCreate.cart.cost.subtotalAmount?.amount || cartData.data.cartCreate.cart.cost.totalAmount.amount);

    // Now apply the discount code
    const discountData = await storefrontApiRequest(CART_DISCOUNT_CODES_UPDATE_MUTATION, {
      cartId,
      discountCodes: [discountCode],
    });

    if (!discountData || discountData.data.cartDiscountCodesUpdate.userErrors.length > 0) {
      return { applicable: false, savings: 0 };
    }

    const updatedCart = discountData.data.cartDiscountCodesUpdate.cart;
    const discountCodes = updatedCart.discountCodes || [];
    const applicable = discountCodes.some((d: { code: string; applicable: boolean }) => d.applicable);
    
    // Calculate savings from discount allocations
    const totalAfterDiscount = parseFloat(updatedCart.cost.totalAmount.amount);
    const savings = subtotal - totalAfterDiscount;

    const url = new URL(updatedCart.checkoutUrl);
    url.searchParams.set('channel', 'online_store');

    return {
      applicable,
      savings: Math.max(0, savings),
      cartId,
      checkoutUrl: url.toString()
    };
  } catch (error) {
    console.error('Error applying discount code:', error);
    return { applicable: false, savings: 0 };
  }
}
