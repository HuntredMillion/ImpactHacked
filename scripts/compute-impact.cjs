/**
 * Precomputes impact scores from PostHog/posthog GitHub data.
 * Run via: npm run compute-impact (uses this CJS script for compatibility)
 * Requires GITHUB_TOKEN in environment or .env.local.
 *
 * Metrics (API-only, no local clone):
 * - Ownership: cross-author fix rate — fixes where a different author wrote the last feat(scope)
 * - Weirdness: scope entropy normalized by log2(global scope count)
 * - First-mover rate: share of scopes you pioneered (first commit in that scope)
 */
require("dotenv").config({ path: ".env.local" });
const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");
const { Octokit } = require("octokit");

const OWNER = "PostHog";
const REPO = "posthog";
const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
const MIN_FIX_COUNT_FOR_OWNERSHIP = 5;

function getSinceDate() {
  return new Date(Date.now() - DAYS_90_MS).toISOString();
}

async function getAllCommits(owner, repo, since) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  return octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo,
    since,
    per_page: 100,
  });
}

function parseCommitType(message) {
  const subject = (message || "").split("\n")[0]?.trim() ?? "";
  const match = subject.match(/^(feat|fix|chore)(\([^)]*\))?!?:\s/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function parseScope(message) {
  const subject = (message || "").split("\n")[0]?.trim() ?? "";
  const match = subject.match(/^(feat|fix|chore)\(([^)]+)\)/i);
  return match?.[2]?.toLowerCase() ?? null;
}

/**
 * Build enriched commit list: { authorId, date, type, scope }
 * Only feat and fix commits with a scope are used for scope-based metrics.
 */
