import { cn } from '@/lib/utils';
import { SeverityLevel } from '@/types/ethics';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const severityConfig: Record<SeverityLevel, { 
  label: string; 
  className: string;
}> = {
  safe: {
    label: 'SAFE',
    className: 'text-[hsl(var(--ethics-safe))] border-[hsl(var(--ethics-safe)/0.4)] bg-[hsl(var(--ethics-safe)/0.08)]',
  },
  low: {
    label: 'LOW',
    className: 'text-[hsl(var(--ethics-low))] border-[hsl(var(--ethics-low)/0.4)] bg-[hsl(var(--ethics-low)/0.08)]',
  },
  medium: {
    label: 'MED',
    className: 'text-[hsl(var(--ethics-medium))] border-[hsl(var(--ethics-medium)/0.4)] bg-[hsl(var(--ethics-medium)/0.08)]',
  },
  high: {
    label: 'HIGH',
    className: 'text-[hsl(var(--ethics-high))] border-[hsl(var(--ethics-high)/0.4)] bg-[hsl(var(--ethics-high)/0.08)]',
  },
  critical: {
    label: 'CRITICAL',
    className: 'text-[hsl(var(--ethics-critical))] border-[hsl(var(--ethics-critical)/0.4)] bg-[hsl(var(--ethics-critical)/0.08)]',
  },
};

const sizeConfig = {
  sm: 'px-1.5 py-0 text-[10px] leading-5',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export function SeverityBadge({ severity, showLabel = true, size = 'md' }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-semibold tracking-wider border rounded',
        config.className,
        sizeConfig[size]
      )}
    >
      {showLabel ? config.label : config.label.charAt(0)}
    </span>
  );
}
