import { EthicsIssue, IssueConfidenceSummary } from '@/types/ethics';
import { SeverityBadge } from './SeverityBadge';
import { DiffViewer } from './DiffViewer';
import { ForkBadge } from './ForkBadge';
import { FeedbackButtons } from './FeedbackButtons';
import { ChevronRight, ChevronDown, FileCode, Lightbulb, AlertCircle, HelpCircle, BarChart3, AlertTriangle as AlertTriangleIcon, BookTemplate, Copy, Check, Wand2, Code2, Info } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getTemplatesForType, generateFixPrompt, MitigationType } from '@/data/remediationTemplates';
import { toast } from 'sonner';
import { useIssueStatus, IssueStatus, ISSUE_STATUS_CONFIG } from '@/contexts/IssueStatusContext';
import { useMode } from '@/contexts/ModeContext';
import { PLAIN_CATEGORY_LABELS, getPlainTitle } from '@/data/plainLanguageMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IssueCardProps {
  issue: EthicsIssue;
  reportId?: string;
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
  'dark-patterns': 'Dark Patterns',
};

const populationLabels: Record<string, string> = {
  'minors': 'Minors',
  'financially-vulnerable': 'Financially Vulnerable',
  'mental-health': 'Mental Health',
  'domestic-abuse': 'Domestic Abuse',
  'elderly': 'Elderly',
};

const ALL_STATUSES: IssueStatus[] = ['unreviewed', 'in-review', 'fixed', 'wont-fix', 'accepted-risk'];

function getConfidenceBadge(overall: number): { label: string; className: string } {
  if (overall < 0.6) return { label: '⚠ Needs Review', className: 'bg-[hsl(var(--ethics-medium)/0.15)] text-[hsl(var(--ethics-medium))] border-[hsl(var(--ethics-medium)/0.3)]' };
  if (overall <= 0.8) return { label: 'Moderate Confidence', className: 'bg-secondary text-muted-foreground border-border' };
  return { label: 'High Confidence', className: 'bg-[hsl(var(--ethics-safe)/0.15)] text-[hsl(var(--ethics-safe))] border-[hsl(var(--ethics-safe)/0.3)]' };
}

function ConfidenceBar({ label, value, rationale }: { label: string; value: number; rationale: string }) {
  const percent = Math.round(value * 100);
  const barColor =
    percent >= 80 ? 'bg-[hsl(var(--ethics-safe))]' :
    percent >= 60 ? 'bg-[hsl(var(--ethics-low))]' :
    'bg-[hsl(var(--ethics-medium))]';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{rationale}</p>
    </div>
  );
}

