import { jsPDF } from 'jspdf';
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

const severityLabel: Record<string, string> = {
  safe: '[SAFE]',
  low: '[LOW]',
  medium: '[MEDIUM]',
  high: '[HIGH]',
  critical: '[CRITICAL]',
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

export function exportAsPDF({ result, capabilities, misuseScenarios }: ExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    const lineHeight = size * 0.5;
    if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + 4;
  };

  const addSpacer = (height: number = 6) => {
    y += height;
  };

  // Header
  addText(`Misuse-by-Design Scan Report`, 18, 'bold');
  addText(result.projectName, 14, 'bold', [100, 100, 100]);
  addSpacer(4);
  addText(`Generated: ${new Date(result.timestamp).toLocaleString()}`, 10, 'normal', [120, 120, 120]);
  addText(`Risk Score: ${result.executiveSummary.riskScore.toFixed(1)} / 10`, 12, 'bold');
  addText(`Overall Status: ${result.overallStatus.toUpperCase()}`, 11, 'normal');
  
  // Separator line
  addSpacer(4);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  addSpacer(10);

  // Executive Summary
  addText('Executive Summary', 14, 'bold');
  addSpacer(2);
  addText(`Total Issues: ${result.executiveSummary.totalIssueCount}`, 10);
  addText(`Critical: ${result.executiveSummary.criticalCount} | High: ${result.executiveSummary.highCount}`, 10);
  addSpacer(4);

  // Top Risks
  if (result.executiveSummary.topThreeRisks.length > 0) {
    addText('Top Risks to Address Before Shipping', 12, 'bold');
    addSpacer(2);
    result.executiveSummary.topThreeRisks.forEach((risk, i) => {
      const severityColor: [number, number, number] = risk.severity === 'critical' ? [180, 40, 40] : risk.severity === 'high' ? [200, 100, 40] : [100, 100, 100];
      addText(`${i + 1}. ${risk.title} ${severityLabel[risk.severity]}`, 10, 'bold', severityColor);
      addText(`   ${risk.summary}`, 9, 'normal', [80, 80, 80]);
      addText(`   Effort to fix: ${risk.effortToFix}`, 9, 'normal', [100, 100, 100]);
      addSpacer(2);
    });
  }

  // Detected Capabilities
  if (capabilities.length > 0) {
    addSpacer(6);
    addText('Detected Capabilities', 14, 'bold');
    addSpacer(2);
    for (const cap of capabilities) {
      const riskColor: [number, number, number] = cap.riskLevel === 'high' ? [180, 40, 40] : cap.riskLevel === 'medium' ? [200, 140, 40] : [40, 140, 40];
      addText(`${cap.name} (${cap.riskLevel.toUpperCase()} risk)`, 11, 'bold', riskColor);
      addText(cap.description, 9, 'normal', [80, 80, 80]);
      if (cap.detectedIn.length > 0) {
        addText(`Found in: ${cap.detectedIn.join(', ')}`, 8, 'normal', [120, 120, 120]);
      }
      addSpacer(4);
    }
  }

  // Misuse Scenarios
  if (misuseScenarios.length > 0) {
    addSpacer(6);
    addText('Potential Misuse Scenarios', 14, 'bold');
    addSpacer(2);
    
    const sorted = [...misuseScenarios].sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    });

    for (const scenario of sorted) {
      const severityColor: [number, number, number] = scenario.severity === 'critical' ? [180, 40, 40] : scenario.severity === 'high' ? [200, 100, 40] : [180, 140, 40];
      addText(`${severityLabel[scenario.severity]} ${scenario.title}`, 11, 'bold', severityColor);
      addText(scenario.description, 9, 'normal', [80, 80, 80]);
      
      if (scenario.realWorldExample) {
        addText(`Real-world precedent: ${scenario.realWorldExample}`, 8, 'normal', [100, 100, 140]);
      }
      
      addText('Recommended Mitigations:', 9, 'bold', [60, 60, 60]);
      for (const mitigation of scenario.mitigations) {
        addText(`• ${mitigation}`, 9, 'normal', [80, 80, 80]);
      }
      addSpacer(6);
    }
  }

  // Issues
  if (result.issues.length > 0) {
    addSpacer(6);
    addText('Detailed Findings', 14, 'bold');
    addSpacer(2);

    for (const issue of result.issues) {
      const severityColor: [number, number, number] = issue.severity === 'critical' ? [180, 40, 40] : issue.severity === 'high' ? [200, 100, 40] : [180, 140, 40];
      addText(`${severityLabel[issue.severity]} ${issue.title}`, 11, 'bold', severityColor);
      addText(`Category: ${issue.category}`, 9, 'normal', [100, 100, 100]);
      if (issue.location) {
        addText(`Location: ${issue.location}`, 9, 'normal', [100, 100, 100]);
      }
      addText(issue.description, 9, 'normal', [80, 80, 80]);
      
      if (issue.misuseScenario) {
        addText(`Misuse Scenario: "${issue.misuseScenario}"`, 9, 'normal', [100, 80, 120]);
      }
      
      if (issue.whyMisuseByDesign) {
        addText(`Why misuse-by-design: ${issue.whyMisuseByDesign}`, 9, 'normal', [80, 80, 80]);
      }
      
      addText(`Mitigation: ${issue.mitigation}`, 9, 'bold', [40, 100, 40]);
      addSpacer(6);
    }
  }

  // Footer
  addSpacer(10);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  addSpacer(6);
  addText('This report identifies misuse-by-design patterns—features that could harm people when working exactly as intended. It is not a security audit or bug report.', 8, 'normal', [120, 120, 120]);

  // Save
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = result.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  doc.save(`ethics-review-${safeName}-${timestamp}.pdf`);
}

