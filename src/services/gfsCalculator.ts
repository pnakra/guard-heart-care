import { EthicsReviewResultV2 } from '@/types/ethicsV2';

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
export function calculateGFS(result: EthicsReviewResultV2): number {
  // 1. Base score
  let gfs = result.executiveSummary.riskScore * 10;

  // 2. Deployment-context modifiers (each is a multiplier-style value, e.g. 1.3)
  const mods = result.deploymentContext?.riskModifiers;
  if (mods) {
    // Convert multiplier-style values to additive points
    // e.g. vulnerablePopulation = 1.3 → adds 3 points
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
