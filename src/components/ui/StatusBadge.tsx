/**
 * @file StatusBadge.tsx
 * @description Componente de badge para exibição de status com visual glassmorphism
 * @module components/ui
 *
 * @example
 * <StatusBadge status="active" />
 *
 * @example
 * <StatusBadge status="warning" label="Atenção" size="lg" />
 */

import { cn } from '@/lib/utils';

type BadgeStatus =
  // CRM Pipeline statuses
  | 'negotiation'
  | 'proposal'
  | 'follow_up'
  | 'collection'
  | 'active'
  | 'paused'
  | 'inactive'
  // Generic semantic statuses
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  /** Status/variante do badge */
  status: BadgeStatus;
  /** Label customizado (se não fornecido, usa o status) */
  label?: string;
  /** Tamanho do badge */
  size?: BadgeSize;
  /** Se mostra o indicador de ponto */
  showDot?: boolean;
  /** Classes adicionais */
  className?: string;
}

const statusStyles: Record<BadgeStatus, {
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  // CRM Pipeline statuses
  negotiation: {
    bgColor: 'bg-violet-500/15',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/40',
    dotColor: 'bg-violet-400',
  },
  proposal: {
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    dotColor: 'bg-blue-400',
  },
  follow_up: {
    bgColor: 'bg-orange-500/15',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/40',
    dotColor: 'bg-orange-400',
  },
  collection: {
    bgColor: 'bg-rose-500/15',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-500/40',
    dotColor: 'bg-rose-400',
  },
  active: {
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
  },
  paused: {
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    dotColor: 'bg-amber-400',
  },
  inactive: {
    bgColor: 'bg-zinc-500/15',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-500/40',
    dotColor: 'bg-zinc-400',
  },
  // Generic semantic statuses
  success: {
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
  },
  warning: {
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    dotColor: 'bg-amber-400',
  },
  danger: {
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-300',
    borderColor: 'border-red-500/40',
    dotColor: 'bg-red-400',
  },
  info: {
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    dotColor: 'bg-blue-400',
  },
};

const statusLabels: Record<BadgeStatus, string> = {
  // CRM Pipeline
  negotiation: 'Em Negociação',
  proposal: 'Proposta Enviada',
  follow_up: 'Follow-up',
  collection: 'Em Cobrança',
  active: 'Ativo',
  paused: 'Pausado',
  inactive: 'Inativo',
  // Generic
  success: 'Sucesso',
  warning: 'Atenção',
  danger: 'Erro',
  info: 'Info',
};

const sizeStyles: Record<BadgeSize, { badge: string; dot: string }> = {
  sm: {
    badge: 'px-2.5 py-1 text-[11px] gap-1.5',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'px-3 py-1.5 text-xs gap-2',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'px-4 py-2 text-sm gap-2.5',
    dot: 'w-2.5 h-2.5',
  },
};

/**
 * Badge para exibição de status com cores semânticas
 * Design glassmorphism com indicador visual opcional
 */
function StatusBadge({
  status,
  label,
  size = 'md',
  showDot = true,
  className,
}: StatusBadgeProps) {
  const styles = statusStyles[status];
  const sizeStyle = sizeStyles[size];
  const displayLabel = label ?? statusLabels[status];

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center font-semibold rounded-lg',
        // Glass effect
        'backdrop-blur-sm border',
        // Shadow for depth
        'shadow-sm',
        // Transition
        'transition-all duration-200',
        // Config colors
        styles.bgColor,
        styles.textColor,
        styles.borderColor,
        // Size
        sizeStyle.badge,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full',
            styles.dotColor,
            sizeStyle.dot
          )}
          style={{
            boxShadow: `0 0 6px currentColor`,
          }}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}

export { StatusBadge };
export type { BadgeSize, BadgeStatus, StatusBadgeProps };
