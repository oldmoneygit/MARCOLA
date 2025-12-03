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
  BarChart,
  BarChart2,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  Camera,
  Car,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Circle,
  Clapperboard,
  Clipboard,
  ClipboardList,
  Clock,
  Cpu,
  CreditCard,
  DollarSign,
  Dumbbell,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  Facebook,
  FileText,
  Film,
  Flag,
  Folder,
  Gift,
  Globe,
  GraduationCap,
  Hammer,
  Heart,
  HelpCircle,
  Hospital,
  Image,
  Info,
  Instagram,
  Key,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Link,
  Linkedin,
  MapPin,
  MessageCircle,
  Minus,
  Music,
  Package,
  PartyPopper,
  Percent,
  Pizza,
  Play,
  Plus,
  Rocket,
  Search,
  Settings,
  Share2,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Users,
  Wallet,
  Wrench,
  X,
  XCircle,
  Youtube,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/** Mapa de nomes para componentes de ícone */
const iconMap: Record<string, LucideIcon> = {
  // Navigation & General
  layoutdashboard: LayoutDashboard,
  dashboard: LayoutDashboard,
  settings: Settings,
  search: Search,
  plus: Plus,
  minus: Minus,
  x: X,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  eye: Eye,
  'eye-off': EyeOff,
  'external-link': ExternalLink,
  link: Link,
  edit: Edit2,
  'edit-2': Edit2,
  trash: Trash2,
  'trash-2': Trash2,
  star: Star,

  // Users & People
  user: User,
  users: Users,

  // Tasks & Organization
  checksquare: CheckSquare,
  'check-square': CheckSquare,
  tasks: CheckSquare,
  clipboard: Clipboard,
  'clipboard-list': ClipboardList,
  layers: Layers,

  // Charts & Reports
  'bar-chart': BarChart,
  'bar-chart-2': BarChart2,
  barchart3: BarChart3,
  'bar-chart-3': BarChart3,
  reports: BarChart3,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,

  // AI & Analysis
  brain: Brain,
  analysis: Brain,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  zap: Zap,
  bot: Bot,
  robot: Bot,
  cpu: Cpu,

  // Files & Documents
  filetext: FileText,
  'file-text': FileText,
  templates: FileText,
  folder: Folder,

  // Money & Finance
  wallet: Wallet,
  financial: Wallet,
  'dollar-sign': DollarSign,
  'credit-card': CreditCard,
  percent: Percent,
  gift: Gift,

  // Status & Feedback
  check: CheckCircle2,
  'check-circle': CheckCircle2,
  alert: AlertCircle,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  'x-circle': XCircle,
  ban: Ban,
  'help-circle': HelpCircle,
  help: HelpCircle,

  // Time
  clock: Clock,
  calendar: Calendar,
  event: Calendar,

  // Achievements
  trophy: Trophy,
  flag: Flag,
  target: Target,

  // Circles (colored)
  circle: Circle,
  'circle-red': Circle,
  'circle-orange': Circle,
  'circle-yellow': Circle,
  'circle-green': Circle,
  'circle-blue': Circle,

  // Segments/Industries
  fitness: Dumbbell,
  dumbbell: Dumbbell,
  delivery: Pizza,
  pizza: Pizza,
  ecommerce: ShoppingCart,
  cart: ShoppingCart,
  'shopping-cart': ShoppingCart,
  services: Wrench,
  wrench: Wrench,
  education: GraduationCap,
  graduation: GraduationCap,
  'graduation-cap': GraduationCap,
  health: Hospital,
  hospital: Hospital,
  construction: Hammer,
  hammer: Hammer,
  events: PartyPopper,
  party: PartyPopper,
  beauty: Sparkles,
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
  pin: MapPin,
  'map-pin': MapPin,

  // Social Platforms
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music,
  music: Music,
  google: Globe,
  globe: Globe,
  youtube: Youtube,
  play: Play,
  linkedin: Linkedin,
  briefcase: Briefcase,
  'message-circle': MessageCircle,

  // Security & Access
  key: Key,

  // Communication & Social
  'share-2': Share2,
  share: Share2,
  heart: Heart,
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
    console.warn(`[Icon] Ícone "${name}" não encontrado. Usando fallback.`);
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
