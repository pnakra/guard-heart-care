import { EthicsIssue, HarmCategory } from '@/types/ethics';
import { IssueCard } from './IssueCard';
import { FileTreeSidebar } from './FileTreeSidebar';
import { useState } from 'react';
import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';
import { ArrowDownNarrowWide, Zap, BarChart3, Layers, AlertTriangle } from 'lucide-react';

interface IssuesListProps {
  issues: EthicsIssue[];
  selectedCategory: HarmCategory | null;
}

type SortMode = 'severity' | 'effort' | 'confidence' | 'category';

const SORT_OPTIONS: { value: SortMode; label: string; icon: typeof AlertTriangle }[] = [
  { value: 'severity', label: 'Severity', icon: AlertTriangle },
  { value: 'effort', label: 'Effort to Fix', icon: Zap },
  { value: 'confidence', label: 'Confidence', icon: BarChart3 },
  { value: 'category', label: 'Category', icon: Layers },
];

const EFFORT_ORDER: Record<string, number> = {
  'ui-language': 1,
  'reframing': 2,
  'interaction-model': 3,
  'feature-removal': 4,
};

const SEVERITY_ORDER: Record<string, number> = {
  'critical': 0,
  'high': 1,
  'medium': 2,
  'low': 3,
  'safe': 4,
};

const CATEGORY_ORDER: Record<string, number> = {
  'false-authority': 0,
  'manipulation': 1,
  'surveillance': 2,
  'admin-abuse': 3,
  'ai-hallucination': 4,
  'dark-patterns': 5,
};

function getEffortRank(issue: EthicsIssue): number {
  // Check mitigationType first
  if (EFFORT_ORDER[issue.mitigationType] !== undefined) {
    return EFFORT_ORDER[issue.mitigationType];
  }
  // Check codeChanges action text for effort keywords
  const actionText = issue.codeChanges?.[0]?.action?.toLowerCase() || '';
  const mitText = issue.mitigation?.toLowerCase() || '';
  const combined = `${actionText} ${mitText}`;

  if (/\b(quick|hours?|1 day|minor|simple)\b/.test(combined)) return 1;
  if (/\b(2-3 days|few days|moderate)\b/.test(combined)) return 2;
  if (/\b(week|sprint|major|significant)\b/.test(combined)) return 3;
  return 4;
}

function sortIssues(issues: EthicsIssue[], mode: SortMode): EthicsIssue[] {
  const sorted = [...issues];
  switch (mode) {
    case 'severity':
      return sorted.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));
    case 'effort':
      return sorted.sort((a, b) => {
        const diff = getEffortRank(a) - getEffortRank(b);
        if (diff !== 0) return diff;
        return (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
      });
    case 'confidence':
      return sorted.sort((a, b) => {
        const confA = a.confidence?.overallConfidence ?? 0;
        const confB = b.confidence?.overallConfidence ?? 0;
        return confB - confA; // highest first
      });
    case 'category':
      return sorted.sort((a, b) => {
        const catDiff = (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99);
        if (catDiff !== 0) return catDiff;
        return (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
      });
    default:
      return sorted;
  }
}

function extractFileFromLocation(location: string): string | null {
  if (!location) return null;
  return location.replace(/:\d+$/, '');
}

function getDefaultSort(): SortMode {
  const hasScanned = sessionStorage.getItem('gfc_has_scanned') === 'true';
  return hasScanned ? 'severity' : 'effort';
}

export function IssuesList({ issues, selectedCategory }: IssuesListProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(getDefaultSort);
  const { isVibe } = useMode();

  let filteredIssues = issues.filter(issue => {
    if (selectedCategory && issue.category !== selectedCategory) return false;
    if (selectedFile && extractFileFromLocation(issue.location || '') !== selectedFile) return false;
    return true;
  });

  filteredIssues = sortIssues(filteredIssues, sortMode);

  const activeFilterLabel = selectedFile
    ? selectedFile.split('/').pop()
    : null;

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ethics-safe-bg mb-4">
          <svg className="w-8 h-8 text-ethics-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-medium text-foreground">
          {selectedCategory ? 'No findings in this category' : 'No misuse-by-design patterns found'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedCategory
            ? 'This harm category has no detected issues.'
            : 'Your project appears free of harmful affordances.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex rounded-lg border border-border overflow-hidden bg-card/30">
      {/* File tree hidden by default in vibe mode */}
      {!isVibe && (
        <FileTreeSidebar
          issues={issues}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />
      )}
      <div className="flex-1 min-w-0">
        {/* Sort controls */}
        <div className="px-3 py-2 border-b border-border bg-secondary/20 flex items-center gap-1.5 flex-wrap">
          <ArrowDownNarrowWide size={12} className="text-muted-foreground shrink-0" />
          <span className={cn('text-[10px] text-muted-foreground mr-1', isVibe ? 'font-sans' : 'font-mono')}>
            Sort:
          </span>
          {SORT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = sortMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSortMode(opt.value)}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors',
                  isVibe ? 'font-sans' : 'font-mono',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent'
                )}
              >
                <Icon size={10} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* File filter bar */}
        {selectedFile && (
          <div className="px-3 py-1.5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              filtering: <span className="text-primary">{selectedFile}</span>
            </span>
            <button
              onClick={() => setSelectedFile(null)}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              [clear]
            </button>
          </div>
        )}

        {/* Effort-first banner */}
        {sortMode === 'effort' && (
          <div className="px-3 py-1.5 border-b border-border bg-[hsl(var(--ethics-safe)/0.06)] flex items-center gap-1.5">
            <Zap size={12} className="text-[hsl(var(--ethics-safe))]" />
            <span className={cn('text-xs text-[hsl(var(--ethics-safe))]', isVibe ? 'font-sans' : 'font-mono')}>
              Showing quick wins first — easiest issues to fix are at the top.
            </span>
          </div>
        )}

        <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-8">
              <p className={cn('text-xs text-muted-foreground', !isVibe && 'font-mono')}>
                No findings for {activeFilterLabel || 'this filter'}
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
