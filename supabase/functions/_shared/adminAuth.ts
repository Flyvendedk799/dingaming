import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Guard for endpoints that expose merchant data or spend money: Kinguin balance
// and order history, catalogue syncs, key retrieval.
//
// These sit behind the anon key, which ships inside the frontend bundle and is
// therefore public — it authenticates nobody. Without this check any visitor
// could read the merchant balance and every customer's order.
//
// Two callers are legitimate:
//   * a signed-in admin (the admin panel), and
//   * the machine itself (the hourly catalogue cron), which presents the
//     service role key.

export interface AdminAuthResult {
  ok: boolean
  /** Populated for a human admin; null for the service role. */
  userId: string | null
  /** Ready-to-return response when ok is false. */
  response?: Response
}

const deny = (headers: Record<string, string>, status: number, message: string): AdminAuthResult => ({
  ok: false,
  userId: null,
  response: new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  }),
})

export async function requireAdmin(req: Request, corsHeaders: Record<string, string>): Promise<AdminAuthResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return deny(corsHeaders, 401, 'Authentication required')
  }

  // Machine caller (cron / server-to-server).
  if (token === serviceRoleKey) {
    return { ok: true, userId: null }
  }

  // The anon key is a valid JWT but identifies no one — reject it explicitly so
  // it can never be mistaken for a signed-in user.
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (anonKey && token === anonKey) {
    return deny(corsHeaders, 401, 'Authentication required')
  }

  const authed = createClient(supabaseUrl, anonKey ?? serviceRoleKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })

  const { data: userData, error: userError } = await authed.auth.getUser()
  if (userError || !userData?.user) {
    return deny(corsHeaders, 401, 'Invalid token')
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const { data: role } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!role) {
    return deny(corsHeaders, 403, 'Admin access required')
  }

  return { ok: true, userId: userData.user.id }
}
