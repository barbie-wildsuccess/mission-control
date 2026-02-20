"use client";

interface Metric {
  _id: string;
  key: string;
  value: number;
  updatedAt: number;
}

interface Task {
  status: string;
}

const METRIC_CONFIG: Record<string, { label: string; icon: string; format?: (v: number) => string }> = {
  emails_sent: { label: "Emails Sent", icon: "📧" },
  tweets_posted: { label: "Tweets Posted", icon: "🐦" },
  products_shipped: { label: "Products Shipped", icon: "📦" },
  revenue: { label: "Revenue", icon: "💵", format: (v) => `$${v.toLocaleString()}` },
  active_tasks: { label: "Active Tasks", icon: "📋" },
};

export function MetricsBar({ metrics, tasks }: { metrics: Metric[]; tasks: Task[] }) {
  const metricMap = new Map(metrics.map((m) => [m.key, m]));
  
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "review").length;

  const displayMetrics = [
    ...Object.entries(METRIC_CONFIG).map(([key, config]) => {
      const metric = metricMap.get(key);
      const value = key === "active_tasks" ? activeTasks : (metric?.value ?? 0);
      return { key, ...config, value };
    }),
  ];

  return (
    <div className="border-t border-black/5 px-4 py-2.5 bg-white/70 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {displayMetrics.map((m) => (
            <div key={m.key} className="flex items-center gap-2">
              <span className="text-sm">{m.icon}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm text-gray-800 tabular-nums">
                  {m.format ? m.format(m.value) : m.value.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">
                  {m.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[9px] text-gray-300">
          THE DREAMHOUSE v1.0
        </div>
      </div>
    </div>
  );
}
