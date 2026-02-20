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
          <h2 className="text-sm font-semibold text-pink-500 tracking-widest uppercase">
            Revenue Tracker
          </h2>
          <div className="text-xs text-gray-400">LOADING...</div>
        </div>
        <div className="h-64 glass-card flex items-center justify-center">
          <div className="text-gray-400">Loading revenue data...</div>
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...(summaryData?.map(d => d.amount) || [0]));

  return (
    <div className="space-y-4">
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-pink-500 tracking-widest uppercase">
          Revenue Tracker
        </h2>
        <div className="text-right">
          <div className="text-xs text-gray-400">TOTAL REVENUE</div>
          <div className="text-lg text-gray-900">{formatCurrency(total || 0)}</div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-gray-100/60 rounded-full inline-flex">
        {(["daily", "weekly", "monthly"] as Period[]).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 text-xs uppercase tracking-wider rounded-full transition-all ${ 
              selectedPeriod === period
                ? "bg-pink-500 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white/60 border border-black/5 rounded-xl p-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
            {selectedPeriod} Revenue
          </h3>
          <div className="space-y-3">
            {summaryData?.slice(0, 7).map((item, index) => (
              <div key={item.period} className="flex items-center gap-3">
                <div className="w-16 text-xs text-gray-400 font-mono">
                  {formatPeriodLabel(item.period, selectedPeriod).slice(0, 8)}
                </div>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400"
                    style={{
                      width: `${(item.amount / maxAmount) * 100}%`,
                    }}
                  />
                </div>
                <div className="w-16 text-xs text-gray-900 font-mono text-right">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product breakdown */}
        <div className="bg-white/60 border border-black/5 rounded-xl p-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
            By Product
          </h3>
          <div className="space-y-3">
            {byProduct?.map((item, index) => (
              <div key={item.product} className="flex items-center gap-3">
                <div className="flex-1 text-xs text-gray-500 font-mono">
                  {item.product}
                </div>
                <div className="text-xs text-gray-900 font-mono">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stripe integration note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-amber-600 uppercase tracking-wider">
            Integration Ready
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Add your Stripe API key to sync real revenue data automatically.
          <br />
          <span className="text-amber-600 font-mono">ENV: STRIPE_SECRET_KEY</span>
        </p>
      </div>
    </div>
  );
}
