import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ops/standup
 * 
 * Returns a standup summary. Configure Supabase for full functionality.
 */
export async function GET() {
  const hasSupabase = !!(
    process.env.SUPABASE_URL && 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!hasSupabase) {
    return NextResponse.json({
      ok: true,
      message: "Standup endpoint ready",
      setup: {
        status: "Supabase not configured",
        instructions: [
          "1. Create a Supabase project at supabase.com",
          "2. Add SUPABASE_URL to .env.local",
          "3. Add SUPABASE_SERVICE_ROLE_KEY to .env.local",
          "4. Run the schema migration in /supabase"
        ]
      },
      sample: {
        agents: ["Agent-01", "Agent-02"],
        lastHeartbeat: new Date().toISOString(),
        activeTasks: 0,
        completedToday: 0
      }
    });
  }

  // With Supabase configured, return real data
  // TODO: Import and use buildStandupSummary when Supabase is ready
  return NextResponse.json({
    ok: true,
    message: "Standup ready - Supabase connected",
    timestamp: new Date().toISOString()
  });
}
