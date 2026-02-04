import { EthicsIssue, HarmCategory } from '@/types/ethics';
import { IssueCard } from './IssueCard';

interface IssuesListProps {
  issues: EthicsIssue[];
  selectedCategory: HarmCategory | null;
}

export function IssuesList({ issues, selectedCategory }: IssuesListProps) {
  const filteredIssues = selectedCategory
    ? issues.filter(issue => issue.category === selectedCategory)
    : issues;

  if (filteredIssues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ethics-safe-bg mb-4">
          <svg 
            className="w-8 h-8 text-ethics-safe" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
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
    <div className="space-y-3">
      {filteredIssues.map(issue => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}
