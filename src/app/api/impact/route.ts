import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import type { ImpactData } from "@/lib/types";

export const dynamic = "force-dynamic";

// Serve precomputed data from data/impact.json (updated by GitHub Action).
// Page loads are fast; no GitHub API calls at request time.
export async function GET() {
  try {
    const dataPath = join(process.cwd(), "data", "impact.json");
    const raw = readFileSync(dataPath, "utf-8");
    const data: ImpactData = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Impact API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to load impact data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
