import type { MetricMetadata } from "./types";

export const TOP_HOG_OVERVIEW =
  "This dashboard connects PostHog's company values (from posthog.com/handbook/values) to observable engineering metrics. Each metric operationalizes a handbook value: Ownership → \"You're the driver\", Weirdness → \"Do more weird\", First-Mover Rate → \"Why not now?\" + \"Optimistic by default\". Impact is the geometric mean of these three scores.";

export const TOP_HOG_METRICS: MetricMetadata[] = [
  {
    name: "Ownership",
    description:
      "Cross-author fix rate — how often you fix things that a different author last shipped in that scope. Maps to handbook value: You're the driver.",
    calculation: "ownership = cross_fix_count / total_fix_count (if total_fix >= 5 else null)",
    interpretation:
      "Higher is better. \"When you see something wrong, you fix it.\" High cross-author fix rate = collective responsibility — you clean up messes that aren't technically yours. Requires at least 5 fix commits with scopes.",
  },
  {
    name: "Weirdness",
    description:
      "Scope entropy — how evenly you spread commits across different scopes. Maps to handbook value: Do more weird.",
    calculation: "weirdness = H_raw(a) / log₂(K_global), H_raw = -Σ p(s)·log₂(p(s))",
    interpretation:
      "Higher is better. PostHog: \"Weirdness can mean shipping products with teams of 1–5 competing with $200bn+ companies.\" High entropy = you roam across flags, replay, hogql, billing, auth — wherever needed. Low entropy = staying in one lane.",
  },
  {
    name: "First-Mover Rate",
    description:
      "How often you are the first person ever to commit to a scope. Maps to handbook values: Why not now? and Optimistic by default.",
    calculation: "first_mover_rate = scopes_you_pioneered / total_scopes_you_touched",
    interpretation:
      "Higher is better. \"You cannot change the world without first believing you can change the world.\" Pioneering new scopes = starting things entirely new, not waiting for consensus — direct behavioral signal of these values.",
  },
];

export const ENGINEERING_IMPACT_OVERVIEW =
  "Engineering impact is computed as a composite of three metrics: Fix-to-Feat ratio (lower is better — you ship features, not just fixes), Rework Rate (lower is better — fewer follow-up fixes), and Throughput (higher is better — sustained contribution). The composite score is the geometric mean of percentile ranks.";

export const ENGINEERING_IMPACT_METRICS: MetricMetadata[] = [
  {
    name: "Fix-to-Feat",
    description: "Ratio of fix commits to feat commits. Lower is better.",
    calculation: "fixToFeat = fix_count / feat_count (or null if no feat commits)",
    interpretation:
      "Lower is better. High fix-to-feat suggests reactive work (fixing bugs). Low fix-to-feat means you ship more net-new features relative to fixes — proactive, value-creating work.",
  },
  {
    name: "Rework Rate",
    description: "How often commits require follow-up fixes. Lower is better.",
    calculation: "reworkRate = follow_up_fixes / total_commits",
    interpretation:
      "Lower is better. High rework rate means work often needs correction. Low rework rate indicates shipping complete, stable work.",
  },
  {
    name: "Throughput",
    description: "Sustained commit volume over time. Higher is better.",
    calculation: "throughput = commits in period / time_span",
    interpretation:
      "Higher is better. Throughput measures consistent contribution. Combined with fix-to-feat and rework, it distinguishes high-impact sustained output from one-off activity.",
  },
];
