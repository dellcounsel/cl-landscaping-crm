import { NextResponse } from "next/server";
import { materializeAllRecurrences } from "@/lib/recurrence";

// Node runtime: uses the service-role client. Vercel Cron invokes this daily
// (see vercel.json) with an Authorization: Bearer <CRON_SECRET> header.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await materializeAllRecurrences();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
