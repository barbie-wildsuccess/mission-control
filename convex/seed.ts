import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingAgents = await ctx.db.query("agents").collect();
    if (existingAgents.length > 0) {
      return "Already seeded";
    }

    const now = Date.now();

    // Seed agents
    const agents = [
      { name: "Jarvis", role: "Squad Lead", emoji: "🎯", color: "#10b981", status: "active" as const, currentTask: "Coordinating agent squad operations", lastSeen: now },
      { name: "Closer", role: "Outreach Specialist", emoji: "💰", color: "#f59e0b", status: "idle" as const, currentTask: "Waiting for leads", lastSeen: now - 300000 },
      { name: "Ghost", role: "Content & SEO Writer", emoji: "✍️", color: "#8b5cf6", status: "idle" as const, currentTask: "Queue empty", lastSeen: now - 600000 },
      { name: "Hype", role: "Social Media Manager", emoji: "📱", color: "#ec4899", status: "idle" as const, currentTask: "No scheduled posts", lastSeen: now - 120000 },
      { name: "Forge", role: "Builder", emoji: "🔧", color: "#3b82f6", status: "sleeping" as const, currentTask: "Sleeping — wakes at 2am", lastSeen: now - 3600000 },
      { name: "Scout", role: "Researcher", emoji: "🔍", color: "#14b8a6", status: "idle" as const, currentTask: "No active research tasks", lastSeen: now - 900000 },
    ];

    for (const agent of agents) {
      await ctx.db.insert("agents", agent);
    }

    // Seed tasks
    const tasks = [
      { title: "Build Mission Control Dashboard", description: "Create the real-time monitoring dashboard for the agent squad", status: "in_progress" as const, assignee: "Forge", priority: "P0" as const, createdAt: now, updatedAt: now },
      { title: "Set up email outreach pipeline", description: "Configure cold email infrastructure with warmup", status: "inbox" as const, assignee: "Closer", priority: "P1" as const, createdAt: now, updatedAt: now },
      { title: "Write 5 SEO blog posts", description: "Target high-value keywords for your business", status: "inbox" as const, assignee: "Ghost", priority: "P1" as const, createdAt: now, updatedAt: now },
      { title: "Launch Twitter content strategy", description: "Plan and schedule first week of tweets", status: "inbox" as const, assignee: "Hype", priority: "P1" as const, createdAt: now, updatedAt: now },
      { title: "Research competitor pricing", description: "Analyze top 10 competitors for positioning", status: "inbox" as const, assignee: "Scout", priority: "P2" as const, createdAt: now, updatedAt: now },
      { title: "Set up monitoring & alerts", description: "Configure uptime monitoring for all properties", status: "inbox" as const, assignee: "Jarvis", priority: "P0" as const, createdAt: now, updatedAt: now },
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
      { key: "active_tasks", value: 6, updatedAt: now },
    ];

    for (const metric of metrics) {
      await ctx.db.insert("metrics", metric);
    }

    // Seed initial activities
    const activities = [
      { agent: "Jarvis", action: "Mission Control initialized", detail: "All systems online. Agent squad activated.", timestamp: now - 60000 },
      { agent: "Jarvis", action: "Squad briefing complete", detail: "6 agents deployed, 6 tasks assigned", timestamp: now - 30000 },
      { agent: "Forge", action: "Build task accepted", detail: "Starting Mission Control dashboard build", timestamp: now - 15000 },
      { agent: "Scout", action: "Research queue loaded", detail: "5 competitor targets identified", timestamp: now - 10000 },
      { agent: "Jarvis", action: "Systems nominal", detail: "All agents reporting. Monitoring active.", timestamp: now },
    ];

    for (const activity of activities) {
      await ctx.db.insert("activities", activity);
    }

    return "Seeded successfully";
  },
});
