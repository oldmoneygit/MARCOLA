/**
 * @file StatusBadge.tsx
 * @description Componente de badge para exibição de status
 * @module components/ui
 *
 * @example
 * <StatusBadge status="active" />
 *
 * @example
 * <StatusBadge status="warning" label="Atenção" size="lg" />
 */

import { cn } from '@/lib/utils';

type BadgeStatus = 'active' | 'paused' | 'inactive' | 'success' | 'warning' | 'danger' | 'info';
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

const statusStyles: Record<BadgeStatus, { bg: string; text: string; dot: string }> = {
  active: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  paused: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  inactive: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
  },
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
};

const statusLabels: Record<BadgeStatus, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  inactive: 'Inativo',
  success: 'Sucesso',
  warning: 'Atenção',
  danger: 'Erro',
  info: 'Info',
};

const sizeStyles: Record<BadgeSize, { badge: string; dot: string }> = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'px-2.5 py-1 text-xs gap-1.5',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm gap-2',
    dot: 'w-2.5 h-2.5',
  },
};

/**
 * Badge para exibição de status com cores semânticas
 * e indicador visual opcional
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
        'inline-flex items-center font-medium rounded-full',
        styles.bg,
        styles.text,
        sizeStyle.badge,
        className
      )}
    >
      {showDot && (
        <span
          className={cn('rounded-full', styles.dot, sizeStyle.dot)}
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}

export { StatusBadge };
export type { BadgeSize, BadgeStatus, StatusBadgeProps };
