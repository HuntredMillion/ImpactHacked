import type { EngineerScore } from "@/lib/types";
import EngineerCard from "./EngineerCard";

interface ScoreSectionProps {
  title: string;
  subtitle: string;
  engineers: EngineerScore[];
}

export default function ScoreSection({ title, subtitle, engineers }: ScoreSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6">
      <h2 className="text-lg font-semibold text-primary-blue">{title}</h2>
      <p className="mb-4 text-sm text-slate-400">{subtitle}</p>
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
  );
}
