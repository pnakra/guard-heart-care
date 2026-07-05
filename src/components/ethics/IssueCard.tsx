import { EthicsIssue, IssueConfidenceSummary } from '@/types/ethics';
import { SeverityBadge } from './SeverityBadge';
import { DiffViewer } from './DiffViewer';
import { ForkBadge } from './ForkBadge';
import { FeedbackButtons } from './FeedbackButtons';
import { ChevronRight, ChevronDown, FileCode, Lightbulb, AlertCircle, HelpCircle, BarChart3, AlertTriangle as AlertTriangleIcon, BookTemplate, Copy, Check, Wand2, Code2, Info, MessageSquareText, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getTemplatesForType, generateFixPrompt, MitigationType } from '@/data/remediationTemplates';
import { toast } from 'sonner';
import { useIssueStatus, IssueStatus, ISSUE_STATUS_CONFIG, RATIONALE_REQUIRED_STATUSES } from '@/contexts/IssueStatusContext';
import { useMode } from '@/contexts/ModeContext';
import { PLAIN_CATEGORY_LABELS, PLAIN_MITIGATION_TYPE_LABELS, getPlainTitle } from '@/data/plainLanguageMap';
import { Textarea } from '@/components/ui/textarea';
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
  const { getStatus, setStatus, getRationale } = useIssueStatus();
  const currentStatus = getStatus(issue.id);
  const statusConfig = ISSUE_STATUS_CONFIG[currentStatus];
  const rationale = getRationale(issue.id);

  // Triage rationale capture: when a builder sets an issue aside ("Won't fix" /
  // "This is intentional") we hold the status change until they explain why.
  const [pendingStatus, setPendingStatus] = useState<IssueStatus | null>(null);
  const [rationaleDraft, setRationaleDraft] = useState('');

  const statusLabel = (status: IssueStatus) =>
    isVibe ? ISSUE_STATUS_CONFIG[status].intentLabel : ISSUE_STATUS_CONFIG[status].label;

  const handleStatusChange = (next: IssueStatus) => {
    if (RATIONALE_REQUIRED_STATUSES.includes(next)) {
      // Require a rationale before committing a set-aside decision.
      setPendingStatus(next);
      setRationaleDraft(rationale ?? '');
    } else {
      setStatus(issue.id, next);
      setPendingStatus(null);
    }
  };

  const confirmRationale = () => {
    if (!pendingStatus) return;
    const trimmed = rationaleDraft.trim();
    if (!trimmed) return; // required — button is disabled, but guard anyway
    setStatus(issue.id, pendingStatus, trimmed);
    setPendingStatus(null);
    setRationaleDraft('');
  };

  const cancelRationale = () => {
    setPendingStatus(null);
    setRationaleDraft('');
  };

  const editRationale = () => {
    setPendingStatus(currentStatus);
    setRationaleDraft(rationale ?? '');
  };

  const pendingLabel = pendingStatus ? statusLabel(pendingStatus) : '';

  const confidence = issue.confidence;
  const isLowConfidence = confidence && confidence.overallConfidence < 0.6;
  const confidenceBadge = confidence ? getConfidenceBadge(confidence.overallConfidence) : null;

  const displayTitle = isVibe ? getPlainTitle(issue.id, issue.title) : issue.title;
  const displayCategory = isVibe
    ? PLAIN_CATEGORY_LABELS[issue.category] || issue.category
    : (categoryLabels[issue.category] || issue.category);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = generateFixPrompt(issue, { plainLanguage: isVibe });
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    toast.success(isVibe ? 'Fix instructions copied — paste into your AI builder' : 'Fix prompt copied to clipboard');
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
                {!isVibe && issue.customRule && (
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
                  'text-muted-foreground',
                  isVibe ? 'text-xs font-sans' : 'text-[10px] font-mono uppercase tracking-widest'
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
                <p className="text-sm text-foreground mt-1.5 font-semibold">
                  {issue.misuseScenario}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
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

        {/* Status dropdown — prominent triage control, visible without expanding */}
        <div className="p-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className={cn(
            'block text-[9px] font-medium text-muted-foreground mb-1 tracking-widest text-right',
            isVibe ? 'font-sans' : 'font-mono uppercase',
          )}>
            {isVibe ? 'Your call' : 'triage'}
          </span>
          <Select
            value={currentStatus}
            onValueChange={(val) => handleStatusChange(val as IssueStatus)}
          >
            <SelectTrigger className={cn(
              'h-8 text-xs w-auto min-w-[150px] gap-1.5 border font-medium',
              statusConfig.color,
              currentStatus === 'unreviewed'
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-secondary/50',
            )}>
              <span className={cn('w-2 h-2 rounded-full shrink-0', statusConfig.dotClass)} />
              <span className="truncate">{statusLabel(currentStatus)}</span>
            </SelectTrigger>
            <SelectContent align="end">
              {ALL_STATUSES.map(status => {
                const cfg = ISSUE_STATUS_CONFIG[status];
                return (
                  <SelectItem key={status} value={status} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', cfg.dotClass)} />
                      {statusLabel(status)}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rationale capture / display — kept out of the expand toggle so a triage
          decision and its justification are always visible. */}
      {pendingStatus ? (
        <div className="px-4 pb-4 pt-0" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-lg border border-[hsl(var(--ethics-medium)/0.4)] bg-[hsl(var(--ethics-medium)/0.06)] p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <MessageSquareText size={13} className="text-[hsl(var(--ethics-medium))]" />
              <p className="text-xs font-medium text-foreground">
                {isVibe
                  ? `Why are you marking this "${pendingLabel}"?`
                  : `Rationale required to mark as "${pendingLabel}"`}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {isVibe
                ? 'One line is enough. This is stored with the decision and lowers the risk score — so future-you (and anyone reviewing) knows it was a deliberate choice, not an oversight.'
                : 'Recorded with the status and reflected in the adjusted score. Explain why this is acceptable or out of scope.'}
            </p>
            <Textarea
              value={rationaleDraft}
              onChange={(e) => setRationaleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) confirmRationale();
                if (e.key === 'Escape') cancelRationale();
              }}
              rows={2}
              autoFocus
              placeholder={isVibe
                ? 'e.g. This is behind an admin-only login, not exposed to end users.'
                : 'e.g. Gated behind authenticated admin role; not reachable by end users.'}
              className="text-xs resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={cancelRationale}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={confirmRationale}
                disabled={!rationaleDraft.trim()}
                className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={12} />
                {isVibe ? 'Save decision' : 'Save rationale'}
              </button>
            </div>
          </div>
        </div>
      ) : rationale ? (
        <div className="px-4 pb-4 pt-0" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-lg border border-border bg-secondary/30 p-3 flex items-start gap-2">
            <MessageSquareText size={13} className={cn('shrink-0 mt-0.5', statusConfig.color)} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                {isVibe ? `Marked "${statusLabel(currentStatus)}" because` : `${statusLabel(currentStatus)} — rationale`}
              </p>
              <p className="text-xs text-foreground break-words">{rationale}</p>
            </div>
            <button
              onClick={editRationale}
              className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil size={11} />
              Edit
            </button>
          </div>
        </div>
      ) : null}

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
                       {isVibe ? 'How this could be misused' : 'Misuse Scenario'}
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
                    {isVibe ? 'Why this is a problem' : 'Why This Is Misuse-by-Design'}
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
                  {isVibe ? 'How to fix it' : 'Mitigation'}
                </h5>
                {issue.mitigationType && (
                  <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
                    {isVibe
                      ? PLAIN_MITIGATION_TYPE_LABELS[issue.mitigationType] || mitigationTypeLabels[issue.mitigationType]
                      : mitigationTypeLabels[issue.mitigationType]}
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
                    Use the <strong className="text-foreground">'Copy fix instructions'</strong> button below and paste it into your AI builder (like Lovable, Cursor, or ChatGPT) — it'll do the technical work for you.
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
              // In vibe mode, code diffs are hidden — non-technical users don't need them.
              null
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
                <span>{isVibe ? 'Copy fix instructions' : 'Prompt-Ready Fix'}</span>
                {!isVibe && (
                  <span className="ml-auto">
                    {copiedPrompt ? <Check size={14} className="text-[hsl(var(--ethics-safe))]" /> : <Copy size={14} className="text-muted-foreground" />}
                  </span>
                )}
                {isVibe && copiedPrompt && <Check size={16} />}
              </button>
              {isVibe && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Paste the copied instructions into your AI builder to apply the fix.
                </p>
              )}
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

            {/* Template Library — dev mode only (technical code snippets) */}
            {!isVibe && issue.mitigationType && getTemplatesForType(issue.mitigationType as MitigationType).length > 0 && (
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
            {!isVibe && confidence && (
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

            {/* Feedback buttons */}
            {reportId && (
              <div className="border-t border-border/50 pt-3">
                <FeedbackButtons reportId={reportId} issueId={issue.id} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
