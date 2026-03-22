import { describe, it, expect } from "vitest";
import { computeComposite } from "../../src/lib/metrics/composite";
import type { AuthorMetrics } from "../../src/lib/metrics/composite";

describe("computeComposite", () => {
  it("returns null composite for authors with no fixToFeat", () => {
    const authors: AuthorMetrics[] = [
      { authorId: "a", fixToFeat: null, reworkRate: null, throughput: null },
    ];
    const result = computeComposite(authors);
    expect(result[0].composite).toBeNull();
  });

  it("computes geometric mean of normalized ranks", () => {
    const authors: AuthorMetrics[] = [
      { authorId: "worst", fixToFeat: 5, reworkRate: null, throughput: null },
      { authorId: "mid", fixToFeat: 1, reworkRate: null, throughput: null },
      { authorId: "best", fixToFeat: 0.1, reworkRate: null, throughput: null },
    ];
    const result = computeComposite(authors);
    expect(result.length).toBe(3);
    const best = result.find((r) => r.authorId === "best");
    const mid = result.find((r) => r.authorId === "mid");
    const worst = result.find((r) => r.authorId === "worst");
    expect(best?.composite).toBeGreaterThan(mid?.composite ?? 0);
    expect(mid?.composite).toBeGreaterThan(worst?.composite ?? 0);
  });

  it("lower fixToFeat yields higher composite", () => {
    const authors: AuthorMetrics[] = [
      { authorId: "good", fixToFeat: 0.1, reworkRate: null, throughput: null },
      { authorId: "bad", fixToFeat: 10, reworkRate: null, throughput: null },
    ];
    const result = computeComposite(authors);
    const good = result.find((r) => r.authorId === "good");
    const bad = result.find((r) => r.authorId === "bad");
    expect(good?.composite).toBeGreaterThan(bad?.composite ?? 0);
  });

  it("handles single author", () => {
    const authors: AuthorMetrics[] = [
      { authorId: "solo", fixToFeat: 0.5, reworkRate: null, throughput: null },
    ];
    const result = computeComposite(authors);
    expect(result[0].composite).toBeGreaterThan(0);
    expect(result[0].composite).toBeLessThanOrEqual(1);
  });
});
