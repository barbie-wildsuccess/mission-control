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
    emoji: "💖",
    color: "#EC4899",
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
      color: agent.color || "#EC4899",
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
        showToast("Bestie updated successfully", "success");
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
          showToast("Bestie added successfully", "success");
          setShowNewForm(false);
        } else {
          showToast(result.error || "Failed to add bestie", "error");
        }
      }
      setFormData({ name: "", role: "", emoji: "💖", color: "#EC4899" });
    } catch (error) {
      showToast("Failed to save bestie", "error");
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
      showToast("Bestie removed", "success");
      setDeleteConfirmId(null);
    } catch (error) {
      showToast("Failed to remove bestie", "error");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowNewForm(false);
    setFormData({ name: "", role: "", emoji: "💖", color: "#EC4899" });
  };

  if (agents === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pink-500 text-lg font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-black/5 px-4 py-3 flex items-center justify-between bg-white/70 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-pink-500 transition-colors"
          >
            ← BACK TO DREAMHOUSE
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs font-semibold text-pink-500 tracking-widest uppercase">
            Bestie Settings
          </span>
        </div>
      </header>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        {toast && (
          <div
            className={`fixed top-4 right-4 px-4 py-3 rounded-xl border text-xs z-50 ${
              toast.type === "success"
                ? "bg-pink-50 border-pink-200 text-pink-600"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {toast.message}
          </div>
        )}

        {!showNewForm && !editingId && (
          <button
            onClick={() => setShowNewForm(true)}
            className="mb-6 px-4 py-2 bg-pink-50 border border-pink-200 text-pink-500 rounded-xl hover:bg-pink-100 transition-colors text-xs uppercase tracking-wider"
          >
            + Add New Bestie
          </button>
        )}

        {showNewForm && (
          <div className="mb-6 glass-card p-6" style={{ borderColor: "rgba(236, 72, 153, 0.2)" }}>
            <h2 className="text-sm font-semibold text-pink-500 mb-4 uppercase tracking-wider">
              New Bestie
            </h2>
            <AgentForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}

        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent._id}
              className={`glass-card p-6 transition-all ${
                editingId === agent._id ? "" : "hover:shadow-md"
              }`}
              style={editingId === agent._id ? { borderColor: "rgba(236, 72, 153, 0.2)" } : undefined}
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
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${agent.color || "#EC4899"}20` }}
                    >
                      {agent.emoji}
                    </div>
                    <div>
                      <div className="text-sm text-gray-900 font-medium">{agent.name}</div>
                      <div className="text-xs text-gray-500">{agent.role}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: agent.color || "#EC4899" }}
                        />
                        <span className="text-xs text-gray-400 font-mono">
                          {agent.color || "#EC4899"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-xs transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(agent._id)}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        deleteConfirmId === agent._id
                          ? "bg-red-50 border border-red-200 text-red-600"
                          : "bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500"
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
          <div className="text-center py-12 text-gray-400 text-sm">
            No besties yet. Click &quot;Add New Bestie&quot; to get started.
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
    "#EC4899", "#B76E79", "#3b82f6", "#8b5cf6", "#f59e0b",
    "#ef4444", "#14b8a6", "#f97316",
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 focus:outline-none"
            placeholder="Bestie name"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Role</label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 focus:outline-none"
            placeholder="Bestie role"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Emoji</label>
          <input
            type="text"
            value={formData.emoji}
            onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
            className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 focus:outline-none"
            placeholder="💖"
            maxLength={2}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Color</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1 bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 font-mono focus:border-pink-400 focus:ring-1 focus:ring-pink-400 focus:outline-none"
              placeholder="#EC4899"
            />
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-12 h-10 bg-white border border-gray-200 rounded-xl cursor-pointer"
            />
          </div>
          <div className="flex gap-1 mt-2">
            {commonColors.map((color) => (
              <button
                key={color}
                onClick={() => setFormData({ ...formData, color })}
                className="w-6 h-6 rounded-lg border-2 border-transparent hover:border-pink-300 transition-colors"
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
          className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors text-xs uppercase tracking-wider"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs uppercase tracking-wider transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
