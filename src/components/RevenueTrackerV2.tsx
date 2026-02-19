"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function RevenueTrackerV2() {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const syncingRef = useRef(false);

  const overview = useQuery(api.revenue.getStripeRealtimeOverview);
  const dailyRevenue = useQuery(api.revenue.getStripeDailyRevenue, { limit: 21 });
  const syncStripe = useAction(api.revenueSync.syncStripe);

  const runSync = useCallback(
    async (manual: boolean) => {
      if (syncingRef.current) return;

      syncingRef.current = true;
      setSyncing(true);
      if (manual) {
        setSyncError(null);
      }

      try {
        const result = await syncStripe();
        if (!result.success && result.error) {
          if (result.error.includes("STRIPE_SECRET_KEY")) {
            setAutoSyncEnabled(false);
          }
          if (manual) {
            setSyncError(result.error);
          }
        }
      } catch (error) {
        if (manual) {
          setSyncError(error instanceof Error ? error.message : "Sync failed");
        }
      } finally {
        syncingRef.current = false;
        setSyncing(false);
      }
    },
    [syncStripe]
  );

  useEffect(() => {
    if (!autoSyncEnabled) return;

    void runSync(false);
    const interval = setInterval(() => {
      void runSync(false);
    }, 60_000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, runSync]);

  const maxDayAmount = useMemo(
    () => Math.max(...((dailyRevenue ?? []).map((day) => day.amount) || [0])),
    [dailyRevenue]
  );

  if (overview === undefined || dailyRevenue === undefined) {
    return (
      <div className="space-y-3">
        <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">Stripe Revenue Tracker</h2>
        <div className="text-xs text-[#737373] font-mono">Loading Stripe revenue data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">Stripe Revenue Tracker</h2>
          <p className="text-xs text-[#737373] font-mono mt-1">
            {autoSyncEnabled ? "Auto-sync every 60s" : "Auto-sync disabled (Stripe key missing)"}
          </p>
        </div>

        <button
          onClick={() => void runSync(true)}
          disabled={syncing}
          className="px-4 py-2 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? "SYNCING..." : "SYNC STRIPE"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded p-4">
          <div className="font-mono text-xs text-emerald-300 uppercase">Total Revenue</div>
          <div className="font-mono text-xl text-white mt-1">{formatCurrency(overview.totalRevenue)}</div>
        </div>
        <div className="border border-cyan-500/20 bg-cyan-500/5 rounded p-4">
          <div className="font-mono text-xs text-cyan-300 uppercase">Last 24h</div>
          <div className="font-mono text-xl text-white mt-1">{formatCurrency(overview.last24hRevenue)}</div>
        </div>
        <div className="border border-amber-500/20 bg-amber-500/5 rounded p-4">
          <div className="font-mono text-xs text-amber-300 uppercase">Products</div>
          <div className="font-mono text-xl text-white mt-1">{overview.connectedProducts}</div>
        </div>
        <div className="border border-slate-500/20 bg-slate-500/5 rounded p-4">
          <div className="font-mono text-xs text-slate-300 uppercase">Transactions</div>
          <div className="font-mono text-xl text-white mt-1">{overview.transactionCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded p-4">
          <h3 className="font-mono text-xs text-[#737373] uppercase tracking-wider mb-3">Revenue by Product</h3>
          <div className="space-y-3 max-h-72 overflow-auto pr-1">
            {overview.productBreakdown.map((item) => {
              const pct = overview.totalRevenue > 0 ? (item.amount / overview.totalRevenue) * 100 : 0;
              return (
                <div key={item.product}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-white font-mono">{item.product}</span>
                    <span className="text-sm text-emerald-400 font-mono">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="mt-1 h-2 bg-[#1a1a1a] rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-[#5f5f5f] font-mono">{item.transactions} payments</div>
                </div>
              );
            })}
            {overview.productBreakdown.length === 0 ? (
              <p className="text-xs text-[#737373] font-mono">No Stripe revenue synced yet.</p>
            ) : null}
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded p-4">
          <h3 className="font-mono text-xs text-[#737373] uppercase tracking-wider mb-3">Daily Revenue Trend</h3>
          <div className="space-y-2">
            {dailyRevenue.slice(0, 12).reverse().map((day) => (
              <div key={day.date} className="flex items-center gap-2">
                <div className="w-16 text-xs text-[#737373] font-mono">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className="flex-1 h-4 bg-[#1a1a1a] rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${maxDayAmount > 0 ? (day.amount / maxDayAmount) * 100 : 0}%` }}
                  />
                </div>
                <div className="w-20 text-right text-xs text-white font-mono">{formatCurrency(day.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded p-3">
        <div className="font-mono text-xs text-[#525252]">
          {syncError
            ? `Sync error: ${syncError}`
            : `Last update: ${
                overview.lastUpdatedAt
                  ? new Date(overview.lastUpdatedAt).toLocaleString("en-US")
                  : "No synced Stripe payments yet"
              }`}
        </div>
      </div>
    </div>
  );
}
