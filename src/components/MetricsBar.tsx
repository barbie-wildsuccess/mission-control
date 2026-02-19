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
  
  // Calculate active tasks from actual task data
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "review").length;

  const displayMetrics = [
    ...Object.entries(METRIC_CONFIG).map(([key, config]) => {
      const metric = metricMap.get(key);
      const value = key === "active_tasks" ? activeTasks : (metric?.value ?? 0);
      return { key, ...config, value };
    }),
  ];

  return (
    <div className="border-t border-[#1e1e1e] px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {displayMetrics.map((m) => (
            <div key={m.key} className="flex items-center gap-2">
              <span className="text-sm">{m.icon}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-sm text-[#e5e5e5] tabular-nums">
                  {m.format ? m.format(m.value) : m.value.toLocaleString()}
                </span>
                <span className="font-mono text-[9px] text-[#3a3a3a] uppercase tracking-wider">
                  {m.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="font-mono text-[9px] text-[#2a2a2a]">
          MISSION CONTROL v1.0
        </div>
      </div>
    </div>
  );
}
