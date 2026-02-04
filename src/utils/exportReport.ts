import { EthicsReviewResult } from '@/types/ethics';
import { DetectedCapability, MisuseScenario } from '@/data/mockMisuseData';

interface ExportData {
  result: EthicsReviewResult;
  capabilities: DetectedCapability[];
  misuseScenarios: MisuseScenario[];
}

const severityEmoji: Record<string, string> = {
  safe: '✅',
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  critical: '🔴',
};

const mitigationTypeLabels: Record<string, string> = {
  'ui-language': 'UI Language Change',
  'interaction-model': 'Interaction Model Change',
  'feature-removal': 'Feature Removal',
  'reframing': 'Reframing',
};

export function exportAsMarkdown({ result, capabilities, misuseScenarios }: ExportData): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Misuse-by-Design Scan Report: ${result.projectName}`);
  lines.push('');
  lines.push(`**Generated:** ${new Date(result.timestamp).toLocaleString()}`);
  lines.push(`**Risk Score:** ${result.executiveSummary.riskScore.toFixed(1)} / 10`);
  lines.push(`**Overall Status:** ${severityEmoji[result.overallStatus]} ${result.overallStatus.toUpperCase()}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Issues | ${result.executiveSummary.totalIssueCount} |`);
  lines.push(`| Critical | ${result.executiveSummary.criticalCount} |`);
  lines.push(`| High | ${result.executiveSummary.highCount} |`);
  lines.push('');

  // Top Risks
  if (result.executiveSummary.topThreeRisks.length > 0) {
    lines.push('### Top Risks to Address Before Shipping');
    lines.push('');
    result.executiveSummary.topThreeRisks.forEach((risk, i) => {
      lines.push(`${i + 1}. **${risk.title}** ${severityEmoji[risk.severity]}`);
      lines.push(`   - ${risk.summary}`);
      lines.push(`   - Effort: ${risk.effortToFix}`);
      lines.push('');
    });
  }

  // Detected Capabilities
  if (capabilities.length > 0) {
    lines.push('## Detected Capabilities');
    lines.push('');
    for (const cap of capabilities) {
      const riskLabel = cap.riskLevel === 'high' ? '⚠️ High Risk' : cap.riskLevel === 'medium' ? '⚡ Medium Risk' : '✓ Low Risk';
      lines.push(`### ${cap.name}`);
      lines.push('');
      lines.push(`**Risk Level:** ${riskLabel}`);
      lines.push('');
      lines.push(cap.description);
      lines.push('');
      if (cap.detectedIn.length > 0) {
        lines.push('**Detected in:**');
        for (const file of cap.detectedIn) {
          lines.push(`- \`${file}\``);
        }
        lines.push('');
      }
    }
  }

  // Misuse Scenarios
  if (misuseScenarios.length > 0) {
    lines.push('## Potential Misuse Scenarios');
    lines.push('');
    
    const sorted = [...misuseScenarios].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2 };
      return order[a.severity] - order[b.severity];
    });

    for (const scenario of sorted) {
      lines.push(`### ${severityEmoji[scenario.severity]} ${scenario.title}`);
      lines.push('');
      lines.push(`**Severity:** ${scenario.severity.toUpperCase()}`);
      lines.push('');
      lines.push(scenario.description);
      lines.push('');
      
      if (scenario.realWorldExample) {
        lines.push(`> **Real-world precedent:** ${scenario.realWorldExample}`);
        lines.push('');
      }

      lines.push('**Recommended Mitigations:**');
      for (const mitigation of scenario.mitigations) {
        lines.push(`- ${mitigation}`);
      }
      lines.push('');
    }
  }

  // Issues by Category
  if (result.issues.length > 0) {
    lines.push('## Detailed Findings');
    lines.push('');

    for (const issue of result.issues) {
      lines.push(`### ${severityEmoji[issue.severity]} ${issue.title}`);
      lines.push('');
      lines.push(`**Category:** ${issue.category}`);
      lines.push(`**Severity:** ${issue.severity}`);
      if (issue.location) {
        lines.push(`**Location:** \`${issue.location}\``);
      }
      lines.push('');
      lines.push(issue.description);
      lines.push('');
      
      if (issue.misuseScenario) {
        lines.push(`> **Misuse Scenario:** "${issue.misuseScenario}"`);
        lines.push('');
      }
      
      if (issue.whyMisuseByDesign) {
        lines.push(`**Why misuse-by-design:** ${issue.whyMisuseByDesign}`);
        lines.push('');
      }
      
      lines.push(`**Mitigation (${mitigationTypeLabels[issue.mitigationType] || issue.mitigationType}):** ${issue.mitigation}`);
      lines.push('');
    }
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*This report identifies misuse-by-design patterns—features that could harm people when working exactly as intended. It is not a security audit or bug report.*');

  return lines.join('\n');
}

