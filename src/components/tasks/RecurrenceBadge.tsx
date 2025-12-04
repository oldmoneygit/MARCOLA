/**
 * @file RecurrenceBadge.tsx
 * @description Componente de badge para recorrência de tarefas
 * @module components/tasks
 *
 * @example
 * <RecurrenceBadge recurrence="weekly" />
 */

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';

import type { TaskRecurrence } from '@/types';

interface RecurrenceBadgeProps {
  /** Tipo de recorrência */
  recurrence: TaskRecurrence;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra o ícone */
  showIcon?: boolean;
  /** Classes adicionais */
  className?: string;
}

/** Configuração de estilos por recorrência */
const recurrenceStyles: Record<TaskRecurrence, {
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  label: string;
}> = {
  daily: {
    bgColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/40',
    icon: 'calendar',
    label: 'Diária',
  },
  every_3_days: {
    bgColor: 'bg-violet-500/15',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/40',
    icon: 'calendar-range',
    label: '3 em 3 dias',
  },
  weekly: {
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    icon: 'calendar-days',
    label: 'Semanal',
  },
  biweekly: {
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    icon: 'calendar-clock',
    label: 'Quinzenal',
  },
  monthly: {
    bgColor: 'bg-pink-500/15',
    textColor: 'text-pink-300',
    borderColor: 'border-pink-500/40',
    icon: 'calendar-heart',
    label: 'Mensal',
  },
};

const sizeStyles = {
  sm: {
    badge: 'px-2.5 py-1 text-[11px] gap-1.5',
    icon: 'xs' as const,
  },
  md: {
    badge: 'px-3 py-1.5 text-xs gap-2',
    icon: 'sm' as const,
  },
  lg: {
    badge: 'px-4 py-2 text-sm gap-2.5',
    icon: 'md' as const,
  },
};

/**
 * Badge para exibição de recorrência de tarefas
 * Design glassmorphism com ícone
 */
function RecurrenceBadge({
  recurrence,
  size = 'md',
  showIcon = true,
  className,
}: RecurrenceBadgeProps) {
  const styles = recurrenceStyles[recurrence] || recurrenceStyles.weekly;
  const sizeStyle = sizeStyles[size];

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
      {showIcon && (
        <Icon
          name={styles.icon}
          size={sizeStyle.icon}
          className="opacity-80"
        />
      )}
      {styles.label}
    </span>
  );
}

export { RecurrenceBadge };
export type { RecurrenceBadgeProps };
