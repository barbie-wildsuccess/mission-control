import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const priorityOrder: Record<"P0" | "P1" | "P2", number> = {
  P0: 0,
  P1: 1,
  P2: 2,
};

const statusOrder: Record<"queued" | "in_progress" | "shipped", number> = {
  queued: 0,
  in_progress: 1,
  shipped: 2,
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("buildQueueItems").collect();
    const sorted = [...items].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return a.sortOrder - b.sortOrder;
    });

    const counts = {
      queued: sorted.filter((item) => item.status === "queued").length,
      inProgress: sorted.filter((item) => item.status === "in_progress").length,
      shipped: sorted.filter((item) => item.status === "shipped").length,
    };

    const lastUpdatedAt = sorted.reduce<number | null>(
      (latest, item) => (latest === null || item.updatedAt > latest ? item.updatedAt : latest),
      null
    );

    return {
      items: sorted,
      counts,
      lastUpdatedAt,
    };
  },
});

export const syncFromMarkdown = mutation({
  args: {
    items: v.array(
      v.object({
        sourceId: v.string(),
        title: v.string(),
        description: v.string(),
        priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
        status: v.union(v.literal("queued"), v.literal("in_progress"), v.literal("shipped")),
        sortOrder: v.number(),
        sourceSection: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query("buildQueueItems").collect();
    const incomingBySource = new Map(args.items.map((item) => [item.sourceId, item]));
    let upserted = 0;
    let removed = 0;

    for (const record of existing) {
      const incoming = incomingBySource.get(record.sourceId);
      if (!incoming) {
        await ctx.db.delete(record._id);
        removed += 1;
        continue;
      }

      await ctx.db.patch(record._id, {
        title: incoming.title,
        description: incoming.description,
        priority: record.priorityOverridden ? record.priority : incoming.priority,
        status: record.statusOverridden ? record.status : incoming.status,
        sortOrder: incoming.sortOrder,
        sourceSection: incoming.sourceSection,
        updatedAt: now,
      });

      incomingBySource.delete(record.sourceId);
      upserted += 1;
    }

    for (const incoming of incomingBySource.values()) {
      await ctx.db.insert("buildQueueItems", {
        ...incoming,
        priorityOverridden: false,
        statusOverridden: false,
        createdAt: now,
        updatedAt: now,
      });
      upserted += 1;
    }

    return { upserted, removed };
  },
});

export const reprioritize = mutation({
  args: {
    itemId: v.id("buildQueueItems"),
    priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, {
      priority: args.priority,
      priorityOverridden: true,
      updatedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    itemId: v.id("buildQueueItems"),
    status: v.union(v.literal("queued"), v.literal("in_progress"), v.literal("shipped")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, {
      status: args.status,
      statusOverridden: true,
      updatedAt: Date.now(),
    });
  },
});
