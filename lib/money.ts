/**
 * Money is stored as integer cents everywhere in the DB and moved through the
 * app as cents. Convert to/from dollars only at the UI edges.
 */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Format integer cents as a USD string, e.g. 12345 -> "$123.45". */
export function formatCents(cents: number): string {
  return USD.format((cents ?? 0) / 100);
}

/** Parse a user-entered dollar string ("123.45", "$1,200") to integer cents. */
export function parseDollarsToCents(input: string | number): number {
  if (typeof input === "number") return Math.round(input * 100);
  const cleaned = input.replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  return Math.round(parseFloat(cleaned) * 100);
}

/** Convert integer cents to a dollar number for input fields, e.g. 12345 -> 123.45. */
export function centsToDollars(cents: number): number {
  return (cents ?? 0) / 100;
}

/** Sum a list of {qty, rateCents} line items into an integer-cent subtotal. */
export function lineTotalCents(qty: number, rateCents: number): number {
  return Math.round(qty * rateCents);
}

/** Apply a tax rate (e.g. 0.07 for 7%) to a subtotal in cents, rounded. */
export function taxCents(subtotalCents: number, taxRate: number): number {
  return Math.round(subtotalCents * (taxRate ?? 0));
}
