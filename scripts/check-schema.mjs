// Dev utility: verify seed results via the (healthy) read path.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const owners = await supabase
  .from("profiles")
  .select("full_name, role")
  .eq("role", "owner");
console.log(
  "owners:",
  owners.error ? owners.error.message : JSON.stringify(owners.data),
);

const clients = await supabase
  .from("clients")
  .select("*", { count: "exact", head: true });
console.log("clients count:", clients.error ? clients.error.message : clients.count);

const prices = await supabase
  .from("price_items")
  .select("*", { count: "exact", head: true });
console.log("price_items count:", prices.error ? prices.error.message : prices.count);
