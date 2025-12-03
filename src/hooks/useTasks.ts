/**
 * @file useTasks.ts
 * @description Hook para gerenciamento de tarefas
 * @module hooks
 *
 * @example
 * const { tasks, loading, createTask, updateTask } = useTasks({ clientId: '...' });
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CreateTaskDTO, Task, TaskStatus, UpdateTaskDTO } from '@/types';

interface UseTasksOptions {
  /** ID do cliente para filtrar tarefas */
  clientId?: string;
  /** Status para filtrar */
  status?: TaskStatus;
  /** Busca automática ao montar */
  autoFetch?: boolean;
}

interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

interface TodayTasksResponse {
  today: Task[];
  overdue: Task[];
  total: number;
}

interface UseTasksReturn extends UseTasksState {
  /** Busca tarefas */
  fetchTasks: () => Promise<void>;
  /** Busca tarefas de hoje e atrasadas */
  fetchTodayTasks: () => Promise<TodayTasksResponse>;
  /** Busca uma tarefa específica */
  getTask: (id: string) => Task | undefined;
  /** Cria uma nova tarefa */
  createTask: (data: CreateTaskDTO) => Promise<Task>;
  /** Atualiza uma tarefa */
  updateTask: (id: string, data: UpdateTaskDTO) => Promise<Task>;
  /** Deleta uma tarefa */
  deleteTask: (id: string) => Promise<void>;
  /** Marca tarefa como concluída */
  completeTask: (id: string) => Promise<void>;
  /** Aplica templates a um cliente */
  applyTemplates: (
    clientId: string,
    options: { templateIds?: string[]; useSegmentTemplates?: boolean }
  ) => Promise<Task[]>;
  /** Tarefas pendentes (todo) */
  todoTasks: Task[];
  /** Tarefas em andamento (doing) */
  doingTasks: Task[];
  /** Tarefas concluídas (done) */
  doneTasks: Task[];
  /** Tarefas urgentes */
  urgentTasks: Task[];
  /** Total de tarefas */
  totalTasks: number;
}

/**
 * Hook para gerenciamento de tarefas
 */
export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { clientId, status, autoFetch = true } = options;

  const [state, setState] = useState<UseTasksState>({
    tasks: [],
    loading: true,
    error: null,
  });

  /**
   * Busca tarefas da API
   */
  const fetchTasks = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('client_id', clientId);
      }
      if (status) {
        params.append('status', status);
      }

      const url = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar tarefas');
      }

      const data = await response.json();
      setState({ tasks: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar tarefas';
      console.error('[useTasks] fetchTasks error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [clientId, status]);

  /**
   * Busca tarefas de hoje e atrasadas
   */
  const fetchTodayTasks = useCallback(async (): Promise<TodayTasksResponse> => {
    try {
      const response = await fetch('/api/tasks/today');

      if (!response.ok) {
        throw new Error('Erro ao buscar tarefas de hoje');
      }

      return await response.json();
    } catch (err) {
      console.error('[useTasks] fetchTodayTasks error:', err);
      throw err;
    }
  }, []);

  /**
   * Busca uma tarefa específica pelo ID
   */
  const getTask = useCallback(
    (id: string) => {
      return state.tasks.find((task) => task.id === id);
    },
    [state.tasks]
  );

  /**
   * Cria uma nova tarefa
   */
  const createTask = useCallback(async (data: CreateTaskDTO): Promise<Task> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar tarefa');
      }

      const newTask = await response.json();

      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));

      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      console.error('[useTasks] createTask error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Atualiza uma tarefa
   */
  const updateTask = useCallback(async (id: string, data: UpdateTaskDTO): Promise<Task> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar tarefa');
      }

      const updatedTask = await response.json();

      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));

      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      console.error('[useTasks] updateTask error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Deleta uma tarefa
   */
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar tarefa');
      }

      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
      console.error('[useTasks] deleteTask error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Marca tarefa como concluída
   */
  const completeTask = useCallback(
    async (id: string): Promise<void> => {
      await updateTask(id, { status: 'done' });
    },
    [updateTask]
  );

  /**
   * Aplica templates de tarefas a um cliente
   */
  const applyTemplates = useCallback(
    async (
      targetClientId: string,
      templateOptions: { templateIds?: string[]; useSegmentTemplates?: boolean }
    ): Promise<Task[]> => {
      try {
        const response = await fetch('/api/tasks/apply-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: targetClientId,
            template_ids: templateOptions.templateIds,
            use_segment_templates: templateOptions.useSegmentTemplates,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao aplicar templates');
        }

        const result = await response.json();

        // Se estamos filtrando pelo mesmo cliente, atualizar a lista
        if (clientId === targetClientId) {
          setState((prev) => ({
            ...prev,
            tasks: [...prev.tasks, ...result.tasks],
          }));
        }

        return result.tasks;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao aplicar templates';
        console.error('[useTasks] applyTemplates error:', err);
        throw new Error(message);
      }
    },
    [clientId]
  );

  // Computed values
  const todoTasks = useMemo(() => state.tasks.filter((t) => t.status === 'todo'), [state.tasks]);

  const doingTasks = useMemo(() => state.tasks.filter((t) => t.status === 'doing'), [state.tasks]);

  const doneTasks = useMemo(() => state.tasks.filter((t) => t.status === 'done'), [state.tasks]);

  const urgentTasks = useMemo(
    () => state.tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done'),
    [state.tasks]
  );

  const totalTasks = state.tasks.length;

  // Fetch inicial
  useEffect(() => {
    if (autoFetch) {
      fetchTasks();
    }
  }, [fetchTasks, autoFetch]);

  return {
    ...state,
    fetchTasks,
    fetchTodayTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    applyTemplates,
    todoTasks,
    doingTasks,
    doneTasks,
    urgentTasks,
    totalTasks,
  };
}
