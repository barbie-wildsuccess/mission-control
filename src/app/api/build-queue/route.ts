import { NextResponse } from "next/server";

/**
 * GET /api/build-queue
 * 
 * Returns the build queue from Convex (not local files).
 * This is a template - connect to your Convex backend for real data.
 */
export async function GET() {
  // Return empty queue by default - users should connect to Convex
  // or customize this endpoint for their setup
  return NextResponse.json([]);
}
