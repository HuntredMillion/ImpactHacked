export interface TopHogMetrics {
  ownership?: number | null;
  weirdness?: number | null;
  firstMoverRate?: number | null;
  commits?: number;
}

export interface EngineerScore {
  login: string;
  avatarUrl: string;
  score: number;
  metrics?: TopHogMetrics | Record<string, number>;
}

export interface ImpactData {
  topHog: EngineerScore[];
  metricBreakdown?: EngineerScore[];
  lastUpdated: string;
}
