import { describe, it, expect } from "vitest";
import {
  computeFixToFeat,
  parseCommitType,
} from "../../src/lib/metrics/fix-to-feat";
import {
  MIXED_COMMITS,
  ALICE_ONLY_FEAT,
  BOB_ZERO_FEAT,
  FIX_COMMITS,
  FEAT_COMMITS,
} from "../fixtures/commits";

describe("parseCommitType", () => {
  it("parses feat prefix", () => {
    expect(parseCommitType("feat: add login")).toBe("feat");
    expect(parseCommitType("feat(api): endpoint")).toBe("feat");
  });

  it("parses fix prefix", () => {
    expect(parseCommitType("fix: resolve bug")).toBe("fix");
    expect(parseCommitType("fix(ui): typo")).toBe("fix");
  });

  it("parses chore prefix", () => {
    expect(parseCommitType("chore: update deps")).toBe("chore");
  });

  it("returns null for non-conventional", () => {
    expect(parseCommitType("WIP")).toBeNull();
    expect(parseCommitType("Merge branch")).toBeNull();
    expect(parseCommitType("")).toBeNull();
  });
});

describe("computeFixToFeat", () => {
  it("excludes authors with fewer than 10 fix+feat commits", () => {
    const result = computeFixToFeat(MIXED_COMMITS);
    expect(result.find((r) => r.authorId === "alice")).toBeDefined();
    expect(result.find((r) => r.authorId === "bob")).toBeDefined();
  });

  it("returns null ratio when feat count is zero", () => {
    const manyFixes = [
      ...Array(10).fill({ message: "fix: x", authorId: "zeroFeat" }),
    ];
    const result = computeFixToFeat(manyFixes);
    const r = result.find((x) => x.authorId === "zeroFeat");
    expect(r?.ratio).toBeNull();
  });

  it("calculates ratio as fix/feat", () => {
    const commits = [
      ...ALICE_ONLY_FEAT,
      { message: "fix: a", authorId: "alice" },
      { message: "fix: b", authorId: "alice" },
      ...Array(6).fill({ message: "feat: x", authorId: "alice" }),
    ];
    const result = computeFixToFeat(commits);
    const alice = result.find((r) => r.authorId === "alice");
    expect(alice).toBeDefined();
    expect(alice?.fixCount).toBe(2);
    expect(alice?.featCount).toBe(9);
    expect(alice?.ratio).toBeCloseTo(2 / 9);
  });

  it("excludes authors with < 10 combined fix+feat", () => {
    const few = [
      { message: "feat: a", authorId: "few" },
      { message: "fix: b", authorId: "few" },
    ];
    const result = computeFixToFeat(few);
    expect(result.find((r) => r.authorId === "few")).toBeUndefined();
  });

  it("ignores chore commits", () => {
    const withChore = [
      ...Array(10).fill({ message: "feat: x", authorId: "c" }),
      { message: "chore: deps", authorId: "c" },
    ];
    const result = computeFixToFeat(withChore);
    const c = result.find((r) => r.authorId === "c");
    expect(c?.featCount).toBe(10);
    expect(c?.fixCount).toBe(0);
  });
});
