const WINSORIZE_PERCENTILE = 95;

export interface AuthorMetrics {
  authorId: string;
  fixToFeat: number | null;
  reworkRate: number | null;
  throughput: number | null;
}

export interface CompositeResult {
  authorId: string;
  composite: number | null;
  percentileThroughput: number | null;
  percentileFixToFeat: number | null;
  percentileRework: number | null;
}

function winsorize(values: number[], p: number): number[] {
  if (values.length === 0) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  const cap = sorted[Math.min(idx, sorted.length - 1)] ?? 0;
  return values.map((v) => Math.min(v, cap));
}

function percentileRank(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0.5;
  let count = 0;
  for (const v of sortedValues) {
    if (v < value) count += 1;
    else if (v === value) count += 0.5;
  }
  return count / sortedValues.length;
}

/**
 * Computes composite score as geometric mean of normalized ranks.
 * - throughput: higher is better -> r_T = percentile rank
 * - fixToFeat: lower is better -> r_F = 1 - percentile rank
 * - reworkRate: lower is better -> r_R = 1 - percentile rank
 * Returns null for authors excluded (e.g. below commit floor).
 */
export function computeComposite(authors: AuthorMetrics[]): CompositeResult[] {
  const withAllNeeded = authors.filter(
    (a) => a.fixToFeat !== null && a.fixToFeat !== undefined
  );
  if (withAllNeeded.length === 0) {
    return authors.map((a) => ({
      authorId: a.authorId,
      composite: null,
      percentileThroughput: null,
      percentileFixToFeat: null,
      percentileRework: null,
    }));
  }

  const fixToFeatVals = withAllNeeded
    .map((a) => a.fixToFeat as number)
    .filter((v) => v !== null && Number.isFinite(v));
  const throughputVals = withAllNeeded
    .map((a) => a.throughput)
    .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));
  const reworkVals = withAllNeeded
    .map((a) => a.reworkRate)
    .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v));

  const winFixToFeat = winsorize(fixToFeatVals, WINSORIZE_PERCENTILE);
  const sortedFixToFeat = [...winFixToFeat].sort((a, b) => a - b);
  const sortedThroughput =
    throughputVals.length > 0 ? [...throughputVals].sort((a, b) => a - b) : [];
  const sortedRework =
    reworkVals.length > 0 ? [...reworkVals].sort((a, b) => a - b) : [];

  const hasThroughput = sortedThroughput.length > 0;
  const hasRework = sortedRework.length > 0;

  return withAllNeeded.map((a) => {
    const r_F = 1 - percentileRank(a.fixToFeat as number, sortedFixToFeat);
    const r_T =
      hasThroughput && a.throughput != null && Number.isFinite(a.throughput)
        ? percentileRank(a.throughput, sortedThroughput)
        : 0.5;
    const r_R =
      hasRework && a.reworkRate != null && Number.isFinite(a.reworkRate)
        ? 1 - percentileRank(a.reworkRate, sortedRework)
        : 0.5;

    const dims = [r_T, r_F, r_R];
    const product = dims.reduce((p, x) => p * Math.max(1e-10, x), 1);
    const composite = product ** (1 / 3);

    return {
      authorId: a.authorId,
      composite,
      percentileThroughput: hasThroughput ? r_T : null,
      percentileFixToFeat: r_F,
      percentileRework: hasRework ? 1 - percentileRank(a.reworkRate!, sortedRework) : null,
    };
  });
}
