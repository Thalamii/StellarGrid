import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Built lazily behind a Proxy: Next.js imports this module while collecting
// page data at build time, before env vars are necessarily available (e.g.
// Netlify build environment), so constructing the client at module scope
// crashes the build. Deferring construction to first property access means
// the build only needs the module to load, not the client to exist.
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    }
    client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Note: Currently using localStorage for stats instead of database
// Supabase client is kept for potential future features
