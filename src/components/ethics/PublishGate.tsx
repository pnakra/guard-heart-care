import { useState } from 'react';
import { MisuseScenario, DetectedCapability } from '@/data/mockMisuseData';
import { EthicsIssue } from '@/types/ethics';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface RiskItem {
  id: string;
  title: string;
  severity: 'medium' | 'high' | 'critical';
  type: 'issue' | 'misuse';
}

interface PublishGateProps {
  issues: EthicsIssue[];
  misuseScenarios: MisuseScenario[];
  projectName: string;
  onPublish: () => void;
  onCancel: () => void;
}

export function PublishGate({ 
  issues, 
  misuseScenarios, 
  projectName,
  onPublish, 
  onCancel 
}: PublishGateProps) {
  // Combine high-severity issues and misuse scenarios into acknowledgment items
  const highSeverityIssues = issues.filter(i => i.severity === 'high' || i.severity === 'critical');
  
  const riskItems: RiskItem[] = [
    ...highSeverityIssues.map(i => ({
      id: `issue-${i.id}`,
      title: i.title,
      severity: i.severity as 'high' | 'critical',
      type: 'issue' as const,
    })),
    ...misuseScenarios.map(s => ({
      id: `misuse-${s.id}`,
      title: s.title,
      severity: s.severity,
      type: 'misuse' as const,
    })),
  ].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2 };
    return order[a.severity] - order[b.severity];
  });

  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  
  const allAcknowledged = riskItems.length === 0 || riskItems.every(item => acknowledged.has(item.id));
  const criticalCount = riskItems.filter(r => r.severity === 'critical').length;
  const highCount = riskItems.filter(r => r.severity === 'high').length;

  const toggleAcknowledged = (id: string) => {
    setAcknowledged(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const severityStyles = {
    critical: {
      border: 'border-[hsl(var(--ethics-critical)/0.4)]',
      bg: 'bg-[hsl(var(--ethics-critical-bg))]',
      text: 'text-[hsl(var(--ethics-critical))]',
    },
    high: {
      border: 'border-[hsl(var(--ethics-high)/0.3)]',
      bg: 'bg-[hsl(var(--ethics-high-bg))]',
      text: 'text-[hsl(var(--ethics-high))]',
    },
    medium: {
      border: 'border-border',
      bg: 'bg-muted/50',
      text: 'text-[hsl(var(--ethics-medium))]',
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={cn(
          'p-6 border-b',
          criticalCount > 0 
            ? 'bg-[hsl(var(--ethics-critical-bg))] border-[hsl(var(--ethics-critical)/0.3)]'
            : 'bg-[hsl(var(--ethics-high-bg))] border-[hsl(var(--ethics-high)/0.3)]'
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
              criticalCount > 0 ? 'bg-[hsl(var(--ethics-critical))]' : 'bg-[hsl(var(--ethics-high))]'
            )}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Review Required Before Publishing
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">{projectName}</span> has{' '}
                {criticalCount > 0 && <span className="font-medium text-[hsl(var(--ethics-critical))]">{criticalCount} critical</span>}
                {criticalCount > 0 && highCount > 0 && ' and '}
                {highCount > 0 && <span className="font-medium text-[hsl(var(--ethics-high))]">{highCount} high-severity</span>}
                {' '}concerns that require acknowledgment.
              </p>
            </div>
          </div>
        </div>

        {/* Risk items */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="space-y-3">
            {riskItems.map(item => {
              const isChecked = acknowledged.has(item.id);
              const styles = severityStyles[item.severity];
              
              return (
                <label
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all',
                    styles.border,
                    isChecked ? 'bg-secondary/50' : styles.bg,
                    'hover:shadow-sm'
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleAcknowledged(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border uppercase',
                        item.severity === 'critical' && 'ethics-badge-critical',
                        item.severity === 'high' && 'ethics-badge-high',
                        item.severity === 'medium' && 'ethics-badge-medium'
                      )}>
                        {item.severity}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">
                        {item.type === 'misuse' ? 'Misuse Risk' : 'Ethics Issue'}
                      </span>
                    </div>
                    <p className={cn(
                      'font-medium mt-1',
                      isChecked ? 'text-muted-foreground line-through' : 'text-foreground'
                    )}>
                      {item.title}
                    </p>
                  </div>
                  {isChecked && (
                    <CheckCircle2 className="shrink-0 w-5 h-5 text-[hsl(var(--ethics-safe))]" />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-muted/30 border-t border-border">
          <div className="flex items-center justify-between gap-4">
            <a 
              href="#" 
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Learn about our ethics framework
              <ExternalLink size={12} />
            </a>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCancel}>
                Go Back
              </Button>
              <Button 
                onClick={onPublish}
                disabled={!allAcknowledged}
                className={cn(
                  'gap-2',
                  allAcknowledged 
                    ? 'bg-[hsl(var(--ethics-safe))] hover:bg-[hsl(var(--ethics-safe))]/90'
                    : ''
                )}
              >
                {allAcknowledged ? (
                  <>
                    <CheckCircle2 size={16} />
                    Publish Anyway
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    Acknowledge All to Publish
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {!allAcknowledged && (
            <p className="text-xs text-muted-foreground mt-3 text-right">
              {riskItems.length - acknowledged.size} of {riskItems.length} items remaining
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
