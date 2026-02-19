import "server-only";

import {
  countRows,
  hasSupabaseServiceEnv,
  insertRows,
  patchRows,
  selectRows,
} from "@/lib/supabaseRest";

type JsonObject = Record<string, unknown>;
type ProposalStatus = "pending" | "approved" | "rejected";
type MissionStatus = "queued" | "running" | "succeeded" | "failed";
type StepStatus = "queued" | "running" | "succeeded" | "failed";
type RiskLevel = "low" | "medium" | "high";

interface OpsPolicyRow {
  key: string;
  value: unknown;
}

export interface OpsProposalRow {
  id: string;
  trigger: string;
  agent: string;
  title: string;
  status: ProposalStatus;
  risk_level: RiskLevel;
  payload: JsonObject;
  reason_rejected: string | null;
  created_at: string;
}

interface OpsMissionRow {
  id: string;
  proposal_id: string;
  status: MissionStatus;
  created_by: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface OpsStepRow {
  id: string;
  mission_id: string;
  proposal_id: string | null;
  kind: string;
  status: StepStatus;
  payload: JsonObject;
  attempts: number;
  last_error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface OpsEventRow {
  id: string;
  mission_id: string | null;
  step_id: string | null;
  proposal_id: string | null;
  agent: string;
  kind: string;
  title: string;
  summary: string;
  tags: string[];
  meta: JsonObject;
  created_at: string;
}

export interface OpsPolicy {
  ops_kernel_enabled: boolean;
  auto_approve_step_kinds: string[];
  daily_quotas: Record<string, number>;
  trigger_cooldowns_minutes: Record<string, number>;
  heartbeat_process_limit: number;
  heartbeat_time_budget_ms: number;
}

export interface StepDraft {
  kind: string;
  payload?: JsonObject;
}

export interface ProposalDraft {
  trigger: string;
  agent?: string;
  title: string;
  risk_level?: RiskLevel;
  payload?: JsonObject;
  steps: StepDraft[];
}

interface TriggerSpec {
  trigger: "standup" | "moltza_post" | "outreach_check";
  title: string;
  summary: string;
}

interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface CreateProposalResult {
  proposal: OpsProposalRow;
  mission: OpsMissionRow | null;
  steps: OpsStepRow[];
  autoApproved: boolean;
  rejected: boolean;
  reason?: string;
}

interface ProcessQueuedSummary {
  attempted: number;
  succeeded: number;
  failed: number;
  skippedByBudget: boolean;
}

interface TriggerEvaluationResult {
  trigger: string;
  created: boolean;
  autoApproved: boolean;
  status: ProposalStatus | "skipped";
  reason?: string;
  proposalId?: string;
}

export interface OpsHeartbeatSummary {
  ok: boolean;
  kernelEnabled: boolean;
  policy: OpsPolicy;
  staleRecovered: number;
  triggers: TriggerEvaluationResult[];
  processed: ProcessQueuedSummary;
  queueDepth: {
    queued: number;
    running: number;
  };
  generatedAt: string;
}

export interface OpsDashboardStatus {
  lastHeartbeat: OpsEventRow | null;
  lastStandup: OpsEventRow | null;
  lastBriefing: OpsEventRow | null;
}

export interface OpsDashboardData {
  events: OpsEventRow[];
  activeSteps: OpsStepRow[];
  status: OpsDashboardStatus;
}

export const DEFAULT_OPS_POLICY: OpsPolicy = {
  ops_kernel_enabled: true,
  auto_approve_step_kinds: ["standup", "moltza_post", "outreach_check"],
  daily_quotas: {
    standup: 1,
    moltza_post: 3,
    outreach_check: 4,
  },
  trigger_cooldowns_minutes: {
    standup: 720,
    moltza_post: 180,
    outreach_check: 360,
  },
  heartbeat_process_limit: 8,
  heartbeat_time_budget_ms: 4000,
};

const POLICY_SEED_ROWS: Array<{ key: string; value: unknown }> = [
  { key: "ops_kernel_enabled", value: DEFAULT_OPS_POLICY.ops_kernel_enabled },
  {
    key: "auto_approve_step_kinds",
    value: DEFAULT_OPS_POLICY.auto_approve_step_kinds,
  },
  { key: "daily_quotas", value: DEFAULT_OPS_POLICY.daily_quotas },
  {
    key: "trigger_cooldowns_minutes",
    value: DEFAULT_OPS_POLICY.trigger_cooldowns_minutes,
  },
  {
    key: "heartbeat_process_limit",
    value: DEFAULT_OPS_POLICY.heartbeat_process_limit,
  },
  {
    key: "heartbeat_time_budget_ms",
    value: DEFAULT_OPS_POLICY.heartbeat_time_budget_ms,
  },
];

const TRIGGERS: TriggerSpec[] = [
  {
    trigger: "standup",
    title: "Draft daily standup update",
    summary: "Prepare and queue a concise daily ops standup.",
  },
  {
    trigger: "moltza_post",
    title: "Draft Moltza social post",
    summary: "Generate and queue a Moltza post for publishing review.",
  },
  {
    trigger: "outreach_check",
    title: "Run outreach health check",
    summary: "Queue follow-up checks for outreach campaigns.",
  },
];

function eq(value: string): string {
  return `eq.${value}`;
}

function gte(value: string): string {
  return `gte.${value}`;
}

function lt(value: string): string {
  return `lt.${value}`;
}

function inList(values: string[]): string {
  return `in.(${values.join(",")})`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function readNumberMap(
  value: unknown,
  fallback: Record<string, number>,
): Record<string, number> {
  if (!isRecord(value)) {
    return fallback;
  }
  const mapped: Record<string, number> = { ...fallback };
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      mapped[key] = entry;
    }
  }
  return mapped;
}

function utcDayBounds(now = new Date()): { start: string; end: string } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function createEvent(params: {
  kind: string;
  title: string;
  summary: string;
  tags?: string[];
  proposalId?: string;
  missionId?: string;
  stepId?: string;
  meta?: JsonObject;
}): Promise<void> {
  await insertRows<OpsEventRow>("ops_events", [
    {
      proposal_id: params.proposalId ?? null,
      mission_id: params.missionId ?? null,
      step_id: params.stepId ?? null,
      kind: params.kind,
      title: params.title,
      summary: params.summary,
      tags: params.tags ?? [],
      meta: params.meta ?? {},
      agent: "ops_kernel",
    },
  ]);
}

async function syncMissionStatus(missionId: string): Promise<void> {
  const steps = await selectRows<Pick<OpsStepRow, "status">>("ops_steps", {
    select: "status",
    mission_id: eq(missionId),
  });

  if (steps.length === 0) {
    return;
  }

  let nextStatus: MissionStatus = "queued";
  if (steps.some((step) => step.status === "running")) {
    nextStatus = "running";
  } else if (steps.some((step) => step.status === "queued")) {
    nextStatus = "queued";
  } else if (steps.some((step) => step.status === "failed")) {
    nextStatus = "failed";
  } else {
    nextStatus = "succeeded";
  }

  const nowIso = new Date().toISOString();
  const update: Record<string, unknown> = { status: nextStatus };

  if (nextStatus === "running") {
    update.started_at = nowIso;
    update.finished_at = null;
  }

  if (nextStatus === "succeeded" || nextStatus === "failed") {
    update.finished_at = nowIso;
  }

  await patchRows<OpsMissionRow>("ops_missions", update, {
    id: eq(missionId),
  });
}

async function checkDailyQuotas(
  steps: StepDraft[],
  policy: OpsPolicy,
): Promise<QuotaCheckResult> {
  const quotaEntries = new Map<string, number>();
  for (const step of steps) {
    quotaEntries.set(step.kind, (quotaEntries.get(step.kind) ?? 0) + 1);
  }

  if (quotaEntries.size === 0) {
    return { allowed: true };
  }

  const { start, end } = utcDayBounds();
  const checks = await Promise.all(
    Array.from(quotaEntries.entries()).map(async ([kind, requested]) => {
      const quota = policy.daily_quotas[kind];
      if (quota === undefined) {
        return { kind, allowed: true };
      }

      const usedToday = await countRows("ops_steps", {
        kind: eq(kind),
        created_at: [gte(start), lt(end)],
      });

      const total = usedToday + requested;
      return {
        kind,
        allowed: total <= quota,
        usedToday,
        requested,
        quota,
      };
    }),
  );

  const blocked = checks.find((item) => !item.allowed);
  if (!blocked) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `Daily quota exceeded for ${blocked.kind}: ${blocked.usedToday}+${blocked.requested} > ${blocked.quota}`,
  };
}

