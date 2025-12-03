/**
 * @file TaskStatusBadge.tsx
 * @description Componente de badge para status de tarefas
 * @module components/tasks
 *
 * @example
 * <TaskStatusBadge status="doing" />
 */

import { cn } from '@/lib/utils';

import { TASK_STATUS_CONFIG, type TaskStatus } from '@/types';

interface TaskStatusBadgeProps {
  /** Status da tarefa */
  status: TaskStatus;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Classes adicionais */
  className?: string;
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

/**
 * Badge para exibição de status de tarefas
 */
function TaskStatusBadge({ status, size = 'md', className }: TaskStatusBadgeProps) {
  const config = TASK_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        sizeStyles[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

export { TaskStatusBadge };
export type { TaskStatusBadgeProps };
