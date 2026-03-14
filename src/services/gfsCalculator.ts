import { EthicsReviewResultV2 } from '@/types/ethicsV2';
import { IssueStatus, GFS_EXCLUDED_STATUSES } from '@/contexts/IssueStatusContext';

/**
 * Calculate the Ground Floor Score (GFS) — a composite 0–100 number
 * factoring risk severity, deployment context, and population vulnerability.
 *
 * Formula:
 *   1. Start with riskScore × 10  (0–100 base)
 *   2. Add deployment-context risk modifiers
 *   3. Subtract credit for resolved issues from versionComparison
 *   4. Clamp to [0, 100]
 */
export function calculateGFS(
  result: EthicsReviewResultV2,
  issueStatuses?: Record<string, IssueStatus>
): number {
  // 1. Base score
  let gfs = result.executiveSummary.riskScore * 10;

  // 2. Deployment-context modifiers (each is a multiplier-style value, e.g. 1.3)
  const mods = result.deploymentContext?.riskModifiers;
  if (mods) {
    const addFromModifier = (val: number) => Math.max(0, (val - 1) * 10);
    gfs += addFromModifier(mods.vulnerablePopulation);
    gfs += addFromModifier(mods.sensitiveContent);
    gfs += addFromModifier(mods.lackOfAuth);
  }

  // 3. Subtract credit for resolved issues (2 points each, max 10)
  const resolved = result.versionComparison?.resolvedIssues?.length ?? 0;
  gfs -= Math.min(resolved * 2, 10);

  // 4. Clamp
  return Math.round(Math.max(0, Math.min(100, gfs)));
}

/**
 * Calculate an adjusted GFS that excludes issues marked as wont-fix or accepted-risk.
 * Returns null if there are no excluded issues (i.e. same as raw GFS).
 */
export function calculateAdjustedGFS(
  rawGFS: number,
  totalIssues: number,
  issueStatuses: Record<string, IssueStatus>,
  issueIds: string[]
): number | null {
  const excludedCount = issueIds.filter(
    id => GFS_EXCLUDED_STATUSES.includes(issueStatuses[id] || 'unreviewed')
  ).length;

  if (excludedCount === 0 || totalIssues === 0) return null;

  // Reduce score proportionally to excluded issues
  const reductionFactor = excludedCount / totalIssues;
  const adjusted = Math.round(rawGFS * (1 - reductionFactor * 0.5)); // 50% weight per excluded issue
  return Math.max(0, Math.min(100, adjusted));
}

export type GFSBand = 'low' | 'moderate' | 'high' | 'critical';

export function getGFSBand(score: number): GFSBand {
  if (score <= 30) return 'low';
  if (score <= 60) return 'moderate';
  if (score <= 85) return 'high';
  return 'critical';
}

export function getGFSLabel(band: GFSBand): string {
  const labels: Record<GFSBand, string> = {
    low: 'LOW',
    moderate: 'MODERATE',
    high: 'HIGH',
    critical: 'CRITICAL',
  };
  return labels[band];
}
