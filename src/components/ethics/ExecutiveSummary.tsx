import { useState } from 'react';
import { ExecutiveSummary as ExecutiveSummaryType, SeverityLevel } from '@/types/ethics';
import { EthicsReviewResultV2 } from '@/types/ethicsV2';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, TrendingUp, Info, Pencil, ShieldCheck } from 'lucide-react';
import { calculateGFS, calculateAdjustedGFS, getGFSBand, getGFSLabel } from '@/services/gfsCalculator';
import { AppCategory, getAppCategoryLabel } from '@/services/categoryDetector';
import { useIssueStatus, REVIEWED_STATUSES } from '@/contexts/IssueStatusContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
  projectName: string;
  timestamp: string;
  fullResult?: EthicsReviewResultV2;
  detectedCategory?: string;
  /** Issue IDs for triage tracking */
  issueIds?: string[];
}

const effortLabels = {
  low: { label: 'Quick fix', className: 'text-[hsl(var(--ethics-safe))]' },
  medium: { label: 'Moderate effort', className: 'text-[hsl(var(--ethics-medium))]' },
  high: { label: 'Significant work', className: 'text-[hsl(var(--ethics-high))]' },
};

const gfsBandStyles = {
  low: {
    text: 'text-[hsl(var(--ethics-safe))]',
    bg: 'bg-[hsl(var(--ethics-safe-bg))] border-[hsl(var(--ethics-safe)/0.3)]',
    badge: 'bg-[hsl(var(--ethics-safe)/0.15)] text-[hsl(var(--ethics-safe))] border border-[hsl(var(--ethics-safe)/0.3)]',
  },
  moderate: {
    text: 'text-[hsl(var(--ethics-medium))]',
    bg: 'bg-[hsl(var(--ethics-medium-bg))] border-[hsl(var(--ethics-medium)/0.3)]',
    badge: 'bg-[hsl(var(--ethics-medium)/0.15)] text-[hsl(var(--ethics-medium))] border border-[hsl(var(--ethics-medium)/0.3)]',
  },
  high: {
    text: 'text-[hsl(var(--ethics-high))]',
    bg: 'bg-[hsl(var(--ethics-high-bg))] border-[hsl(var(--ethics-high)/0.3)]',
    badge: 'bg-[hsl(var(--ethics-high)/0.15)] text-[hsl(var(--ethics-high))] border border-[hsl(var(--ethics-high)/0.3)]',
  },
  critical: {
    text: 'text-[hsl(var(--ethics-critical))]',
    bg: 'bg-[hsl(var(--ethics-critical-bg))] border-[hsl(var(--ethics-critical)/0.3)]',
    badge: 'bg-[hsl(var(--ethics-critical)/0.15)] text-[hsl(var(--ethics-critical))] border border-[hsl(var(--ethics-critical)/0.3)]',
  },
};

export function ExecutiveSummary({ summary, projectName, timestamp, fullResult, detectedCategory, issueIds = [] }: ExecutiveSummaryProps) {
  const hasTopRisks = summary.topThreeRisks && summary.topThreeRisks.length > 0;
  const [categoryOverride, setCategoryOverride] = useState<string | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const { getStatus, getAllStatuses } = useIssueStatus();

  const activeCategory = (categoryOverride || detectedCategory || 'unknown') as AppCategory;
  const categoryLabel = getAppCategoryLabel(activeCategory);

  // Compute GFS
  const allStatuses = getAllStatuses();
  const gfs = fullResult ? calculateGFS(fullResult, allStatuses) : Math.round(summary.riskScore * 10);
  const adjustedGFS = calculateAdjustedGFS(gfs, issueIds.length, allStatuses, issueIds);
  
  const displayGFS = adjustedGFS ?? gfs;
  const band = getGFSBand(displayGFS);
  const bandLabel = getGFSLabel(band);
  const styles = gfsBandStyles[band];
  const isAdjusted = adjustedGFS !== null;

  // Triage progress
  const totalIssues = issueIds.length;
  const reviewedCount = issueIds.filter(id => REVIEWED_STATUSES.includes(getStatus(id))).length;
  const triagePercent = totalIssues > 0 ? Math.round((reviewedCount / totalIssues) * 100) : 0;

  const ALL_CATEGORIES: AppCategory[] = ['fitness', 'dating', 'fintech', 'health', 'productivity', 'social', 'b2b', 'gaming', 'unknown'];

  return (
    <div className="space-y-4">
      {/* Header with GFS */}
      <div className={cn('rounded-xl p-6 border', styles.bg)}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Ground Floor Check
              </h2>
              {activeCategory !== 'unknown' && (
                <div className="flex items-center gap-1">
                  {isEditingCategory ? (
                    <Select
                      value={activeCategory}
                      onValueChange={(val) => {
                        setCategoryOverride(val);
                        setIsEditingCategory(false);
                      }}
                    >
                      <SelectTrigger className="h-6 text-xs w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_CATEGORIES.filter(c => c !== 'unknown').map(cat => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {getAppCategoryLabel(cat)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <button
                      onClick={() => setIsEditingCategory(true)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      Detected: {categoryLabel}
                      <Pencil size={10} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              {projectName}
            </p>
            <p className="text-xs text-muted-foreground">
              Scanned: {new Date(timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* GFS Score */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center cursor-help">
                    <div className={cn('text-5xl font-bold tabular-nums', styles.text)}>
                      {displayGFS}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', styles.badge)}>
                        {bandLabel}
                      </span>
                      <Info size={12} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAdjusted ? 'Adjusted GFS / 100' : 'GFS / 100'}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px] text-center">
                  <p className="text-xs">
                    {isAdjusted
                      ? `Adjusted from ${gfs} → ${displayGFS} after excluding accepted-risk and won't-fix issues. Composite score factoring risk severity, deployment context, and population vulnerability.`
                      : 'Composite score factoring risk severity, deployment context, and population vulnerability'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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

        {/* Triage Progress Bar */}
        {totalIssues > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Triage Progress
              </span>
              <span className="text-xs text-muted-foreground">
                {reviewedCount} of {totalIssues} reviewed ({triagePercent}%)
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  triagePercent === 100
                    ? 'bg-[hsl(var(--ethics-safe))]'
                    : triagePercent > 50
                    ? 'bg-[hsl(var(--ethics-low))]'
                    : 'bg-primary'
                )}
                style={{ width: `${triagePercent}%` }}
              />
            </div>
          </div>
        )}
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
