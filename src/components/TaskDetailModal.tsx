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
  inbox: { bg: "rgba(82, 82, 82, 0.15)", text: "#737373", border: "rgba(82, 82, 82, 0.3)" },
  in_progress: { bg: "rgba(16, 185, 129, 0.15)", text: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
  review: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" },
  done: { bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
  blocked: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
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
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add the URL as a link
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-500 hover:text-emerald-400 underline transition-colors"
      >
        {match[0]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function TaskDetailModal({ task, agents, onClose }: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const agentMap = new Map(agents.map((a) => [a.name, a.emoji]));

  // Close on ESC key
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

  // Focus trap
  useEffect(() => {
    if (!task || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element (close button)
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

  // Copy to clipboard function
  const copyTaskJSON = async () => {
    if (!task) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(task, null, 2));
      // Could add a toast notification here
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
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
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#1e1e1e]">
            <div className="flex-1 min-w-0">
              <h2
                id="task-modal-title"
                className="text-lg font-medium text-[#e5e5e5] mb-3 leading-tight"
              >
                {task.title}
              </h2>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {/* Status badge */}
                <div
                  className="px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    background: statusColor.bg,
                    color: statusColor.text,
                    border: `1px solid ${statusColor.border}`,
                  }}
                >
                  {STATUS_LABELS[task.status]}
                </div>

                {/* Priority badge */}
                <div
                  className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold ${
                    task.priority === "P0"
                      ? "priority-p0"
                      : task.priority === "P1"
                      ? "priority-p1"
                      : "priority-p2"
                  }`}
                >
                  {task.priority}
                </div>

                {/* Assignee badge */}
                <div className="px-2.5 py-1 rounded font-mono text-[10px] font-medium bg-[#1a1a1a] text-[#737373] border border-[#2a2a2a] flex items-center gap-1.5">
                  <span>{agentMap.get(task.assignee) || "⚡"}</span>
                  <span>{task.assignee}</span>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-[#1a1a1a] text-[#737373] hover:text-[#e5e5e5] transition-colors"
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
            {/* Timestamps */}
            <div className="flex gap-6 text-xs">
              <div>
                <span className="font-mono text-[#525252] uppercase tracking-wide">Created</span>
                <p className="text-[#737373] mt-1">{formatTimestamp(task.createdAt)}</p>
              </div>
              {task.updatedAt !== task.createdAt && (
                <div>
                  <span className="font-mono text-[#525252] uppercase tracking-wide">Updated</span>
                  <p className="text-[#737373] mt-1">{formatTimestamp(task.updatedAt)}</p>
                </div>
              )}
              {task.status === "done" && (
                <div>
                  <span className="font-mono text-[#525252] uppercase tracking-wide">Completed</span>
                  <p className="text-[#737373] mt-1">{formatTimestamp(task.updatedAt)}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-mono text-[10px] text-[#525252] uppercase tracking-wider mb-2">
                Description
              </h3>
              <div className="text-sm text-[#e5e5e5] whitespace-pre-wrap leading-relaxed">
                {linkifyText(task.description)}
              </div>
            </div>

            {/* Task ID */}
            <div>
              <h3 className="font-mono text-[10px] text-[#525252] uppercase tracking-wider mb-2">
                Task ID
              </h3>
              <code className="text-xs text-[#737373] font-mono bg-[#0a0a0a] px-2 py-1 rounded border border-[#1e1e1e]">
                {task._id}
              </code>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#1e1e1e] bg-[#0a0a0a]">
            <button
              onClick={copyTaskJSON}
              className="px-3 py-2 rounded font-mono text-xs text-[#737373] hover:text-[#e5e5e5] bg-[#111111] hover:bg-[#1a1a1a] border border-[#1e1e1e] hover:border-[#2a2a2a] transition-colors flex items-center gap-2"
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
              className="px-4 py-2 rounded font-mono text-xs text-[#e5e5e5] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/40 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Animations */}
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
