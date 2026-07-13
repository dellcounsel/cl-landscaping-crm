/**
 * Business-level settings. Until the `settings` table lands in M5 these come
 * from environment variables with sensible fallbacks.
 */

export function businessName(): string {
  return process.env.BUSINESS_NAME?.trim() || "FieldBook";
}

/** Optional owner address to receive quote-response notifications. */
export function ownerNotifyEmail(): string | null {
  return process.env.OWNER_NOTIFY_EMAIL?.trim() || null;
}
