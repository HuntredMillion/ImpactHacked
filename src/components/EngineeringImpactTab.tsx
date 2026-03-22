import EngineerCard from "./EngineerCard";
import MetricCard from "./MetricCard";
import {
  ENGINEERING_IMPACT_METRICS,
  ENGINEERING_IMPACT_OVERVIEW,
} from "@/lib/metrics/writeups";
import type { EngineerScore } from "@/lib/types";

interface EngineeringImpactTabProps {
  engineers?: EngineerScore[];
}

const METRIC_VALUE_KEYS = ["fixToFeat", "reworkRate", "throughput"] as const;

export default function EngineeringImpactTab({ engineers = [] }: EngineeringImpactTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-primary-blue">Engineering Impact</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {ENGINEERING_IMPACT_OVERVIEW}
        </p>
      </div>

      <section>
        <h3 className="mb-4 text-sm font-medium text-slate-300">Top 5 Scorers</h3>
        <div className="flex flex-col gap-3">
          {engineers.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No data yet</p>
          ) : (
            engineers.map((engineer, i) => (
              <EngineerCard key={engineer.login} engineer={engineer} rank={i + 1} />
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-medium text-slate-300">Metric Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          {ENGINEERING_IMPACT_METRICS.map((metadata, i) => (
            <MetricCard
              key={metadata.name}
              metadata={metadata}
              engineers={engineers}
              valueKey={METRIC_VALUE_KEYS[i] ?? "fixToFeat"}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
