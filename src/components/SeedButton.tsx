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
      className="px-6 py-2.5 bg-pink-50 border border-pink-200 text-pink-500 rounded-xl text-sm hover:bg-pink-100 transition-colors disabled:opacity-50"
    >
      {loading ? "INVITING BESTIES..." : "💖 INVITE YOUR BESTIES"}
    </button>
  );
}