export function IssueCard({ issue, reportId }: IssueCardProps) {
  const { isVibe } = useMode();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showDiff, setShowDiff] = useState(!isVibe); // collapsed by default in vibe
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const { getStatus, setStatus } = useIssueStatus();
  const currentStatus = getStatus(issue.id);
  const statusConfig = ISSUE_STATUS_CONFIG[currentStatus];

  const confidence = issue.confidence;
  const isLowConfidence = confidence && confidence.overallConfidence < 0.6;
  const confidenceBadge = confidence ? getConfidenceBadge(confidence.overallConfidence) : null;

  const displayTitle = isVibe ? getPlainTitle(issue.id, issue.title) : issue.title;
  const displayCategory = isVibe
    ? PLAIN_CATEGORY_LABELS[issue.category] || issue.category
    : (categoryLabels[issue.category] || issue.category);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = generateFixPrompt(issue);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    toast.success('Fix prompt copied to clipboard');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div 
      className={cn(
        'bg-card border rounded-lg overflow-hidden transition-all duration-200',
        'hover:shadow-md',
        isLowConfidence
          ? 'border-dashed border-[hsl(var(--ethics-medium)/0.5)]'
          : 'border-border hover:border-border/80',
        (currentStatus === 'fixed' || currentStatus === 'wont-fix') && 'opacity-60'
      )}
    >
      {/* Low confidence flag */}
      {isLowConfidence && (
        <div className="px-4 py-1.5 bg-[hsl(var(--ethics-medium)/0.08)] border-b border-dashed border-[hsl(var(--ethics-medium)/0.3)] flex items-center gap-1.5">
          <AlertTriangleIcon size={11} className="text-[hsl(var(--ethics-medium))]" />
          <span className="text-xs font-medium text-[hsl(var(--ethics-medium))]">Flagged for human review</span>
        </div>
      )}

      <div className="flex items-start">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 text-left p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={issue.severity} size="sm" />
                {issue.forkClassification && (
                  <ForkBadge classification={issue.forkClassification} />
                )}
                {!isVibe && confidenceBadge && (
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full border', confidenceBadge.className)}>
                    {confidenceBadge.label}
                  </span>
                )}
                {issue.customRule && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                    Custom Rule{issue.customRuleName ? `: ${issue.customRuleName}` : ''}
                  </span>
                )}
                {issue.populationTags && issue.populationTags.length > 0 && issue.populationTags.map(tag => (
                  <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full border bg-[hsl(var(--ethics-medium)/0.1)] text-[hsl(var(--ethics-medium))] border-[hsl(var(--ethics-medium)/0.2)]">
                    ⚠ Elevated: {populationLabels[tag] || tag}
                  </span>
                ))}
                <span className={cn(
                  'text-[10px] text-muted-foreground uppercase tracking-widest',
                  isVibe ? 'font-sans' : 'font-mono'
                )}>
                  {isVibe ? displayCategory : `[${displayCategory.toUpperCase()}]`}
                </span>
              </div>
              <h4 className={cn(
                'font-medium text-foreground mt-2 text-sm',
                isVibe ? 'font-sans' : 'font-mono'
              )}>
                {displayTitle}
              </h4>

              {/* In vibe mode, show misuse scenario prominently in collapsed view */}
              {isVibe && issue.misuseScenario ? (
                <p className="text-sm text-foreground mt-1.5 font-semibold line-clamp-2">
                  {issue.misuseScenario}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {issue.description}
                </p>
              )}
            </div>
            
            <ChevronRight 
              className={cn(
                'shrink-0 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
              size={20}
            />
          </div>

          {/* Vibe mode: prominent copy fix prompt CTA in collapsed view */}
          {isVibe && !isExpanded && (
            <div className="mt-3" onClick={e => e.stopPropagation()}>
              <button
                onClick={handleCopyPrompt}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center',
                  copiedPrompt
                    ? 'bg-[hsl(var(--ethics-safe)/0.15)] text-[hsl(var(--ethics-safe))] border border-[hsl(var(--ethics-safe)/0.3)]'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {copiedPrompt ? <Check size={16} /> : <Wand2 size={16} />}
                {copiedPrompt ? 'Copied!' : 'Copy fix prompt'}
              </button>
            </div>
          )}
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
            {/* Location - hidden in vibe mode unless expanded */}
            {issue.location && !isVibe && (
              <div className="flex items-center gap-2 text-sm">
                <FileCode size={14} className="text-muted-foreground shrink-0" />
                <code className="font-mono text-[11px] bg-[hsl(210,28%,8%)] text-primary px-2.5 py-1 rounded border border-border">
                  {issue.location}
                </code>
              </div>
            )}

            {/* Misuse Scenario */}
            {issue.misuseScenario && (
              <div className="p-3 rounded-lg bg-[hsl(var(--ethics-high-bg))] border border-[hsl(var(--ethics-high)/0.2)]">
                <div className="flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-[hsl(var(--ethics-high))]" />
                  <div>
                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                       Misuse Scenario
                     </p>
                     <p className={cn(
                       'text-sm text-foreground',
                       isVibe ? 'font-semibold' : 'italic'
                     )}>
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
                {!isVibe && issue.mitigationType && (
                  <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                    {mitigationTypeLabels[issue.mitigationType]}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground pl-5">
                {issue.mitigation}
              </p>
              {isVibe && (
                <div className="mt-2 ml-5 p-2.5 rounded-lg bg-primary/5 border border-primary/15 flex items-start gap-2">
                  <Info size={13} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    For a plain-language fix, use the <strong className="text-foreground">'Copy fix prompt'</strong> button and paste into your AI tool.
                  </p>
                </div>
              )}
            </div>

            {/* Code Changes Diff Viewer - collapsed by default in vibe mode */}
            {!isVibe ? (
              <div className="pl-5">
                {issue.codeChanges && issue.codeChanges.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Code2 size={13} className="text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                        Code Changes ({issue.codeChanges.length})
                      </span>
                    </div>
                    {issue.codeChanges.map((change, i) => (
                      <DiffViewer key={i} codeChange={change} />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-secondary/20">
                    <Code2 size={13} className="text-muted-foreground/50" />
                    <span className="text-xs font-mono text-muted-foreground/70">
                      No code-level changes — see design and content changes below
                    </span>
                  </div>
                )}
              </div>
            ) : (
              issue.codeChanges && issue.codeChanges.length > 0 && (
                <div className="pl-5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDiff(!showDiff); }}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <Code2 size={14} />
                    <span>View code changes ({issue.codeChanges.length})</span>
                    {showDiff ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {showDiff && (
                    <div className="mt-2 space-y-3">
                      {issue.codeChanges.map((change, i) => (
                        <DiffViewer key={i} codeChange={change} />
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Prompt-Ready Fix — larger CTA in vibe mode */}
            <div className="border-t border-border/50 pt-3">
              <button
                onClick={handleCopyPrompt}
                className={cn(
                  'flex items-center gap-2 font-medium transition-colors w-full',
                  isVibe
                    ? 'px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm justify-center'
                    : 'text-sm text-primary hover:text-primary/80'
                )}
              >
                <Wand2 size={isVibe ? 16 : 14} />
                <span>{isVibe ? 'Copy fix prompt' : 'Prompt-Ready Fix'}</span>
                {!isVibe && (
                  <span className="ml-auto">
                    {copiedPrompt ? <Check size={14} className="text-[hsl(var(--ethics-safe))]" /> : <Copy size={14} className="text-muted-foreground" />}
                  </span>
                )}
                {isVibe && copiedPrompt && <Check size={16} />}
              </button>
              {!isVibe && (
                <div
                  onClick={handleCopyPrompt}
                  className="mt-2 p-3 rounded-lg bg-secondary/70 border border-border cursor-pointer hover:bg-secondary transition-colors"
                >
                  <code className="text-xs text-foreground font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {generateFixPrompt(issue)}
                  </code>
                </div>
              )}
            </div>

            {/* Template Library */}
            {issue.mitigationType && getTemplatesForType(issue.mitigationType as MitigationType).length > 0 && (
              <div className="border-t border-border/50 pt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowTemplates(!showTemplates); }}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <BookTemplate size={14} />
                  <span>Template Library</span>
                  <span className="text-xs text-muted-foreground ml-auto mr-1">
                    {getTemplatesForType(issue.mitigationType as MitigationType).length} templates
                  </span>
                  {showTemplates ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {showTemplates && (
                  <div className="mt-3 space-y-3 pl-5">
                    {getTemplatesForType(issue.mitigationType as MitigationType).map(template => (
                      <div key={template.id} className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-secondary/50">
                          <div>
                            <p className="text-xs font-medium text-foreground">{template.title}</p>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(template.copyText);
                              setCopiedId(template.id);
                              toast.success(`"${template.title}" copied`);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className={cn(
                              'shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                              copiedId === template.id
                                ? 'bg-[hsl(var(--ethics-safe)/0.15)] text-[hsl(var(--ethics-safe))]'
                                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                            )}
                          >
                            {copiedId === template.id ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === template.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="px-3 py-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto">
                          {template.copyText}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Confidence Section — collapsed by default in vibe, same behavior in dev */}
            {confidence && (
              <div className="border-t border-border/50 pt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowConfidence(!showConfidence); }}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <BarChart3 size={14} />
                  <span>Confidence Scores</span>
                  <span className="text-xs tabular-nums ml-auto mr-1">
                    {Math.round(confidence.overallConfidence * 100)}% overall
                  </span>
                  {showConfidence ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                
                {showConfidence && (
                  <div className="mt-3 space-y-4 pl-5">
                    <ConfidenceBar
                      label="Detection Confidence"
                      value={confidence.detectionConfidence}
                      rationale={confidence.detectionRationale}
                    />
                    <ConfidenceBar
                      label="Misuse Confidence"
                      value={confidence.misuseConfidence}
                      rationale={confidence.misuseRationale}
                    />
                    <ConfidenceBar
                      label="Severity Confidence"
                      value={confidence.severityConfidence}
                      rationale={confidence.severityRationale}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