function enrichCommits(commits) {
  return commits
    .map((c) => {
      const authorId = c.author?.login ?? c.commit?.author?.email ?? null;
      if (!authorId || authorId === "unknown") return null;
      const type = parseCommitType(c.commit?.message ?? "");
      if (type !== "feat" && type !== "fix") return null;
      const scope = parseScope(c.commit?.message ?? "");
      if (!scope) return null;
      return {
        authorId,
        date: c.commit?.author?.date ?? new Date().toISOString(),
        type,
        scope,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * score_ownership(a) = cross_fix_count(a) / total_fix_count(a)
 * if total_fix_count(a) >= 5 else null
 */
function computeOwnership(sortedCommits) {
  const lastFeatByScope = new Map();
  const byAuthor = {};

  for (const c of sortedCommits) {
    if (!byAuthor[c.authorId]) {
      byAuthor[c.authorId] = { totalFix: 0, crossFix: 0 };
    }

    if (c.type === "feat") {
      lastFeatByScope.set(c.scope, { authorId: c.authorId, date: c.date });
    } else if (c.type === "fix") {
      byAuthor[c.authorId].totalFix += 1;
      const last = lastFeatByScope.get(c.scope);
      if (last && last.authorId !== c.authorId) {
        byAuthor[c.authorId].crossFix += 1;
      }
      lastFeatByScope.set(c.scope, { authorId: c.authorId, date: c.date });
    }
  }

  return Object.fromEntries(
    Object.entries(byAuthor).map(([authorId, { totalFix, crossFix }]) => [
      authorId,
      totalFix >= MIN_FIX_COUNT_FOR_OWNERSHIP ? crossFix / totalFix : null,
    ])
  );
}

/**
 * scope_first_commits: for each scope, (date, author) of first ever commit
 */
function computeFirstMoverRate(sortedCommits, allAuthors) {
  const scopeFirstCommits = {};
  for (const c of sortedCommits) {
    if (!scopeFirstCommits[c.scope]) {
      scopeFirstCommits[c.scope] = { date: c.date, authorId: c.authorId };
    }
  }

  const totalScopesByAuthor = {};
  const pioneerCountByAuthor = {};
  for (const a of allAuthors) {
    totalScopesByAuthor[a] = 0;
    pioneerCountByAuthor[a] = 0;
  }

  const authorScopes = new Map();
  for (const c of sortedCommits) {
    if (!authorScopes.has(c.authorId)) authorScopes.set(c.authorId, new Set());
    authorScopes.get(c.authorId).add(c.scope);
  }

  for (const [authorId, scopes] of authorScopes) {
    totalScopesByAuthor[authorId] = scopes.size;
    for (const scope of scopes) {
      const first = scopeFirstCommits[scope];
      if (first && first.authorId === authorId) {
        pioneerCountByAuthor[authorId] = (pioneerCountByAuthor[authorId] ?? 0) + 1;
      }
    }
  }

  const result = {};
  for (const a of allAuthors) {
    const total = totalScopesByAuthor[a] ?? 0;
    const pioneers = pioneerCountByAuthor[a] ?? 0;
    result[a] = total > 0 ? pioneers / total : null;
  }
  return result;
}

/**
 * score_weird(a) = H_raw(a) / log2(K_global)
 * H_raw = -sum p(s) * log2(p(s)) over scopes author has committed to
 */
function computeWeirdness(sortedCommits, allAuthors, K_global) {
  const log2K = Math.log2(Math.max(1, K_global));

  const scopeCountsByAuthor = new Map();
  for (const c of sortedCommits) {
    if (!scopeCountsByAuthor.has(c.authorId)) {
      scopeCountsByAuthor.set(c.authorId, new Map());
    }
    const m = scopeCountsByAuthor.get(c.authorId);
    m.set(c.scope, (m.get(c.scope) ?? 0) + 1);
  }

  const result = {};
  for (const authorId of allAuthors) {
    const counts = scopeCountsByAuthor.get(authorId);
    if (!counts || counts.size === 0) {
      result[authorId] = null;
      continue;
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    let H_raw = 0;
    for (const n of counts.values()) {
      const p = n / total;
      H_raw -= p * Math.log2(p);
    }
    result[authorId] = log2K > 0 ? H_raw / log2K : 0;
  }
  return result;
}

/**
 * Composite: geometric mean of ownership, weirdness, first_mover.
 * Uses 0.5 as neutral when a metric is null.
 */
function computeComposite(byAuthor) {
  return Object.entries(byAuthor).map(([authorId, m]) => {
    const o = m.ownership ?? 0.5;
    const w = m.weirdness ?? 0.5;
    const f = m.firstMoverRate ?? 0.5;
    const product = Math.max(1e-10, o) * Math.max(1e-10, w) * Math.max(1e-10, f);
    const composite = product ** (1 / 3);
    return { authorId, ...m, composite };
  });
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN required. Set in .env.local or environment.");
  }

  const since = getSinceDate();
  console.log(`Fetching commits since ${since}...`);

  const commits = await getAllCommits(OWNER, REPO, since);
  console.log(`  Got ${commits.length} commits`);

  const authorInfo = {};
  for (const c of commits) {
    const authorId = c.author?.login ?? c.commit?.author?.email ?? "unknown";
    if (authorId !== "unknown") {
      if (!authorInfo[authorId]) {
        authorInfo[authorId] = { count: 0, avatarUrl: c.author?.avatar_url ?? "" };
      }
      authorInfo[authorId].count += 1;
      if (!authorInfo[authorId].avatarUrl && c.author?.avatar_url) {
        authorInfo[authorId].avatarUrl = c.author.avatar_url;
      }
    }
  }

  const sortedCommits = enrichCommits(commits);
  const allAuthors = [
    ...new Set([...Object.keys(authorInfo), ...sortedCommits.map((c) => c.authorId)]),
  ];
  const K_global = new Set(sortedCommits.map((c) => c.scope)).size;

  console.log(`  ${sortedCommits.length} feat/fix commits with scope, ${K_global} distinct scopes`);

  const ownership = computeOwnership(sortedCommits);
  const weirdness = computeWeirdness(sortedCommits, allAuthors, K_global);
  const firstMoverRate = computeFirstMoverRate(sortedCommits, allAuthors);

  const byAuthor = {};
  for (const a of allAuthors) {
    byAuthor[a] = {
      ownership: ownership[a] ?? null,
      weirdness: weirdness[a] ?? null,
      firstMoverRate: firstMoverRate[a] ?? null,
    };
  }

  const compositeResults = computeComposite(byAuthor);

  const hasAnyMetric = (r) =>
    r.ownership != null || r.weirdness != null || r.firstMoverRate != null;

  const sortByComposite = (a, b) => {
    if (b.composite !== a.composite) return b.composite - a.composite;
    return (authorInfo[b.authorId]?.count ?? 0) - (authorInfo[a.authorId]?.count ?? 0);
  };

  const toEngineerEntry = (r) => {
    const info = authorInfo[r.authorId];
    return {
      login: r.authorId,
      avatarUrl: info?.avatarUrl ?? "",
      score: Math.round(r.composite * 1000) / 1000,
      metrics: {
        ownership: r.ownership,
        weirdness: r.weirdness,
        firstMoverRate: r.firstMoverRate,
        commits: info?.count ?? 0,
      },
    };
  };

  const withMetrics = compositeResults.filter(hasAnyMetric).sort(sortByComposite);
  const withoutMetrics = compositeResults.filter((r) => !hasAnyMetric(r)).sort(sortByComposite);

  const topHog = [...withMetrics.slice(0, 5), ...withoutMetrics.slice(0, 5 - withMetrics.length)]
    .slice(0, 5)
    .map(toEngineerEntry);

  if (topHog.length === 0) {
    const fallback = Object.entries(authorInfo)
      .map(([login, { count, avatarUrl }]) => ({
        login,
        avatarUrl,
        score: count,
        metrics: {
          ownership: null,
          weirdness: null,
          firstMoverRate: null,
          commits: count,
        },
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    topHog.push(...fallback);
  }

  const metricBreakdown = compositeResults
    .filter(hasAnyMetric)
    .sort(sortByComposite)
    .slice(0, 50)
    .map(toEngineerEntry);

  const data = {
    topHog,
    metricBreakdown,
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
