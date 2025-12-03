/**
 * @file TasksPageContent.tsx
 * @description Conteúdo da página de tarefas
 * @module components/tasks
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, Modal, Skeleton } from '@/components/ui';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

import { useTasks, useClients } from '@/hooks';

import type { CreateTaskDTO, Task, TaskStatus, TaskPriority } from '@/types';

type FilterView = 'all' | 'today' | 'overdue' | 'upcoming';
type FilterPriority = TaskPriority | 'all';

interface ClientOption {
  id: string;
  name: string;
}

/**
 * Componente principal da página de tarefas
 */
export function TasksPageContent() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { clients } = useClients();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<FilterView>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [formLoading, setFormLoading] = useState(false);

  const clientOptions: ClientOption[] = useMemo(() => {
    return clients.map(c => ({ id: c.id, name: c.name }));
  }, [clients]);

  /**
   * Filtra e agrupa tarefas
   */
  const { filteredTasks, tasksByGroup } = useMemo(() => {
    let filtered = [...tasks];

    // Filtrar por prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Filtrar por visão
    switch (viewFilter) {
      case 'today':
        filtered = filtered.filter(t => {
          const dueDate = parseISO(t.due_date);
          return isToday(dueDate) && t.status !== 'done';
        });
        break;
      case 'overdue':
        filtered = filtered.filter(t => {
          const dueDate = parseISO(t.due_date);
          return isPast(dueDate) && !isToday(dueDate) && t.status !== 'done';
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(t => {
          const dueDate = parseISO(t.due_date);
          return !isPast(dueDate) && !isToday(dueDate) && t.status !== 'done';
        });
        break;
      default:
        break;
    }

    // Agrupar por data
    const groups: Record<string, Task[]> = {};

    filtered.forEach(task => {
      const dueDate = parseISO(task.due_date);
      let groupKey: string;

      if (isToday(dueDate)) {
        groupKey = 'Hoje';
      } else if (isTomorrow(dueDate)) {
        groupKey = 'Amanhã';
      } else if (isPast(dueDate) && task.status !== 'done') {
        groupKey = 'Atrasadas';
      } else {
        groupKey = format(dueDate, "d 'de' MMMM", { locale: ptBR });
      }

      (groups[groupKey] ??= []).push(task);
    });

    // Ordenar tarefas dentro de cada grupo por prioridade
    const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    Object.values(groups).forEach(taskList => {
      taskList.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    });

    return { filteredTasks: filtered, tasksByGroup: groups };
  }, [tasks, viewFilter, priorityFilter]);

  /**
   * Conta tarefas por filtro
   */
  const counts = useMemo(() => {
    const pending = tasks.filter(t => t.status !== 'done');

    return {
      all: tasks.length,
      today: pending.filter(t => isToday(parseISO(t.due_date))).length,
      overdue: pending.filter(t => {
        const dueDate = parseISO(t.due_date);
        return isPast(dueDate) && !isToday(dueDate);
      }).length,
      upcoming: pending.filter(t => {
        const dueDate = parseISO(t.due_date);
        return !isPast(dueDate) && !isToday(dueDate);
      }).length,
    };
  }, [tasks]);

  const handleCreateTask = useCallback(async (data: CreateTaskDTO) => {
    setFormLoading(true);
    try {
      await createTask(data);
      setShowCreateModal(false);
      setSelectedClientId('');
    } catch (err) {
      console.error('[TasksPageContent] Error creating task:', err);
    } finally {
      setFormLoading(false);
    }
  }, [createTask]);

  const handleUpdateTask = useCallback(async (data: CreateTaskDTO) => {
    if (!editingTask) { return; }

    setFormLoading(true);
    try {
      await updateTask(editingTask.id, data);
      setEditingTask(null);
    } catch (err) {
      console.error('[TasksPageContent] Error updating task:', err);
    } finally {
      setFormLoading(false);
    }
  }, [editingTask, updateTask]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('[TasksPageContent] Error updating task status:', err);
    }
  }, [updateTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error('[TasksPageContent] Error deleting task:', err);
    }
  }, [deleteTask]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout title="Tarefas" subtitle="Gerencie suas tarefas e pendências">
        <div className="space-y-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-24 rounded-lg bg-white/[0.03] animate-pulse" />
            ))}
          </div>
          <GlassCard>
            <Skeleton.Table rows={5} columns={3} />
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Tarefas"
      subtitle="Gerencie suas tarefas e pendências"
      headerActions={
        <Button onClick={() => setShowCreateModal(true)}>
          Nova Tarefa
        </Button>
      }
    >
      {/* Filtros de visão */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { value: 'all' as const, label: 'Todas', count: counts.all },
            { value: 'today' as const, label: 'Hoje', count: counts.today },
            { value: 'overdue' as const, label: 'Atrasadas', count: counts.overdue },
            { value: 'upcoming' as const, label: 'Próximas', count: counts.upcoming },
          ].map(filter => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setViewFilter(filter.value)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                viewFilter === filter.value
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  viewFilter === filter.value ? 'bg-violet-500/30' : 'bg-white/[0.1]'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filtro de prioridade */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-zinc-400">Prioridade:</span>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as FilterPriority)}
            className="px-3 py-2 text-sm rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors cursor-pointer hover:border-zinc-600/70"
          >
            <option value="all" className="bg-zinc-900 text-white">Todas</option>
            <option value="urgent" className="bg-zinc-900 text-white">Urgente</option>
            <option value="high" className="bg-zinc-900 text-white">Alta</option>
            <option value="medium" className="bg-zinc-900 text-white">Média</option>
            <option value="low" className="bg-zinc-900 text-white">Baixa</option>
          </select>
        </div>
      </div>

      {/* Lista de tarefas */}
      {filteredTasks.length === 0 ? (
        <GlassCard>
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">
              {viewFilter === 'overdue' ? '🎉' : '📋'}
            </span>
            <p className="text-lg text-zinc-300 mb-2">
              {viewFilter === 'all' && 'Nenhuma tarefa encontrada'}
              {viewFilter === 'today' && 'Nenhuma tarefa para hoje'}
              {viewFilter === 'overdue' && 'Nenhuma tarefa atrasada!'}
              {viewFilter === 'upcoming' && 'Nenhuma tarefa futura'}
            </p>
            <p className="text-zinc-500 mb-6">
              {viewFilter === 'overdue'
                ? 'Parabéns! Você está em dia com suas tarefas.'
                : 'Crie uma nova tarefa para começar a organizar seu trabalho.'
              }
            </p>
            {viewFilter !== 'overdue' && (
              <Button onClick={() => setShowCreateModal(true)}>
                Criar Tarefa
              </Button>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Ordenar grupos: Atrasadas primeiro, depois Hoje, Amanhã, e datas futuras */}
          {Object.entries(tasksByGroup)
            .sort(([a], [b]) => {
              const order: Record<string, number> = { 'Atrasadas': 0, 'Hoje': 1, 'Amanhã': 2 };
              const aOrder = order[a] ?? 99;
              const bOrder = order[b] ?? 99;
              return aOrder - bOrder;
            })
            .map(([groupName, groupTasks]) => (
              <div key={groupName}>
                <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                  groupName === 'Atrasadas' ? 'text-red-400' : 'text-zinc-400'
                }`}>
                  {groupName === 'Atrasadas' && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                  {groupName === 'Hoje' && (
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                  {groupName === 'Amanhã' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                  {groupName} ({groupTasks.length})
                </h3>
                <div className="space-y-2">
                  {groupTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onClick={setEditingTask}
                      onDelete={handleDeleteTask}
                      showClient
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal de criação */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedClientId('');
        }}
        title="Nova Tarefa"
      >
        {/* Seleção de cliente */}
        {!selectedClientId ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Selecione o cliente para a tarefa:</p>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {clientOptions.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">
                  Nenhum cliente encontrado. Cadastre um cliente primeiro.
                </p>
              ) : (
                clientOptions.map(client => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className="w-full p-3 text-left rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-violet-500/30 transition-colors"
                  >
                    <span className="text-white">{client.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <TaskForm
            clientId={selectedClientId}
            onSubmit={handleCreateTask}
            onCancel={() => {
              setShowCreateModal(false);
              setSelectedClientId('');
            }}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Modal de edição */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Editar Tarefa"
      >
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSubmit={handleUpdateTask}
            onCancel={() => setEditingTask(null)}
            loading={formLoading}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