export async function bootstrapPolicyDefaults(): Promise<OpsPolicy> {
  const existingRows = await selectRows<OpsPolicyRow>("ops_policy", {
    select: "key,value",
  });

  const existingKeys = new Set(existingRows.map((row) => row.key));
  const missing = POLICY_SEED_ROWS.filter((row) => !existingKeys.has(row.key));
  if (missing.length > 0) {
    await insertRows<OpsPolicyRow>("ops_policy", missing, {
      onConflict: "key",
      upsert: true,
    });
  }

  const rows = await selectRows<OpsPolicyRow>("ops_policy", {
    select: "key,value",
  });

  const policyMap = new Map(rows.map((row) => [row.key, row.value]));

  return {
    ops_kernel_enabled: readBoolean(
      policyMap.get("ops_kernel_enabled"),
      DEFAULT_OPS_POLICY.ops_kernel_enabled,
    ),
    auto_approve_step_kinds: readStringArray(
      policyMap.get("auto_approve_step_kinds"),
      DEFAULT_OPS_POLICY.auto_approve_step_kinds,
    ),
    daily_quotas: readNumberMap(
      policyMap.get("daily_quotas"),
      DEFAULT_OPS_POLICY.daily_quotas,
    ),
    trigger_cooldowns_minutes: readNumberMap(
      policyMap.get("trigger_cooldowns_minutes"),
      DEFAULT_OPS_POLICY.trigger_cooldowns_minutes,
    ),
    heartbeat_process_limit: readNumber(
      policyMap.get("heartbeat_process_limit"),
      DEFAULT_OPS_POLICY.heartbeat_process_limit,
    ),
    heartbeat_time_budget_ms: readNumber(
      policyMap.get("heartbeat_time_budget_ms"),
      DEFAULT_OPS_POLICY.heartbeat_time_budget_ms,
    ),
  };
}

