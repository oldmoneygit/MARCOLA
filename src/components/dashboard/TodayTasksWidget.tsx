/**
 * @file TodayTasksWidget.tsx
 * @description Widget de tarefas do dia para o dashboard
 * @module components/dashboard
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';

import { GlassCard } from '@/components/ui';
import { PriorityBadge } from '@/components/tasks';

import type { Task, TaskStatus } from '@/types';

interface TodayTasksData {
  today: Task[];
  overdue: Task[];
  total: number;
}

/**
 * Widget de tarefas do dia para o dashboard
 */
export function TodayTasksWidget() {
  const [data, setData] = useState<TodayTasksData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks/today');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('[TodayTasksWidget] Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = useCallback(async (taskId: string, currentStatus: TaskStatus) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('[TodayTasksWidget] Error updating task:', err);
    }
  }, [fetchTasks]);

  if (loading) {
    return (
      <GlassCard className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-white whitespace-nowrap">Tarefas de Hoje</h2>
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const overdueCount = data?.overdue?.length || 0;
  const todayCount = data?.today?.length || 0;
  const allTasks = [...(data?.overdue || []), ...(data?.today || [])];

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-semibold text-white whitespace-nowrap">Tarefas de Hoje</h2>
          {overdueCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#E57373]/10 text-[#E57373] whitespace-nowrap flex-shrink-0">
              {overdueCount}
            </span>
          )}
        </div>
        <Link
          href="/tasks"
          className="text-xs text-[#BDCDCF] hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
        >
          Ver todas
        </Link>
      </div>

      {allTasks.length === 0 ? (
        <div className="text-center py-8 text-[#6B8A8D] flex-1 flex flex-col justify-center">
          <CheckCircle2 className="w-10 h-10 mx-auto text-[#7ED4A6]" />
          <p className="mt-2">Nenhuma tarefa para hoje!</p>
          <p className="text-sm text-[#6B8A8D]">Aproveite o dia</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {allTasks.slice(0, 5).map((task) => {
            const isOverdue = data?.overdue?.some(t => t.id === task.id);

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isOverdue
                    ? 'bg-[#E57373]/5 border border-[#E57373]/20'
                    : 'bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleComplete(task.id, task.status)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.status === 'done'
                      ? 'bg-[#7ED4A6] border-[#7ED4A6] text-white'
                      : 'border-[#6B8A8D] hover:border-[#8FAAAD]'
                  }`}
                >
                  {task.status === 'done' && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    task.status === 'done' ? 'line-through text-zinc-500' : 'text-white'
                  }`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.client && (
                      <span className="text-xs text-zinc-500 truncate">
                        {task.client.name}
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-xs text-[#E57373]">
                        Atrasada
                      </span>
                    )}
                  </div>
                </div>

                {/* Prioridade */}
                <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
              </div>
            );
          })}

          {allTasks.length > 5 && (
            <Link
              href="/tasks"
              className="block text-center text-sm text-zinc-500 hover:text-zinc-400 py-2"
            >
              +{allTasks.length - 5} mais tarefa{allTasks.length - 5 > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      )}

      {/* Footer com total */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <span>{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
        <span>{todayCount} tarefa{todayCount !== 1 ? 's' : ''} para hoje</span>
      </div>
    </GlassCard>
  );
}
