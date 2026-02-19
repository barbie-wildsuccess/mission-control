import "server-only";

import { countRows, insertRows, selectRows } from "@/lib/supabaseRest";

type JsonObject = Record<string, unknown>;
type StepStatus = "queued" | "running" | "succeeded" | "failed";
type MissionStatus = "queued" | "running" | "succeeded" | "failed";

interface OpsEventSummaryRow {
  id: string;
  kind: string;
  title: string;
  summary: string;
  created_at: string;
}

interface OpsStepSummaryRow {
  id: string;
  kind: string;
  status: StepStatus;
  created_at: string;
  started_at: string | null;
}

interface AgentMemoryRow {
  id: string;
  agent: string;
  text: string;
  tags: string[];
  metadata: JsonObject;
  created_at: string;
}

export interface OpsSummaryResponse {
  ok: true;
  generatedAt: string;
  type: "standup" | "briefing";
  windowHours: number;
  text: string;
  highlights: string[];
  metrics: {
    eventsInWindow: number;
    queueDepth: {
      queued: number;
      running: number;
    };
    stepsInWindow: Record<StepStatus, number>;
    missionsInWindow: Record<MissionStatus, number>;
    memoriesInWindow: number;
  };
  recentEvents: OpsEventSummaryRow[];
  recentMemories: AgentMemoryRow[];
  activeSteps: OpsStepSummaryRow[];
}

export interface OpsHealthResponse {
  ok: true;
  checkedAt: string;
  tables: {
    ops_events: {
      reachable: boolean;
      rowCount: number;
    };
    ops_steps: {
      reachable: boolean;
      rowCount: number;
    };
    agent_memories: {
      reachable: boolean;
      rowCount: number;
    };
  };
}

function eq(value: string): string {
  return `eq.${value}`;
}

