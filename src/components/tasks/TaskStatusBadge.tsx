/**
 * @file TaskStatusBadge.tsx
 * @description Componente de badge para status de tarefas com visual glassmorphism
 * @module components/tasks
 *
 * @example
 * <TaskStatusBadge status="doing" />
 */

import { cn } from '@/lib/utils';

import type { TaskStatus } from '@/types';

interface TaskStatusBadgeProps {
  /** Status da tarefa */
  status: TaskStatus;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra o indicador de ponto */
  showDot?: boolean;
  /** Classes adicionais */
  className?: string;
}

/** Configuração de estilos por status */
const statusStyles: Record<TaskStatus, {
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  label: string;
}> = {
  todo: {
    bgColor: 'bg-zinc-500/15',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-500/40',
    dotColor: 'bg-zinc-400',
    label: 'A fazer',
  },
  doing: {
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    dotColor: 'bg-blue-400',
    label: 'Fazendo',
  },
  done: {
    bgColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/40',
    dotColor: 'bg-emerald-400',
    label: 'Concluída',
  },
  cancelled: {
    bgColor: 'bg-red-500/15',
    textColor: 'text-red-300',
    borderColor: 'border-red-500/40',
    dotColor: 'bg-red-400',
    label: 'Cancelada',
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
 * Badge para exibição de status de tarefas
 * Design glassmorphism moderno
 */
function TaskStatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: TaskStatusBadgeProps) {
  const styles = statusStyles[status];
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
      {styles.label}
    </span>
  );
}

export { TaskStatusBadge };
export type { TaskStatusBadgeProps };
