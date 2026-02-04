// ============================================================\
// Version Comparator - Tracks changes between scans
// ============================================================\

import { VersionComparison, ResolvedIssue, UnchangedIssue, TrendAnalysis } from '@/types/ethicsV2';
import { EthicsIssue } from '@/types/ethics';

export interface ScanHistoryEntry {
  timestamp: string;
  riskScore: number;
  issueIds: string[];
  issues: Array<{ id: string; title: string; severity: string }>;
}

/**
 * Compare current scan with previous scan
 */
export function compareWithPreviousScan(
  currentIssues: EthicsIssue[],
  currentScore: number,
  previousScan: ScanHistoryEntry | null,
  currentTimestamp: string
): VersionComparison {
  if (!previousScan) {
    return {
      currentScan: currentTimestamp,
      previousScan: null,
      scoreChange: null,
      scoreChangeInterpretation: null,
      resolvedIssues: [],
      newIssues: [],
      regressedIssues: [],
      unchangedIssues: currentIssues.map(issue => ({
        id: issue.id,
        ageInDays: 0,
        status: 'new' as const,
      })),
      trendAnalysis: null,
    };
  }
  
  const currentIssueIds = new Set(currentIssues.map(i => i.id));
  const previousIssueIds = new Set(previousScan.issueIds);
  
  // Find resolved issues (in previous but not in current)
  const resolvedIssues: ResolvedIssue[] = previousScan.issues
    .filter(pi => !currentIssueIds.has(pi.id))
    .map(pi => ({
      id: pi.id,
      title: pi.title,
      resolvedAt: currentTimestamp,
      howFixed: 'Issue no longer detected in codebase',
    }));
  
  // Find new issues (in current but not in previous)
  const newIssueIds = currentIssues
    .filter(ci => !previousIssueIds.has(ci.id))
    .map(ci => ci.id);
  
  // Find unchanged issues
  const unchangedIssues: UnchangedIssue[] = currentIssues
    .filter(ci => previousIssueIds.has(ci.id))
    .map(ci => {
      const prevDate = new Date(previousScan.timestamp);
      const currDate = new Date(currentTimestamp);
      const ageInDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: ci.id,
        ageInDays,
        status: 'acknowledged' as const,
      };
    });
  
  // Calculate score change
  const scoreChange = Math.round((currentScore - previousScan.riskScore) * 10) / 10;
  
  let scoreChangeInterpretation: string;
  if (scoreChange < -1) {
    scoreChangeInterpretation = `Improved by ${Math.abs(scoreChange).toFixed(1)} points (${Math.round((Math.abs(scoreChange) / previousScan.riskScore) * 100)}% reduction)`;
  } else if (scoreChange > 1) {
    scoreChangeInterpretation = `Regressed by ${scoreChange.toFixed(1)} points (${Math.round((scoreChange / previousScan.riskScore) * 100)}% increase)`;
  } else if (scoreChange < 0) {
    scoreChangeInterpretation = `Slightly improved by ${Math.abs(scoreChange).toFixed(1)} points`;
  } else if (scoreChange > 0) {
    scoreChangeInterpretation = `Slightly regressed by ${scoreChange.toFixed(1)} points`;
  } else {
    scoreChangeInterpretation = 'Score unchanged';
  }
  
  return {
    currentScan: currentTimestamp,
    previousScan: previousScan.timestamp,
    scoreChange,
    scoreChangeInterpretation,
    resolvedIssues,
    newIssues: newIssueIds,
    regressedIssues: [], // Would need more history to detect regressions
    unchangedIssues,
    trendAnalysis: null, // Would need more history for trend analysis
  };
}

/**
 * Calculate trend analysis from scan history
 */
export function calculateTrendAnalysis(
  history: ScanHistoryEntry[],
  currentScore: number,
  targetScore: number = 5.0
): TrendAnalysis | null {
  if (history.length < 2) {
    return null;
  }
  
  // Sort by timestamp (oldest first)
  const sorted = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Get last 7 days of history
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentHistory = sorted.filter(h => 
    new Date(h.timestamp).getTime() >= sevenDaysAgo
  );
  
  if (recentHistory.length < 2) {
    return {
      last7Days: 'Insufficient data for 7-day trend',
      velocity: 'Unknown',
      projectedTimeTo5: 'Unable to project',
    };
  }
  
  // Calculate 7-day change
  const oldestRecent = recentHistory[0];
  const change7Days = currentScore - oldestRecent.riskScore;
  
  // Calculate velocity (points per day)
  const daysDiff = (Date.now() - new Date(oldestRecent.timestamp).getTime()) / (1000 * 60 * 60 * 24);
  const velocity = change7Days / Math.max(daysDiff, 1);
  
  // Project time to target score
  let projectedDays: number | null = null;
  if (velocity < 0 && currentScore > targetScore) {
    projectedDays = Math.ceil((currentScore - targetScore) / Math.abs(velocity));
  }
  
  const last7DaysText = change7Days < 0
    ? `Score decreased by ${Math.abs(change7Days).toFixed(1)} points`
    : change7Days > 0
      ? `Score increased by ${change7Days.toFixed(1)} points`
      : 'Score unchanged';
  
  const velocityText = velocity < 0
    ? `Improving at ~${Math.abs(velocity).toFixed(2)} points/day`
    : velocity > 0
      ? `Worsening at ~${velocity.toFixed(2)} points/day`
      : 'Stable';
  
  const projectedText = projectedDays !== null
    ? `Projected to reach ${targetScore.toFixed(1)} in ~${projectedDays} days at current velocity`
    : velocity >= 0
      ? 'Not on track to reach target (score not improving)'
      : 'Already at or below target';
  
  return {
    last7Days: last7DaysText,
    velocity: velocityText,
    projectedTimeTo5: projectedText,
  };
}

/**
 * Create a history entry from current scan
 */
export function createHistoryEntry(
  issues: EthicsIssue[],
  riskScore: number,
  timestamp: string
): ScanHistoryEntry {
  return {
    timestamp,
    riskScore,
    issueIds: issues.map(i => i.id),
    issues: issues.map(i => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
    })),
  };
}

/**
 * Detect issues that have regressed (were fixed but reappeared)
 */
export function detectRegressedIssues(
  currentIssues: EthicsIssue[],
  fullHistory: ScanHistoryEntry[]
): string[] {
  if (fullHistory.length < 3) return [];
  
  const currentIssueIds = new Set(currentIssues.map(i => i.id));
  const regressedIds: string[] = [];
  
  // Look through history to find issues that were previously resolved
  for (let i = fullHistory.length - 2; i >= 0; i--) {
    const olderScan = fullHistory[i];
    const newerScan = fullHistory[i + 1];
    
    // Find issues that were in olderScan but not in newerScan (resolved)
    // and are now back in currentIssues (regressed)
    for (const issueId of olderScan.issueIds) {
      if (!newerScan.issueIds.includes(issueId) && currentIssueIds.has(issueId)) {
        if (!regressedIds.includes(issueId)) {
          regressedIds.push(issueId);
        }
      }
    }
  }
  
  return regressedIds;
}
