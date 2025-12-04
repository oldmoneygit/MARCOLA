/**
 * @file TaskCard.tsx
 * @description Componente de card para exibição de tarefas
 * @module components/tasks
 *
 * @example
 * <TaskCard task={task} onStatusChange={handleStatusChange} />
 */

'use client';

import { useCallback, useState } from 'react';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';

import { TeamMemberAvatar } from '@/components/team';

import { CategoryBadge } from './CategoryBadge';
import { ChecklistView } from './ChecklistView';
import { PriorityBadge } from './PriorityBadge';
import { RecurrenceBadge } from './RecurrenceBadge';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskQuickActions } from './TaskQuickActions';

import type { Task, TaskStatus, ChecklistItem } from '@/types';
import type { ClientData } from './TaskQuickActions';

interface TaskCardProps {
  /** Dados da tarefa */
  task: Task;
  /** Dados do cliente para ações rápidas */
  clientData?: ClientData | null;
  /** Callback ao mudar status */
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  /** Callback ao clicar no card */
  onClick?: (task: Task) => void;
  /** Callback ao deletar */
  onDelete?: (taskId: string) => Promise<void>;
  /** Callback ao atualizar checklist */
  onChecklistUpdate?: (taskId: string, checklist: ChecklistItem[]) => Promise<void>;
  /** Callback para criar evento no calendário */
  onCreateCalendarEvent?: (task: Task) => void;
  /** Mostra o nome do cliente */
  showClient?: boolean;
  /** Mostra o checklist expandido */
  showChecklist?: boolean;
  /** Mostra ações rápidas */
  showQuickActions?: boolean;
  /** Modo compacto */
  compact?: boolean;
  /** Classes adicionais */
  className?: string;
}

/**
 * Card para exibição de uma tarefa individual
 */
function TaskCard({
  task,
  clientData,
  onStatusChange,
  onClick,
  onDelete,
  onChecklistUpdate,
  onCreateCalendarEvent,
  showClient = true,
  showChecklist = false,
  showQuickActions = true,
  compact = false,
  className,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(showChecklist);

  const hasChecklist = task.checklist && task.checklist.length > 0;

  const dueDate = parseISO(task.due_date);
  const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'done';
  const isDueToday = isToday(dueDate);

  const handleStatusChange = useCallback(
    async (newStatus: TaskStatus) => {
      if (!onStatusChange || isUpdating) {
        return;
      }

      setIsUpdating(true);
      try {
        await onStatusChange(task.id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    },
    [task.id, onStatusChange, isUpdating]
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onDelete || isUpdating) {
        return;
      }

      if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
        return;
      }

      setIsUpdating(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsUpdating(false);
      }
    },
    [task.id, onDelete, isUpdating]
  );

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(task);
    }
  }, [onClick, task]);

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (task.status === 'done') {
        handleStatusChange('todo');
      } else {
        handleStatusChange('done');
      }
    },
    [task.status, handleStatusChange]
  );

  const handleChecklistToggle = useCallback(
    async (itemId: string) => {
      if (!onChecklistUpdate || !task.checklist || isUpdating) {
        return;
      }

      const updatedChecklist = task.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );

      setIsUpdating(true);
      try {
        await onChecklistUpdate(task.id, updatedChecklist);
      } finally {
        setIsUpdating(false);
      }
    },
    [task.id, task.checklist, onChecklistUpdate, isUpdating]
  );

  const toggleChecklistExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChecklistExpanded((prev) => !prev);
  }, []);

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg',
          'bg-white/[0.02] hover:bg-white/[0.05]',
          'border border-white/[0.06] hover:border-white/[0.12]',
          'transition-all duration-200',
          onClick && 'cursor-pointer',
          isOverdue && 'border-red-500/30 bg-red-500/5',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={isUpdating}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
            'transition-colors duration-200',
            task.status === 'done'
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-zinc-600 hover:border-zinc-500'
          )}
        >
          {task.status === 'done' && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium truncate',
              task.status === 'done' && 'line-through text-zinc-500'
            )}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
            <span
              className={cn(
                'text-xs',
                isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-zinc-500'
              )}
            >
              {format(dueDate, "dd 'de' MMM", { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl',
        'bg-white/[0.03] hover:bg-white/[0.06]',
        'border border-white/[0.08] hover:border-white/[0.15]',
        'transition-all duration-200',
        onClick && 'cursor-pointer',
        isOverdue && 'border-red-500/30 bg-red-500/5',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            disabled={isUpdating}
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
              'transition-colors duration-200',
              task.status === 'done'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-zinc-600 hover:border-zinc-500'
            )}
          >
            {task.status === 'done' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Título e descrição */}
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                'font-medium',
                task.status === 'done' && 'line-through text-zinc-500'
              )}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{task.description}</p>
            )}

            {/* Category & Recurrence badges */}
            {(task.category || task.is_recurring) && (
              <div className="flex items-center gap-2 mt-2">
                {task.category && (
                  <CategoryBadge category={task.category} size="sm" />
                )}
                {task.is_recurring && task.recurrence && (
                  <RecurrenceBadge recurrence={task.recurrence} size="sm" />
                )}
              </div>
            )}

            {/* Quick Actions */}
            {showQuickActions && task.status !== 'done' && (
              <TaskQuickActions
                task={task}
                clientData={clientData}
                onCreateCalendarEvent={onCreateCalendarEvent}
                size="sm"
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* Ações */}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isUpdating}
            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
            aria-label="Excluir tarefa"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Checklist Section */}
      {hasChecklist && (
        <div className="mt-3">
          {/* Toggle button */}
          <button
            type="button"
            onClick={toggleChecklistExpand}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg',
              'bg-white/[0.02] hover:bg-white/[0.05]',
              'border border-white/[0.06]',
              'text-sm text-zinc-400 hover:text-zinc-300',
              'transition-all duration-200'
            )}
          >
            <svg
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isChecklistExpanded && 'rotate-90'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>
              Checklist ({task.checklist?.filter((i) => i.done).length || 0}/{task.checklist?.length || 0})
            </span>
          </button>

          {/* Expanded checklist */}
          {isChecklistExpanded && task.checklist && (
            <div className="mt-2">
              <ChecklistView
                items={task.checklist}
                onToggleItem={onChecklistUpdate ? handleChecklistToggle : undefined}
                editable={!!onChecklistUpdate}
                size="sm"
                showProgress={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} size="sm" />
          <TaskStatusBadge status={task.status} size="sm" />
          {/* Assignee indicator */}
          {task.assignee && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5">
              <TeamMemberAvatar
                name={task.assignee.name}
                avatarUrl={task.assignee.avatar_url}
                color={task.assignee.color}
                size="xs"
              />
              <span className="text-xs text-zinc-400 max-w-[80px] truncate">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          {showClient && task.client && (
            <span className="text-zinc-400">{task.client.name}</span>
          )}
          <span
            className={cn(
              'flex items-center gap-1',
              isOverdue ? 'text-red-400' : isDueToday ? 'text-amber-400' : 'text-zinc-500'
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {isOverdue
              ? 'Atrasada'
              : isDueToday
                ? 'Hoje'
                : format(dueDate, "dd 'de' MMM", { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
}

export { TaskCard };
export type { TaskCardProps };
