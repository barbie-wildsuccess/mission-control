"use client";

import { useEffect, useRef } from "react";

interface Activity {
  _id: string;
  agent: string;
  action: string;
  detail?: string;
  timestamp: number;
}

interface Agent {
  name: string;
  emoji: string;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ActivityFeed({
  activities,
  agents,
}: {
  activities: Activity[];
  agents: Agent[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const agentMap = new Map(agents.map((a) => [a.name, a.emoji]));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-white/30 bg-white/70 backdrop-blur-xl min-h-0 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            Live Activity Feed
          </span>
        </div>
        <span className="text-[10px] text-gray-400">
          {activities.length} events
        </span>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto feed-mask">
        <div className="p-3 space-y-1">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className="group flex items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              {/* Timestamp */}
              <span className="font-mono text-[11px] text-gray-400 shrink-0 tabular-nums pt-0.5">
                {formatTime(activity.timestamp)}
              </span>

              {/* Agent emoji + name */}
              <span className="text-xs shrink-0 pt-0.5">
                <span className="mr-1">{agentMap.get(activity.agent) || "⚡"}</span>
                <span className="text-pink-500/70 font-medium">{activity.agent}</span>
              </span>

              {/* Action */}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-800">{activity.action}</span>
                {activity.detail && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate group-hover:whitespace-normal">
                    {activity.detail}
                  </p>
                )}
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              Waiting for activity...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
