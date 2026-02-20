"use client";

import { useState } from "react";

export type RoomType =
  | "foyer"
  | "living-room"
  | "closet"
  | "kitchen"
  | "bedroom"
  | "mailroom"
  | "pool"
  | "penthouse"
  | "glam-room"
  | "diary";

interface Room {
  id: RoomType;
  emoji: string;
  name: string;
  subtitle: string;
}

export const ROOMS: Room[] = [
  { id: "foyer", emoji: "🪞", name: "The Foyer", subtitle: "Dashboard" },
  { id: "living-room", emoji: "🛋️", name: "The Living Room", subtitle: "Active Projects" },
  { id: "closet", emoji: "👗", name: "The Closet", subtitle: "Resources & Assets" },
  { id: "kitchen", emoji: "🍳", name: "The Kitchen", subtitle: "Content & Creation" },
  { id: "bedroom", emoji: "🛏️", name: "The Bedroom", subtitle: "Strategy & Vision" },
  { id: "mailroom", emoji: "💌", name: "The Mailroom", subtitle: "Comms & CRM" },
  { id: "pool", emoji: "🏊", name: "The Pool", subtitle: "Backlog" },
  { id: "penthouse", emoji: "🎬", name: "The Penthouse", subtitle: "Revenue + Builds" },
  { id: "glam-room", emoji: "💅", name: "The Glam Room", subtitle: "Settings" },
  { id: "diary", emoji: "📓", name: "The Diary", subtitle: "Action Log" },
];

interface SidebarProps {
  activeRoom: RoomType;
  onRoomChange: (room: RoomType) => void;
  agentCount: number;
  activeCount: number;
}

export function Sidebar({ activeRoom, onRoomChange, agentCount, activeCount }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 rounded-xl bg-white/80 backdrop-blur-xl border border-pink-200/50 flex items-center justify-center shadow-lg shadow-pink-200/20 text-pink-500"
      >
        {collapsed ? "☰" : "✕"}
      </button>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`sidebar-glass fixed md:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col transition-transform duration-300 ease-out ${
          collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        }`}
      >
        {/* Branding */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl sparkle-text">🏠</span>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-wide sparkle-text">
                The Dreamhouse
              </h1>
              <p className="text-[10px] text-pink-400 uppercase tracking-widest">
                {activeCount}/{agentCount} besties online ✨
              </p>
            </div>
          </div>
        </div>

        <div className="h-px mx-4 bg-gradient-to-r from-transparent via-pink-300/40 to-transparent" />

        {/* Room list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-pink">
          {ROOMS.map((room) => {
            const isActive = activeRoom === room.id;
            return (
              <button
                key={room.id}
                onClick={() => {
                  onRoomChange(room.id);
                  setCollapsed(true);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? "bg-pink-500/15 text-pink-700 shadow-sm shadow-pink-200/30"
                    : "text-gray-600 hover:bg-pink-50/80 hover:text-pink-600"
                }`}
              >
                <span className="text-lg flex-shrink-0">{room.emoji}</span>
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${isActive ? "text-pink-700" : ""}`}>
                    {room.name}
                  </div>
                  <div className={`text-[10px] truncate ${isActive ? "text-pink-500" : "text-gray-400"}`}>
                    {room.subtitle}
                  </div>
                </div>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="h-px mx-4 bg-gradient-to-r from-transparent via-pink-300/30 to-transparent" />

        {/* Footer */}
        <div className="px-5 py-3">
          <p className="text-[9px] text-pink-300 text-center tracking-wider">
            Built with 💖 by Barbie
          </p>
        </div>
      </aside>
    </>
  );
}
