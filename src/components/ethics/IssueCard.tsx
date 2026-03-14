import { EthicsIssue } from '@/types/ethics';
import { SeverityBadge } from './SeverityBadge';
import { ChevronRight, FileCode, Lightbulb, AlertCircle, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIssueStatus, IssueStatus, ISSUE_STATUS_CONFIG } from '@/contexts/IssueStatusContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IssueCardProps {
  issue: EthicsIssue;
}

const mitigationTypeLabels = {
  'ui-language': 'UI Language Change',
  'interaction-model': 'Interaction Model Change', 
  'feature-removal': 'Feature Removal',
  'reframing': 'Reframing',
};

const categoryLabels: Record<string, string> = {
  'false-authority': 'False Authority',
  'manipulation': 'Manipulation',
  'surveillance': 'Surveillance',
  'admin-abuse': 'Admin Abuse',
  'ai-hallucination': 'AI Hallucination',
};

const ALL_STATUSES: IssueStatus[] = ['unreviewed', 'in-review', 'fixed', 'wont-fix', 'accepted-risk'];

export function IssueCard({ issue }: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getStatus, setStatus } = useIssueStatus();
  const currentStatus = getStatus(issue.id);
  const statusConfig = ISSUE_STATUS_CONFIG[currentStatus];

  return (
    <div 
      className={cn(
        'bg-card border border-border rounded-lg overflow-hidden transition-all duration-200',
        'hover:shadow-md hover:border-border/80',
        (currentStatus === 'fixed' || currentStatus === 'wont-fix') && 'opacity-60'
      )}
    >
      <div className="flex items-start">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={issue.severity} size="sm" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {categoryLabels[issue.category] || issue.category}
                </span>
              </div>
              <h4 className="font-medium text-foreground mt-2">
                {issue.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {issue.description}
              </p>
            </div>
            
            <ChevronRight 
              className={cn(
                'shrink-0 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
              size={20}
            />
          </div>
        </button>

        {/* Status dropdown */}
        <div className="p-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Select
            value={currentStatus}
            onValueChange={(val) => setStatus(issue.id, val as IssueStatus)}
          >
            <SelectTrigger className={cn(
              'h-7 text-xs w-auto min-w-[110px] gap-1.5 border-0 bg-secondary/50',
              statusConfig.color
            )}>
              <span className={cn('w-2 h-2 rounded-full shrink-0', statusConfig.dotClass)} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {ALL_STATUSES.map(status => {
                const cfg = ISSUE_STATUS_CONFIG[status];
                return (
                  <SelectItem key={status} value={status} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', cfg.dotClass)} />
                      {cfg.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-0 animate-slide-in">
          <div className="pt-4 space-y-4">
            {issue.location && (
              <div className="flex items-center gap-2 text-sm">
                <FileCode size={14} className="text-muted-foreground shrink-0" />
                <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                  {issue.location}
                </code>
              </div>
            )}

            {/* Misuse Scenario - the key differentiator */}
            {issue.misuseScenario && (
              <div className="p-3 rounded-lg bg-[hsl(var(--ethics-high-bg))] border border-[hsl(var(--ethics-high)/0.2)]">
                <div className="flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-[hsl(var(--ethics-high))]" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Misuse Scenario
                    </p>
                    <p className="text-sm text-foreground italic">
                      "{issue.misuseScenario}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Why this is misuse-by-design */}
            {issue.whyMisuseByDesign && (
              <div className="flex gap-2">
                <HelpCircle size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Why This Is Misuse-by-Design
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {issue.whyMisuseByDesign}
                  </p>
                </div>
              </div>
            )}
            
            {/* Mitigation */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={14} className="text-primary" />
                <h5 className="text-sm font-medium text-foreground">
                  Mitigation
                </h5>
                {issue.mitigationType && (
                  <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                    {mitigationTypeLabels[issue.mitigationType]}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground pl-5">
                {issue.mitigation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
