import type { CommitForFixToFeat } from "../../src/lib/metrics/fix-to-feat";

export const FIX_COMMITS: CommitForFixToFeat[] = [
  { message: "fix: resolve null pointer", authorId: "alice" },
  { message: "fix: patch memory leak", authorId: "alice" },
  { message: "fix(api): handle empty response", authorId: "bob" },
];

export const FEAT_COMMITS: CommitForFixToFeat[] = [
  { message: "feat: add user auth", authorId: "alice" },
  { message: "feat(api): new endpoint", authorId: "alice" },
  { message: "feat: dashboard", authorId: "alice" },
  { message: "feat: init", authorId: "bob" },
  { message: "feat: second feat", authorId: "bob" },
];

export const CHORE_COMMITS: CommitForFixToFeat[] = [
  { message: "chore: update deps", authorId: "alice" },
  { message: "chore: lint", authorId: "bob" },
];

export const MIXED_COMMITS: CommitForFixToFeat[] = [
  ...FEAT_COMMITS,
  ...FIX_COMMITS,
  ...CHORE_COMMITS,
  // Push alice and bob over 10 combined fix+feat
  ...Array(5).fill({ message: "feat: more", authorId: "alice" }),
  ...Array(4).fill({ message: "fix: more", authorId: "alice" }),
  ...Array(6).fill({ message: "feat: more", authorId: "bob" }),
  ...Array(4).fill({ message: "fix: more", authorId: "bob" }),
];

export const ALICE_ONLY_FEAT: CommitForFixToFeat[] = [
  { message: "feat: a", authorId: "alice" },
  { message: "feat: b", authorId: "alice" },
  { message: "feat: c", authorId: "alice" },
];

export const BOB_ZERO_FEAT: CommitForFixToFeat[] = [
  { message: "fix: x", authorId: "bob" },
  { message: "fix: y", authorId: "bob" },
  { message: "fix: z", authorId: "bob" },
];
