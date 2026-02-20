import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaseItem {
  id: string;
  kinguin_product_id: string;
  drop_percentage: number;
  kinguin_products: {
    id: string;
    name: string;
    sell_price: number;
    cover_image: string | null;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { caseId } = await req.json();

    if (!caseId) {
      return new Response(
        JSON.stringify({ error: 'Missing caseId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the case details
    const { data: caseData, error: caseError } = await supabase
      .from('shard_cases')
      .select('*')
      .eq('id', caseId)
      .eq('is_active', true)
      .single();

    if (caseError || !caseData) {
      return new Response(
        JSON.stringify({ error: 'Case not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get case items with product details
    const { data: items, error: itemsError } = await supabase
      .from('shard_case_items')
      .select(`
        id,
        kinguin_product_id,
        drop_percentage,
        kinguin_products (
          id,
          name,
          sell_price,
          cover_image
        )
      `)
      .eq('case_id', caseId);

    if (itemsError || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Case has no items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's shard balance
    const { data: balance, error: balanceError } = await supabase
      .from('shard_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (balanceError || !balance) {
      return new Response(
        JSON.stringify({ error: 'Could not get shard balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (balance.balance < caseData.calculated_price) {
      return new Response(
        JSON.stringify({ error: 'Insufficient shards', required: caseData.calculated_price, current: balance.balance }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Weighted random selection
    const typedItems = items as unknown as CaseItem[];
    const random = Math.random() * 100;
    let cumulative = 0;
    let wonItem: CaseItem | null = null;

    for (const item of typedItems) {
      cumulative += Number(item.drop_percentage);
      if (random <= cumulative) {
        wonItem = item;
        break;
      }
    }

    // Fallback to last item if something goes wrong with percentages
    if (!wonItem) {
      wonItem = typedItems[typedItems.length - 1];
    }

    // Deduct shards via transaction (trigger will update balance)
    const { error: transactionError } = await supabase
      .from('shard_transactions')
      .insert({
        user_id: user.id,
        amount: -caseData.calculated_price,
        type: 'case_opening',
        description: `Åbnede ${caseData.name}`,
        reference_id: caseId,
      });

    if (transactionError) {
      return new Response(
        JSON.stringify({ error: 'Failed to process shard transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record the opening
    const { data: openingRecord, error: openingError } = await supabase
      .from('shard_case_openings')
      .insert({
        user_id: user.id,
        case_id: caseId,
        won_item_id: wonItem.id,
        shards_spent: caseData.calculated_price,
      })
      .select('id')
      .single();

    if (openingError) {
      console.error('Failed to record opening:', openingError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        openingId: openingRecord?.id || null,
        wonItem: {
          id: wonItem.id,
          productId: wonItem.kinguin_product_id,
          name: wonItem.kinguin_products.name,
          price: wonItem.kinguin_products.sell_price,
          image: wonItem.kinguin_products.cover_image,
          dropPercentage: wonItem.drop_percentage,
        },
        shardsSpent: caseData.calculated_price,
        allItems: typedItems.map(item => ({
          id: item.id,
          name: item.kinguin_products.name,
          price: item.kinguin_products.sell_price,
          image: item.kinguin_products.cover_image,
          dropPercentage: item.drop_percentage,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in open-case:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
