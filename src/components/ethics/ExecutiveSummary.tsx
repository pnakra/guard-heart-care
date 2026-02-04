import { ExecutiveSummary as ExecutiveSummaryType, SeverityLevel } from '@/types/ethics';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
  projectName: string;
  timestamp: string;
}

const effortLabels = {
  low: { label: 'Quick fix', className: 'text-[hsl(var(--ethics-safe))]' },
  medium: { label: 'Moderate effort', className: 'text-[hsl(var(--ethics-medium))]' },
  high: { label: 'Significant work', className: 'text-[hsl(var(--ethics-high))]' },
};

function getRiskScoreColor(score: number): string {
  if (score >= 8) return 'text-[hsl(var(--ethics-critical))]';
  if (score >= 6) return 'text-[hsl(var(--ethics-high))]';
  if (score >= 4) return 'text-[hsl(var(--ethics-medium))]';
  if (score >= 2) return 'text-[hsl(var(--ethics-low))]';
  return 'text-[hsl(var(--ethics-safe))]';
}

function getRiskScoreBg(score: number): string {
  if (score >= 8) return 'bg-[hsl(var(--ethics-critical-bg))] border-[hsl(var(--ethics-critical)/0.3)]';
  if (score >= 6) return 'bg-[hsl(var(--ethics-high-bg))] border-[hsl(var(--ethics-high)/0.3)]';
  if (score >= 4) return 'bg-[hsl(var(--ethics-medium-bg))] border-[hsl(var(--ethics-medium)/0.3)]';
  return 'bg-card border-border';
}

export function ExecutiveSummary({ summary, projectName, timestamp }: ExecutiveSummaryProps) {
  const hasTopRisks = summary.topThreeRisks && summary.topThreeRisks.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with risk score */}
      <div className={cn(
        'rounded-xl p-6 border',
        getRiskScoreBg(summary.riskScore)
      )}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Misuse-by-Design Scan
            </h2>
            <p className="text-muted-foreground">
              {projectName}
            </p>
            <p className="text-xs text-muted-foreground">
              Scanned: {new Date(timestamp).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Risk Score */}
            <div className="text-center">
              <div className={cn(
                'text-4xl font-bold tabular-nums',
                getRiskScoreColor(summary.riskScore)
              )}>
                {summary.riskScore.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Risk Score / 10</p>
            </div>
            
            {/* Issue counts */}
            <div className="flex gap-4 text-sm">
              {summary.criticalCount > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[hsl(var(--ethics-critical))]">
                    {summary.criticalCount}
                  </div>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              )}
              {summary.highCount > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[hsl(var(--ethics-high))]">
                    {summary.highCount}
                  </div>
                  <p className="text-xs text-muted-foreground">High</p>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {summary.totalIssueCount}
                </div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Risks */}
      {hasTopRisks && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle size={14} />
            Top Risks to Address Before Shipping
          </h3>
          
          <div className="grid gap-3">
            {summary.topThreeRisks.map((risk, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border flex items-start gap-4',
                  risk.severity === 'critical' && 'bg-[hsl(var(--ethics-critical-bg))] border-[hsl(var(--ethics-critical)/0.3)]',
                  risk.severity === 'high' && 'bg-[hsl(var(--ethics-high-bg))] border-[hsl(var(--ethics-high)/0.3)]',
                  risk.severity === 'medium' && 'bg-card border-border'
                )}
              >
                <div className={cn(
                  'shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white',
                  risk.severity === 'critical' && 'bg-[hsl(var(--ethics-critical))]',
                  risk.severity === 'high' && 'bg-[hsl(var(--ethics-high))]',
                  risk.severity === 'medium' && 'bg-[hsl(var(--ethics-medium))]'
                )}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-medium text-foreground">{risk.title}</h4>
                    <SeverityBadge severity={risk.severity} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground">{risk.summary}</p>
                </div>
                
                <div className="shrink-0 flex items-center gap-1.5 text-xs">
                  <Clock size={12} className={effortLabels[risk.effortToFix].className} />
                  <span className={effortLabels[risk.effortToFix].className}>
                    {effortLabels[risk.effortToFix].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No issues state */}
      {!hasTopRisks && summary.totalIssueCount === 0 && (
        <div className="p-6 rounded-lg bg-[hsl(var(--ethics-safe)/0.1)] border border-[hsl(var(--ethics-safe)/0.3)] text-center">
          <TrendingUp className="w-8 h-8 text-[hsl(var(--ethics-safe))] mx-auto mb-2" />
          <h3 className="font-medium text-foreground">No misuse-by-design patterns detected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This codebase appears to be free of harmful affordances. Continue to scan after making changes.
          </p>
        </div>
      )}
    </div>
  );
}
