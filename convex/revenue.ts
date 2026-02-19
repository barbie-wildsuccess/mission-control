import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Add revenue entry
export const add = mutation({
  args: {
    date: v.string(),
    amount: v.number(),
    product: v.string(),
    source: v.string(),
    stripePaymentId: v.optional(v.string()),
    metadata: v.optional(v.object({
      customer: v.optional(v.string()),
      subscription: v.optional(v.string()),
      currency: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    if (args.stripePaymentId) {
      const existing = await ctx.db
        .query("revenue")
        .withIndex("by_stripe_payment_id", (q) => q.eq("stripePaymentId", args.stripePaymentId!))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          date: args.date,
          amount: args.amount,
          product: args.product,
          source: args.source,
          metadata: args.metadata,
          createdAt: Date.now(),
        });
        return existing._id;
      }
    }

    return await ctx.db.insert("revenue", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Get revenue by date range
export const getByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("revenue")
      .withIndex("by_date", (q) => 
        q.gte("date", args.startDate).lte("date", args.endDate)
      )
      .collect();
  },
});

// Get all revenue entries (limited for dashboard)
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("revenue")
      .withIndex("by_date")
      .order("desc")
      .take(args.limit ?? 100);
  },
});

// Get revenue summary by product
export const getByProduct = query({
  handler: async (ctx) => {
    const revenues = await ctx.db.query("revenue").collect();
    
    const productTotals = revenues.reduce((acc, revenue) => {
      if (!acc[revenue.product]) {
        acc[revenue.product] = 0;
      }
      acc[revenue.product] += revenue.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(productTotals).map(([product, amount]) => ({
      product,
      amount,
    }));
  },
});

// Get revenue summary by time period
export const getSummaryByPeriod = query({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const revenues = await ctx.db.query("revenue").collect();
    
    // Group revenue by period
    const groupedRevenue = revenues.reduce((acc, revenue) => {
      let key: string;
      const date = new Date(revenue.date);
      
      switch (args.period) {
        case "daily":
          key = revenue.date;
          break;
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += revenue.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedRevenue)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => b.period.localeCompare(a.period))
      .slice(0, args.limit ?? 30);
  },
});

// Get total revenue
export const getTotal = query({
  handler: async (ctx) => {
    const revenues = await ctx.db.query("revenue").collect();
    return revenues.reduce((total, revenue) => total + revenue.amount, 0);
  },
});

export const getStripeRealtimeOverview = query({
  handler: async (ctx) => {
    const stripeRevenue = await ctx.db
      .query("revenue")
      .withIndex("by_source", (q) => q.eq("source", "stripe"))
      .collect();

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const productMap = new Map<string, { amount: number; count: number }>();

    let totalRevenue = 0;
    let last24hRevenue = 0;

    for (const item of stripeRevenue) {
      totalRevenue += item.amount;

      const itemDate = new Date(`${item.date}T00:00:00.000Z`).getTime();
      if (!Number.isNaN(itemDate) && itemDate >= oneDayAgo) {
        last24hRevenue += item.amount;
      }

      const product = productMap.get(item.product);
      if (product) {
        product.amount += item.amount;
        product.count += 1;
      } else {
        productMap.set(item.product, { amount: item.amount, count: 1 });
      }
    }

    const productBreakdown = Array.from(productMap.entries())
      .map(([product, stats]) => ({
        product,
        amount: stats.amount,
        transactions: stats.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const recentPayments = [...stripeRevenue]
      .sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;
        return b.createdAt - a.createdAt;
      })
      .slice(0, 8)
      .map((payment) => ({
        id: payment._id,
        date: payment.date,
        product: payment.product,
        amount: payment.amount,
        stripePaymentId: payment.stripePaymentId,
      }));

    const lastUpdatedAt = stripeRevenue.reduce<number | null>(
      (latest, item) => (latest === null || item.createdAt > latest ? item.createdAt : latest),
      null
    );

    return {
      totalRevenue,
      last24hRevenue,
      connectedProducts: productBreakdown.length,
      transactionCount: stripeRevenue.length,
      productBreakdown,
      recentPayments,
      lastUpdatedAt,
    };
  },
});

export const getStripeDailyRevenue = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const stripeRevenue = await ctx.db
      .query("revenue")
      .withIndex("by_source", (q) => q.eq("source", "stripe"))
      .collect();

    const grouped = stripeRevenue.reduce((acc, item) => {
      acc[item.date] = (acc[item.date] ?? 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, args.limit ?? 30);
  },
});

// Seed with mock data for development
export const seedMockData = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existing = await ctx.db.query("revenue").first();
    if (existing) return { message: "Mock data already exists" };

    const mockData = [
      // Product A revenue
      { date: "2026-01-31", amount: 2900, product: "Product A", source: "stripe" },
      { date: "2026-01-30", amount: 900, product: "Product A", source: "stripe" },
      { date: "2026-01-29", amount: 1500, product: "Product A", source: "stripe" },
      { date: "2026-01-28", amount: 500, product: "Product A", source: "stripe" },
      
      // Service subscription revenue
      { date: "2026-01-31", amount: 19900, product: "Service Subscription", source: "stripe" },
      { date: "2026-01-30", amount: 49900, product: "Service Subscription", source: "stripe" },
      { date: "2026-01-25", amount: 64900, product: "Service Subscription", source: "stripe" },
      
      // Product B (new product)
      { date: "2026-02-01", amount: 499, product: "Product B", source: "stripe" },
      { date: "2026-02-01", amount: 499, product: "Product B", source: "stripe" },
      { date: "2026-01-31", amount: 499, product: "Product B", source: "stripe" },
    ];

    for (const data of mockData) {
      await ctx.db.insert("revenue", {
        ...data,
        createdAt: Date.now(),
      });
    }

    return { message: "Mock revenue data seeded successfully" };
  },
});
