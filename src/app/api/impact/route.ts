import { NextResponse } from "next/server";
import { getCommits, getPullRequests, getSinceDate } from "@/lib/github";
import type { EngineerScore, ImpactData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const since = getSinceDate();

    const [commits, prs] = await Promise.all([
      getCommits("PostHog", "posthog", since),
      getPullRequests("PostHog", "posthog", "closed", since),
    ]);

    const commitCountByAuthor: Record<string, { count: number; avatarUrl: string }> = {};
    for (const commit of commits) {
      const login = commit.author?.login ?? commit.commit.author?.email ?? "unknown";
      if (!commitCountByAuthor[login]) {
        commitCountByAuthor[login] = {
          count: 0,
          avatarUrl: commit.author?.avatar_url ?? "",
        };
      }
      commitCountByAuthor[login].count += 1;
      if (!commitCountByAuthor[login].avatarUrl && commit.author?.avatar_url) {
        commitCountByAuthor[login].avatarUrl = commit.author.avatar_url;
      }
    }

    const prCountByAuthor: Record<string, { count: number; avatarUrl: string }> = {};
    for (const pr of prs) {
      const login = pr.user?.login ?? "unknown";
      if (!prCountByAuthor[login]) {
        prCountByAuthor[login] = {
          count: 0,
          avatarUrl: pr.user?.avatar_url ?? "",
        };
      }
      prCountByAuthor[login].count += 1;
    }

    const engineeringImpact: EngineerScore[] = Object.entries(commitCountByAuthor)
      .filter(([login]) => login !== "unknown")
      .map(([login, { count, avatarUrl }]) => ({
        login,
        avatarUrl,
        score: count,
        metrics: { commits: count },
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const hogFactor: EngineerScore[] = Object.entries(prCountByAuthor)
      .filter(([login]) => login !== "unknown")
      .map(([login, { count, avatarUrl }]) => ({
        login,
        avatarUrl,
        score: count,
        metrics: { mergedPRs: count },
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const data: ImpactData = {
      engineeringImpact,
      hogFactor,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Impact API error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch impact data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
