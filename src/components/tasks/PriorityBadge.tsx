/**
 * @file PriorityBadge.tsx
 * @description Componente de badge para prioridade de tarefas com visual glassmorphism
 * @module components/tasks
 *
 * @example
 * <PriorityBadge priority="urgent" />
 */

import { cn } from '@/lib/utils';

import type { TaskPriority } from '@/types';

interface PriorityBadgeProps {
  /** Prioridade da tarefa */
  priority: TaskPriority;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra o indicador de ponto/ícone */
  showDot?: boolean;
  /** Alias para showDot (compatibilidade) */
  showIcon?: boolean;
  /** Classes adicionais */
  className?: string;
}

/** Configuração de estilos por prioridade */
const priorityStyles: Record<TaskPriority, {
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  label: string;
}> = {
  urgent: {
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-300',
    borderColor: 'border-red-500/40',
    dotColor: 'bg-red-400',
    label: 'Urgente',
  },
  high: {
    bgColor: 'bg-orange-500/15',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/40',
    dotColor: 'bg-orange-400',
    label: 'Alta',
  },
  medium: {
    bgColor: 'bg-yellow-500/15',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-500/40',
    dotColor: 'bg-yellow-400',
    label: 'Média',
  },
  low: {
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
    label: 'Baixa',
  },
};

const sizeStyles = {
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
 * Badge para exibição de prioridade de tarefas
 * Design glassmorphism com glow sutil
 */
function PriorityBadge({
  priority,
  size = 'md',
  showDot = true,
  showIcon,
  className,
}: PriorityBadgeProps) {
  const styles = priorityStyles[priority] || priorityStyles.medium;
  const sizeStyle = sizeStyles[size];
  // showIcon é alias para showDot (compatibilidade)
  const shouldShowDot = showIcon !== undefined ? showIcon : showDot;

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
      {shouldShowDot && (
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
      {styles.label}
    </span>
  );
}

export { PriorityBadge };
export type { PriorityBadgeProps };
