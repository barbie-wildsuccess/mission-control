import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ops/health
 * 
 * Health check endpoint for monitoring.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      convex: !!process.env.NEXT_PUBLIC_CONVEX_URL,
      supabase: !!process.env.SUPABASE_URL
    }
  });
}
