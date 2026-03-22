"use client";

import { useEffect, useState } from "react";
import TopHogTab from "@/components/TopHogTab";
import Header from "@/components/Header";
import type { ImpactData } from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/impact")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="py-16 text-center">
            <p className="text-slate-400">Loading impact data...</p>
            <div className="mt-4 h-1 w-32 animate-pulse rounded bg-deep-orange/30 mx-auto" />
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-6 text-center">
            <p className="font-medium text-red-400">Failed to load data</p>
            <p className="mt-2 text-sm text-slate-400">{error}</p>
            <p className="mt-4 text-xs text-slate-500">
              Ensure GITHUB_TOKEN is set in .env.local. See .env.local.example.
            </p>
          </div>
        )}
        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6">
              <TopHogTab
                engineers={data.topHog}
                metricBreakdown={data.metricBreakdown}
              />
            </div>
          </div>
        )}
        {!loading && !error && data && (
          <p className="mt-8 text-center text-xs text-slate-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        )}
      </main>
    </div>
  );
}
