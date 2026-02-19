import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    emoji: v.string(),
    color: v.string(),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("sleeping")),
    currentTask: v.string(),
    lastSeen: v.number(),
    lastHeartbeat: v.optional(v.number()),
  }).index("by_name", ["name"]),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    assignee: v.string(),
    priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  activities: defineTable({
    agent: v.string(),
    action: v.string(),
    detail: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  metrics: defineTable({
    key: v.string(),
    value: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  revenue: defineTable({
    date: v.string(), // ISO date string (YYYY-MM-DD)
    amount: v.number(), // Amount in cents
    product: v.string(), // Product/service name
    source: v.string(), // "stripe" | "manual" | etc
    stripePaymentId: v.optional(v.string()),
    metadata: v.optional(v.object({
      customer: v.optional(v.string()),
      subscription: v.optional(v.string()),
      currency: v.optional(v.string()),
    })),
    createdAt: v.number(),
  }).index("by_date", ["date"]).index("by_source", ["source"]).index("by_stripe_payment_id", ["stripePaymentId"]),

  buildQueueItems: defineTable({
    sourceId: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
    status: v.union(v.literal("queued"), v.literal("in_progress"), v.literal("shipped")),
    sortOrder: v.number(),
    sourceSection: v.optional(v.string()),
    priorityOverridden: v.boolean(),
    statusOverridden: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_source_id", ["sourceId"]).index("by_status", ["status"]).index("by_priority", ["priority"]),

  leads: defineTable({
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.union(
      v.literal("cold_outreach"),
      v.literal("inbound"),
      v.literal("referral"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("replied"),
      v.literal("meeting"),
      v.literal("proposal"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("nurture")
    ),
    lastContact: v.optional(v.number()),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    value: v.optional(v.number()),
    assignee: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]).index("by_assignee", ["assignee"]),

  actionLogs: defineTable({
    agent: v.string(),
    action: v.string(),
    prediction: v.optional(v.string()),
    category: v.union(
      v.literal("outreach"),
      v.literal("content"),
      v.literal("code"),
      v.literal("research"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failure"),
      v.literal("partial"),
      v.literal("unknown")
    ),
    outcome: v.optional(v.string()),
    lessonsLearned: v.optional(v.string()),
    createdAt: v.number(),
    verifiedAt: v.optional(v.number()),
    autoVerify: v.optional(v.object({
      type: v.union(
        v.literal("email_reply"),
        v.literal("stripe_payment"),
        v.literal("twitter_engagement"),
        v.literal("manual")
      ),
      checkAfterMs: v.number(),
    })),
  }).index("by_agent", ["agent"]).index("by_category", ["category"]).index("by_status", ["status"]),
});
