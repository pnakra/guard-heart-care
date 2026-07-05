// Merge logic for chunked ("per-category-group") analysis passes.
//
// The scanner runs the model in several focused passes, each bounded to a few
// harm categories so no single response can truncate mid-JSON. This module
// merges those passes back into one analysis object with the same shape the
// client already consumes. It is a pure function (no Deno/runtime deps) so it
// can be unit-tested from the Vite/Vitest side — see src/test/mergeAnalyses.test.ts.

type AnyRecord = Record<string, unknown>;

interface MergeCaps {
  issues: number;
  capabilities: number;
  scenarios: number;
  riskChains: number;
}

export const DEFAULT_MERGE_CAPS: MergeCaps = {
  issues: 8,
  capabilities: 8,
  scenarios: 6,
  riskChains: 4,
};

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  safe: 4,
};

function asArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? (value.filter((v) => v && typeof v === "object") as AnyRecord[]) : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function severityRank(value: unknown): number {
  const rank = SEVERITY_RANK[str(value).toLowerCase()];
  return rank === undefined ? 5 : rank;
}

/** Dedupe a list of records by a derived key, keeping the first occurrence. */
function dedupeBy(records: AnyRecord[], keyOf: (r: AnyRecord) => string): AnyRecord[] {
  const seen = new Set<string>();
  const out: AnyRecord[] = [];
  for (const r of records) {
    const key = keyOf(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/**
 * Merge the parsed analysis objects from each chunked pass into one result.
 * `passes` should already exclude nulls (failed passes).
 */
export function mergeAnalyses(
  passes: AnyRecord[],
  detectedCategory: string,
  caps: MergeCaps = DEFAULT_MERGE_CAPS,
): AnyRecord {
  const valid = passes.filter((p) => p && typeof p === "object");

  // --- Issues: dedupe by category + title, then rank by severity ---
  const mergedIssues = dedupeBy(
    valid.flatMap((p) => asArray(p.issues)),
    (i) => `${str(i.category).toLowerCase()}::${str(i.title).trim().toLowerCase()}`,
  )
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, caps.issues);

  // --- Capabilities: dedupe by name ---
  const mergedCapabilities = dedupeBy(
    valid.flatMap((p) => asArray(p.capabilities)),
    (c) => str(c.name).trim().toLowerCase(),
  ).slice(0, caps.capabilities);

  // --- Misuse scenarios: dedupe by title ---
  const mergedScenarios = dedupeBy(
    valid.flatMap((p) => asArray(p.misuseScenarios)),
    (s) => str(s.title).trim().toLowerCase(),
  ).slice(0, caps.scenarios);

  // --- Risk chains: dedupe by name/title/id ---
  const mergedRiskChains = dedupeBy(
    valid.flatMap((p) => asArray(p.riskChains)),
    (r) => str(r.name || r.title || r.id).trim().toLowerCase(),
  ).slice(0, caps.riskChains);

  // --- Executive summary: recompute counts from merged issues; take the
  //     highest riskScore any pass reported so added coverage never lowers it. ---
  const criticalCount = mergedIssues.filter((i) => str(i.severity).toLowerCase() === "critical").length;
  const highCount = mergedIssues.filter((i) => str(i.severity).toLowerCase() === "high").length;

  const riskScore = valid.reduce((max, p) => {
    const es = (p.executiveSummary && typeof p.executiveSummary === "object" ? p.executiveSummary : {}) as AnyRecord;
    return Math.max(max, num(es.riskScore));
  }, 0);

  // Prefer AI-authored risk summaries (they carry effortToFix); fall back to the
  // issue's own fields so the top risks always line up with the merged issues.
  const allTopRisks = valid.flatMap((p) => {
    const es = (p.executiveSummary && typeof p.executiveSummary === "object" ? p.executiveSummary : {}) as AnyRecord;
    return asArray(es.topThreeRisks);
  });
  const riskByTitle = new Map<string, AnyRecord>();
  for (const r of allTopRisks) {
    const key = str(r.title).trim().toLowerCase();
    if (key && !riskByTitle.has(key)) riskByTitle.set(key, r);
  }

  const topThreeRisks = mergedIssues.slice(0, 3).map((issue) => {
    const authored = riskByTitle.get(str(issue.title).trim().toLowerCase());
    return authored ?? {
      title: str(issue.title),
      severity: str(issue.severity) || "medium",
      effortToFix: "medium",
      summary: str(issue.description),
    };
  });

  return {
    executiveSummary: {
      topThreeRisks,
      riskScore,
      totalIssueCount: mergedIssues.length,
      criticalCount,
      highCount,
    },
    capabilities: mergedCapabilities,
    misuseScenarios: mergedScenarios,
    issues: mergedIssues,
    riskChains: mergedRiskChains,
    detectedCategory,
  };
}

/**
 * Harm-category groups for chunked analysis. Splitting the 8 categories across
 * a few focused passes lets each pass stay small enough to return complete JSON
 * while together covering far more than the old single-pass 3-issue cap.
 */
export const CATEGORY_GROUPS: { label: string; categories: string[] }[] = [
  {
    label: "interpersonal & platform-power harms",
    categories: ["surveillance", "manipulation", "admin-abuse", "dark-patterns"],
  },
  {
    label: "authority, AI, identity & systemic harms",
    categories: ["false-authority", "ai-hallucination", "restrictive-masculinity", "environmental-impact"],
  },
];
