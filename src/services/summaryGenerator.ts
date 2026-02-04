// ============================================================
// Summary Generator - Creates CI/CD-friendly markdown summaries
// ============================================================

import { CISummary, EthicsReviewResultV2 } from '@/types/ethicsV2';
import { SeverityLevel } from '@/types/ethics';

const SEVERITY_EMOJI: Record<SeverityLevel, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🟢',
  safe: '✅',
};

const STATUS_EMOJI: Record<string, string> = {
  critical: '🚨',
  high: '⚠️',
  medium: '📋',
  low: '✓',
  safe: '✅',
};

/**
 * Generate compact markdown summary for CI/CD
 */
export function generateMarkdownSummary(result: EthicsReviewResultV2): string {
  const lines: string[] = [];
  
  // Header
  lines.push('## 🔍 Ethical Review Report');
  lines.push('');
  
  // Risk Score with change indicator
  const scoreChange = result.versionComparison.scoreChange;
  const changeIndicator = scoreChange !== null 
    ? scoreChange < 0 
      ? `↓ ${Math.abs(scoreChange).toFixed(1)} improved` 
      : scoreChange > 0 
        ? `↑ ${scoreChange.toFixed(1)} regressed` 
        : '→ unchanged'
    : '';
  
  const statusEmoji = STATUS_EMOJI[result.overallStatus] || '📋';
  
  lines.push(`**Risk Score:** ${result.executiveSummary.riskScore.toFixed(1)}/10 ${statusEmoji} ${changeIndicator ? `(${changeIndicator})` : ''}`);
  lines.push(`**Status:** ${result.overallStatus.charAt(0).toUpperCase() + result.overallStatus.slice(1)} Risk`);
  lines.push(`**Adjusted Score:** ${result.executiveSummary.adjustedRiskScore.toFixed(1)}/10 (based on deployment context)`);
  lines.push('');
  
  // Issues Summary Table
  lines.push('### 📊 Issues Summary');
  lines.push('| Severity | Count | Top Issue |');
  lines.push('|----------|-------|-----------|');
  
  const severityGroups: Record<string, { count: number; topIssue: string }> = {
    critical: { count: 0, topIssue: '-' },
    high: { count: 0, topIssue: '-' },
    medium: { count: 0, topIssue: '-' },
    low: { count: 0, topIssue: '-' },
  };
  
  for (const issue of result.issues) {
    const severity = issue.severity;
    if (severity in severityGroups) {
      severityGroups[severity].count++;
      if (severityGroups[severity].topIssue === '-') {
        severityGroups[severity].topIssue = issue.title;
      }
    }
  }
  
  for (const [severity, data] of Object.entries(severityGroups)) {
    if (data.count > 0) {
      lines.push(`| ${SEVERITY_EMOJI[severity as SeverityLevel]} ${severity.charAt(0).toUpperCase() + severity.slice(1)} | ${data.count} | ${data.topIssue} |`);
    }
  }
  
  lines.push('');
  
  // Top 3 Priority Fixes
  lines.push('### 🎯 Top 3 Priority Fixes');
  lines.push('');
  
  const topIssues = result.issues
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, safe: 4 };
      return (order[a.severity] || 4) - (order[b.severity] || 4);
    })
    .slice(0, 3);
  
  for (let i = 0; i < topIssues.length; i++) {
    const issue = topIssues[i];
    const emoji = SEVERITY_EMOJI[issue.severity];
    
    lines.push(`#### ${i + 1}. ${emoji} ${issue.title}`);
    lines.push(`**Impact:** Fixing removes ~${issue.remediationImpact.currentRiskContribution.toFixed(1)} risk points (→ score ${issue.remediationImpact.projectedScoreAfterFix.toFixed(1)})`);
    lines.push(`**Effort:** ${issue.fixComplexity.technical.charAt(0).toUpperCase() + issue.fixComplexity.technical.slice(1)} (${issue.remediationImpact.timeToFix.estimate})`);
    
    if (issue.location) {
      lines.push(`**File:** \`${issue.location}\``);
    }
    
    lines.push('');
    lines.push('<details>');
    lines.push('<summary>Show fix details</summary>');
    lines.push('');
    
    // Code changes if available
    if (issue.mitigation.codeChanges.length > 0) {
      const change = issue.mitigation.codeChanges[0];
      if (change.diffPreview) {
        lines.push('```diff');
        lines.push(change.diffPreview);
        lines.push('```');
        lines.push('');
      }
    }
    
    lines.push(`**Why this is misuse-by-design:** ${issue.whyMisuseByDesign}`);
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }
  
  // Progress Tracking
  if (result.versionComparison.previousScan) {
    lines.push('---');
    lines.push('');
    lines.push('### 📈 Progress Tracking');
    
    if (result.versionComparison.resolvedIssues.length > 0) {
      lines.push(`- ✅ ${result.versionComparison.resolvedIssues.length} issue(s) resolved since last scan`);
    }
    
    if (result.versionComparison.newIssues.length > 0) {
      lines.push(`- 🆕 ${result.versionComparison.newIssues.length} new issue(s) detected`);
    }
    
    lines.push(`- 🎯 ${result.issues.length} issue(s) remaining`);
    
    if (result.versionComparison.trendAnalysis) {
      lines.push(`- 📉 Score trend: ${result.versionComparison.trendAnalysis.velocity}`);
    }
    
    lines.push('');
  }
  
  // Footer
  lines.push('---');
  lines.push('');
  lines.push('### 🔗 Full Report');
  lines.push('[View detailed analysis](.ethical-review/report.json)');
  lines.push('');
  lines.push('---');
  lines.push('*Generated by Ethical Review Scanner v2.0*');
  
  return lines.join('\n');
}

/**
 * Generate CI summary object
 */
export function generateCISummary(result: EthicsReviewResultV2): CISummary {
  const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
  const highCount = result.issues.filter(i => i.severity === 'high').length;
  const mediumCount = result.issues.filter(i => i.severity === 'medium').length;
  const lowCount = result.issues.filter(i => i.severity === 'low').length;
  
  const topIssues = result.issues
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, safe: 4 };
      return (order[a.severity] || 4) - (order[b.severity] || 4);
    })
    .slice(0, 3);
  
  return {
    riskScore: result.executiveSummary.riskScore,
    scoreChange: result.versionComparison.scoreChange,
    status: result.overallStatus as CISummary['status'],
    issuesSummary: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      topIssue: topIssues[0]?.title || 'None',
    },
    topFixes: topIssues.map(issue => ({
      title: issue.title,
      severity: issue.severity,
      impact: issue.remediationImpact.currentRiskContribution,
      effort: issue.remediationImpact.timeToFix.estimate,
      file: issue.location || 'N/A',
    })),
    progress: {
      resolved: result.versionComparison.resolvedIssues.length,
      remaining: result.issues.length,
      trend: result.versionComparison.trendAnalysis?.velocity || 'No trend data',
    },
    markdownSummary: generateMarkdownSummary(result),
  };
}

/**
 * Generate one-line status for CI badge
 */
export function generateStatusBadge(result: EthicsReviewResultV2): string {
  const emoji = STATUS_EMOJI[result.overallStatus];
  return `${emoji} Risk: ${result.executiveSummary.riskScore.toFixed(1)}/10 | ${result.issues.length} issues`;
}
