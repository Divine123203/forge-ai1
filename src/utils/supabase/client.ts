import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // These variables must be prefixed with NEXT_PUBLIC_ to be visible on the frontend
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}