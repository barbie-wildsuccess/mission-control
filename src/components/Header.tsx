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
    <header className="border-b border-[#1e1e1e] px-4 py-3 flex items-center justify-between relative scanline overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs text-emerald-500 tracking-widest uppercase">
            Mission Control
          </span>
        </div>
        <div className="h-4 w-px bg-[#2a2a2a]" />
        <span className="font-mono text-xs text-[#525252]">
          {activeCount}/{agentCount} AGENTS ACTIVE
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-[#525252]">
          SYS: NOMINAL
        </span>
        <div className="h-4 w-px bg-[#2a2a2a]" />
        <span className="font-mono text-sm text-[#737373] tabular-nums">
          {time}
        </span>
      </div>
    </header>
  );
}
