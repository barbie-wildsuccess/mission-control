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
  { name: "Ken", role: "Code Builder", emoji: "💪", color: "#3B82F6" },
  { name: "Skipper", role: "Research & Discovery", emoji: "🔍", color: "#8B5CF6" },
  { name: "Mrs Honey", role: "Outreach & Growth", emoji: "🍯", color: "#F59E0B" },
  { name: "Theresa", role: "Sales & Deals", emoji: "💖", color: "#EC4899" },
];

const EMOJI_OPTIONS = ["💪", "🔍", "🍯", "💖", "🔧", "⚡", "🚀", "🎨", "🧠", "💡", "🔥", "⭐", "🎀", "✨", "💎"];
const COLOR_OPTIONS = [
  "#EC4899", "#B76E79", "#8b5cf6", "#3B82F6", "#F59E0B",
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
    const names = agents.map(a => a.name.trim());
    if (names.some(n => !n)) {
      setError("All besties must have a name");
      return;
    }
    if (new Set(names).size !== names.length) {
      setError("Bestie names must be unique");
      return;
    }

    setDeploying(true);
    setError(null);

    try {
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
          throw new Error(result.error || "Failed to create bestie");
        }
      }
    } catch (e) {
      console.error("Deploy failed:", e);
      setError(e instanceof Error ? e.message : "Failed to invite besties");
      setDeploying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏠 Invite Your Besties
          </h1>
          <p className="text-gray-500 text-sm">
            Customize your besties before they move in
          </p>
        </div>

        {/* Agent Cards */}
        <div className="space-y-4 mb-8">
          {agents.map((agent, index) => (
            <div
              key={index}
              className="glass-card p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                    Bestie Name
                  </label>
                  <input
                    type="text"
                    value={agent.name}
                    onChange={(e) => updateAgent(index, "name", e.target.value)}
                    className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                    Role
                  </label>
                  <input
                    type="text"
                    value={agent.role}
                    onChange={(e) => updateAgent(index, "role", e.target.value)}
                    className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
                    placeholder="Enter role"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                    Emoji
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => updateAgent(index, "emoji", emoji)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                          agent.emoji === emoji
                            ? "bg-pink-100 border-2 border-pink-500 shadow-sm"
                            : "bg-white/80 border border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
                    Color
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateAgent(index, "color", color)}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          agent.color === color
                            ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-white scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 pt-4 border-t border-black/5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}40` }}
                  >
                    {agent.emoji}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {agent.name || "Unnamed Bestie"}
                    </div>
                    <div className="text-xs text-gray-500">
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
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Deploy Button */}
        <div className="flex justify-center">
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="px-12 py-4 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-lg rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-pink-500/20"
          >
            {deploying ? "INVITING BESTIES..." : "💖 INVITE YOUR BESTIES"}
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          You can edit these later in Settings
        </p>
      </div>
    </div>
  );
}
