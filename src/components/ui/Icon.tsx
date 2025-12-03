/**
 * @file Icon.tsx
 * @description Componente de ícone centralizado usando Lucide React
 * @module components/ui
 *
 * @example
 * <Icon name="check" className="w-5 h-5 text-emerald-400" />
 */

import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Briefcase,
  Calendar,
  Camera,
  Car,
  CheckCircle2,
  Circle,
  Clapperboard,
  Clock,
  Dumbbell,
  Film,
  GraduationCap,
  Hammer,
  Heart,
  HelpCircle,
  Hospital,
  Image,
  Info,
  Lightbulb,
  MapPin,
  MessageCircle,
  Music,
  Package,
  PartyPopper,
  Pizza,
  Play,
  Rocket,
  Search,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tag,
  Trophy,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/** Mapa de nomes para componentes de ícone */
const iconMap: Record<string, LucideIcon> = {
  // Status/Priority
  check: CheckCircle2,
  'check-circle': CheckCircle2,
  alert: AlertCircle,
  'alert-triangle': AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  'x-circle': XCircle,
  ban: Ban,
  clock: Clock,
  trophy: Trophy,

  // Circles (colored)
  'circle-red': Circle,
  'circle-orange': Circle,
  'circle-yellow': Circle,
  'circle-green': Circle,
  'circle-blue': Circle,

  // Segments
  fitness: Dumbbell,
  dumbbell: Dumbbell,
  delivery: Pizza,
  pizza: Pizza,
  ecommerce: ShoppingCart,
  cart: ShoppingCart,
  services: Wrench,
  wrench: Wrench,
  education: GraduationCap,
  graduation: GraduationCap,
  health: Hospital,
  hospital: Hospital,
  construction: Hammer,
  hammer: Hammer,
  events: PartyPopper,
  party: PartyPopper,
  beauty: Sparkles,
  sparkles: Sparkles,
  automotive: Car,
  car: Car,
  other: Package,
  package: Package,

  // Content Types
  post: Image,
  image: Image,
  photo: Camera,
  camera: Camera,
  video: Clapperboard,
  clapperboard: Clapperboard,
  reels: Film,
  film: Film,
  stories: Smartphone,
  smartphone: Smartphone,
  promo: Tag,
  tag: Tag,
  campaign: Rocket,
  rocket: Rocket,
  event: Calendar,
  calendar: Calendar,
  pin: MapPin,
  'map-pin': MapPin,

  // Platforms
  instagram: Camera,
  facebook: MessageCircle,
  tiktok: Music,
  music: Music,
  google: Search,
  search: Search,
  youtube: Play,
  play: Play,
  linkedin: Briefcase,
  briefcase: Briefcase,

  // Other
  lightbulb: Lightbulb,
  heart: Heart,
  help: HelpCircle,
};

export interface IconProps {
  /** Nome do ícone */
  name: string;
  /** Classes CSS */
  className?: string;
  /** Tamanho do ícone */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Cor customizada (para ícones de círculo) */
  color?: string;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

/**
 * Componente de ícone unificado
 */
function Icon({ name, className, size = 'md', color }: IconProps) {
  const IconComponent = iconMap[name.toLowerCase()];

  if (!IconComponent) {
    // Fallback para ícone de ajuda se não encontrar
    return <HelpCircle className={cn(sizeMap[size], className)} />;
  }

  // Para ícones de círculo com cor específica
  if (name.startsWith('circle-') && color) {
    return (
      <IconComponent
        className={cn(sizeMap[size], className)}
        fill={color}
        stroke={color}
      />
    );
  }

  return <IconComponent className={cn(sizeMap[size], className)} />;
}

/** Lista de nomes de ícones disponíveis */
export const availableIcons = Object.keys(iconMap);

export { Icon };
