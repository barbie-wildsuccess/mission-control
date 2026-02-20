"use client";

import { useEffect, useRef, type ReactNode } from "react";

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

interface TaskDetailModalProps {
  task: Task | null;
  agents: Agent[];
  onClose: () => void;
}

const STATUS_COLORS: Record<Task["status"], { bg: string; text: string; border: string }> = {
  inbox: { bg: "rgba(156, 163, 175, 0.1)", text: "#6b7280", border: "rgba(156, 163, 175, 0.2)" },
  in_progress: { bg: "rgba(236, 72, 153, 0.1)", text: "#EC4899", border: "rgba(236, 72, 153, 0.2)" },
  review: { bg: "rgba(245, 158, 11, 0.1)", text: "#d97706", border: "rgba(245, 158, 11, 0.2)" },
  done: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" },
  blocked: { bg: "rgba(239, 68, 68, 0.1)", text: "#dc2626", border: "rgba(239, 68, 68, 0.2)" },
};

const STATUS_LABELS: Record<Task["status"], string> = {
  inbox: "INBOX",
  in_progress: "IN PROGRESS",
  review: "REVIEW",
  done: "DONE",
  blocked: "BLOCKED",
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function linkifyText(text: string): ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-pink-500 hover:text-pink-400 underline transition-colors"
      >
        {match[0]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function TaskDetailModal({ task, agents, onClose }: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const agentMap = new Map(agents.map((a) => [a.name, a.emoji]));

  useEffect(() => {
    if (!task) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [task, onClose]);

  useEffect(() => {
    if (!task || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    closeButtonRef.current?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [task]);

  const copyTaskJSON = async () => {
    if (!task) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(task, null, 2));
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!task) return null;

  const statusColor = STATUS_COLORS[task.status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in"
      >
        <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-black/5">
            <div className="flex-1 min-w-0">
              <h2
                id="task-modal-title"
                className="text-lg font-medium text-gray-900 mb-3 leading-tight"
              >
                {task.title}
              </h2>
              
              <div className="flex flex-wrap gap-2">
                <div
                  className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    background: statusColor.bg,
                    color: statusColor.text,
                    border: `1px solid ${statusColor.border}`,
                  }}
                >
                  {STATUS_LABELS[task.status]}
                </div>

                <div
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold ${
                    task.priority === "P0"
                      ? "priority-p0"
                      : task.priority === "P1"
                      ? "priority-p1"
                      : "priority-p2"
                  }`}
                >
                  {task.priority}
                </div>

                <div className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1.5">
                  <span>{agentMap.get(task.assignee) || "⚡"}</span>
                  <span>{task.assignee}</span>
                </div>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-gray-400 uppercase tracking-wide">Created</span>
                <p className="text-gray-600 mt-1">{formatTimestamp(task.createdAt)}</p>
              </div>
              {task.updatedAt !== task.createdAt && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wide">Updated</span>
                  <p className="text-gray-600 mt-1">{formatTimestamp(task.updatedAt)}</p>
                </div>
              )}
              {task.status === "done" && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wide">Completed</span>
                  <p className="text-gray-600 mt-1">{formatTimestamp(task.updatedAt)}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                Description
              </h3>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {linkifyText(task.description)}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                Task ID
              </h3>
              <code className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                {task._id}
              </code>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-black/5 bg-gray-50/50">
            <button
              onClick={copyTaskJSON}
              className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors flex items-center gap-2"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 11V3C3 2.44772 3.44772 2 4 2H11" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Copy JSON
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-white bg-pink-500 hover:bg-pink-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
