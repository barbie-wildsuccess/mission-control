"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";

interface AgentFormData {
  id?: Id<"agents">;
  name: string;
  role: string;
  emoji: string;
  color: string;
}

export default function SettingsPage() {
  const agents = useQuery(api.agents.list);
  const updateAgent = useMutation(api.agents.update);
  const removeAgent = useMutation(api.agents.remove);
  const createAgent = useMutation(api.agents.create);

  const [editingId, setEditingId] = useState<Id<"agents"> | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<Id<"agents"> | null>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    role: "",
    emoji: "🤖",
    color: "#10b981",
  });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (agent: any) => {
    setEditingId(agent._id);
    setFormData({
      id: agent._id,
      name: agent.name,
      role: agent.role,
      emoji: agent.emoji,
      color: agent.color || "#10b981",
    });
    setShowNewForm(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role || !formData.emoji) {
      showToast("Please fill in all fields", "error");
      return;
    }

    try {
      if (editingId) {
        await updateAgent({
          id: editingId,
          name: formData.name,
          role: formData.role,
          emoji: formData.emoji,
          color: formData.color,
        });
        showToast("Agent updated successfully", "success");
        setEditingId(null);
      } else {
        const result = await createAgent({
          name: formData.name,
          role: formData.role,
          emoji: formData.emoji,
          color: formData.color,
          status: "idle",
          currentTask: "Waiting for assignment",
        });
        if (result.ok) {
          showToast("Agent created successfully", "success");
          setShowNewForm(false);
        } else {
          showToast(result.error || "Failed to create agent", "error");
        }
      }
      setFormData({ name: "", role: "", emoji: "🤖", color: "#10b981" });
    } catch (error) {
      showToast("Failed to save agent", "error");
    }
  };

  const handleDelete = async (id: Id<"agents">) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }

    try {
      await removeAgent({ id });
      showToast("Agent deleted successfully", "success");
      setDeleteConfirmId(null);
    } catch (error) {
      showToast("Failed to delete agent", "error");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowNewForm(false);
    setFormData({ name: "", role: "", emoji: "🤖", color: "#10b981" });
  };

  if (agents === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-emerald-500 font-mono text-lg">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#1e1e1e] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-xs text-[#525252] hover:text-emerald-500 transition-colors"
          >
            ← BACK TO DASHBOARD
          </Link>
          <div className="h-4 w-px bg-[#2a2a2a]" />
          <span className="font-mono text-xs text-emerald-500 tracking-widest uppercase">
            Agent Settings
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-6xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 px-4 py-3 rounded-lg border font-mono text-xs z-50 ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-red-500/10 border-red-500/30 text-red-500"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Add New Agent Button */}
        {!showNewForm && !editingId && (
          <button
            onClick={() => setShowNewForm(true)}
            className="mb-6 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded hover:bg-emerald-500/30 transition-colors font-mono text-xs uppercase tracking-wider"
          >
            + Add New Agent
          </button>
        )}

        {/* New Agent Form */}
        {showNewForm && (
          <div className="mb-6 bg-[#0c0c0c] border border-emerald-500/30 rounded-lg p-6">
            <h2 className="font-mono text-sm text-emerald-500 mb-4 uppercase tracking-wider">
              New Agent
            </h2>
            <AgentForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* Agent List */}
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent._id}
              className={`bg-[#0c0c0c] border rounded-lg p-6 transition-all ${
                editingId === agent._id
                  ? "border-emerald-500/30"
                  : "border-[#1e1e1e] hover:border-[#2a2a2a]"
              }`}
            >
              {editingId === agent._id ? (
                <AgentForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${agent.color || "#10b981"}20` }}
                    >
                      {agent.emoji}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-white">{agent.name}</div>
                      <div className="font-mono text-xs text-[#737373]">{agent.role}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: agent.color || "#10b981" }}
                        />
                        <span className="font-mono text-xs text-[#525252]">
                          {agent.color || "#10b981"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="px-3 py-1 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#737373] hover:text-white rounded font-mono text-xs transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(agent._id)}
                      className={`px-3 py-1 rounded font-mono text-xs transition-colors ${
                        deleteConfirmId === agent._id
                          ? "bg-red-500/20 border border-red-500/30 text-red-500"
                          : "bg-[#1e1e1e] hover:bg-red-500/10 text-[#737373] hover:text-red-500"
                      }`}
                    >
                      {deleteConfirmId === agent._id ? "CONFIRM?" : "DELETE"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {agents.length === 0 && !showNewForm && (
          <div className="text-center py-12 text-[#525252] font-mono text-sm">
            No agents yet. Click "Add New Agent" to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function AgentForm({
  formData,
  setFormData,
  onSave,
  onCancel,
}: {
  formData: AgentFormData;
  setFormData: (data: AgentFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const commonColors = [
    "#10b981", // emerald
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ef4444", // red
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs text-[#737373] mb-2 uppercase tracking-wider">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-[#000] border border-[#2a2a2a] rounded px-3 py-2 font-mono text-sm text-white focus:border-emerald-500/30 focus:outline-none"
            placeholder="Agent name"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-[#737373] mb-2 uppercase tracking-wider">
            Role
          </label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-[#000] border border-[#2a2a2a] rounded px-3 py-2 font-mono text-sm text-white focus:border-emerald-500/30 focus:outline-none"
            placeholder="Agent role"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs text-[#737373] mb-2 uppercase tracking-wider">
            Emoji
          </label>
          <input
            type="text"
            value={formData.emoji}
            onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
            className="w-full bg-[#000] border border-[#2a2a2a] rounded px-3 py-2 font-mono text-sm text-white focus:border-emerald-500/30 focus:outline-none"
            placeholder="🤖"
            maxLength={2}
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-[#737373] mb-2 uppercase tracking-wider">
            Color
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1 bg-[#000] border border-[#2a2a2a] rounded px-3 py-2 font-mono text-sm text-white focus:border-emerald-500/30 focus:outline-none"
              placeholder="#10b981"
            />
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-12 h-10 bg-[#000] border border-[#2a2a2a] rounded cursor-pointer"
            />
          </div>
          <div className="flex gap-1 mt-2">
            {commonColors.map((color) => (
              <button
                key={color}
                onClick={() => setFormData({ ...formData, color })}
                className="w-6 h-6 rounded border-2 border-transparent hover:border-white transition-colors"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded hover:bg-emerald-500/30 transition-colors font-mono text-xs uppercase tracking-wider"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-[#737373] hover:text-white rounded font-mono text-xs uppercase tracking-wider transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
