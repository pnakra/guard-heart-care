import { CategorySummary } from '@/types/ethics';
import { CategoryIcon } from './CategoryIcon';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: CategorySummary;
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
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
            <h3 className="font-medium text-foreground truncate">
              {category.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {category.description}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
          {category.issueCount > 0 ? (
            <>
              <SeverityBadge severity={category.highestSeverity} size="sm" showLabel={false} />
              <span className="text-xs text-muted-foreground">
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
