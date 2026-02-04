import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { BACKEND_PUBLIC_PUBLISHABLE_KEY, BACKEND_PUBLIC_URL } from "@/lib/backendPublic";

// Authenticated client (persists session)
export const supabase = createClient<Database>(
  BACKEND_PUBLIC_URL,
  BACKEND_PUBLIC_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Public client (never persists session / never auto-refresh)
export const publicSupabase = createClient<Database>(
  BACKEND_PUBLIC_URL,
  BACKEND_PUBLIC_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
