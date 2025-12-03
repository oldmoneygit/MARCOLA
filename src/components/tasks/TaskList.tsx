/**
 * @file TaskList.tsx
 * @description Componente de lista de tarefas com filtros
 * @module components/tasks
 *
 * @example
 * <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
 */

'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { EmptyState } from '@/components/ui/EmptyState';
import { TaskCard } from './TaskCard';

import type { Task, TaskPriority, TaskStatus } from '@/types';

interface TaskListProps {
  /** Lista de tarefas */
  tasks: Task[];
  /** Callback ao mudar status */
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  /** Callback ao clicar em uma tarefa */
  onTaskClick?: (task: Task) => void;
  /** Callback ao deletar */
  onDelete?: (taskId: string) => Promise<void>;
  /** Mostra filtros */
  showFilters?: boolean;
  /** Mostra o nome do cliente */
  showClient?: boolean;
  /** Modo compacto */
  compact?: boolean;
  /** Mensagem de estado vazio */
  emptyMessage?: string;
  /** Se está carregando */
  loading?: boolean;
  /** Classes adicionais */
  className?: string;
}

type FilterStatus = TaskStatus | 'all';
type FilterPriority = TaskPriority | 'all';

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'todo', label: 'A fazer' },
  { value: 'doing', label: 'Fazendo' },
  { value: 'done', label: 'Concluídas' },
];

const priorityFilters: { value: FilterPriority; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'urgent', label: '🔴 Urgente' },
  { value: 'high', label: '🟠 Alta' },
  { value: 'medium', label: '🟡 Média' },
  { value: 'low', label: '🟢 Baixa' },
];

/**
 * Lista de tarefas com filtros opcionais
 */
function TaskList({
  tasks,
  onStatusChange,
  onTaskClick,
  onDelete,
  showFilters = true,
  showClient = true,
  compact = false,
  emptyMessage = 'Nenhuma tarefa encontrada',
  loading = false,
  className,
}: TaskListProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  // Agrupar por status se não estiver filtrando por status específico
  const groupedTasks = useMemo(() => {
    if (statusFilter !== 'all') {
      return { [statusFilter]: filteredTasks };
    }

    return {
      todo: filteredTasks.filter((t) => t.status === 'todo'),
      doing: filteredTasks.filter((t) => t.status === 'doing'),
      done: filteredTasks.filter((t) => t.status === 'done'),
    };
  }, [filteredTasks, statusFilter]);

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.08] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filtros */}
      {showFilters && tasks.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {/* Filtro de Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Status:</span>
            <div className="flex gap-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full transition-colors',
                    statusFilter === filter.value
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.05]'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro de Prioridade */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Prioridade:</span>
            <div className="flex gap-1">
              {priorityFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setPriorityFilter(filter.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full transition-colors',
                    priorityFilter === filter.value
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.05]'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Tarefas */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title={emptyMessage}
          description="As tarefas aparecerão aqui quando forem criadas"
        />
      ) : (
        <div className="space-y-6">
          {/* Se agrupado por status */}
          {statusFilter === 'all' ? (
            <>
              {/* A fazer */}
              {groupedTasks.todo && groupedTasks.todo.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                    A fazer ({groupedTasks.todo.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.todo.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={onStatusChange}
                        onClick={onTaskClick}
                        onDelete={onDelete}
                        showClient={showClient}
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fazendo */}
              {groupedTasks.doing && groupedTasks.doing.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Em andamento ({groupedTasks.doing.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.doing.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={onStatusChange}
                        onClick={onTaskClick}
                        onDelete={onDelete}
                        showClient={showClient}
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Concluídas */}
              {groupedTasks.done && groupedTasks.done.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Concluídas ({groupedTasks.done.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.done.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={onStatusChange}
                        onClick={onTaskClick}
                        onDelete={onDelete}
                        showClient={showClient}
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onClick={onTaskClick}
                  onDelete={onDelete}
                  showClient={showClient}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { TaskList };
export type { TaskListProps };
