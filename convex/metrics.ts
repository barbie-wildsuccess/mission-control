import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("metrics").collect();
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("metrics", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }
  },
});

export const increment = mutation({
  args: {
    key: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const amount = args.amount ?? 1;
    const existing = await ctx.db
      .query("metrics")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: existing.value + amount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("metrics", {
        key: args.key,
        value: amount,
        updatedAt: Date.now(),
      });
    }
  },
});
