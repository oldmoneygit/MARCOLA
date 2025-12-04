/**
 * @file ClientCard.tsx
 * @description Card para exibição de informações do cliente com tarefas pendentes
 * @module components/clients
 *
 * @example
 * <ClientCard client={client} pendingTasks={tasks} onEdit={handleEdit} onDelete={handleDelete} />
 */

'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

import { Button, GlassCard, StatusBadge } from '@/components/ui';
import { CLIENT_STATUS, SEGMENTS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

import type { Client, Task, TaskPriority } from '@/types';
import { TASK_RECURRENCE_CONFIG } from '@/types/task';

/** Configuração de cores por prioridade de tarefa */
const PRIORITY_STYLES: Record<TaskPriority, {
  ring: string;
  border: string;
  bg: string;
  badge: string;
  avatarBorder: string;
  dot: string;
  text: string;
}> = {
  urgent: {
    ring: 'ring-red-500/60',
    border: 'border-red-500/40',
    bg: 'from-red-500/10',
    badge: 'bg-red-500',
    avatarBorder: 'border-red-500/60',
    dot: 'bg-red-500',
    text: 'text-red-400',
  },
  high: {
    ring: 'ring-orange-500/50',
    border: 'border-orange-500/30',
    bg: 'from-orange-500/8',
    badge: 'bg-orange-500',
    avatarBorder: 'border-orange-500/50',
    dot: 'bg-orange-500',
    text: 'text-orange-400',
  },
  medium: {
    ring: 'ring-amber-500/50',
    border: 'border-amber-500/30',
    bg: 'from-amber-500/5',
    badge: 'bg-amber-500',
    avatarBorder: 'border-amber-500/50',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
  },
  low: {
    ring: 'ring-emerald-500/40',
    border: 'border-emerald-500/25',
    bg: 'from-emerald-500/5',
    badge: 'bg-emerald-500',
    avatarBorder: 'border-emerald-500/40',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

interface ClientCardProps {
  client: Client;
  pendingTasks?: Task[];
  onView?: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onCompleteTask?: (taskId: string) => Promise<void>;
  onStartTask?: (taskId: string) => Promise<void>;
}

/**
 * Formata data para exibição
 */
function formatDueDate(dateStr: string): { text: string; isOverdue: boolean; isToday: boolean } {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d atrasado`, isOverdue: true, isToday: false };
  }
  if (diffDays === 0) {
    return { text: 'Hoje', isOverdue: false, isToday: true };
  }
  if (diffDays === 1) {
    return { text: 'Amanhã', isOverdue: false, isToday: false };
  }
  if (diffDays <= 7) {
    return { text: `${diffDays}d`, isOverdue: false, isToday: false };
  }

  return {
    text: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    isOverdue: false,
    isToday: false
  };
}

/**
 * Card com informações resumidas do cliente
 * Suporta avatar personalizado e lista de tarefas pendentes expansível
 */
export function ClientCard({
  client,
  pendingTasks = [],
  onView,
  onEdit,
  onDelete,
  onCompleteTask,
  onStartTask,
}: ClientCardProps) {
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const statusConfig = CLIENT_STATUS[client.status];
  const segmentLabel = SEGMENTS.find((s) => s.value === client.segment)?.label || client.segment;
  const hasPendingTasks = pendingTasks.length > 0;

  // Ordena tarefas por prioridade e data
  const sortedTasks = useMemo(() => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...pendingTasks].sort((a, b) => {
      // Primeiro por prioridade
      const prioA = priorityOrder[a.priority];
      const prioB = priorityOrder[b.priority];
      if (prioA !== prioB) {
        return prioA - prioB;
      }
      // Depois por data
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [pendingTasks]);

  // Pega a prioridade mais alta
  const highestPriority = sortedTasks[0]?.priority;
  const priorityStyle = hasPendingTasks && highestPriority ? PRIORITY_STYLES[highestPriority] : null;

  // Memoiza os estilos baseados nas cores da marca
  const brandStyles = useMemo(() => {
    if (!client.brand_colors) {
      return {
        avatarGradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        cardBorderColor: undefined,
        cardAccent: undefined,
      };
    }

    const { primary, secondary, accent } = client.brand_colors;
    return {
      avatarGradient: `linear-gradient(135deg, ${primary}, ${secondary})`,
      cardBorderColor: `${primary}30`,
      cardAccent: `linear-gradient(135deg, ${primary}10 0%, transparent 50%, ${accent}10 100%)`,
    };
  }, [client.brand_colors]);

  const handleCompleteTask = useCallback(async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCompleteTask) {
      return;
    }
    setCompletingTaskId(taskId);
    try {
      await onCompleteTask(taskId);
    } finally {
      setCompletingTaskId(null);
    }
  }, [onCompleteTask]);

  const handleStartTask = useCallback(async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStartTask) {
      return;
    }
    try {
      await onStartTask(taskId);
    } catch {
      // Error handled by parent
    }
  }, [onStartTask]);

  const toggleTasksExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTasksExpanded(prev => !prev);
  }, []);

  return (
    <GlassCard
      className={`group relative overflow-hidden ${priorityStyle ? `ring-2 ${priorityStyle.ring} ${priorityStyle.border}` : ''}`}
      hover
      style={{
        borderColor: priorityStyle ? undefined : brandStyles.cardBorderColor,
      }}
    >
      {/* Gradiente de fundo sutil baseado nas cores da marca */}
      {brandStyles.cardAccent && !hasPendingTasks && (
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: brandStyles.cardAccent }}
        />
      )}

      {/* Indicador de tarefas pendentes com cor baseada na prioridade */}
      {priorityStyle && (
        <div className={`absolute inset-0 bg-gradient-to-br ${priorityStyle.bg} to-transparent pointer-events-none`} />
      )}

      <div className="relative flex items-start justify-between mb-4">
        {/* Avatar e nome */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold text-lg flex-shrink-0 border ${priorityStyle ? priorityStyle.avatarBorder : 'border-white/10'}`}
              style={{ background: brandStyles.avatarGradient }}
            >
              {client.avatar_url ? (
                <Image
                  src={client.avatar_url}
                  alt={client.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                client.name.charAt(0).toUpperCase()
              )}
            </div>
            {/* Badge de tarefas pendentes */}
            {priorityStyle && (
              <div className={`absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full ${priorityStyle.badge} text-white text-xs font-bold shadow-lg`}>
                {pendingTasks.length}
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => onView?.(client)}
              className="text-white font-medium hover:text-violet-400 transition-colors text-left"
            >
              {client.name}
            </button>
            <p className="text-sm text-zinc-500">{segmentLabel}</p>
          </div>
        </div>

        {/* Status badge */}
        <StatusBadge status={client.status} label={statusConfig.label} />
      </div>

      {/* Informações básicas */}
      <div className="relative space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Valor Mensal</span>
          <span className="text-sm font-medium text-white">
            {formatCurrency(client.monthly_value)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Vencimento</span>
          <span className="text-sm font-medium text-white">Dia {client.due_day}</span>
        </div>
      </div>

      {/* Seção de Tarefas Pendentes */}
      {hasPendingTasks && (
        <div className="relative mb-4">
          {/* Header da seção - clicável para expandir */}
          <button
            onClick={toggleTasksExpanded}
            className="w-full flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 text-zinc-400 transition-transform ${isTasksExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-zinc-300">
                {pendingTasks.length} tarefa{pendingTasks.length !== 1 ? 's' : ''} pendente{pendingTasks.length !== 1 ? 's' : ''}
              </span>
              {/* Indicador de tarefas recorrentes */}
              {pendingTasks.some(t => t.is_recurring) && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-400"
                  title={`${pendingTasks.filter(t => t.is_recurring).length} recorrente${pendingTasks.filter(t => t.is_recurring).length !== 1 ? 's' : ''}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-[10px] font-medium">{pendingTasks.filter(t => t.is_recurring).length}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Indicadores de prioridade */}
              {sortedTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`w-2 h-2 rounded-full ${PRIORITY_STYLES[task.priority].dot}`}
                  title={PRIORITY_LABELS[task.priority]}
                />
              ))}
              {sortedTasks.length > 3 && (
                <span className="text-xs text-zinc-500 ml-1">+{sortedTasks.length - 3}</span>
              )}
            </div>
          </button>

          {/* Lista de tarefas expandida */}
          {isTasksExpanded && (
            <div className="mt-2 space-y-2 animate-fade-in">
              {sortedTasks.map((task) => {
                const taskPriorityStyle = PRIORITY_STYLES[task.priority];
                const dueInfo = formatDueDate(task.due_date);
                const isCompleting = completingTaskId === task.id;
                const isDoing = task.status === 'doing';

                const isTodo = task.status === 'todo';

                const isRecurring = task.is_recurring;
                const recurrenceLabel = task.recurrence ? TASK_RECURRENCE_CONFIG[task.recurrence]?.label : null;

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border transition-colors relative ${
                      dueInfo.isOverdue
                        ? 'bg-red-500/[0.03] border-white/[0.06] border-l-2 border-l-red-500 hover:bg-red-500/[0.06]'
                        : isDoing
                          ? 'bg-blue-500/[0.03] border-white/[0.06] border-l-2 border-l-blue-500 hover:bg-blue-500/[0.06]'
                          : isTodo
                            ? 'bg-zinc-500/[0.03] border-white/[0.06] border-l-2 border-l-zinc-500 hover:bg-zinc-500/[0.06]'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    } ${isRecurring ? 'border-r-2 border-r-violet-500/50' : ''}`}
                  >
                    {/* Linha 1: Título e ações */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate" title={task.title}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5" title={task.description}>
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isDoing && onStartTask && (
                          <button
                            onClick={(e) => handleStartTask(task.id, e)}
                            className="p-1.5 rounded-md hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 transition-colors"
                            title="Iniciar tarefa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {onCompleteTask && (
                          <button
                            onClick={(e) => handleCompleteTask(task.id, e)}
                            disabled={isCompleting}
                            className={`p-1.5 rounded-md hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 transition-colors ${
                              isCompleting ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Marcar como concluída"
                          >
                            {isCompleting ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Linha 2: Metadados */}
                    <div className="flex items-center gap-3 text-xs">
                      {/* Prioridade */}
                      <span className={`flex items-center gap-1 ${taskPriorityStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${taskPriorityStyle.dot}`} />
                        {PRIORITY_LABELS[task.priority]}
                      </span>

                      {/* Status */}
                      {isDoing && (
                        <span className="flex items-center gap-1 text-blue-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Em andamento
                        </span>
                      )}
                      {isTodo && !dueInfo.isOverdue && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pendente
                        </span>
                      )}

                      {/* Data */}
                      <span className={`flex items-center gap-1 ${
                        dueInfo.isOverdue ? 'text-red-400' : dueInfo.isToday ? 'text-amber-400' : 'text-zinc-500'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dueInfo.text}
                      </span>

                      {/* Horário se existir */}
                      {task.due_time && (
                        <span className="text-zinc-500">
                          {task.due_time.slice(0, 5)}
                        </span>
                      )}

                      {/* WhatsApp */}
                      {task.send_whatsapp && (
                        <span className="text-green-400" title="Envia notificação WhatsApp">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </span>
                      )}

                      {/* Recorrência */}
                      {isRecurring && (
                        <span
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400"
                          title={`Tarefa recorrente: ${recurrenceLabel || 'Recorrente'}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-[10px] font-medium uppercase tracking-wide">
                            {recurrenceLabel || 'Recorrente'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Links rápidos */}
      <div className="relative flex items-center gap-2 mb-4">
        {client.ads_account_url && (
          <a
            href={client.ads_account_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="Conta de Anúncios"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </a>
        )}

        {client.website_url && (
          <a
            href={client.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="Website"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </a>
        )}

        {client.drive_url && (
          <a
            href={client.drive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="Google Drive"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Ações */}
      <div className="relative flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => onView?.(client)}
          className="flex-1"
        >
          Ver Detalhes
        </Button>

        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>
        )}

        {onDelete && (
          <Button variant="danger" size="sm" onClick={() => onDelete(client)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
