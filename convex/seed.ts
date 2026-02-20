import { mutation } from "./_generated/server";

export const reseed = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing agents
    const existingAgents = await ctx.db.query("agents").collect();
    for (const agent of existingAgents) {
      await ctx.db.delete(agent._id);
    }

    const now = Date.now();

    // Insert new besties
    const agents = [
      { name: "Ken", role: "Code Builder", emoji: "💪", color: "#3B82F6", status: "active" as const, currentTask: "Ready to build", lastSeen: now },
      { name: "Skipper", role: "Research & Discovery", emoji: "🔍", color: "#8B5CF6", status: "idle" as const, currentTask: "Scouting opportunities", lastSeen: now - 300000 },
      { name: "Mrs Honey", role: "Outreach & Growth", emoji: "🍯", color: "#F59E0B", status: "idle" as const, currentTask: "Nurturing connections", lastSeen: now - 600000 },
      { name: "Theresa", role: "Sales & Deals", emoji: "💖", color: "#EC4899", status: "idle" as const, currentTask: "Ready to close", lastSeen: now - 120000 },
    ];

    for (const agent of agents) {
      await ctx.db.insert("agents", agent);
    }

    return "Reseeded with besties!";
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingAgents = await ctx.db.query("agents").collect();
    if (existingAgents.length > 0) {
      return "Already seeded";
    }

    const now = Date.now();

    // Seed agents — the besties
    const agents = [
      { name: "Ken", role: "Code Builder", emoji: "💪", color: "#3B82F6", status: "active" as const, currentTask: "Ready to build", lastSeen: now },
      { name: "Skipper", role: "Research & Discovery", emoji: "🔍", color: "#8B5CF6", status: "idle" as const, currentTask: "Scouting opportunities", lastSeen: now - 300000 },
      { name: "Mrs Honey", role: "Outreach & Growth", emoji: "🍯", color: "#F59E0B", status: "idle" as const, currentTask: "Nurturing connections", lastSeen: now - 600000 },
      { name: "Theresa", role: "Sales & Deals", emoji: "💖", color: "#EC4899", status: "idle" as const, currentTask: "Ready to close", lastSeen: now - 120000 },
    ];

    for (const agent of agents) {
      await ctx.db.insert("agents", agent);
    }

    // Seed tasks
    const tasks = [
      { title: "Build Mission Control Dashboard", description: "Create the real-time monitoring dashboard", status: "in_progress" as const, assignee: "Ken", priority: "P0" as const, createdAt: now, updatedAt: now },
      { title: "Research competitor landscape", description: "Analyze top 10 competitors for positioning", status: "inbox" as const, assignee: "Skipper", priority: "P1" as const, createdAt: now, updatedAt: now },
      { title: "Set up outreach pipeline", description: "Configure email and social outreach infrastructure", status: "inbox" as const, assignee: "Mrs Honey", priority: "P1" as const, createdAt: now, updatedAt: now },
      { title: "Close first deals", description: "Convert warm leads into paying customers", status: "inbox" as const, assignee: "Theresa", priority: "P0" as const, createdAt: now, updatedAt: now },
    ];

    for (const task of tasks) {
      await ctx.db.insert("tasks", task);
    }

    // Seed metrics
    const metrics = [
      { key: "emails_sent", value: 0, updatedAt: now },
      { key: "tweets_posted", value: 0, updatedAt: now },
      { key: "products_shipped", value: 0, updatedAt: now },
      { key: "revenue", value: 0, updatedAt: now },
      { key: "active_tasks", value: 4, updatedAt: now },
    ];

    for (const metric of metrics) {
      await ctx.db.insert("metrics", metric);
    }

    // Seed initial activities
    const activities = [
      { agent: "Ken", action: "Dashboard build started", detail: "Setting up The Dreamhouse mission control", timestamp: now - 60000 },
      { agent: "Skipper", action: "Research queue loaded", detail: "5 competitor targets identified", timestamp: now - 30000 },
      { agent: "Mrs Honey", action: "Outreach pipeline ready", detail: "Email warmup initiated", timestamp: now - 15000 },
      { agent: "Theresa", action: "Sales deck prepared", detail: "Ready to close deals", timestamp: now - 10000 },
    ];

    for (const activity of activities) {
      await ctx.db.insert("activities", activity);
    }

    return "Seeded successfully";
  },
});
