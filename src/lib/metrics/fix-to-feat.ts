const MIN_COMBINED_COMMITS = 10;

/**
 * Parses conventional commit type from subject (first line) of commit message.
 * Returns "feat" | "fix" | "chore" | null for other types.
 */
export function parseCommitType(message: string): "feat" | "fix" | "chore" | null {
  const subject = message.split("\n")[0]?.trim() ?? "";
  const match = subject.match(/^(feat|fix|chore)(\([^)]*\))?!?:\s/i);
  return (match?.[1]?.toLowerCase() as "feat" | "fix" | "chore") ?? null;
}

export interface CommitForFixToFeat {
  message: string;
  authorId: string;
}

export interface FixToFeatResult {
  authorId: string;
  fixCount: number;
  featCount: number;
  ratio: number | null;
}

/**
 * Computes fix-to-feat ratio per author over a commit list (assumed 90-day window).
 * - Returns null for ratio when feat count is zero
 * - Excludes authors with fewer than 10 combined fix+feat commits
 */
export function computeFixToFeat(commits: CommitForFixToFeat[]): FixToFeatResult[] {
  const byAuthor: Record<
    string,
    { fix: number; feat: number }
  > = {};

  for (const c of commits) {
    const type = parseCommitType(c.message);
    if (type !== "feat" && type !== "fix") continue;

    if (!byAuthor[c.authorId]) {
      byAuthor[c.authorId] = { fix: 0, feat: 0 };
    }
    if (type === "feat") byAuthor[c.authorId].feat += 1;
    else byAuthor[c.authorId].fix += 1;
  }

  return Object.entries(byAuthor)
    .filter(([, counts]) => counts.fix + counts.feat >= MIN_COMBINED_COMMITS)
    .map(([authorId, { fix, feat }]) => ({
      authorId,
      fixCount: fix,
      featCount: feat,
      ratio: feat === 0 ? null : fix / feat,
    }));
}
