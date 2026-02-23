import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_timestamp")
      .order("desc")
      .take(50);
    return messages.reverse();
  },
});

export const send = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      sender: "user",
      text: args.text,
      timestamp: Date.now(),
      processed: false,
    });
  },
});

export const addResponse = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("chatMessages", {
      sender: "barbie",
      text: args.text,
      timestamp: Date.now(),
    });
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_processed")
      .filter((q) => q.eq(q.field("processed"), false))
      .collect();
    return messages;
  },
});

export const markProcessed = mutation({
  args: { id: v.id("chatMessages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { processed: true });
  },
});