function gte(value: string): string {
  return `gte.${value}`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}...`;
}

function parseWindowHours(raw: string | null, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(72, Math.max(1, Math.floor(parsed)));
}

function sinceIsoFromHours(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function startOfUtcDayIso(now = new Date()): string {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  return start.toISOString();
}

function buildEventLines(events: OpsEventSummaryRow[], max = 5): string[] {
  return events.slice(0, max).map((event) => {
    return `- ${event.kind}: ${truncate(event.summary || event.title, 140)}`;
  });
}

function buildMemoryLines(memories: AgentMemoryRow[], max = 4): string[] {
  return memories.slice(0, max).map((memory) => {
    return `- [${memory.agent}] ${truncate(memory.text, 140)}`;
  });
}

async function countStepStatuses(sinceIso: string): Promise<Record<StepStatus, number>> {
  const [queued, running, succeeded, failed] = await Promise.all([
    countRows("ops_steps", { status: eq("queued"), created_at: gte(sinceIso) }),
    countRows("ops_steps", { status: eq("running"), created_at: gte(sinceIso) }),
    countRows("ops_steps", { status: eq("succeeded"), created_at: gte(sinceIso) }),
    countRows("ops_steps", { status: eq("failed"), created_at: gte(sinceIso) }),
  ]);

  return { queued, running, succeeded, failed };
}

async function countMissionStatuses(
  sinceIso: string,
): Promise<Record<MissionStatus, number>> {
  const [queued, running, succeeded, failed] = await Promise.all([
    countRows("ops_missions", { status: eq("queued"), created_at: gte(sinceIso) }),
    countRows("ops_missions", { status: eq("running"), created_at: gte(sinceIso) }),
    countRows("ops_missions", { status: eq("succeeded"), created_at: gte(sinceIso) }),
    countRows("ops_missions", { status: eq("failed"), created_at: gte(sinceIso) }),
  ]);

  return { queued, running, succeeded, failed };
}

async function countQueueDepthNow(): Promise<{ queued: number; running: number }> {
  const [queued, running] = await Promise.all([
    countRows("ops_steps", { status: eq("queued") }),
    countRows("ops_steps", { status: eq("running") }),
  ]);
  return { queued, running };
}

async function recordSummaryEvent(
  kind: "standup_generated" | "briefing_generated",
  title: string,
  text: string,
  meta: JsonObject,
): Promise<void> {
  const row: Record<string, unknown> = {
    kind,
    title,
    summary: text,
    tags: ["ops", "summary", kind.replace("_generated", "")],
    meta,
    agent: "ops_kernel",
  };

  await insertRows<Record<string, unknown>>("ops_events", [row]);
}

export async function buildStandupSummary(windowHours = 24): Promise<OpsSummaryResponse> {
  const boundedWindowHours = Math.min(72, Math.max(1, Math.floor(windowHours)));
  const sinceIso = sinceIsoFromHours(boundedWindowHours);
  const generatedAt = new Date().toISOString();

  const [
    recentEvents,
    recentMemories,
    activeSteps,
    eventsInWindow,
    memoriesInWindow,
    queueDepth,
    stepsInWindow,
    missionsInWindow,
  ] = await Promise.all([
    selectRows<OpsEventSummaryRow>("ops_events", {
      select: "id,kind,title,summary,created_at",
      created_at: gte(sinceIso),
      order: "created_at.desc",
      limit: 12,
    }),
    selectRows<AgentMemoryRow>("agent_memories", {
      select: "id,agent,text,tags,metadata,created_at",
      created_at: gte(sinceIso),
      order: "created_at.desc",
      limit: 8,
    }),
    selectRows<OpsStepSummaryRow>("ops_steps", {
      select: "id,kind,status,created_at,started_at",
      status: "in.(queued,running)",
      order: "created_at.asc",
      limit: 10,
    }),
    countRows("ops_events", { created_at: gte(sinceIso) }),
    countRows("agent_memories", { created_at: gte(sinceIso) }),
    countQueueDepthNow(),
    countStepStatuses(sinceIso),
    countMissionStatuses(sinceIso),
  ]);

  const highlights = [
    `${eventsInWindow} ops event(s) captured in the last ${boundedWindowHours}h.`,
    `${stepsInWindow.succeeded} step(s) succeeded, ${stepsInWindow.failed} failed in that window.`,
    `Queue depth is ${queueDepth.queued} queued / ${queueDepth.running} running.`,
    `${memoriesInWindow} shared memory item(s) were written.`,
  ];

  const text = [
    `Mission Control Standup (${generatedAt})`,
    `Window: last ${boundedWindowHours} hour(s)`,
    `Ops activity: ${eventsInWindow} event(s), ${missionsInWindow.succeeded} mission(s) succeeded, ${missionsInWindow.failed} failed.`,
    `Step queue: ${queueDepth.queued} queued, ${queueDepth.running} running.`,
    "",
    "Highlights:",
    ...buildEventLines(recentEvents, 5),
    "",
    "Shared Memory:",
    ...buildMemoryLines(recentMemories, 4),
  ].join("\n");

  await recordSummaryEvent(
    "standup_generated",
    "Standup summary generated",
    text,
    {
      window_hours: boundedWindowHours,
      events_in_window: eventsInWindow,
      memories_in_window: memoriesInWindow,
    },
  );

  return {
    ok: true,
    generatedAt,
    type: "standup",
    windowHours: boundedWindowHours,
    text,
    highlights,
    metrics: {
      eventsInWindow,
      queueDepth,
      stepsInWindow,
      missionsInWindow,
      memoriesInWindow,
    },
    recentEvents,
    recentMemories,
    activeSteps,
  };
}

export async function buildMorningBriefing(): Promise<OpsSummaryResponse> {
  const windowHours = 24;
  const sinceMidnightIso = startOfUtcDayIso();
  const recentSinceIso = sinceIsoFromHours(windowHours);
  const generatedAt = new Date().toISOString();

  const [
    eventsSinceMidnight,
    queueDepth,
    activeSteps,
    recentMemories,
    memoriesInWindow,
    eventsInWindow,
    stepsInWindow,
    missionsInWindow,
    lastStandup,
  ] = await Promise.all([
    selectRows<OpsEventSummaryRow>("ops_events", {
      select: "id,kind,title,summary,created_at",
      created_at: gte(sinceMidnightIso),
      order: "created_at.desc",
      limit: 15,
    }),
    countQueueDepthNow(),
    selectRows<OpsStepSummaryRow>("ops_steps", {
      select: "id,kind,status,created_at,started_at",
      status: "in.(queued,running)",
      order: "created_at.asc",
      limit: 10,
    }),
    selectRows<AgentMemoryRow>("agent_memories", {
      select: "id,agent,text,tags,metadata,created_at",
      created_at: gte(recentSinceIso),
      order: "created_at.desc",
      limit: 8,
    }),
    countRows("agent_memories", { created_at: gte(recentSinceIso) }),
    countRows("ops_events", { created_at: gte(recentSinceIso) }),
    countStepStatuses(recentSinceIso),
    countMissionStatuses(recentSinceIso),
    selectRows<OpsEventSummaryRow>("ops_events", {
      select: "id,kind,title,summary,created_at",
      kind: eq("standup_generated"),
      order: "created_at.desc",
      limit: 1,
    }),
  ]);

  const lastStandupAt = lastStandup[0]?.created_at ?? null;
  const highlights = [
    `${eventsSinceMidnight.length} event(s) logged since 00:00 UTC.`,
    `Queue currently ${queueDepth.queued} queued / ${queueDepth.running} running.`,
    `Past 24h: ${missionsInWindow.succeeded} mission(s) succeeded and ${stepsInWindow.failed} step(s) failed.`,
    lastStandupAt
      ? `Most recent standup was generated at ${lastStandupAt}.`
      : "No standup summary has been generated yet.",
  ];

  const text = [
    `Mission Control Morning Briefing (${generatedAt})`,
    "Coverage: since 00:00 UTC plus trailing 24h metrics",
    `Queue depth: ${queueDepth.queued} queued, ${queueDepth.running} running.`,
    `Trailing 24h: ${eventsInWindow} event(s), ${missionsInWindow.succeeded} mission(s) succeeded, ${missionsInWindow.failed} failed.`,
    lastStandupAt
      ? `Last standup generated: ${lastStandupAt}`
      : "Last standup generated: none",
    "",
    "Overnight Events:",
    ...buildEventLines(eventsSinceMidnight, 6),
    "",
    "Shared Memory Notes:",
    ...buildMemoryLines(recentMemories, 4),
  ].join("\n");

  await recordSummaryEvent(
    "briefing_generated",
    "Morning briefing generated",
    text,
    {
      since_midnight_utc: sinceMidnightIso,
      events_since_midnight: eventsSinceMidnight.length,
      queue_depth: queueDepth,
      memories_in_24h: memoriesInWindow,
    },
  );

  return {
    ok: true,
    generatedAt,
    type: "briefing",
    windowHours,
    text,
    highlights,
    metrics: {
      eventsInWindow,
      queueDepth,
      stepsInWindow,
      missionsInWindow,
      memoriesInWindow,
    },
    recentEvents: eventsSinceMidnight,
    recentMemories,
    activeSteps,
  };
}

export function resolveSummaryFormat(request: Request): "json" | "text" {
  const url = new URL(request.url);
  const requested = url.searchParams.get("format");
  if (requested === "text") {
    return "text";
  }
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/plain")) {
    return "text";
  }
  return "json";
}

export function parseStandupWindowHours(request: Request): number {
  const url = new URL(request.url);
  return parseWindowHours(url.searchParams.get("hours"), 24);
}

export async function checkOpsDbHealth(): Promise<OpsHealthResponse> {
  const [opsEventsCount, opsStepsCount, memoriesCount] = await Promise.all([
    countRows("ops_events", {}),
    countRows("ops_steps", {}),
    countRows("agent_memories", {}),
  ]);

  return {
    ok: true,
    checkedAt: new Date().toISOString(),
    tables: {
      ops_events: {
        reachable: true,
        rowCount: opsEventsCount,
      },
      ops_steps: {
        reachable: true,
        rowCount: opsStepsCount,
      },
      agent_memories: {
        reachable: true,
        rowCount: memoriesCount,
      },
    },
  };
}
