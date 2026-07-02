import { createClient } from "@supabase/supabase-js"

// Service-role client for server-only code paths that must bypass RLS to
// write money-adjacent columns (stake confirmation, settlement, winner
// determination) on the staked-matches tables — see supabase-staked-matches-table.sql.
// Never import this from client components; the service role key must never
// reach the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
