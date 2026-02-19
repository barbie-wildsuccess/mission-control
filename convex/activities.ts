import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
    return activities;
  },
});

export const log = mutation({
  args: {
    agent: v.string(),
    action: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activities", {
      agent: args.agent,
      action: args.action,
      detail: args.detail,
      timestamp: Date.now(),
    });
  },
});
