import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Service-role client for server-only code paths that must bypass RLS to
// write money-adjacent columns (stake confirmation, settlement, winner
// determination) on the staked-matches tables — see supabase-staked-matches-table.sql.
// Never import this from client components; the service role key must never
// reach the browser.
//
// Built lazily behind a Proxy: Next.js imports this module while collecting
// page data at build time, before env vars are necessarily available (e.g.
// Netlify build environment), so constructing the client at module scope
// crashes the build. Deferring construction to first property access means
// the build only needs the module to load, not the client to exist.
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    }
    client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return client
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})
