import { CategorySummary, HarmCategory } from '@/types/ethics';
import { CategoryIcon } from './CategoryIcon';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';
import { useMode } from '@/contexts/ModeContext';
import { PLAIN_CATEGORY_LABELS, PLAIN_CATEGORY_DESCRIPTIONS } from '@/data/plainLanguageMap';

interface CategoryCardProps {
  category: CategorySummary;
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
  const { isVibe } = useMode();
  const cat = category.category as HarmCategory;
  const displayLabel = isVibe
    ? PLAIN_CATEGORY_LABELS[cat] || category.label
    : category.label;
  const displayDescription = isVibe
    ? (PLAIN_CATEGORY_DESCRIPTIONS[cat] || category.description)
    : category.description;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        isSelected 
          ? 'bg-primary/5 border-primary shadow-sm' 
          : 'bg-card border-border hover:bg-secondary/50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            'p-2 rounded-lg shrink-0',
            isSelected ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
          )}>
            <CategoryIcon icon={category.icon} size={18} />
          </div>
          
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              'font-medium text-foreground text-sm truncate',
              isVibe ? 'font-sans' : 'font-mono'
            )}>
              {isVibe ? displayLabel : `[${category.label.toUpperCase()}]`}
            </h3>
            <p className={cn(
              'text-xs text-muted-foreground mt-0.5',
              isVibe ? 'line-clamp-3' : 'line-clamp-2'
            )}>
              {displayDescription}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
          {category.issueCount > 0 ? (
            <>
              <SeverityBadge severity={category.highestSeverity} size="sm" showLabel={false} />
              <span className={cn(
                'text-[10px] text-muted-foreground',
                isVibe ? 'font-sans' : 'font-mono'
              )}>
                {category.issueCount} {category.issueCount === 1 ? 'issue' : 'issues'}
              </span>
            </>
          ) : (
            <SeverityBadge severity="safe" size="sm" />
          )}
        </div>
      </div>
    </button>
  );
}
