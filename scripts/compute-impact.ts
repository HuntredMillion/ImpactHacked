/**
 * Precomputes impact scores from PostHog/posthog GitHub data.
 * Run via: npm run compute-impact
 * Requires GITHUB_TOKEN in environment or .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getAllCommits, getSinceDate } from "../src/lib/github";
import { computeFixToFeat } from "../src/lib/metrics/fix-to-feat";
import { computeComposite } from "../src/lib/metrics/composite";
import type { EngineerScore, ImpactData } from "../src/lib/types";

const OWNER = "PostHog";
const REPO = "posthog";

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN required. Set in .env.local or environment.");
  }

  const since = getSinceDate();
  console.log(`Fetching commits since ${since}...`);

  const commits = await getAllCommits(OWNER, REPO, since);
  console.log(`  Got ${commits.length} commits`);

  const authorInfo: Record<string, { count: number; avatarUrl: string }> = {};
  const commitsForFixToFeat = commits.map((c) => {
    const authorId = c.author?.login ?? c.commit.author?.email ?? "unknown";
    if (authorId !== "unknown") {
      if (!authorInfo[authorId]) {
        authorInfo[authorId] = {
          count: 0,
          avatarUrl: c.author?.avatar_url ?? "",
        };
      }
      authorInfo[authorId].count += 1;
      if (!authorInfo[authorId].avatarUrl && c.author?.avatar_url) {
        authorInfo[authorId].avatarUrl = c.author.avatar_url;
      }
    }
    return {
      message: c.commit?.message ?? "",
      authorId,
    };
  });

  const fixToFeatResults = computeFixToFeat(commitsForFixToFeat);
  const fixToFeatByAuthor = new Map(
    fixToFeatResults.map((r) => [r.authorId, r])
  );

  const authorsForComposite = [...new Set([
    ...Object.keys(authorInfo),
    ...fixToFeatResults.map((r) => r.authorId),
  ])].map((authorId) => {
    const ftf = fixToFeatByAuthor.get(authorId);
    return {
      authorId,
      fixToFeat: ftf?.ratio ?? null,
      reworkRate: null,
      throughput: null,
    };
  });

  const compositeResults = computeComposite(authorsForComposite);
  const compositeByAuthor = new Map(
    compositeResults.map((r) => [r.authorId, r])
  );

  let engineeringTop5: EngineerScore[] = compositeResults
    .filter((r) => r.composite !== null)
    .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0))
    .slice(0, 5)
    .map((r) => {
      const info = authorInfo[r.authorId];
      const ftf = fixToFeatByAuthor.get(r.authorId);
      return {
        login: r.authorId,
        avatarUrl: info?.avatarUrl ?? "",
        score: Math.round((r.composite ?? 0) * 1000) / 1000,
        metrics: {
          fixToFeat: ftf?.ratio ?? null,
          reworkRate: null,
          throughput: null,
          commits: info?.count ?? 0,
        },
      };
    });

  if (engineeringTop5.length === 0) {
    engineeringTop5 = Object.entries(authorInfo)
      .map(([login, { count, avatarUrl }]) => ({
        login,
        avatarUrl,
        score: count,
        metrics: {
          fixToFeat: null,
          reworkRate: null,
          throughput: null,
          commits: count,
        },
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  const hogFactorTop5: EngineerScore[] = Object.entries(authorInfo)
    .map(([login, { count, avatarUrl }]) => ({
      login,
      avatarUrl,
      score: count,
      metrics: { commits: count },
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const data: ImpactData = {
    topHog: engineeringTop5,
    metricBreakdown: hogFactorTop5,
    lastUpdated: new Date().toISOString(),
  };

  const outDir = join(process.cwd(), "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "impact.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
