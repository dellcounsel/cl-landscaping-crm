import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Privileged Supabase client using the service-role key. BYPASSES Row Level
 * Security — never expose to the browser and never import into Client
 * Components. Use only in server-side code that hand-selects safe columns
 * (e.g. public quote/invoice pages looked up by unguessable token, cron jobs).
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