export function exportAsSARIF({ result }: ExportData): string {
  const categoryLabels: Record<string, string> = {
    'false-authority': 'False Authority',
    'manipulation': 'Manipulation',
    'surveillance': 'Surveillance',
    'admin-abuse': 'Admin Abuse',
    'ai-hallucination': 'AI Hallucination',
    'dark-patterns': 'Dark Patterns',
  };

  const severityToLevel = (sev: string): string => {
    if (sev === 'critical' || sev === 'high') return 'error';
    if (sev === 'medium') return 'warning';
    return 'note';
  };

  const parseLocation = (loc?: string) => {
    if (!loc) return { uri: 'unknown', line: 1 };
    const match = loc.match(/^(.+?)(?::(\d+))?$/);
    return {
      uri: match?.[1] || loc,
      line: match?.[2] ? parseInt(match[2], 10) : 1,
    };
  };

  // Collect unique categories used as rules
  const usedCategories = [...new Set(result.issues.map(i => i.category))];
  const rules = usedCategories.map(cat => ({
    id: cat,
    name: categoryLabels[cat] || cat,
    shortDescription: { text: categoryLabels[cat] || cat },
    fullDescription: {
      text: result.categories.find(c => c.category === cat)?.description || categoryLabels[cat] || cat,
    },
  }));

  const results = result.issues.map(issue => {
    const loc = parseLocation(issue.location);
    return {
      ruleId: issue.category,
      ruleIndex: usedCategories.indexOf(issue.category),
      level: severityToLevel(issue.severity),
      message: { text: issue.description },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: loc.uri },
            region: { startLine: loc.line },
          },
        },
      ],
      properties: {
        issueId: issue.id,
        severity: issue.severity,
        mitigationType: issue.mitigationType,
        mitigation: issue.mitigation,
      },
    };
  });

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Ground Floor Check',
            version: '2.0.0',
            informationUri: 'https://guard-heart-care.lovable.app',
            rules,
          },
        },
        results,
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

export function generatePRComment({ result }: ExportData): string {
  const lines: string[] = [];
  const gfs = Math.round((1 - result.executiveSummary.riskScore / 10) * 100);

  lines.push(`## 🛡️ Ground Floor Check — Scan Results (GFS: ${gfs}/100)`);
  lines.push('');
  lines.push('| Severity | Category | Issue | File | Effort to Fix |');
  lines.push('|----------|----------|-------|------|---------------|');

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, safe: 4 };
  const sorted = [...result.issues].sort(
    (a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)
  );

  const effortMap: Record<string, string> = {
    'ui-language': '🟢 Low',
    'reframing': '🟢 Low',
    'interaction-model': '🟡 Medium',
    'feature-removal': '🟠 High',
  };

  for (const issue of sorted) {
    const sev = issue.severity === 'critical' ? '🔴 CRITICAL'
      : issue.severity === 'high' ? '🟠 HIGH'
      : issue.severity === 'medium' ? '🟡 MEDIUM'
      : '🟢 LOW';
    const cat = (issue.category || '').replace(/-/g, ' ');
    const file = issue.location ? `\`${issue.location}\`` : '—';
    const effort = effortMap[issue.mitigationType] || '—';
    lines.push(`| ${sev} | ${cat} | ${issue.title} | ${file} | ${effort} |`);
  }

  const attentionCount = result.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  lines.push('');
  lines.push(`> Generated by [Ground Floor Check](https://guard-heart-care.lovable.app). **${attentionCount} issue${attentionCount !== 1 ? 's' : ''} require${attentionCount === 1 ? 's' : ''} attention before merge.**`);

  return lines.join('\n');
}

export function exportReport(data: ExportData, format: 'markdown' | 'json' | 'pdf' | 'sarif') {
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = data.result.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  if (format === 'markdown') {
    const content = exportAsMarkdown(data);
    downloadFile(content, `ethics-review-${safeName}-${timestamp}.md`, 'text/markdown');
  } else if (format === 'pdf') {
    exportAsPDF(data);
  } else if (format === 'sarif') {
    const content = exportAsSARIF(data);
    downloadFile(content, 'ground-floor-check.sarif', 'application/json');
  } else {
    const content = exportAsJSON(data);
    downloadFile(content, `ethics-review-${safeName}-${timestamp}.json`, 'application/json');
  }
}
