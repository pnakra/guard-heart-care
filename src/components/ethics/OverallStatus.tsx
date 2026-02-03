import { SeverityLevel } from '@/types/ethics';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';

interface OverallStatusProps {
  status: SeverityLevel;
  issueCount: number;
  projectName: string;
}

const statusMessages: Record<SeverityLevel, string> = {
  safe: 'No ethical concerns detected',
  low: 'Minor considerations identified',
  medium: 'Some ethical concerns require attention',
  high: 'Significant ethical issues found',
  critical: 'Critical ethical violations detected',
};

const statusColors: Record<SeverityLevel, string> = {
  safe: 'from-ethics-safe/20 to-ethics-safe/5',
  low: 'from-ethics-low/20 to-ethics-low/5',
  medium: 'from-ethics-medium/20 to-ethics-medium/5',
  high: 'from-ethics-high/20 to-ethics-high/5',
  critical: 'from-ethics-critical/20 to-ethics-critical/5',
};

export function OverallStatus({ status, issueCount, projectName }: OverallStatusProps) {
  return (
    <div 
      className={cn(
        'rounded-xl p-6 bg-gradient-to-br border border-border/50',
        statusColors[status]
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            Ethics Review
          </h2>
          <p className="text-muted-foreground">
            {projectName}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1">
              <SeverityBadge severity={status} size="lg" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-foreground font-medium">
          {statusMessages[status]}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {issueCount} {issueCount === 1 ? 'issue' : 'issues'} identified across all categories
        </p>
      </div>
    </div>
  );
}
