import { ForkClassification } from '@/types/ethics';
import { cn } from '@/lib/utils';

const FORK_BADGE_CONFIG: Record<ForkClassification, { label: string; className: string }> = {
  inherited: {
    label: 'INHERITED',
    className: 'bg-[hsl(var(--ethics-medium)/0.15)] text-[hsl(var(--ethics-medium))] border-[hsl(var(--ethics-medium)/0.3)]',
  },
  introduced: {
    label: 'INTRODUCED',
    className: 'bg-[hsl(var(--ethics-critical)/0.15)] text-[hsl(var(--ethics-critical))] border-[hsl(var(--ethics-critical)/0.3)]',
  },
  remediated: {
    label: 'REMEDIATED',
    className: 'bg-[hsl(var(--ethics-safe)/0.15)] text-[hsl(var(--ethics-safe))] border-[hsl(var(--ethics-safe)/0.3)]',
  },
};

export function ForkBadge({ classification }: { classification: ForkClassification }) {
  const config = FORK_BADGE_CONFIG[classification];
  return (
    <span className={cn(
      'font-mono text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider',
      config.className
    )}>
      {config.label}
    </span>
  );
}
