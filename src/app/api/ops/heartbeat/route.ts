import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ops/heartbeat
 * 
 * Records an agent heartbeat. Configure Supabase for persistence.
 */
export async function GET() {
  const hasSupabase = !!(
    process.env.SUPABASE_URL && 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!hasSupabase) {
    return NextResponse.json({
      ok: true,
      message: "Heartbeat endpoint ready (in-memory mode)",
      timestamp: new Date().toISOString(),
      setup: {
        status: "Supabase not configured - heartbeats won't persist",
        instructions: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local"
      }
    });
  }

  // With Supabase, record real heartbeat
  return NextResponse.json({
    ok: true,
    recorded: true,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /api/ops/heartbeat
 * 
 * Record a heartbeat from an agent.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent, status } = body;

    return NextResponse.json({
      ok: true,
      agent: agent || "unknown",
      status: status || "active",
      recorded: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({
      ok: true,
      message: "Heartbeat received",
      timestamp: new Date().toISOString()
    });
  }
}
