"use client";

interface Agent {
  _id: string;
  name: string;
  role: string;
  emoji: string;
  color?: string;
  status: "idle" | "active" | "sleeping";
  currentTask: string;
  lastSeen: number;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatusIndicator({ status, color = "#10b981" }: { status: string; color?: string }) {
  if (status === "active") {
    return (
      <div className="relative">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75" style={{ backgroundColor: color }} />
      </div>
    );
  }
  if (status === "sleeping") {
    return <span className="text-xs">🌙</span>;
  }
  return <div className="w-2 h-2 rounded-full bg-[#525252]" />;
}

export function AgentCards({ agents }: { agents: Agent[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {agents.map((agent) => {
        const agentColor = agent.color || "#10b981";
        return (
          <div
            key={agent._id}
            className={`
              relative rounded-lg border bg-[#111111] p-3
              transition-all duration-300 w-[160px] flex-shrink-0
              ${agent.status === "active" ? "agent-active" : "hover:border-[#2a2a2a]"}
            `}
            style={{
              borderColor: agent.status === "active" ? `${agentColor}40` : "#1e1e1e",
            }}
          >
            {/* Top row: emoji + name + status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{agent.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-[#e5e5e5]">{agent.name}</div>
                  <div className="text-[10px] font-mono text-[#525252] uppercase tracking-wide">
                    {agent.role}
                  </div>
                </div>
              </div>
              <StatusIndicator status={agent.status} color={agentColor} />
            </div>

            {/* Current task */}
            <div className="text-xs text-[#737373] truncate mb-2 font-mono">
              {agent.currentTask}
            </div>

            {/* Last seen */}
            <div className="text-[10px] font-mono text-[#3a3a3a]">
              {timeAgo(agent.lastSeen)}
            </div>

            {/* Active overlay glow */}
            {agent.status === "active" && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{ backgroundColor: `${agentColor}08` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
