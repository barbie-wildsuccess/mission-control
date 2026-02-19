import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    title: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("blocked")
    ),
    assignee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    const task = tasks.find((t) => t.title === args.title);
    if (task) {
      await ctx.db.patch(task._id, {
        status: args.status,
        ...(args.assignee && { assignee: args.assignee }),
        updatedAt: Date.now(),
      });
    }
  },
});
