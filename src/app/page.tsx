"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AgentCards } from "@/components/AgentCards";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TaskBoard } from "@/components/TaskBoard";
import { MetricsBar } from "@/components/MetricsBar";
import { Header } from "@/components/Header";
import { Onboarding } from "@/components/Onboarding";
import { RevenueTrackerV2 } from "@/components/RevenueTrackerV2";
import { BuildQueue } from "@/components/BuildQueue";
import { TaskCreator } from "@/components/TaskCreator";
import { LeadTracker } from "@/components/LeadTracker";
import { ActionLog } from "@/components/ActionLog";
import { useState } from "react";

type TabType = "dashboard" | "leads" | "actions";

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-mono text-xs uppercase tracking-wider rounded transition-colors ${
        isActive
          ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
          : "text-[#737373] hover:text-white hover:bg-[#1e1e1e] border border-transparent"
      }`}
    >
      {label}
    </button>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const activities = useQuery(api.activities.list, { limit: 100 });
  const metrics = useQuery(api.metrics.list);

  const isLoading = agents === undefined || tasks === undefined || activities === undefined || metrics === undefined;
  const isEmpty = agents !== undefined && agents.length === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-emerald-500 font-mono text-lg mb-2">INITIALIZING...</div>
          <div className="w-48 h-1 bg-[#1e1e1e] rounded overflow-hidden">
            <div className="h-full bg-emerald-500 rounded animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return <Onboarding />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "leads":
        return (
          <div className="flex-1 px-4 pb-3 overflow-auto">
            <LeadTracker />
          </div>
        );
      
      case "actions":
        return (
          <div className="flex-1 px-4 pb-3 overflow-auto">
            <ActionLog />
          </div>
        );

      default: // dashboard
        return (
          <div className="flex-1 overflow-auto">
            {/* Agent Status Cards */}
            <div className="px-4 py-3">
              <AgentCards agents={agents} />
            </div>

            {/* Main Content: Activity Feed + Task Board */}
            <div className="flex-1 flex gap-4 px-4 pb-3 min-h-0">
              {/* Activity Feed - 60% */}
              <div className="w-[60%] flex flex-col min-h-0">
                <ActivityFeed activities={activities} agents={agents} />
              </div>

              {/* Task Board - 40% */}
              <div className="w-[40%] flex flex-col min-h-0">
                <TaskBoard tasks={tasks} agents={agents} />
              </div>
            </div>

            {/* Mission Control+ Features */}
            <div className="px-4 pb-6 pt-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">
                  Mission Control+
                </h2>
                <span className="font-mono text-xs text-[#525252]">REVENUE + QUEUE + TASK CREATION</span>
              </div>

              <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg p-4">
                <RevenueTrackerV2 />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg p-4">
                  <BuildQueue />
                </div>
                <div className="xl:col-span-1">
                  <TaskCreator agents={agents} />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header agentCount={agents.length} activeCount={agents.filter(a => a.status === "active").length} />
      
      {/* Tab Navigation */}
      <div className="px-4 py-2 border-b border-[#1e1e1e]">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <TabButton 
              label="Dashboard" 
              isActive={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <TabButton 
              label="Leads" 
              isActive={activeTab === "leads"}
              onClick={() => setActiveTab("leads")}
            />
            <TabButton 
              label="Actions" 
              isActive={activeTab === "actions"}
              onClick={() => setActiveTab("actions")}
            />
          </div>
          <a
            href="/settings"
            className="px-3 py-1 font-mono text-xs text-[#737373] hover:text-emerald-500 hover:bg-[#1e1e1e] rounded transition-colors uppercase tracking-wider"
          >
            ⚙️ Settings
          </a>
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Metrics Bar (only on dashboard) */}
      {activeTab === "dashboard" && (
        <MetricsBar metrics={metrics} tasks={tasks} />
      )}
    </div>
  );
}
