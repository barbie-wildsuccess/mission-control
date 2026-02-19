import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Create a new lead
export const create = mutation({
  args: {
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
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("replied"),
      v.literal("meeting"),
      v.literal("proposal"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("nurture")
    )),
    assignee: v.optional(v.string()),
    value: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("leads", {
      ...args,
      status: args.status ?? "new",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a lead
export const update = mutation({
  args: {
    id: v.id("leads"),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.union(
      v.literal("cold_outreach"),
      v.literal("inbound"),
      v.literal("referral"),
      v.literal("other")
    )),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("replied"),
      v.literal("meeting"),
      v.literal("proposal"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("nurture")
    )),
    lastContact: v.optional(v.number()),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    value: v.optional(v.number()),
    assignee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const lead = await ctx.db.get(id);
    if (!lead) throw new Error("Lead not found");
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a lead
export const remove = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// List all leads with optional filters
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("replied"),
      v.literal("meeting"),
      v.literal("proposal"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("nurture")
    )),
    assignee: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    } else if (args.assignee) {
      const assignee = args.assignee;
      return await ctx.db
        .query("leads")
        .withIndex("by_assignee", (q) => q.eq("assignee", assignee))
        .order("desc")
        .collect();
    }
    
    return await ctx.db.query("leads").order("desc").collect();
  },
});

// Get a single lead by ID
export const get = query({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get overdue follow-ups
export const getOverdue = query({
  handler: async (ctx) => {
    const now = Date.now();
    const allLeads = await ctx.db.query("leads").collect();
    
    return allLeads.filter(lead => 
      lead.nextActionDate && 
      lead.nextActionDate < now &&
      !["won", "lost"].includes(lead.status)
    );
  },
});

// Get stats
export const getStats = query({
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").collect();
    
    const stats = {
      total: leads.length,
      byStatus: {} as Record<string, number>,
      totalValue: 0,
      wonValue: 0,
    };
    
    leads.forEach(lead => {
      stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
      if (lead.value) {
        stats.totalValue += lead.value;
        if (lead.status === "won") {
          stats.wonValue += lead.value;
        }
      }
    });
    
    return stats;
  },
});
