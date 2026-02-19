"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

type LeadStatus = "new" | "contacted" | "replied" | "meeting" | "proposal" | "won" | "lost" | "nurture";

const statusColumns: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "emerald" },
  { status: "contacted", label: "Contacted", color: "cyan" },
  { status: "replied", label: "Replied", color: "blue" },
  { status: "meeting", label: "Meeting", color: "purple" },
  { status: "proposal", label: "Proposal", color: "amber" },
  { status: "won", label: "Won", color: "green" },
  { status: "lost", label: "Lost", color: "red" },
  { status: "nurture", label: "Nurture", color: "gray" },
];

export function LeadTracker() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const leads = useQuery(api.leads.list, {});
  const stats = useQuery(api.leads.getStats);
  const overdue = useQuery(api.leads.getOverdue);
  const updateLead = useMutation(api.leads.update);
  const createLead = useMutation(api.leads.create);
  
  const isLoading = leads === undefined || stats === undefined;

  const handleStatusChange = async (leadId: Id<"leads">, newStatus: LeadStatus) => {
    await updateLead({ id: leadId, status: newStatus });
  };

  const formatCurrency = (cents?: number) => {
    if (!cents) return "";
    return `$${(cents / 100).toLocaleString()}`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">
            Lead Tracker
          </h2>
          <div className="text-xs text-[#525252] font-mono">LOADING...</div>
        </div>
      </div>
    );
  }

  const renderKanbanView = () => (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {statusColumns.map(({ status, label, color }) => {
        const columnLeads = leads?.filter(lead => lead.status === status) || [];
        const count = columnLeads.length;
        
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded">
              <div className="p-3 border-b border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#737373] uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="font-mono text-xs text-emerald-500">{count}</span>
                </div>
              </div>
              
              <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                {columnLeads.map(lead => (
                  <div
                    key={lead._id}
                    className="bg-[#1e1e1e] border border-[#2e2e2e] rounded p-3 hover:border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    <div className="font-mono text-sm text-white mb-1">{lead.name}</div>
                    {lead.company && (
                      <div className="text-xs text-[#737373] mb-2">{lead.company}</div>
                    )}
                    
                    {lead.value && (
                      <div className="text-xs text-emerald-500 font-mono mb-2">
                        {formatCurrency(lead.value)}
                      </div>
                    )}
                    
                    {lead.nextAction && (
                      <div className="text-xs text-[#525252] mb-1">
                        📌 {lead.nextAction}
                      </div>
                    )}
                    
                    {lead.nextActionDate && (
                      <div className={`text-xs font-mono ${
                        lead.nextActionDate < Date.now() ? "text-red-500" : "text-[#525252]"
                      }`}>
                        {formatDate(lead.nextActionDate)}
                      </div>
                    )}
                    
                    {lead.assignee && (
                      <div className="text-xs text-cyan-500 font-mono mt-2">
                        👤 {lead.assignee}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded">
      <table className="w-full">
        <thead className="border-b border-[#1e1e1e]">
          <tr>
            <th className="px-4 py-3 text-left font-mono text-xs text-[#525252] uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left font-mono text-xs text-[#525252] uppercase tracking-wider">Company</th>
            <th className="px-4 py-3 text-left font-mono text-xs text-[#525252] uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left font-mono text-xs text-[#525252] uppercase tracking-wider">Value</th>
            <th className="px-4 py-3 text-left font-mono text-xs text-[#525252] uppercase tracking-wider">Next Action</th>
            <th className="px-4 py-3 text-left font-mono text-xs text-[#525252] uppercase tracking-wider">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {leads?.map(lead => (
            <tr key={lead._id} className="border-b border-[#1e1e1e] hover:bg-[#1e1e1e] transition-colors">
              <td className="px-4 py-3 font-mono text-sm text-white">{lead.name}</td>
              <td className="px-4 py-3 text-sm text-[#737373]">{lead.company || "—"}</td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead._id, e.target.value as LeadStatus)}
                  className="bg-[#0c0c0c] border border-[#2e2e2e] rounded px-2 py-1 text-xs text-emerald-500 font-mono"
                >
                  {statusColumns.map(({ status, label }) => (
                    <option key={status} value={status}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-sm text-emerald-500 font-mono">
                {formatCurrency(lead.value)}
              </td>
              <td className="px-4 py-3 text-sm text-[#737373]">
                {lead.nextAction || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-cyan-500 font-mono">
                {lead.assignee || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm text-emerald-500 tracking-widest uppercase">
          Lead Tracker
        </h2>
        
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-xs text-[#525252] font-mono">TOTAL LEADS</div>
            <div className="font-mono text-lg text-white">{stats?.total || 0}</div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-[#525252] font-mono">PIPELINE VALUE</div>
            <div className="font-mono text-lg text-emerald-500">
              {formatCurrency(stats?.totalValue)}
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1 font-mono text-xs rounded transition-colors ${
                view === "kanban"
                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                  : "text-[#737373] hover:text-white bg-[#1e1e1e]"
              }`}
            >
              KANBAN
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1 font-mono text-xs rounded transition-colors ${
                view === "list"
                  ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                  : "text-[#737373] hover:text-white bg-[#1e1e1e]"
              }`}
            >
              LIST
            </button>
          </div>
        </div>
      </div>

      {/* Overdue alerts */}
      {overdue && overdue.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs text-red-500 uppercase tracking-wider">
              {overdue.length} Overdue Follow-ups
            </span>
          </div>
          <div className="space-y-1">
            {overdue.slice(0, 3).map(lead => (
              <div key={lead._id} className="text-xs text-[#737373]">
                {lead.name} — {lead.nextAction}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main view */}
      {view === "kanban" ? renderKanbanView() : renderListView()}

      {/* Add lead button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 rounded font-mono text-sm text-emerald-500 hover:bg-emerald-500/20 transition-colors"
      >
        + ADD LEAD
      </button>
    </div>
  );
}
