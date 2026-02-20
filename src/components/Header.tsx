"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
  agentCount: number;
  activeCount: number;
}

export function Header({ agentCount, activeCount }: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-pink-200/30 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-white/70 via-pink-50/50 to-white/70 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {activeCount}/{agentCount} Besties Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-pink-400 tracking-wider">
          VIBES: IMMACULATE ✨
        </span>
        <div className="h-4 w-px bg-pink-200/50" />
        <span className="text-sm text-gray-400 tabular-nums">
          {time}
        </span>
      </div>
    </header>
  );
}
