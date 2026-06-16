// Shared discount validation used by both validate-discount (client UX) and
// create-order (authoritative). Looks up a store-wide code in discount_codes.

export interface DiscountResult {
  valid: boolean
  reason?: string
  code?: string
  type?: 'percent' | 'fixed'
  value?: number
  savings: number
}

export async function evaluateDiscount(
  supabase: any,
  rawCode: string,
  subtotal: number,
): Promise<DiscountResult> {
  const code = (rawCode || '').trim().toUpperCase()
  if (!code) return { valid: false, reason: 'empty', savings: 0 }

  const { data: dc } = await supabase
    .from('discount_codes')
    .select('*')
    .ilike('code', code)
    .maybeSingle()

  if (!dc || !dc.is_active) {
    return { valid: false, reason: 'not_found', savings: 0 }
  }
  if (dc.expires_at && new Date(dc.expires_at).getTime() < Date.now()) {
    return { valid: false, reason: 'expired', savings: 0 }
  }
  if (dc.max_uses != null && dc.used_count >= dc.max_uses) {
    return { valid: false, reason: 'used_up', savings: 0 }
  }
  if (subtotal < Number(dc.min_subtotal || 0)) {
    return { valid: false, reason: 'min_subtotal', savings: 0 }
  }

  const value = Number(dc.value)
  let savings = dc.type === 'percent' ? (subtotal * value) / 100 : value
  savings = Math.min(savings, subtotal)
  savings = Math.round(savings * 100) / 100

  return { valid: true, code: dc.code, type: dc.type, value, savings }
}
