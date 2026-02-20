"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

type LeadStatus = "new" | "contacted" | "replied" | "meeting" | "proposal" | "won" | "lost" | "nurture";

const statusColumns: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "pink" },
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
          <h2 className="text-sm font-semibold text-pink-500 tracking-widest uppercase">
            Lead Tracker
          </h2>
          <div className="text-xs text-gray-400">LOADING...</div>
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
            <div className="bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl">
              <div className="p-3 border-b border-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    {label}
                  </span>
                  <span className="text-xs text-pink-500">{count}</span>
                </div>
              </div>
              
              <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                {columnLeads.map(lead => (
                  <div
                    key={lead._id}
                    className="bg-white/70 border border-black/5 rounded-xl p-3 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="text-sm text-gray-900 mb-1">{lead.name}</div>
                    {lead.company && (
                      <div className="text-xs text-gray-500 mb-2">{lead.company}</div>
                    )}
                    
                    {lead.value && (
                      <div className="text-xs text-pink-500 font-mono mb-2">
                        {formatCurrency(lead.value)}
                      </div>
                    )}
                    
                    {lead.nextAction && (
                      <div className="text-xs text-gray-400 mb-1">
                        📌 {lead.nextAction}
                      </div>
                    )}
                    
                    {lead.nextActionDate && (
                      <div className={`text-xs font-mono ${
                        lead.nextActionDate < Date.now() ? "text-red-500" : "text-gray-400"
                      }`}>
                        {formatDate(lead.nextActionDate)}
                      </div>
                    )}
                    
                    {lead.assignee && (
                      <div className="text-xs text-blue-500 mt-2">
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
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-black/5">
          <tr>
            <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Company</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Value</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Next Action</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {leads?.map(lead => (
            <tr key={lead._id} className="border-b border-black/5 hover:bg-white/40 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-900">{lead.name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{lead.company || "—"}</td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead._id, e.target.value as LeadStatus)}
                  className="bg-white/80 border border-gray-200 rounded-lg px-2 py-1 text-xs text-pink-500"
                >
                  {statusColumns.map(({ status, label }) => (
                    <option key={status} value={status}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-sm text-pink-500 font-mono">
                {formatCurrency(lead.value)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {lead.nextAction || "—"}
              </td>
              <td className="px-4 py-3 text-sm text-blue-500">
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
        <h2 className="text-sm font-semibold text-pink-500 tracking-widest uppercase">
          Lead Tracker
        </h2>
        
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-xs text-gray-400">TOTAL LEADS</div>
            <div className="text-lg text-gray-900">{stats?.total || 0}</div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-400">PIPELINE VALUE</div>
            <div className="text-lg text-pink-500">
              {formatCurrency(stats?.totalValue)}
            </div>
          </div>
          
          <div className="flex gap-1 bg-gray-100/60 p-1 rounded-full">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                view === "kanban"
                  ? "bg-pink-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              KANBAN
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                view === "list"
                  ? "bg-pink-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              LIST
            </button>
          </div>
        </div>
      </div>

      {/* Overdue alerts */}
      {overdue && overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-600 uppercase tracking-wider">
              {overdue.length} Overdue Follow-ups
            </span>
          </div>
          <div className="space-y-1">
            {overdue.slice(0, 3).map(lead => (
              <div key={lead._id} className="text-xs text-gray-500">
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
        className="w-full py-2 bg-pink-50 border border-pink-200 rounded-xl text-sm text-pink-500 hover:bg-pink-100 transition-colors"
      >
        + ADD LEAD
      </button>
    </div>
  );
}
