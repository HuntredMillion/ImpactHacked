export interface EngineerScore {
  login: string;
  avatarUrl: string;
  score: number;
  metrics?: Record<string, number>;
}

export interface ImpactData {
  engineeringImpact: EngineerScore[];
  hogFactor: EngineerScore[];
  lastUpdated: string;
}
