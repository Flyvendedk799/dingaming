-- Speed up updates by adding an index on kinguin_id
CREATE INDEX IF NOT EXISTS idx_kinguin_products_kinguin_id ON public.kinguin_products (kinguin_id);

-- Bulk update helper for setting Shopify IDs in one call
CREATE OR REPLACE FUNCTION public.bulk_update_kinguin_shopify_ids(updates jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  WITH data AS (
    SELECT
      (elem->>'kinguin_id')::integer AS kinguin_id,
      elem->>'shopify_product_id' AS shopify_product_id
    FROM jsonb_array_elements(updates) AS elem
    WHERE (elem ? 'kinguin_id') AND (elem ? 'shopify_product_id')
  ),
  upd AS (
    UPDATE public.kinguin_products kp
    SET
      shopify_product_id = d.shopify_product_id,
      last_synced_to_shopify = now()
    FROM data d
    WHERE kp.kinguin_id = d.kinguin_id
    RETURNING 1
  )
  SELECT count(*) INTO updated_count FROM upd;

  RETURN jsonb_build_object('updated', updated_count);
END;
$$;