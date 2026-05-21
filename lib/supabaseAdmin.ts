import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _admin;
}

// Keep named export for backwards compat - lazily evaluated
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (getSupabaseAdmin() as any)[prop];
  }
});
