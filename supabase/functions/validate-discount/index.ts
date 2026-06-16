import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { evaluateDiscount } from '../_shared/discount.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { code, subtotal } = await req.json()
    const result = await evaluateDiscount(supabase, code ?? '', Number(subtotal) || 0)

    return json(result)
  } catch (error) {
    console.error('validate-discount error:', error)
    return json({ valid: false, savings: 0, error: 'Server error' }, 500)
  }
})
