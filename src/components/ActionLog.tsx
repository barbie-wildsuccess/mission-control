"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

type Category = "outreach" | "content" | "code" | "research" | "other";
type Status = "pending" | "success" | "failure" | "partial" | "unknown";

const categoryColors: Record<Category, string> = {
  outreach: "cyan",
  content: "purple",
  code: "emerald",
  research: "blue",
  other: "gray",
};

const statusColors: Record<Status, string> = {
  pending: "amber",
  success: "green",
  failure: "red",
  partial: "orange",
  unknown: "gray",
};

export function ActionLog() {
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterAgent, setFilterAgent] = useState<string | "all">("all");
  
  const actions = useQuery(api.actionLogs.list, {
    category: filterCategory !== "all" ? filterCategory : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    agent: filterAgent !== "all" ? filterAgent : undefined,
    limit: 50,
  });
  
  const stats = useQuery(api.actionLogs.getStats, {
    category: filterCategory !== "all" ? filterCategory : undefined,
    agent: filterAgent !== "all" ? filterAgent : undefined,
  });
  
  const pendingVerifications = useQuery(api.actionLogs.getPendingVerifications);
  const updateOutcome = useMutation(api.actionLogs.updateOutcome);
  
  const isLoading = actions === undefined || stats === undefined;

  // Get unique agents from actions
  const agents = Array.from(new Set(actions?.map(a => a.agent) || []));

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">
            Action Log
          </h2>
          <div className="text-xs text-[#525252] font-mono">LOADING...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">
          Action Log
        </h2>
        
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-xs text-[#525252] font-mono">SUCCESS RATE</div>
            <div className="font-mono text-lg text-emerald-500">
              {stats?.successRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-[#525252] font-mono">TOTAL ACTIONS</div>
            <div className="font-mono text-lg text-white">{stats?.total || 0}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="bg-[#0c0c0c] border border-[#1e1e1e] rounded px-3 py-1 font-mono text-xs text-emerald-500"
        >
          <option value="all">ALL AGENTS</option>
          {agents.map(agent => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as Category | "all")}
          className="bg-[#0c0c0c] border border-[#1e1e1e] rounded px-3 py-1 font-mono text-xs text-cyan-500"
        >
          <option value="all">ALL CATEGORIES</option>
          <option value="outreach">OUTREACH</option>
          <option value="content">CONTENT</option>
          <option value="code">CODE</option>
          <option value="research">RESEARCH</option>
          <option value="other">OTHER</option>
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
          className="bg-[#0c0c0c] border border-[#1e1e1e] rounded px-3 py-1 font-mono text-xs text-purple-500"
        >
          <option value="all">ALL STATUS</option>
          <option value="pending">PENDING</option>
          <option value="success">SUCCESS</option>
          <option value="failure">FAILURE</option>
          <option value="partial">PARTIAL</option>
          <option value="unknown">UNKNOWN</option>
        </select>
      </div>

      {/* Pending verification alert */}
      {pendingVerifications && pendingVerifications.length > 0 && filterStatus === "all" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-xs text-amber-500 uppercase tracking-wider">
              {pendingVerifications.length} Pending Verification
            </span>
          </div>
          <p className="text-xs text-[#737373]">
            Actions waiting for outcome verification
          </p>
        </div>
      )}

      {/* Stats breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
          <div key={status} className="bg-[#0c0c0c] border border-[#1e1e1e] rounded p-3">
            <div className={`text-2xl font-mono text-${statusColors[status as Status]}-500 mb-1`}>
              {count}
            </div>
            <div className="text-xs text-[#525252] font-mono uppercase">
              {status}
            </div>
          </div>
        ))}
      </div>

      {/* Action feed */}
      <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded max-h-[600px] overflow-y-auto">
        <div className="divide-y divide-[#1e1e1e]">
          {actions?.map(action => (
            <div key={action._id} className="p-4 hover:bg-[#1e1e1e] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-emerald-500">{action.agent}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded bg-${categoryColors[action.category]}-500/20 text-${categoryColors[action.category]}-500`}>
                    {action.category}
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded bg-${statusColors[action.status]}-500/20 text-${statusColors[action.status]}-500`}>
                    {action.status}
                  </span>
                </div>
                <div className="text-xs text-[#525252] font-mono">
                  {formatTimestamp(action.createdAt)}
                </div>
              </div>
              
              <div className="text-sm text-white mb-2">{action.action}</div>
              
              {action.prediction && (
                <div className="text-xs text-[#737373] mb-2">
                  🎯 <span className="italic">Predicted: {action.prediction}</span>
                </div>
              )}
              
              {action.outcome && (
                <div className="text-xs text-cyan-500 mb-2">
                  ✓ {action.outcome}
                </div>
              )}
              
              {action.lessonsLearned && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 mt-2">
                  <div className="text-xs text-purple-500 font-mono mb-1">📚 LESSON LEARNED</div>
                  <div className="text-xs text-[#737373]">{action.lessonsLearned}</div>
                </div>
              )}
              
              {action.status === "pending" && (
                <div className="mt-2 pt-2 border-t border-[#1e1e1e]">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOutcome({
                        id: action._id,
                        status: "success",
                        outcome: "Verified successful"
                      })}
                      className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs font-mono text-green-500 hover:bg-green-500/30 transition-colors"
                    >
                      ✓ SUCCESS
                    </button>
                    <button
                      onClick={() => updateOutcome({
                        id: action._id,
                        status: "failure",
                        outcome: "Verified failed"
                      })}
                      className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs font-mono text-red-500 hover:bg-red-500/30 transition-colors"
                    >
                      ✗ FAILED
                    </button>
                    <button
                      onClick={() => updateOutcome({
                        id: action._id,
                        status: "partial",
                        outcome: "Partially successful"
                      })}
                      className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs font-mono text-orange-500 hover:bg-orange-500/30 transition-colors"
                    >
                      ~ PARTIAL
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