export function exportAsJSON({ result, capabilities, misuseScenarios }: ExportData): string {
  return JSON.stringify({
    projectName: result.projectName,
    timestamp: result.timestamp,
    overallStatus: result.overallStatus,
    executiveSummary: result.executiveSummary,
    capabilities,
    misuseScenarios,
    issues: result.issues,
    categories: result.categories,
  }, null, 2);
}

export function generateLovablePrompt({ result, capabilities, misuseScenarios }: ExportData): string {
  const lines: string[] = [];

  lines.push(`# Ethical Misuse-by-Design Fixes for ${result.projectName}`);
  lines.push('');
  lines.push('Please address the following misuse-by-design issues. These are not bugs—they are features that could harm people when working exactly as intended.');
  lines.push('');
  lines.push('**Focus on:**');
  lines.push('- UI language changes (warnings, disclaimers, reframing)');
  lines.push('- Interaction model changes (friction, consent, confirmation)');
  lines.push('- Feature removal or limitation');
  lines.push('- NOT technical patches like input validation');
  lines.push('');

  // Priority: Critical and High misuse scenarios first
  const criticalScenarios = misuseScenarios.filter(s => s.severity === 'critical');
  if (criticalScenarios.length > 0) {
    lines.push('## 🔴 CRITICAL - Must Fix Before Shipping');
    lines.push('');
    for (const scenario of criticalScenarios) {
      lines.push(`### ${scenario.title}`);
      lines.push(`**Problem:** ${scenario.description}`);
      lines.push('');
      lines.push('**Required mitigations:**');
      for (const mitigation of scenario.mitigations) {
        lines.push(`- ${mitigation}`);
      }
      lines.push('');
    }
  }

  // Group issues by severity
  const criticalIssues = result.issues.filter(i => i.severity === 'critical');
  const highIssues = result.issues.filter(i => i.severity === 'high');
  const otherIssues = result.issues.filter(i => i.severity !== 'critical' && i.severity !== 'high');

  if (criticalIssues.length > 0) {
    lines.push('## 🔴 Critical Issues');
    lines.push('');
    for (const issue of criticalIssues) {
      lines.push(`### ${issue.title}`);
      if (issue.location) {
        lines.push(`**File:** \`${issue.location}\``);
      }
      lines.push('');
      lines.push(`**The Problem:** ${issue.description}`);
      lines.push('');
      if (issue.misuseScenario) {
        lines.push(`**How it could be misused:** "${issue.misuseScenario}"`);
        lines.push('');
      }
      lines.push(`**Fix (${mitigationTypeLabels[issue.mitigationType] || issue.mitigationType}):** ${issue.mitigation}`);
      lines.push('');
    }
  }

  if (highIssues.length > 0) {
    lines.push('## 🟠 High Priority Fixes');
    lines.push('');
    for (const issue of highIssues) {
      lines.push(`**${issue.title}**`);
      if (issue.location) {
        lines.push(`Location: \`${issue.location}\``);
      }
      lines.push(`Problem: ${issue.description}`);
      if (issue.misuseScenario) {
        lines.push(`Misuse: "${issue.misuseScenario}"`);
      }
      lines.push(`Fix: ${issue.mitigation}`);
      lines.push('');
    }
  }

  if (otherIssues.length > 0) {
    lines.push('## 🟡 Medium/Low Priority Fixes');
    lines.push('');
    for (const issue of otherIssues) {
      lines.push(`- **${issue.title}**: ${issue.mitigation}`);
    }
    lines.push('');
  }

  // Add context about detected capabilities
  const highRiskCaps = capabilities.filter(c => c.riskLevel === 'high');
  if (highRiskCaps.length > 0) {
    lines.push('## ⚠️ High-Risk Capabilities to Review');
    lines.push('');
    lines.push('These features have inherent risk potential. Review their implementation for consent, transparency, and abuse prevention:');
    lines.push('');
    for (const cap of highRiskCaps) {
      lines.push(`- **${cap.name}**: ${cap.description}`);
      if (cap.detectedIn.length > 0) {
        lines.push(`  - Found in: ${cap.detectedIn.map(f => `\`${f}\``).join(', ')}`);
      }
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Please implement these changes focusing on user protection and harm prevention. Focus on UI/interaction changes, not technical patches.*');

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function exportReport(data: ExportData, format: 'markdown' | 'json') {
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = data.result.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  if (format === 'markdown') {
    const content = exportAsMarkdown(data);
    downloadFile(content, `ethics-review-${safeName}-${timestamp}.md`, 'text/markdown');
  } else {
    const content = exportAsJSON(data);
    downloadFile(content, `ethics-review-${safeName}-${timestamp}.json`, 'application/json');
  }
}
