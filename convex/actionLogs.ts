import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Log a new action
export const log = mutation({
  args: {
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
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failure"),
      v.literal("partial"),
      v.literal("unknown")
    )),
    outcome: v.optional(v.string()),
    autoVerify: v.optional(v.object({
      type: v.union(
        v.literal("email_reply"),
        v.literal("stripe_payment"),
        v.literal("twitter_engagement"),
        v.literal("manual")
      ),
      checkAfterMs: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("actionLogs", {
      ...args,
      status: args.status ?? "pending",
      createdAt: Date.now(),
    });
  },
});

// Update action outcome
export const updateOutcome = mutation({
  args: {
    id: v.id("actionLogs"),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failure"),
      v.literal("partial"),
      v.literal("unknown")
    ),
    outcome: v.optional(v.string()),
    lessonsLearned: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const action = await ctx.db.get(id);
    if (!action) throw new Error("Action log not found");
    
    await ctx.db.patch(id, {
      ...updates,
      verifiedAt: Date.now(),
    });
  },
});

// List action logs with filters
export const list = query({
  args: {
    agent: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("outreach"),
      v.literal("content"),
      v.literal("code"),
      v.literal("research"),
      v.literal("other")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failure"),
      v.literal("partial"),
      v.literal("unknown")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.agent) {
      const agent = args.agent;
      return await ctx.db
        .query("actionLogs")
        .withIndex("by_agent", (q) => q.eq("agent", agent))
        .order("desc")
        .take(args.limit ?? 100);
    } else if (args.category) {
      const category = args.category;
      return await ctx.db
        .query("actionLogs")
        .withIndex("by_category", (q) => q.eq("category", category))
        .order("desc")
        .take(args.limit ?? 100);
    } else if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("actionLogs")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(args.limit ?? 100);
    }
    
    return await ctx.db.query("actionLogs").order("desc").take(args.limit ?? 100);
  },
});

// Get pending verifications
export const getPendingVerifications = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("actionLogs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Get success rate stats
export const getStats = query({
  args: {
    agent: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("outreach"),
      v.literal("content"),
      v.literal("code"),
      v.literal("research"),
      v.literal("other")
    )),
  },
  handler: async (ctx, args) => {
    let actions = await ctx.db.query("actionLogs").collect();
    
    // Apply filters
    if (args.agent) {
      actions = actions.filter(a => a.agent === args.agent);
    }
    if (args.category) {
      actions = actions.filter(a => a.category === args.category);
    }
    
    const total = actions.length;
    const byStatus = actions.reduce((acc, action) => {
      acc[action.status] = (acc[action.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const verified = total - (byStatus.pending || 0) - (byStatus.unknown || 0);
    const successful = byStatus.success || 0;
    const successRate = verified > 0 ? (successful / verified) * 100 : 0;
    
    return {
      total,
      byStatus,
      verified,
      successRate: Math.round(successRate * 10) / 10,
    };
  },
});

// Get recent lessons learned
export const getLessons = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db.query("actionLogs").order("desc").collect();
    
    return actions
      .filter(a => a.lessonsLearned)
      .slice(0, args.limit ?? 20)
      .map(a => ({
        id: a._id,
        agent: a.agent,
        action: a.action,
        category: a.category,
        status: a.status,
        lessonsLearned: a.lessonsLearned,
        createdAt: a.createdAt,
      }));
  },
});
