import { Octokit } from "octokit";

const OWNER = "PostHog";
const REPO = "posthog";
const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set");
  }
  return new Octokit({ auth: token });
}

export function getSinceDate(): string {
  return new Date(Date.now() - DAYS_90_MS).toISOString();
}

export async function getCommits(owner = OWNER, repo = REPO, since?: string) {
  const octokit = getOctokit();
  const sinceDate = since ?? getSinceDate();
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since: sinceDate,
    per_page: 100,
  });
  return data;
}

export async function getAllCommits(owner = OWNER, repo = REPO, since?: string) {
  const octokit = getOctokit();
  const sinceDate = since ?? getSinceDate();
  return octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo,
    since: sinceDate,
    per_page: 100,
  });
}

export async function getContributors(owner = OWNER, repo = REPO) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.listContributors({
    owner,
    repo,
    per_page: 100,
  });
  return data;
}

export async function getContributorStats(owner = OWNER, repo = REPO) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.getContributorsStats({
    owner,
    repo,
  });
  return data;
}

export async function getPullRequests(
  owner = OWNER,
  repo = REPO,
  state: "all" | "open" | "closed" = "closed",
  since?: string
) {
  const octokit = getOctokit();
  const sinceDate = since ?? getSinceDate();
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state,
    sort: "updated",
    direction: "desc",
    per_page: 100,
  });
  return data.filter((pr) => pr.merged_at && new Date(pr.merged_at) >= new Date(sinceDate));
}

export async function getAllMergedPRs(owner = OWNER, repo = REPO, since?: string) {
  const octokit = getOctokit();
  const sinceDate = since ?? getSinceDate();
  const sinceTime = new Date(sinceDate).getTime();
  const all: Awaited<ReturnType<typeof octokit.rest.pulls.list>>["data"] = [];
  // Search API doesn't return merged_at reliably. Paginate through all closed PRs
  // and filter. Max 400 pages (~40k PRs) to stay within reasonable runtime.
  const MAX_PAGES = 400;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "closed",
      sort: "updated",
      direction: "desc",
      per_page: 100,
      page,
    });
    if (data.length === 0) break;
    for (const pr of data) {
      if (!pr.merged_at) continue;
      if (new Date(pr.merged_at).getTime() >= sinceTime) all.push(pr);
    }
  }
  return all;
}

export async function getPullRequestReviews(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pullNumber,
  });
  return data;
}