async function approveProposal(
  proposal: OpsProposalRow,
  steps: StepDraft[],
): Promise<{ mission: OpsMissionRow; steps: OpsStepRow[] }> {
  const [mission] = await insertRows<OpsMissionRow>("ops_missions", [
    {
      proposal_id: proposal.id,
      status: "queued",
      created_by: "ops_kernel",
    },
  ]);

  const stepRows = await insertRows<OpsStepRow>(
    "ops_steps",
    steps.map((step) => ({
      mission_id: mission.id,
      proposal_id: proposal.id,
      kind: step.kind,
      status: "queued",
      payload: step.payload ?? {},
      attempts: 0,
    })),
  );

  await patchRows<OpsProposalRow>(
    "ops_proposals",
    { status: "approved", reason_rejected: null },
    { id: eq(proposal.id) },
  );

  await createEvent({
    kind: "proposal_approved",
    title: "Proposal auto-approved",
    summary: `${proposal.title} approved and enqueued with ${stepRows.length} step(s).`,
    tags: ["ops", "proposal", "approved"],
    proposalId: proposal.id,
    missionId: mission.id,
    meta: {
      trigger: proposal.trigger,
      step_kinds: stepRows.map((step) => step.kind),
    },
  });

  return { mission, steps: stepRows };
}

