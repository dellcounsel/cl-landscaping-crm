// FieldBook seed script.
//
//   npm run seed
//
// Creates the owner account and demo data (5 clients + a price list) for
// testing. Uses the service-role key, so it BYPASSES RLS — never run against
// a production project with real data. Safe to re-run: it upserts by a stable
// key and skips the owner if the email already exists.
//
// Requires in .env.local:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   SEED_OWNER_EMAIL, SEED_OWNER_PASSWORD, (optional) SEED_OWNER_NAME

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = process.env.SEED_OWNER_EMAIL;
const ownerPassword = process.env.SEED_OWNER_PASSWORD;
const ownerName = process.env.SEED_OWNER_NAME || "Owner";

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}
if (!ownerEmail || !ownerPassword) {
  console.error("Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run a Supabase write and retry while PostgREST reports a stale schema cache
 * (PGRST205 "Could not find the table … in the schema cache"). Newly created
 * tables can take a short while to appear in the REST cache, especially during
 * a Supabase incident. Non-cache errors fail fast.
 */
async function withRetry(fn, label, attempts = 12, delayMs = 5000) {
  for (let i = 1; i <= attempts; i++) {
    const { error } = await fn();
    if (!error) return;
    const cacheMiss =
      error.code === "PGRST205" ||
      (error.message ?? "").includes("schema cache");
    if (!cacheMiss || i === attempts) throw error;
    console.log(
      `  ${label}: schema cache not ready yet, retrying (${i}/${attempts})…`,
    );
    await sleep(delayMs);
  }
}

async function ensureOwner() {
  // Look for an existing user with this email (paged list, first page is enough
  // for a small team).
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  let user = list.users.find(
    (u) => u.email?.toLowerCase() === ownerEmail.toLowerCase(),
  );

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: ownerName },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created owner auth user: ${ownerEmail}`);
  } else {
    console.log(`Owner already exists: ${ownerEmail}`);
  }

  // The handle_new_user trigger inserts a profile with role 'crew'; promote to
  // owner and set the name.
  await withRetry(
    () =>
      supabase
        .from("profiles")
        .update({ role: "owner", full_name: ownerName })
        .eq("id", user.id),
    "profiles",
  );
  console.log("Promoted profile to owner.");
}

const DEMO_CLIENTS = [
  {
    name: "Greenfield HOA",
    email: "board@greenfieldhoa.example",
    phone: "(215) 555-0142",
    property_address: "1200 Meadow Ln, Doylestown, PA 18901",
    billing_address: "PO Box 88, Doylestown, PA 18901",
    tags: ["commercial", "weekly"],
    notes: "Gate code on file with crew lead. Mow Mon mornings.",
  },
  {
    name: "Maria Alvarez",
    email: "maria.alvarez@example.com",
    phone: "(267) 555-0199",
    property_address: "34 Birch St, New Hope, PA 18938",
    tags: ["residential", "biweekly"],
    notes: "Dog in backyard — text before arriving.",
  },
  {
    name: "Tom & Linda Becker",
    phone: "(215) 555-0123",
    property_address: "88 Ridgeview Dr, Chalfont, PA 18914",
    tags: ["residential"],
    notes: "Seasonal cleanup + mulch each spring.",
  },
  {
    name: "Riverside Dental",
    email: "office@riversidedental.example",
    phone: "(215) 555-0177",
    property_address: "5 Commerce Blvd, Warrington, PA 18976",
    tags: ["commercial", "weekly"],
    notes: "Keep entrance beds tidy; clients notice.",
  },
  {
    name: "Doug Pearson",
    phone: "(484) 555-0110",
    property_address: "412 Oak Hollow Rd, Perkasie, PA 18944",
    status: "inactive",
    tags: ["residential"],
    notes: "Paused service over winter.",
  },
];

const DEMO_PRICE_ITEMS = [
  { name: "Weekly Mow", unit: "flat", default_rate_cents: 4500 },
  { name: "Biweekly Mow", unit: "flat", default_rate_cents: 6000 },
  { name: "Mulch Install", unit: "yard", default_rate_cents: 8500 },
  { name: "Spring Cleanup", unit: "hour", default_rate_cents: 6500 },
  { name: "Hedge Trimming", unit: "hour", default_rate_cents: 5500 },
  { name: "Leaf Removal", unit: "hour", default_rate_cents: 6000 },
  { name: "Sod Install", unit: "sqft", default_rate_cents: 120 },
];

async function seedClients() {
  // Idempotent by name: delete demo clients with these names first.
  const names = DEMO_CLIENTS.map((c) => c.name);
  await withRetry(
    () => supabase.from("clients").delete().in("name", names),
    "clients",
  );
  await withRetry(
    () => supabase.from("clients").insert(DEMO_CLIENTS),
    "clients",
  );
  console.log(`Seeded ${DEMO_CLIENTS.length} clients.`);
}

async function seedPriceItems() {
  const names = DEMO_PRICE_ITEMS.map((p) => p.name);
  await withRetry(
    () => supabase.from("price_items").delete().in("name", names),
    "price_items",
  );
  await withRetry(
    () => supabase.from("price_items").insert(DEMO_PRICE_ITEMS),
    "price_items",
  );
  console.log(`Seeded ${DEMO_PRICE_ITEMS.length} price items.`);
}

try {
  await ensureOwner();
  await seedClients();
  await seedPriceItems();
  console.log("\n✅ Seed complete. Log in with your SEED_OWNER_EMAIL.");
} catch (err) {
  console.error("\n❌ Seed failed:", err.message ?? err);
  process.exit(1);
}
