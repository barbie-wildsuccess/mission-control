"use client";

import { useMemo, useState } from "react";
import { TaskDetailModal } from "./TaskDetailModal";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "inbox" | "in_progress" | "review" | "done" | "blocked";
  assignee: string;
  priority: "P0" | "P1" | "P2";
  createdAt: number;
  updatedAt: number;
}

interface Agent {
  name: string;
  emoji: string;
}

const COLUMNS: { key: Task["status"]; label: string; color: string }[] = [
  { key: "inbox", label: "INBOX", color: "#525252" },
  { key: "in_progress", label: "IN PROGRESS", color: "#10b981" },
  { key: "review", label: "REVIEW", color: "#f59e0b" },
  { key: "done", label: "DONE", color: "#3b82f6" },
];

function TaskCard({ 
  task, 
  agentMap,
  onClick,
}: { 
  task: Task; 
  agentMap: Map<string, string>;
  onClick: () => void;
}) {
  return (
    <div 
      className="rounded border border-[#1e1e1e] bg-[#0a0a0a] p-2.5 hover:border-[#2a2a2a] transition-colors cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${task.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs text-[#e5e5e5] font-medium leading-tight line-clamp-2">
          {task.title}
        </span>
        <span
          className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
            task.priority === "P0"
              ? "priority-p0"
              : task.priority === "P1"
              ? "priority-p1"
              : "priority-p2"
          }`}
        >
          {task.priority}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs">{agentMap.get(task.assignee) || "⚡"}</span>
        <span className="font-mono text-[10px] text-[#525252]">{task.assignee}</span>
      </div>
    </div>
  );
}

export function TaskBoard({ tasks, agents }: { tasks: Task[]; agents: Agent[] }) {
  const agentMap = new Map(agents.map((a) => [a.name, a.emoji]));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("task");
  });
  const selectedTask = useMemo(
    () => tasks.find((task) => task._id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task._id);
    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set("task", task._id);
    window.history.pushState({}, "", url);
  };

  const handleCloseModal = () => {
    setSelectedTaskId(null);
    // Remove task param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("task");
    window.history.pushState({}, "", url);
  };

  return (
    <>
      <div className="flex-1 flex flex-col rounded-lg border border-[#1e1e1e] bg-[#111111] min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1e1e]">
          <span className="font-mono text-xs text-[#737373] uppercase tracking-wider">
            Task Board
          </span>
          <span className="font-mono text-[10px] text-[#3a3a3a]">
            {tasks.length} tasks
          </span>
        </div>

        {/* Columns */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-4 gap-2 h-full">
            {COLUMNS.map((col) => {
              const columnTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="flex flex-col min-h-0">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <span className="font-mono text-[9px] text-[#525252] tracking-wider">
                      {col.label}
                    </span>
                    <span className="font-mono text-[9px] text-[#3a3a3a]">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {columnTasks.map((task) => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        agentMap={agentMap} 
                        onClick={() => handleTaskClick(task)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal 
        task={selectedTask} 
        agents={agents}
        onClose={handleCloseModal}
      />
    </>
  );
}
