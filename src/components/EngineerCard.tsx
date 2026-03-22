import type { EngineerScore } from "@/lib/types";

interface EngineerCardProps {
  engineer: EngineerScore;
  rank: number;
}

export default function EngineerCard({ engineer, rank }: EngineerCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 transition-colors hover:border-primary-blue/30 hover:bg-slate-800/80">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-gold/20 text-sm font-bold text-yellow-gold">
        {rank}
      </span>
      <img
        src={engineer.avatarUrl || `https://github.com/${engineer.login}.png`}
        alt={engineer.login}
        className="h-12 w-12 shrink-0 rounded-full border-2 border-slate-600"
      />
      <div className="min-w-0 flex-1">
        <a
          href={`https://github.com/${engineer.login}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate font-medium text-foreground hover:text-primary-blue"
        >
          @{engineer.login}
        </a>
        <p className="text-sm text-slate-400">
          Score: <span className="font-semibold text-yellow-gold">{engineer.score}</span>
        </p>
      </div>
    </div>
  );
}
