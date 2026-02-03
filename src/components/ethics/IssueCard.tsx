import { EthicsIssue } from '@/types/ethics';
import { SeverityBadge } from './SeverityBadge';
import { ChevronRight, ExternalLink, FileCode } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: EthicsIssue;
}

export function IssueCard({ issue }: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={cn(
        'bg-card border border-border rounded-lg overflow-hidden transition-all duration-200',
        'hover:shadow-md hover:border-border/80'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={issue.severity} size="sm" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {issue.category.replace('-', ' ')}
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
            
            <div>
              <h5 className="text-sm font-medium text-foreground mb-1">
                Recommendation
              </h5>
              <p className="text-sm text-muted-foreground">
                {issue.recommendation}
              </p>
            </div>
            
            {issue.learnMoreUrl && (
              <a
                href={issue.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Learn more
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
