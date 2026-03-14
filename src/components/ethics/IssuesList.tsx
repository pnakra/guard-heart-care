import { EthicsIssue, HarmCategory } from '@/types/ethics';
import { IssueCard } from './IssueCard';
import { FileTreeSidebar } from './FileTreeSidebar';
import { useState } from 'react';

interface IssuesListProps {
  issues: EthicsIssue[];
  selectedCategory: HarmCategory | null;
}

function extractFileFromLocation(location: string): string | null {
  if (!location) return null;
  return location.replace(/:\d+$/, '');
}

export function IssuesList({ issues, selectedCategory }: IssuesListProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const filteredIssues = issues.filter(issue => {
    if (selectedCategory && issue.category !== selectedCategory) return false;
    if (selectedFile && extractFileFromLocation(issue.location || '') !== selectedFile) return false;
    return true;
  });

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
      <FileTreeSidebar
        issues={issues}
        selectedFile={selectedFile}
        onSelectFile={setSelectedFile}
      />
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
        <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-mono text-xs text-muted-foreground">
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
