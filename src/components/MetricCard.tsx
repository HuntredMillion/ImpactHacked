import type { MetricMetadata } from "@/lib/metrics/types";
import type { EngineerScore } from "@/lib/types";

interface MetricCardProps {
  metadata: MetricMetadata;
  engineers: EngineerScore[];
  valueKey: string;
}

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

export default function MetricCard({ metadata, engineers, valueKey }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
      <h3 className="text-sm font-semibold text-primary-blue">{metadata.name}</h3>
      <p className="mt-1 text-sm text-slate-400">{metadata.description}</p>
      <div className="mt-2 rounded bg-slate-900/50 px-3 py-2 font-mono text-xs text-slate-500">
        {metadata.calculation}
      </div>
      <p className="mt-2 text-xs text-slate-500">{metadata.interpretation}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {engineers.map((e) => {
          const metrics = e.metrics as Record<string, number | null | undefined> | undefined;
          const val = metrics?.[valueKey];
          return (
            <span
              key={e.login}
              className="rounded bg-slate-700/50 px-2 py-1 text-xs text-slate-300"
            >
              @{e.login}: {formatValue(val)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
