import EngineerCard from "./EngineerCard";
import MetricCard from "./MetricCard";
import {
  TOP_HOG_OVERVIEW,
  TOP_HOG_METRICS,
} from "@/lib/metrics/writeups";
import type { EngineerScore } from "@/lib/types";

interface TopHogTabProps {
  engineers: EngineerScore[];
  metricBreakdown?: EngineerScore[];
}

const METRIC_VALUE_KEYS = ["ownership", "weirdness", "firstMoverRate"] as const;

export default function TopHogTab({ engineers, metricBreakdown }: TopHogTabProps) {
  const breakdownEngineers = metricBreakdown ?? engineers;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-primary-blue">TOP HOG</h2>
        <p className="mt-1 text-sm font-medium text-slate-400">
          Engineering Impact
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          {TOP_HOG_OVERVIEW}
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
          {TOP_HOG_METRICS.map((metadata, i) => (
            <MetricCard
              key={metadata.name}
              metadata={metadata}
              engineers={breakdownEngineers}
              valueKey={METRIC_VALUE_KEYS[i] ?? "ownership"}
            />
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <h3 className="text-sm font-semibold text-primary-blue">
            How the aggregate score is calculated
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            The aggregate score is the geometric mean of the three component
            metrics:
          </p>
          <div className="mt-2 rounded bg-slate-900/50 px-3 py-2 font-mono text-xs text-slate-500">
            score = (ownership × weirdness × firstMoverRate)^(1/3)
          </div>
          <p className="mt-2 text-xs text-slate-500">
            When a metric is null (e.g., fewer than 5 fix commits for ownership),
            it defaults to 0.5 so that author can still receive a composite
            score.
          </p>
        </div>
      </section>
    </div>
  );
}
