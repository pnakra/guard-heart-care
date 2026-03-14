import { EthicsIssue, ForkClassification } from '@/types/ethics';
import { IssueCard } from './IssueCard';
import { GitFork, AlertTriangle, ArrowDownToLine, CheckCircle2 } from 'lucide-react';

interface ForkAnalysisTabProps {
  issues: EthicsIssue[];
  forkSummary: {
    introducedCount: number;
    inheritedCount: number;
    remediatedCount: number;
    upstreamRepo: string;
    forkRepo: string;
  };
}

function ForkSection({
  title,
  icon: Icon,
  iconClass,
  issues,
  emptyMessage,
}: {
  title: string;
  icon: React.ElementType;
  iconClass: string;
  issues: EthicsIssue[];
  emptyMessage: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className={iconClass} />
        <h4 className="font-mono text-xs font-medium text-foreground uppercase tracking-wider">
          {title}
        </h4>
        <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
          {issues.length}
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground pl-5 py-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ForkAnalysisTab({ issues, forkSummary }: ForkAnalysisTabProps) {
  const introduced = issues.filter(i => i.forkClassification === 'introduced');
  const inherited = issues.filter(i => i.forkClassification === 'inherited');
  const remediated = issues.filter(i => i.forkClassification === 'remediated');

  return (
    <div className="space-y-6">
      {/* Fork summary banner */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <GitFork size={16} className="text-primary" />
          <span className="font-mono text-sm font-medium text-foreground">Fork Comparison Summary</span>
        </div>
        <p className="font-mono text-xs text-muted-foreground mb-3">
          Comparing <span className="text-foreground">{forkSummary.forkRepo}</span> against upstream <span className="text-foreground">{forkSummary.upstreamRepo}</span>
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 rounded bg-[hsl(var(--ethics-critical)/0.08)] border border-[hsl(var(--ethics-critical)/0.2)] text-center">
            <p className="font-mono text-lg font-bold text-[hsl(var(--ethics-critical))]">{forkSummary.introducedCount}</p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Introduced</p>
          </div>
          <div className="p-2 rounded bg-[hsl(var(--ethics-medium)/0.08)] border border-[hsl(var(--ethics-medium)/0.2)] text-center">
            <p className="font-mono text-lg font-bold text-[hsl(var(--ethics-medium))]">{forkSummary.inheritedCount}</p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Inherited</p>
          </div>
          <div className="p-2 rounded bg-[hsl(var(--ethics-safe)/0.08)] border border-[hsl(var(--ethics-safe)/0.2)] text-center">
            <p className="font-mono text-lg font-bold text-[hsl(var(--ethics-safe))]">{forkSummary.remediatedCount}</p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">Remediated</p>
          </div>
        </div>
      </div>

      <ForkSection
        title="Issues You Introduced"
        icon={AlertTriangle}
        iconClass="text-[hsl(var(--ethics-critical))]"
        issues={introduced}
        emptyMessage="No new issues introduced in your fork — nice work."
      />

      <ForkSection
        title="Issues You Inherited"
        icon={ArrowDownToLine}
        iconClass="text-[hsl(var(--ethics-medium))]"
        issues={inherited}
        emptyMessage="No issues inherited from upstream."
      />

      <ForkSection
        title="Issues You Fixed"
        icon={CheckCircle2}
        iconClass="text-[hsl(var(--ethics-safe))]"
        issues={remediated}
        emptyMessage="No upstream issues were remediated in your fork."
      />
    </div>
  );
}
