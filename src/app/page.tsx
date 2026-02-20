"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AgentCards } from "@/components/AgentCards";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TaskBoard } from "@/components/TaskBoard";
import { MetricsBar } from "@/components/MetricsBar";
import { Header } from "@/components/Header";
import { Onboarding } from "@/components/Onboarding";
import { RevenueTrackerV2 } from "@/components/RevenueTrackerV2";
import { BuildQueue } from "@/components/BuildQueue";
import { TaskCreator } from "@/components/TaskCreator";
import { LeadTracker } from "@/components/LeadTracker";
import { ActionLog } from "@/components/ActionLog";
import { Sidebar, RoomType } from "@/components/Sidebar";
import { useState, useMemo, useEffect } from "react";

const GREETINGS = [
  "Welcome home, Ash ✨",
  "Hey gorgeous 💖",
  "Looking fabulous today, Ash 🌸",
  "The Dreamhouse missed you 💕",
  "Slaying as always, Ash 👑",
];

const QUOTES = [
  "She believed she could, so she did. 💪",
  "Good things come to those who hustle. ✨",
  "Your vibe attracts your tribe. 🦋",
  "Dream big, sparkle more, shine bright. 💎",
  "Boss moves only today. 🔥",
  "The universe is conspiring in your favour. 🌙",
];

function TodaysVibe() {
  const [greeting, setGreeting] = useState("");
  const [quote, setQuote] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return (
    <div className="glass-card p-5 mb-4 bg-gradient-to-r from-pink-50/80 via-white/60 to-pink-50/80">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{greeting}</h2>
      <p className="text-xs text-pink-400 uppercase tracking-widest mb-3">{dateStr}</p>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-200/30">
        <span className="text-pink-500 text-sm">🔮</span>
        <p className="text-sm text-pink-700 font-medium italic">{quote}</p>
      </div>
    </div>
  );
}

function PlaceholderRoom({ emoji, name, description }: { emoji: string; name: string; description: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="glass-card p-10 text-center max-w-md w-full">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{name}</h2>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-600 text-xs font-medium">
          <span>Under Construction 🔨</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-4">Coming soon — watch this space ✨</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeRoom, setActiveRoom] = useState<RoomType>("foyer");

  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const activities = useQuery(api.activities.list, { limit: 100 });
  const metrics = useQuery(api.metrics.list);

  const isLoading = agents === undefined || tasks === undefined || activities === undefined || metrics === undefined;
  const isEmpty = agents !== undefined && agents.length === 0;

  const activeTasks = useMemo(
    () => tasks?.filter((t) => t.status === "in_progress" || t.status === "inbox") ?? [],
    [tasks]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-pink-500 text-lg mb-2 font-medium">Loading...</div>
          <div className="w-48 h-1 bg-pink-100 rounded overflow-hidden">
            <div className="h-full bg-pink-500 rounded animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return <Onboarding />;
  }

  const renderRoom = () => {
    switch (activeRoom) {
      case "foyer":
        return (
          <div className="flex-1 overflow-auto room-transition">
            <div className="px-4 py-3">
              <TodaysVibe />
            </div>
            <div className="px-4 py-1">
              <AgentCards agents={agents} />
            </div>
            <div className="flex-1 flex gap-4 px-4 pb-3 min-h-0">
              <div className="w-[60%] flex flex-col min-h-0">
                <ActivityFeed activities={activities} agents={agents} />
              </div>
              <div className="w-[40%] flex flex-col min-h-0">
                <TaskBoard tasks={tasks} agents={agents} />
              </div>
            </div>
            <MetricsBar metrics={metrics} tasks={tasks} />
          </div>
        );

      case "living-room":
        return (
          <div className="flex-1 overflow-auto px-4 py-3 room-transition">
            <h2 className="text-sm font-semibold text-pink-500 tracking-widest uppercase mb-3">
              🛋️ Active Projects
            </h2>
            <TaskBoard tasks={activeTasks} agents={agents} />
          </div>
        );

      case "closet":
        return <PlaceholderRoom emoji="👗" name="The Closet" description="Brand files, templates, SOPs, logins, key docs — everything you need, organised beautifully." />;

      case "kitchen":
        return <PlaceholderRoom emoji="🍳" name="The Kitchen" description="Content calendar, ideas pipeline, what's cooking — your creative hub." />;

      case "bedroom":
        return <PlaceholderRoom emoji="🛏️" name="The Bedroom" description="Long-term goals, quarterly plans, big dreams — your strategy sanctuary." />;

      case "mailroom":
        return (
          <div className="flex-1 px-4 pb-3 overflow-auto room-transition">
            <LeadTracker />
          </div>
        );

      case "pool":
        return <PlaceholderRoom emoji="🏊" name="The Pool" description="Ideas we're marinating on — someday, maybe, who knows?" />;

      case "penthouse":
        return (
          <div className="flex-1 overflow-auto px-4 pb-6 pt-3 space-y-4 room-transition">
            <h2 className="text-sm font-semibold text-pink-500 tracking-widest uppercase">
              🎬 The Penthouse
            </h2>
            <div className="glass-card p-4">
              <RevenueTrackerV2 />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 glass-card p-4">
                <BuildQueue />
              </div>
              <div className="xl:col-span-1">
                <TaskCreator agents={agents} />
              </div>
            </div>
            <div className="glass-card p-4">
              <ActionLog />
            </div>
          </div>
        );

      case "glam-room":
        return (
          <div className="flex-1 flex items-center justify-center room-transition">
            <div className="glass-card p-10 text-center max-w-md">
              <div className="text-6xl mb-4">💅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">The Glam Room</h2>
              <p className="text-sm text-gray-500 mb-4">Settings & customization</p>
              <a
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200/50"
              >
                Open Settings ⚙️
              </a>
            </div>
          </div>
        );

      case "diary":
        return (
          <div className="flex-1 px-4 pb-3 overflow-auto room-transition">
            <ActionLog />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeRoom={activeRoom}
        onRoomChange={setActiveRoom}
        agentCount={agents.length}
        activeCount={agents.filter((a) => a.status === "active").length}
      />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header
          agentCount={agents.length}
          activeCount={agents.filter((a) => a.status === "active").length}
        />
        {renderRoom()}
      </main>
    </div>
  );
}
