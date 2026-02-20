import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { openingId } = await req.json();
    if (!openingId) {
      return new Response(
        JSON.stringify({ error: 'Missing openingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the case opening record with the won item details
    const { data: opening, error: openingError } = await supabase
      .from('shard_case_openings')
      .select(`
        id,
        user_id,
        shards_spent,
        won_item_id,
        shard_case_items (
          id,
          kinguin_product_id,
          kinguin_products (
            name,
            sell_price
          )
        )
      `)
      .eq('id', openingId)
      .eq('user_id', user.id)
      .single();

    if (openingError || !opening) {
      return new Response(
        JSON.stringify({ error: 'Opening not found or not yours' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate shard value: sell_price (DKK) * 1000 = shards
    const caseItem = opening.shard_case_items as any;
    const product = caseItem?.kinguin_products;
    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product data not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shardValue = Math.round(product.sell_price * 1000);

    // Credit shards via transaction (trigger handles balance)
    const { error: txError } = await supabase
      .from('shard_transactions')
      .insert({
        user_id: user.id,
        amount: shardValue,
        type: 'case_sell',
        description: `Solgte ${product.name}`,
        reference_id: openingId,
      });

    if (txError) {
      return new Response(
        JSON.stringify({ error: 'Failed to credit shards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        shardsReceived: shardValue,
        productName: product.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sell-case-item:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
