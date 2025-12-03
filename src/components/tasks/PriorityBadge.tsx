/**
 * @file PriorityBadge.tsx
 * @description Componente de badge para prioridade de tarefas
 * @module components/tasks
 *
 * @example
 * <PriorityBadge priority="urgent" />
 */

import { cn } from '@/lib/utils';

import { TASK_PRIORITY_CONFIG, type TaskPriority } from '@/types';

interface PriorityBadgeProps {
  /** Prioridade da tarefa */
  priority: TaskPriority;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra o ícone */
  showIcon?: boolean;
  /** Classes adicionais */
  className?: string;
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

/**
 * Badge para exibição de prioridade de tarefas
 */
function PriorityBadge({
  priority,
  size = 'md',
  showIcon = true,
  className,
}: PriorityBadgeProps) {
  // Fallback para prioridade inválida ou undefined
  const config = TASK_PRIORITY_CONFIG[priority] || TASK_PRIORITY_CONFIG.medium;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.className,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && <span aria-hidden="true">{config.icon}</span>}
      {config.label}
    </span>
  );
}

export { PriorityBadge };
export type { PriorityBadgeProps };
