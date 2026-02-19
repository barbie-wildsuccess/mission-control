"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type QueuePriority = "P0" | "P1" | "P2";
type QueueStatus = "queued" | "in_progress" | "shipped";
type SyncState = "idle" | "syncing" | "ready" | "error";

interface MarkdownQueueItem {
  sourceId: string;
  title: string;
  description: string;
  priority: QueuePriority;
  status: QueueStatus;
  sortOrder: number;
  sourceSection?: string;
}

const statusStyles: Record<QueueStatus, string> = {
  queued: "text-slate-300 border-slate-400/30 bg-slate-500/10",
  in_progress: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  shipped: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
};

const priorityStyles: Record<QueuePriority, string> = {
  P0: "text-red-300 border-red-400/30 bg-red-500/10",
  P1: "text-amber-300 border-amber-400/30 bg-amber-500/10",
  P2: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10",
};

export function BuildQueue() {
  const queueData = useQuery(api.buildQueue.list);
  const syncFromMarkdown = useMutation(api.buildQueue.syncFromMarkdown);
  const reprioritize = useMutation(api.buildQueue.reprioritize);
  const updateStatus = useMutation(api.buildQueue.updateStatus);

  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<"all" | QueuePriority>("all");
  const [busyItemId, setBusyItemId] = useState<Id<"buildQueueItems"> | null>(null);

  const syncQueue = useCallback(async () => {
    setSyncState("syncing");
    setSyncMessage("");

    try {
      const response = await fetch("/api/build-queue", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Queue sync failed (${response.status})`);
      }

      const items = (await response.json()) as MarkdownQueueItem[];
      await syncFromMarkdown({ items });
      setSyncState("ready");
      setSyncMessage(`Synced ${items.length} queue items`);
    } catch (error) {
      console.error("Failed to sync build queue:", error);
      setSyncState("error");
      setSyncMessage("Unable to sync from build-queue.md");
    }
  }, [syncFromMarkdown]);

  useEffect(() => {
    void syncQueue();
  }, [syncQueue]);

  const filteredItems = useMemo(() => {
    const items = queueData?.items ?? [];
    if (selectedPriority === "all") return items;
    return items.filter((item) => item.priority === selectedPriority);
  }, [queueData?.items, selectedPriority]);

  const counts = queueData?.counts ?? {
    queued: 0,
    inProgress: 0,
    shipped: 0,
  };

  const lastUpdatedLabel = queueData?.lastUpdatedAt
    ? new Date(queueData.lastUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "--";

  const handlePriorityChange = async (itemId: Id<"buildQueueItems">, priority: QueuePriority) => {
    setBusyItemId(itemId);
    try {
      await reprioritize({ itemId, priority });
    } finally {
      setBusyItemId(null);
    }
  };

  const handleStatusChange = async (itemId: Id<"buildQueueItems">, status: QueueStatus) => {
    setBusyItemId(itemId);
    try {
      await updateStatus({ itemId, status });
    } finally {
      setBusyItemId(null);
    }
  };

  if (queueData === undefined && syncState !== "error") {
    return (
      <div className="space-y-3">
        <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">Build Queue</h2>
        <div className="text-[#525252] font-mono text-xs">Loading queue data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">Build Queue</h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#737373]">LAST SYNC {lastUpdatedLabel}</span>
          <button
            onClick={() => void syncQueue()}
            disabled={syncState === "syncing"}
            className="px-3 py-1 border border-[#2a2a2a] rounded font-mono text-xs text-[#b5b5b5] hover:text-white hover:border-[#525252] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {syncState === "syncing" ? "SYNCING..." : "SYNC NOW"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="border border-slate-400/20 bg-slate-500/5 rounded px-3 py-2">
          <div className="font-mono text-xs text-slate-300 uppercase">Queued</div>
          <div className="font-mono text-xl text-white">{counts.queued}</div>
        </div>
        <div className="border border-amber-400/20 bg-amber-500/5 rounded px-3 py-2">
          <div className="font-mono text-xs text-amber-300 uppercase">In Progress</div>
          <div className="font-mono text-xl text-white">{counts.inProgress}</div>
        </div>
        <div className="border border-emerald-400/20 bg-emerald-500/5 rounded px-3 py-2">
          <div className="font-mono text-xs text-emerald-300 uppercase">Shipped</div>
          <div className="font-mono text-xl text-white">{counts.shipped}</div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-[#0c0c0c] border border-[#1e1e1e] rounded inline-flex">
        {(["all", "P0", "P1", "P2"] as const).map((priority) => (
          <button
            key={priority}
            onClick={() => setSelectedPriority(priority)}
            className={`px-3 py-1 font-mono text-xs uppercase tracking-wider rounded transition-colors ${
              selectedPriority === priority
                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                : "text-[#737373] hover:text-white hover:bg-[#1e1e1e]"
            }`}
          >
            {priority === "all" ? "ALL" : priority}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
        {filteredItems.map((item) => (
          <div key={item._id} className="border border-[#1e1e1e] rounded p-3 bg-[#0c0c0c]">
            <div className="flex items-start gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded border font-mono text-xs uppercase ${statusStyles[item.status]}`}>
                {item.status.replace("_", " ")}
              </span>
              <span className={`px-2 py-0.5 rounded border font-mono text-xs ${priorityStyles[item.priority]}`}>
                {item.priority}
              </span>
              <div className="text-sm text-white font-medium leading-tight flex-1">{item.title}</div>
            </div>

            {item.description ? <p className="text-xs text-[#8a8a8a] mb-3">{item.description}</p> : null}

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-[#737373] font-mono">
                Priority
                <select
                  value={item.priority}
                  disabled={busyItemId === item._id}
                  onChange={(e) => void handlePriorityChange(item._id, e.target.value as QueuePriority)}
                  className="mt-1 w-full bg-[#151515] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                </select>
              </label>

              <label className="text-xs text-[#737373] font-mono">
                Status
                <select
                  value={item.status}
                  disabled={busyItemId === item._id}
                  onChange={(e) => void handleStatusChange(item._id, e.target.value as QueueStatus)}
                  className="mt-1 w-full bg-[#151515] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/40"
                >
                  <option value="queued">Queued</option>
                  <option value="in_progress">In Progress</option>
                  <option value="shipped">Shipped</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs font-mono text-[#525252]">
        {syncMessage || "Queue synced from ~/clawd/memory/build-queue.md"}
      </div>
    </div>
  );
}
