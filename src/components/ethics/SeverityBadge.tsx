import { cn } from '@/lib/utils';
import { SeverityLevel } from '@/types/ethics';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const severityConfig: Record<SeverityLevel, { 
  label: string; 
  className: string;
  Icon: typeof CheckCircle2;
}> = {
  safe: {
    label: 'Safe',
    className: 'ethics-badge-safe',
    Icon: CheckCircle2,
  },
  low: {
    label: 'Low',
    className: 'ethics-badge-low',
    Icon: Info,
  },
  medium: {
    label: 'Medium',
    className: 'ethics-badge-medium',
    Icon: AlertTriangle,
  },
  high: {
    label: 'High',
    className: 'ethics-badge-high',
    Icon: AlertCircle,
  },
  critical: {
    label: 'Critical',
    className: 'ethics-badge-critical',
    Icon: XCircle,
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const iconSizeConfig = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function SeverityBadge({ severity, showLabel = true, size = 'md' }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const { Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.className,
        sizeConfig[size]
      )}
    >
      <Icon size={iconSizeConfig[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
