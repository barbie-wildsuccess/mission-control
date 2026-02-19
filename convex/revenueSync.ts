import { action } from "./_generated/server";
import { api } from "./_generated/api";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type StripeCharge = {
  id: string;
  amount: number;
  created: number;
  status: string;
  description?: string | null;
  metadata?: Record<string, string | undefined>;
  customer?: string | null;
  currency?: string;
};

function normalizeProductName(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim();
  if (!cleaned) return undefined;
  return cleaned.replace(/\s+/g, " ");
}

function inferStripeProduct(charge: StripeCharge): string {
  const metadataProduct = normalizeProductName(
    charge.metadata?.product ??
      charge.metadata?.product_name ??
      charge.metadata?.app ??
      charge.metadata?.project
  );
  if (metadataProduct) return metadataProduct;

  const description = normalizeProductName(charge.description);
  if (description) return description;

  return "Stripe Product";
}

async function fetchStripeCharges(stripeKey: string, createdAfterEpochSec: number): Promise<StripeCharge[]> {
  const allCharges: StripeCharge[] = [];
  let hasMore = true;
  let startingAfter: string | null = null;

  while (hasMore) {
    const params = new URLSearchParams({
      limit: "100",
      "created[gte]": String(createdAfterEpochSec),
    });
    if (startingAfter) {
      params.set("starting_after", startingAfter);
    }

    const response = await fetch(`https://api.stripe.com/v1/charges?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${stripeKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as {
      data?: StripeCharge[];
      has_more?: boolean;
    };

    const page = payload.data ?? [];
    allCharges.push(...page);
    hasMore = Boolean(payload.has_more) && page.length > 0;
    startingAfter = page.length > 0 ? page[page.length - 1].id : null;
  }

  return allCharges;
}

// Sync revenue from Stripe
export const syncStripe = action({
  args: {},
  handler: async (ctx) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return {
        success: false,
        error: "STRIPE_SECRET_KEY environment variable not set",
      };
    }

    try {
      const thirtyDaysAgo = Math.floor((Date.now() - THIRTY_DAYS_MS) / 1000);
      const charges = await fetchStripeCharges(stripeKey, thirtyDaysAgo);

      let syncedCount = 0;
      for (const charge of charges) {
        if (charge.status !== "succeeded") continue;

        const date = new Date(charge.created * 1000).toISOString().split("T")[0];
        const product = inferStripeProduct(charge);

        await ctx.runMutation(api.revenue.add, {
          date,
          amount: charge.amount,
          product,
          source: "stripe",
          stripePaymentId: charge.id,
          metadata: {
            customer: charge.customer ?? undefined,
            currency: charge.currency,
          },
        });

        syncedCount += 1;
      }

      return {
        success: true,
        syncedCharges: syncedCount,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown Stripe sync error";
      console.error("Stripe sync error:", error);
      return {
        success: false,
        error: message,
      };
    }
  },
});

// Sync revenue from Whop
export const syncWhop = action({
  args: {},
  handler: async (ctx) => {
    const whopKey = process.env.WHOP_API_KEY;

    if (!whopKey) {
      return {
        success: false,
        error: "WHOP_API_KEY environment variable not set",
      };
    }

    try {
      const thirtyDaysAgo = Date.now() - THIRTY_DAYS_MS;

      const paymentsResponse = await fetch("https://api.whop.com/api/v1/payments", {
        headers: {
          Authorization: `Bearer ${whopKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!paymentsResponse.ok) {
        throw new Error(`Whop API error: ${paymentsResponse.statusText}`);
      }

      const paymentsData = (await paymentsResponse.json()) as {
        data?: Array<{
          created_at: string;
          amount: number;
          product?: { name?: string };
          user?: { email?: string };
        }>;
      };

      let syncedCount = 0;
      for (const payment of paymentsData.data ?? []) {
        const createdAt = new Date(payment.created_at).getTime();
        if (createdAt < thirtyDaysAgo) continue;

        const date = new Date(createdAt).toISOString().split("T")[0];
        await ctx.runMutation(api.revenue.add, {
          date,
          amount: Math.floor(payment.amount * 100),
          product: payment.product?.name ?? "Whop Product",
          source: "whop",
          metadata: {
            customer: payment.user?.email,
          },
        });
        syncedCount += 1;
      }

      return {
        success: true,
        syncedPayments: syncedCount,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown Whop sync error";
      console.error("Whop sync error:", error);
      return {
        success: false,
        error: message,
      };
    }
  },
});