export async function createProposalAndMaybeAutoApprove(
  draft: ProposalDraft,
  providedPolicy?: OpsPolicy,
): Promise<CreateProposalResult> {
  const policy = providedPolicy ?? (await bootstrapPolicyDefaults());
  const quotaResult = await checkDailyQuotas(draft.steps, policy);

  if (!quotaResult.allowed) {
    const [rejectedProposal] = await insertRows<OpsProposalRow>("ops_proposals", [
      {
        trigger: draft.trigger,
        agent: draft.agent ?? "ops_kernel",
        title: draft.title,
        status: "rejected",
        risk_level: draft.risk_level ?? "low",
        reason_rejected: quotaResult.reason ?? "Daily quota exceeded",
        payload: {
          ...(draft.payload ?? {}),
          steps: draft.steps,
        },
      },
    ]);

    await createEvent({
      kind: "proposal_rejected",
      title: "Proposal rejected by quota gate",
      summary: quotaResult.reason ?? "Daily quota exceeded.",
      tags: ["ops", "proposal", "quota"],
      proposalId: rejectedProposal.id,
      meta: {
        trigger: draft.trigger,
      },
    });

    return {
      proposal: rejectedProposal,
      mission: null,
      steps: [],
      autoApproved: false,
      rejected: true,
      reason: quotaResult.reason,
    };
  }

  const [proposal] = await insertRows<OpsProposalRow>("ops_proposals", [
    {
      trigger: draft.trigger,
      agent: draft.agent ?? "ops_kernel",
      title: draft.title,
      status: "pending",
      risk_level: draft.risk_level ?? "low",
      payload: {
        ...(draft.payload ?? {}),
        steps: draft.steps,
      },
    },
  ]);

  const autoApproveKinds = new Set(policy.auto_approve_step_kinds);
  const shouldAutoApprove =
    draft.steps.length > 0 &&
    draft.steps.every((step) => autoApproveKinds.has(step.kind));

  if (!shouldAutoApprove) {
    await createEvent({
      kind: "proposal_created",
      title: "Proposal queued for approval",
      summary: `${proposal.title} is waiting for manual approval.`,
      tags: ["ops", "proposal", "pending"],
      proposalId: proposal.id,
      meta: {
        trigger: draft.trigger,
      },
    });

    return {
      proposal,
      mission: null,
      steps: [],
      autoApproved: false,
      rejected: false,
    };
  }

  const { mission, steps } = await approveProposal(proposal, draft.steps);

  return {
    proposal: { ...proposal, status: "approved", reason_rejected: null },
    mission,
    steps,
    autoApproved: true,
    rejected: false,
  };
}

async function evaluateTriggers(
  policy: OpsPolicy,
): Promise<TriggerEvaluationResult[]> {
  const results: TriggerEvaluationResult[] = [];
  const now = Date.now();

  for (const trigger of TRIGGERS) {
    const cooldownMinutes =
      policy.trigger_cooldowns_minutes[trigger.trigger] ??
      DEFAULT_OPS_POLICY.trigger_cooldowns_minutes[trigger.trigger];
    const since = new Date(now - cooldownMinutes * 60_000).toISOString();

    const recent = await countRows("ops_proposals", {
      trigger: eq(trigger.trigger),
      created_at: gte(since),
    });

    if (recent > 0) {
      results.push({
        trigger: trigger.trigger,
        created: false,
        autoApproved: false,
        status: "skipped",
        reason: `Cooldown active (${cooldownMinutes}m).`,
      });
      continue;
    }

    const created = await createProposalAndMaybeAutoApprove(
      {
        trigger: trigger.trigger,
        title: trigger.title,
        risk_level: "low",
        payload: {
          source: "heartbeat",
        },
        steps: [
          {
            kind: trigger.trigger,
            payload: {
              trigger: trigger.trigger,
              summary: trigger.summary,
            },
          },
        ],
      },
      policy,
    );

    results.push({
      trigger: trigger.trigger,
      created: true,
      autoApproved: created.autoApproved,
      status: created.proposal.status,
      reason: created.reason,
      proposalId: created.proposal.id,
    });
  }

  return results;
}

