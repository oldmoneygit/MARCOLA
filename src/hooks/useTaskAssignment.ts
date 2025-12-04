/**
 * @file useTaskAssignment.ts
 * @description Hook para atribuição de tarefas a membros da equipe
 * @module hooks
 *
 * @example
 * const { assignTask, unassignTask, bulkAssign } = useTaskAssignment();
 */

'use client';

import { useCallback, useState } from 'react';

import type { Task } from '@/types';

interface UseTaskAssignmentState {
  assigning: boolean;
  error: string | null;
}

interface AssignResult {
  success: boolean;
  task?: Task;
  error?: string;
}

interface BulkAssignResult {
  success: boolean;
  updated_count: number;
  tasks?: Task[];
  error?: string;
}

interface UseTaskAssignmentReturn extends UseTaskAssignmentState {
  /** Atribui uma tarefa a um membro */
  assignTask: (taskId: string, memberId: string, note?: string) => Promise<AssignResult>;
  /** Remove a atribuição de uma tarefa */
  unassignTask: (taskId: string, note?: string) => Promise<AssignResult>;
  /** Atribui múltiplas tarefas a um membro */
  bulkAssign: (taskIds: string[], memberId: string, note?: string) => Promise<BulkAssignResult>;
  /** Remove atribuição de múltiplas tarefas */
  bulkUnassign: (taskIds: string[], note?: string) => Promise<BulkAssignResult>;
  /** Reatribui tarefa de um membro para outro */
  reassignTask: (
    taskId: string,
    fromMemberId: string,
    toMemberId: string,
    note?: string
  ) => Promise<AssignResult>;
  /** Limpa o erro */
  clearError: () => void;
}

/**
 * Hook para atribuição de tarefas
 */
export function useTaskAssignment(): UseTaskAssignmentReturn {
  const [state, setState] = useState<UseTaskAssignmentState>({
    assigning: false,
    error: null,
  });

  /**
   * Atribui uma tarefa a um membro
   */
  const assignTask = useCallback(
    async (taskId: string, memberId: string, note?: string): Promise<AssignResult> => {
      setState({ assigning: true, error: null });

      try {
        const response = await fetch('/api/tasks/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: taskId,
            assigned_to: memberId,
            note,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atribuir tarefa');
        }

        const task = await response.json();
        setState({ assigning: false, error: null });
        return { success: true, task };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atribuir tarefa';
        console.error('[useTaskAssignment] assignTask error:', err);
        setState({ assigning: false, error: message });
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * Remove a atribuição de uma tarefa
   */
  const unassignTask = useCallback(
    async (taskId: string, note?: string): Promise<AssignResult> => {
      setState({ assigning: true, error: null });

      try {
        const response = await fetch('/api/tasks/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: taskId,
            assigned_to: null,
            note,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao remover atribuição');
        }

        const task = await response.json();
        setState({ assigning: false, error: null });
        return { success: true, task };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao remover atribuição';
        console.error('[useTaskAssignment] unassignTask error:', err);
        setState({ assigning: false, error: message });
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * Atribui múltiplas tarefas a um membro
   */
  const bulkAssign = useCallback(
    async (taskIds: string[], memberId: string, note?: string): Promise<BulkAssignResult> => {
      setState({ assigning: true, error: null });

      try {
        const response = await fetch('/api/tasks/assign', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_ids: taskIds,
            assigned_to: memberId,
            note,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atribuir tarefas');
        }

        const result = await response.json();
        setState({ assigning: false, error: null });
        return {
          success: true,
          updated_count: result.updated_count,
          tasks: result.tasks,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atribuir tarefas';
        console.error('[useTaskAssignment] bulkAssign error:', err);
        setState({ assigning: false, error: message });
        return { success: false, updated_count: 0, error: message };
      }
    },
    []
  );

  /**
   * Remove atribuição de múltiplas tarefas
   */
  const bulkUnassign = useCallback(
    async (taskIds: string[], note?: string): Promise<BulkAssignResult> => {
      setState({ assigning: true, error: null });

      try {
        const response = await fetch('/api/tasks/assign', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_ids: taskIds,
            assigned_to: null,
            note,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao remover atribuições');
        }

        const result = await response.json();
        setState({ assigning: false, error: null });
        return {
          success: true,
          updated_count: result.updated_count,
          tasks: result.tasks,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao remover atribuições';
        console.error('[useTaskAssignment] bulkUnassign error:', err);
        setState({ assigning: false, error: message });
        return { success: false, updated_count: 0, error: message };
      }
    },
    []
  );

  /**
   * Reatribui tarefa de um membro para outro
   */
  const reassignTask = useCallback(
    async (
      taskId: string,
      _fromMemberId: string,
      toMemberId: string,
      note?: string
    ): Promise<AssignResult> => {
      // Por enquanto, apenas atribui ao novo membro
      // O histórico é registrado automaticamente pelo trigger no banco
      return assignTask(taskId, toMemberId, note);
    },
    [assignTask]
  );

  /**
   * Limpa o erro
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    assignTask,
    unassignTask,
    bulkAssign,
    bulkUnassign,
    reassignTask,
    clearError,
  };
}
