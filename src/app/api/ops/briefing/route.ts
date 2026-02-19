import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ops/briefing
 * 
 * Returns an operations briefing. Configure Supabase for full functionality.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Briefing endpoint ready",
    timestamp: new Date().toISOString(),
    setup: {
      supabase: !!process.env.SUPABASE_URL,
      convex: !!process.env.NEXT_PUBLIC_CONVEX_URL
    }
  });
}
