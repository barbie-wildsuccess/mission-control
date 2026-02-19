import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const heartbeat = mutation({
  args: {
    name: v.string(),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("sleeping")),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db.query("agents").collect();
    const agent = agents.find((a) => a.name === args.name);
    if (agent) {
      await ctx.db.patch(agent._id, {
        status: args.status,
        currentTask: args.currentTask ?? agent.currentTask,
        lastSeen: Date.now(),
      });
    }
  },
});

export const updateStatus = mutation({
  args: {
    name: v.string(),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("sleeping")),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agents = await ctx.db.query("agents").collect();
    const agent = agents.find((a) => a.name === args.name);
    if (agent) {
      await ctx.db.patch(agent._id, {
        status: args.status,
        ...(args.currentTask !== undefined && { currentTask: args.currentTask }),
        lastSeen: Date.now(),
      });
    }
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    emoji: v.string(),
    color: v.optional(v.string()),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("sleeping")),
    currentTask: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if agent already exists
    const agents = await ctx.db.query("agents").collect();
    const existing = agents.find((a) => a.name === args.name);
    if (existing) {
      return { ok: false, error: "Agent already exists" };
    }
    
    await ctx.db.insert("agents", {
      ...args,
      color: args.color ?? "#10b981",
      lastSeen: Date.now(),
    });
    return { ok: true };
  },
});

export const update = mutation({
  args: {
    id: v.id("agents"),
    name: v.string(),
    role: v.string(),
    emoji: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return { ok: true };
  },
});

export const remove = mutation({
  args: {
    id: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});
