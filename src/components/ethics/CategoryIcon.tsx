import { 
  Brain, 
  EyeOff, 
  Shield, 
  Accessibility, 
  RefreshCw, 
  Search, 
  Users, 
  AlertTriangle,
  LucideIcon
} from 'lucide-react';
import { EthicsCategory } from '@/types/ethics';

const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  'eye-off': EyeOff,
  shield: Shield,
  accessibility: Accessibility,
  'refresh-cw': RefreshCw,
  search: Search,
  users: Users,
  'alert-triangle': AlertTriangle,
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
