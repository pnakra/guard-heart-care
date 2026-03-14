import { EthicsIssue, HarmCategory } from '@/types/ethics';
import { IssueCard } from './IssueCard';
import { FileTreeSidebar } from './FileTreeSidebar';
import { useState } from 'react';
import { useMode } from '@/contexts/ModeContext';
import { cn } from '@/lib/utils';

interface IssuesListProps {
  issues: EthicsIssue[];
  selectedCategory: HarmCategory | null;
}

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

function extractFileFromLocation(location: string): string | null {
  if (!location) return null;
  return location.replace(/:\d+$/, '');
}

export function IssuesList({ issues, selectedCategory }: IssuesListProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { isVibe } = useMode();

  let filteredIssues = issues.filter(issue => {
    if (selectedCategory && issue.category !== selectedCategory) return false;
    if (selectedFile && extractFileFromLocation(issue.location || '') !== selectedFile) return false;
    return true;
  });

  // In vibe mode, sort by effort (quick wins first), then severity
  if (isVibe) {
    filteredIssues = [...filteredIssues].sort((a, b) => {
      const effortA = EFFORT_ORDER[a.mitigationType] ?? 99;
      const effortB = EFFORT_ORDER[b.mitigationType] ?? 99;
      if (effortA !== effortB) return effortA - effortB;
      return (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
    });
  }

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
        {isVibe && (
          <div className="px-3 py-1.5 border-b border-border bg-primary/5">
            <span className="text-xs text-muted-foreground">
              ✦ Sorted by effort — quick wins first
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