async function recoverStaleRunningSteps(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
  const staleSteps = await selectRows<OpsStepRow>("ops_steps", {
    select:
      "id,mission_id,proposal_id,kind,status,payload,attempts,last_error,created_at,started_at,finished_at",
    status: eq("running"),
    started_at: lt(cutoff),
    order: "started_at.asc",
    limit: 100,
  });

  for (const step of staleSteps) {
    await patchRows<OpsStepRow>(
      "ops_steps",
      {
        status: "failed",
        last_error: "Recovered as stale running step (>30 minutes).",
        finished_at: new Date().toISOString(),
      },
      {
        id: eq(step.id),
        status: eq("running"),
      },
    );

    await createEvent({
      kind: "step_recovered_stale",
      title: "Recovered stale running step",
      summary: `Step ${step.kind} was marked failed after running past 30 minutes.`,
      tags: ["ops", "step", "recovery"],
      proposalId: step.proposal_id ?? undefined,
      missionId: step.mission_id,
      stepId: step.id,
      meta: {
        step_kind: step.kind,
      },
    });

    await syncMissionStatus(step.mission_id);
  }

  return staleSteps.length;
}

export async function processQueuedSteps(
  limit: number,
  timeBudgetMs: number,
): Promise<ProcessQueuedSummary> {
  const queued = await selectRows<OpsStepRow>("ops_steps", {
    select:
      "id,mission_id,proposal_id,kind,status,payload,attempts,last_error,created_at,started_at,finished_at",
    status: eq("queued"),
    order: "created_at.asc",
    limit,
  });

  const summary: ProcessQueuedSummary = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    skippedByBudget: false,
  };
  const startedAtMs = Date.now();

  for (const step of queued) {
    const elapsed = Date.now() - startedAtMs;
    if (elapsed > timeBudgetMs) {
      summary.skippedByBudget = true;
      break;
    }

    summary.attempted += 1;

    const startedRows = await patchRows<OpsStepRow>(
      "ops_steps",
      {
        status: "running",
        started_at: new Date().toISOString(),
        attempts: step.attempts + 1,
        last_error: null,
      },
      {
        id: eq(step.id),
        status: eq("queued"),
      },
    );

    if (startedRows.length === 0) {
      continue;
    }

    await patchRows<OpsMissionRow>(
      "ops_missions",
      {
        status: "running",
        started_at: new Date().toISOString(),
      },
      { id: eq(step.mission_id) },
    );

    try {
      await createEvent({
        kind: "step_executed",
        title: `Executed step: ${step.kind}`,
        summary: "MVP executor recorded the step execution event.",
        tags: ["ops", "step", "executed"],
        proposalId: step.proposal_id ?? undefined,
        missionId: step.mission_id,
        stepId: step.id,
        meta: {
          step_kind: step.kind,
          payload: step.payload,
        },
      });

      await patchRows<OpsStepRow>(
        "ops_steps",
        {
          status: "succeeded",
          finished_at: new Date().toISOString(),
        },
        {
          id: eq(step.id),
          status: eq("running"),
        },
      );

      summary.succeeded += 1;
    } catch (error) {
      await patchRows<OpsStepRow>(
        "ops_steps",
        {
          status: "failed",
          finished_at: new Date().toISOString(),
          last_error: error instanceof Error ? error.message : String(error),
        },
        {
          id: eq(step.id),
          status: eq("running"),
        },
      );

      await createEvent({
        kind: "step_failed",
        title: `Step failed: ${step.kind}`,
        summary: "Step execution failed and was marked failed.",
        tags: ["ops", "step", "failed"],
        proposalId: step.proposal_id ?? undefined,
        missionId: step.mission_id,
        stepId: step.id,
        meta: {
          step_kind: step.kind,
        },
      });

      summary.failed += 1;
    }

    await syncMissionStatus(step.mission_id);
  }

  return summary;
}

