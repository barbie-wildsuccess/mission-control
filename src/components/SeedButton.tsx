"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function SeedButton() {
  const seedMutation = useMutation(api.seed.seed);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedMutation();
    } catch (e) {
      console.error("Seed failed:", e);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg font-mono text-sm hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
    >
      {loading ? "DEPLOYING AGENTS..." : "DEPLOY AGENT SQUAD"}
    </button>
  );
}
