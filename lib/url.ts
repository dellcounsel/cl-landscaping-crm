import { headers } from "next/headers";

/**
 * Absolute base URL for building public links (e.g. /q/[token]).
 * Prefers APP_URL when it's a real value; otherwise derives from the request
 * headers so links are correct even if APP_URL hasn't been set yet.
 */
export async function getBaseUrl(): Promise<string> {
  const env = process.env.APP_URL;
  if (env && !env.includes("placeholder")) {
    return env.replace(/\/+$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
