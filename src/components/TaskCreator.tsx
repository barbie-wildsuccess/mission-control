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
    <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-lg p-4 h-full">
      <div className="mb-4">
        <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">One-Click Task Creator</h2>
        <p className="text-xs text-[#737373] mt-1">Fill fields and submit to push a task into inbox.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block font-mono text-xs text-[#737373] uppercase mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full bg-[#151515] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-[#525252] focus:border-emerald-500/40 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-[#737373] uppercase mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task description"
            rows={4}
            className="w-full bg-[#151515] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-[#525252] resize-none focus:border-emerald-500/40 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-mono text-xs text-[#737373] uppercase mb-1">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-[#151515] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white focus:border-emerald-500/40 focus:outline-none"
              required
            >
              <option value="">Select agent</option>
              {agents.map((agent) => (
                <option key={agent.name} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs text-[#737373] uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "P0" | "P1" | "P2")}
              className="w-full bg-[#151515] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white focus:border-emerald-500/40 focus:outline-none"
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
          className="w-full px-3 py-2 rounded bg-emerald-500 text-black font-mono text-sm uppercase tracking-wide hover:bg-emerald-400 disabled:bg-[#2a2a2a] disabled:text-[#666] disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Creating..." : "Create Task"}
        </button>
      </form>

      {statusMessage ? <div className="mt-3 text-xs font-mono text-[#737373]">{statusMessage}</div> : null}
    </div>
  );
}