export async function runOpsHeartbeat(): Promise<OpsHeartbeatSummary> {
  if (!hasSupabaseServiceEnv()) {
    return {
      ok: false,
      kernelEnabled: false,
      policy: DEFAULT_OPS_POLICY,
      staleRecovered: 0,
      triggers: [],
      processed: {
        attempted: 0,
        succeeded: 0,
        failed: 0,
        skippedByBudget: false,
      },
      queueDepth: {
        queued: 0,
        running: 0,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  const policy = await bootstrapPolicyDefaults();
  if (!policy.ops_kernel_enabled) {
    const summary: OpsHeartbeatSummary = {
      ok: true,
      kernelEnabled: false,
      policy,
      staleRecovered: 0,
      triggers: [],
      processed: {
        attempted: 0,
        succeeded: 0,
        failed: 0,
        skippedByBudget: false,
      },
      queueDepth: {
        queued: await countRows("ops_steps", { status: eq("queued") }),
        running: await countRows("ops_steps", { status: eq("running") }),
      },
      generatedAt: new Date().toISOString(),
    };

    await createEvent({
      kind: "heartbeat",
      title: "Ops heartbeat executed",
      summary: "Heartbeat completed while ops kernel is disabled.",
      tags: ["ops", "heartbeat"],
      meta: {
        kernel_enabled: summary.kernelEnabled,
        queue_depth: summary.queueDepth,
      },
    });

    return summary;
  }

  const staleRecovered = await recoverStaleRunningSteps();
  const triggers = await evaluateTriggers(policy);
  const processed = await processQueuedSteps(
    Math.max(1, Math.floor(policy.heartbeat_process_limit)),
    Math.max(500, Math.floor(policy.heartbeat_time_budget_ms)),
  );

  const summary: OpsHeartbeatSummary = {
    ok: true,
    kernelEnabled: true,
    policy,
    staleRecovered,
    triggers,
    processed,
    queueDepth: {
      queued: await countRows("ops_steps", { status: eq("queued") }),
      running: await countRows("ops_steps", { status: eq("running") }),
    },
    generatedAt: new Date().toISOString(),
  };

  await createEvent({
    kind: "heartbeat",
    title: "Ops heartbeat executed",
    summary:
      "Heartbeat evaluated triggers, recovered stale steps, and processed queued work.",
    tags: ["ops", "heartbeat"],
    meta: {
      kernel_enabled: summary.kernelEnabled,
      stale_recovered: summary.staleRecovered,
      queue_depth: summary.queueDepth,
      processed: summary.processed,
      trigger_statuses: summary.triggers.map((trigger) => ({
        trigger: trigger.trigger,
        status: trigger.status,
        created: trigger.created,
      })),
    },
  });

  return summary;
}

export async function listOpsDashboardData(): Promise<OpsDashboardData> {
  const [events, activeSteps, lastHeartbeatRows, lastStandupRows, lastBriefingRows] =
    await Promise.all([
    selectRows<OpsEventRow>("ops_events", {
      select:
        "id,mission_id,step_id,proposal_id,agent,kind,title,summary,tags,meta,created_at",
      order: "created_at.desc",
      limit: 30,
    }),
    selectRows<OpsStepRow>("ops_steps", {
      select:
        "id,mission_id,proposal_id,kind,status,payload,attempts,last_error,created_at,started_at,finished_at",
      status: inList(["queued", "running"]),
      order: "created_at.asc",
      limit: 50,
    }),
    selectRows<OpsEventRow>("ops_events", {
      select:
        "id,mission_id,step_id,proposal_id,agent,kind,title,summary,tags,meta,created_at",
      kind: eq("heartbeat"),
      order: "created_at.desc",
      limit: 1,
    }),
    selectRows<OpsEventRow>("ops_events", {
      select:
        "id,mission_id,step_id,proposal_id,agent,kind,title,summary,tags,meta,created_at",
      kind: eq("standup_generated"),
      order: "created_at.desc",
      limit: 1,
    }),
    selectRows<OpsEventRow>("ops_events", {
      select:
        "id,mission_id,step_id,proposal_id,agent,kind,title,summary,tags,meta,created_at",
      kind: eq("briefing_generated"),
      order: "created_at.desc",
      limit: 1,
    }),
  ]);

  return {
    events,
    activeSteps,
    status: {
      lastHeartbeat: lastHeartbeatRows[0] ?? null,
      lastStandup: lastStandupRows[0] ?? null,
      lastBriefing: lastBriefingRows[0] ?? null,
    },
  };
}
