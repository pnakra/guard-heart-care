import { 
  Brain, 
  Eye, 
  ShieldAlert, 
  Scale,
  Sparkles,
  AlertTriangle,
  Zap,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  eye: Eye,
  'shield-alert': ShieldAlert,
  scale: Scale,
  sparkles: Sparkles,
  'alert-triangle': AlertTriangle,
  zap: Zap,
};

interface CategoryIconProps {
  icon: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ icon, className, size = 20 }: CategoryIconProps) {
  const Icon = iconMap[icon] || AlertTriangle;
  return <Icon className={className} size={size} />;
}
