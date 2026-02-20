"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface TaskCreatorProps {
  agents: Array<{ name: string }>;
}

export function TaskCreator({ agents }: TaskCreatorProps) {
  const createTask = useMutation(api.tasks.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"P0" | "P1" | "P2">("P1");
  const [assignee, setAssignee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && assignee.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        status: "inbox",
        assignee,
        priority,
      });

      setTitle("");
      setDescription("");
      setPriority("P1");
      setAssignee("");
      setStatusMessage("Task created");
    } catch (error) {
      console.error("Failed to create task:", error);
      setStatusMessage("Task creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-4 h-full">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-pink-500 tracking-widest uppercase">One-Click Task Creator</h2>
        <p className="text-xs text-gray-400 mt-1">Fill fields and submit to push a task into inbox.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
            rows={4}
            className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:outline-none"
              required
            >
              <option value="">Select bestie</option>
              {agents.map((agent) => (
                <option key={agent.name} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "P0" | "P1" | "P2")}
              className="w-full bg-white/80 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:outline-none"
            >
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="w-full px-3 py-2 rounded-xl bg-pink-500 text-white text-sm uppercase tracking-wide hover:bg-pink-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Creating..." : "Create Task"}
        </button>
      </form>

      {statusMessage ? <div className="mt-3 text-xs text-gray-500">{statusMessage}</div> : null}
    </div>
  );
}
