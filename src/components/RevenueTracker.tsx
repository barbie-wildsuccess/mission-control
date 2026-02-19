"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

type Period = "daily" | "weekly" | "monthly";

export function RevenueTracker() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("daily");
  
  const total = useQuery(api.revenue.getTotal);
  const byProduct = useQuery(api.revenue.getByProduct);
  const summaryData = useQuery(api.revenue.getSummaryByPeriod, {
    period: selectedPeriod,
    limit: 10,
  });

  const isLoading = total === undefined || byProduct === undefined || summaryData === undefined;

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatPeriodLabel = (period: string, type: Period) => {
    switch (type) {
      case "daily":
        return new Date(period).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "weekly":
        return `Week of ${new Date(period).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      case "monthly":
        const [year, month] = period.split("-");
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { 
          month: "long", 
          year: "numeric" 
        });
      default:
        return period;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">
            Revenue Tracker
          </h2>
          <div className="text-xs text-[#525252] font-mono">LOADING...</div>
        </div>
        <div className="h-64 bg-[#0c0c0c] border border-[#1e1e1e] rounded flex items-center justify-center">
          <div className="text-[#525252] font-mono">Loading revenue data...</div>
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...(summaryData?.map(d => d.amount) || [0]));

  return (
    <div className="space-y-4">
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">
          Revenue Tracker
        </h2>
        <div className="text-right">
          <div className="text-xs text-[#525252] font-mono">TOTAL REVENUE</div>
          <div className="font-mono text-lg text-white">{formatCurrency(total || 0)}</div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-[#0c0c0c] border border-[#1e1e1e] rounded inline-flex">
        {(["daily", "weekly", "monthly"] as Period[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded transition-colors ${ 
              selectedPeriod === period
                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                : "text-[#737373] hover:text-white hover:bg-[#1e1e1e]"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded p-4">
          <h3 className="font-mono text-xs text-[#525252] uppercase tracking-wider mb-4">
            {selectedPeriod} Revenue
          </h3>
          <div className="space-y-3">
            {summaryData?.slice(0, 7).map((item, index) => (
              <div key={item.period} className="flex items-center gap-3">
                <div className="w-16 text-xs text-[#525252] font-mono">
                  {formatPeriodLabel(item.period, selectedPeriod).slice(0, 8)}
                </div>
                <div className="flex-1 h-4 bg-[#1e1e1e] rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{
                      width: `${(item.amount / maxAmount) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-xs text-white font-mono text-right">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product breakdown */}
        <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded p-4">
          <h3 className="font-mono text-xs text-[#525252] uppercase tracking-wider mb-4">
            By Product
          </h3>
          <div className="space-y-3">
            {byProduct?.map((item, index) => (
              <div key={item.product} className="flex items-center gap-3">
                <div className="flex-1 text-xs text-[#737373] font-mono">
                  {item.product}
                </div>
                <div className="text-xs text-white font-mono">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stripe integration note */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="font-mono text-xs text-amber-500 uppercase tracking-wider">
            Integration Ready
          </span>
        </div>
        <p className="text-xs text-[#737373] leading-relaxed">
          Add your Stripe API key to sync real revenue data automatically.
          <br />
          <span className="text-amber-500 font-mono">ENV: STRIPE_SECRET_KEY</span>
        </p>
      </div>
    </div>
  );
}