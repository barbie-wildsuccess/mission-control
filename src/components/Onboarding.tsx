"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AgentFormData {
  name: string;
  role: string;
  emoji: string;
  color: string;
}

const DEFAULT_AGENTS: AgentFormData[] = [
  { name: "Jarvis", role: "Squad Lead", emoji: "🎯", color: "#10b981" },
  { name: "Closer", role: "Outreach Specialist", emoji: "💰", color: "#f59e0b" },
  { name: "Ghost", role: "Content & SEO Writer", emoji: "✍️", color: "#8b5cf6" },
  { name: "Hype", role: "Social Media Manager", emoji: "📱", color: "#ec4899" },
  { name: "Forge", role: "Builder", emoji: "🔧", color: "#3b82f6" },
];

const EMOJI_OPTIONS = ["🎯", "💰", "✍️", "📱", "🔧", "🔍", "⚡", "🚀", "🎨", "🧠", "💡", "🔥", "⭐", "🎪", "🎭"];
const COLOR_OPTIONS = [
  "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6",
  "#14b8a6", "#f97316", "#06b6d4", "#a855f7", "#f43f5e"
];

export function Onboarding() {
  const [agents, setAgents] = useState<AgentFormData[]>(DEFAULT_AGENTS);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createAgent = useMutation(api.agents.create);

  const updateAgent = (index: number, field: keyof AgentFormData, value: string) => {
    const newAgents = [...agents];
    newAgents[index] = { ...newAgents[index], [field]: value };
    setAgents(newAgents);
  };

  const handleDeploy = async () => {
    // Validation
    const names = agents.map(a => a.name.trim());
    if (names.some(n => !n)) {
      setError("All agents must have a name");
      return;
    }
    if (new Set(names).size !== names.length) {
      setError("Agent names must be unique");
      return;
    }

    setDeploying(true);
    setError(null);

    try {
      // Create all agents
      for (const agent of agents) {
        const result = await createAgent({
          name: agent.name.trim(),
          role: agent.role.trim(),
          emoji: agent.emoji,
          color: agent.color,
          status: "idle",
          currentTask: "Ready to start",
        });

        if (!result.ok) {
          throw new Error(result.error || "Failed to create agent");
        }
      }

      // Success - page will automatically refresh when agents exist
      // No need to do anything else, the query will update
    } catch (e) {
      console.error("Deploy failed:", e);
      setError(e instanceof Error ? e.message : "Failed to deploy agents");
      setDeploying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-mono font-bold text-emerald-500 mb-2">
            🎯 Name Your Agent Squad
          </h1>
          <p className="text-[#737373] font-mono text-sm">
            Customize your 5 agents before deployment
          </p>
        </div>

        {/* Agent Cards */}
        <div className="space-y-4 mb-8">
          {agents.map((agent, index) => (
            <div
              key={index}
              className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name & Role */}
                <div>
                  <label className="block text-xs font-mono text-[#737373] mb-1.5 uppercase tracking-wider">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agent.name}
                    onChange={(e) => updateAgent(index, "name", e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#737373] mb-1.5 uppercase tracking-wider">
                    Role
                  </label>
                  <input
                    type="text"
                    value={agent.role}
                    onChange={(e) => updateAgent(index, "role", e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    placeholder="Enter role"
                  />
                </div>

                {/* Emoji & Color */}
                <div>
                  <label className="block text-xs font-mono text-[#737373] mb-1.5 uppercase tracking-wider">
                    Emoji
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => updateAgent(index, "emoji", emoji)}
                        className={`w-10 h-10 rounded flex items-center justify-center text-xl transition-colors ${
                          agent.emoji === emoji
                            ? "bg-emerald-500/20 border-2 border-emerald-500"
                            : "bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#3e3e3e]"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#737373] mb-1.5 uppercase tracking-wider">
                    Color
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateAgent(index, "color", color)}
                        className={`w-10 h-10 rounded transition-all ${
                          agent.color === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#0c0c0c] scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 pt-4 border-t border-[#1e1e1e]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}40` }}
                  >
                    {agent.emoji}
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-white">
                      {agent.name || "Unnamed Agent"}
                    </div>
                    <div className="text-xs font-mono text-[#737373]">
                      {agent.role || "No role assigned"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-500 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Deploy Button */}
        <div className="flex justify-center">
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="px-12 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-black font-mono font-bold text-lg rounded-lg transition-colors uppercase tracking-wider shadow-lg shadow-emerald-500/20"
          >
            {deploying ? "DEPLOYING SQUAD..." : "🚀 DEPLOY SQUAD"}
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-[#525252] font-mono mt-6">
          You can edit these later in Settings
        </p>
      </div>
    </div>
  );
}
