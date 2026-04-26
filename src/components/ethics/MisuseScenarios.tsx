import { useState } from 'react';
import { MisuseScenario, DetectedCapability, getCapabilityById } from '@/data/mockMisuseData';
import { cn } from '@/lib/utils';
import { AlertTriangle, ChevronRight, Shield, Lightbulb, ExternalLink } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';

interface MisuseScenariosProps {
  scenarios: MisuseScenario[];
  capabilities: DetectedCapability[];
}

const severityConfig = {
  medium: {
    label: 'Medium Risk',
    className: 'ethics-badge-medium',
  },
  high: {
    label: 'High Risk',
    className: 'ethics-badge-high',
  },
  critical: {
    label: 'Critical Risk',
    className: 'ethics-badge-critical',
  },
};

function ScenarioCard({ scenario }: { scenario: MisuseScenario }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = severityConfig[scenario.severity];
  const relatedCapabilities = scenario.capabilities
    .map(getCapabilityById)
    .filter(Boolean) as DetectedCapability[];

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-all duration-200',
      scenario.severity === 'critical' && 'border-[hsl(var(--ethics-critical)/0.4)] bg-[hsl(var(--ethics-critical-bg))]',
      scenario.severity === 'high' && 'border-[hsl(var(--ethics-high)/0.3)] bg-[hsl(var(--ethics-high-bg))]',
      scenario.severity === 'medium' && 'border-border bg-card'
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            scenario.severity === 'critical' && 'bg-[hsl(var(--ethics-critical))]',
            scenario.severity === 'high' && 'bg-[hsl(var(--ethics-high))]',
            scenario.severity === 'medium' && 'bg-[hsl(var(--ethics-medium))]'
          )}>
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
                config.className
              )}>
                {config.label}
              </span>
            </div>
            <h4 className="font-medium text-foreground">
              {scenario.title}
            </h4>
            <p className={cn("text-sm text-muted-foreground mt-1", !isExpanded && "line-clamp-2")}>
              {scenario.description}
            </p>
          </div>
          
          <ChevronRight 
            className={cn(
              'shrink-0 text-muted-foreground transition-transform duration-200 mt-1',
              isExpanded && 'rotate-90'
            )}
            size={20}
          />
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 animate-slide-in">
          <div className="pt-4 space-y-4">
            {/* Enabling capabilities */}
            <div>
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Enabled by these capabilities
              </h5>
              <div className="flex flex-wrap gap-2">
                {relatedCapabilities.map(cap => (
                  <span 
                    key={cap.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
                  >
                    {cap.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Real world example */}
            {scenario.realWorldExample && (
              <div className={cn(
                'p-3 rounded-lg border',
                scenario.severity === 'critical' ? 'bg-[hsl(var(--ethics-critical)/0.1)] border-[hsl(var(--ethics-critical)/0.2)]' : 'bg-muted/50 border-border'
              )}>
                <div className="flex gap-2">
                  <ExternalLink size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Real-world precedent
                    </p>
                    <p className="text-sm text-foreground">
                      {scenario.realWorldExample}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mitigations */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-[hsl(var(--ethics-safe))]" />
                <h5 className="text-sm font-medium text-foreground">
                  Recommended mitigations
                </h5>
              </div>
              <ul className="space-y-2">
                {scenario.mitigations.map((mitigation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Lightbulb size={14} className="shrink-0 mt-0.5 text-primary" />
                    <span className="text-muted-foreground">{mitigation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MisuseScenarios({ scenarios, capabilities }: MisuseScenariosProps) {
  const criticalCount = scenarios.filter(s => s.severity === 'critical').length;
  const highCount = scenarios.filter(s => s.severity === 'high').length;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className={cn(
        'p-4 rounded-lg border',
        criticalCount > 0 
          ? 'bg-[hsl(var(--ethics-critical-bg))] border-[hsl(var(--ethics-critical)/0.3)]'
          : 'bg-[hsl(var(--ethics-high-bg))] border-[hsl(var(--ethics-high)/0.3)]'
      )}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={cn(
            'w-5 h-5 shrink-0',
            criticalCount > 0 ? 'text-[hsl(var(--ethics-critical))]' : 'text-[hsl(var(--ethics-high))]'
          )} />
          <div>
            <p className="font-medium text-foreground">
              {criticalCount > 0 
                ? `${criticalCount} critical misuse scenario${criticalCount > 1 ? 's' : ''} detected`
                : `${highCount} high-risk misuse scenario${highCount > 1 ? 's' : ''} detected`
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on {capabilities.length} detected capabilities, we've identified how bad actors could misuse this application.
            </p>
          </div>
        </div>
      </div>

      {/* Detected capabilities summary */}
      <div className="p-4 bg-secondary/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Detected Capabilities
        </h4>
        <div className="flex flex-wrap gap-2">
          {capabilities.map(cap => (
            <span 
              key={cap.id}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
                cap.riskLevel === 'high' && 'bg-[hsl(var(--ethics-high-bg))] text-[hsl(var(--ethics-high))] border-[hsl(var(--ethics-high)/0.3)]',
                cap.riskLevel === 'medium' && 'bg-[hsl(var(--ethics-medium-bg))] text-[hsl(var(--ethics-medium))] border-[hsl(var(--ethics-medium)/0.3)]',
                cap.riskLevel === 'low' && 'bg-secondary text-secondary-foreground border-border'
              )}
            >
              {cap.name}
            </span>
          ))}
        </div>
      </div>

      {/* Scenario cards */}
      <div className="space-y-3">
        {scenarios
          .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2 };
            return order[a.severity] - order[b.severity];
          })
          .map(scenario => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
      </div>
    </div>
  );
}
