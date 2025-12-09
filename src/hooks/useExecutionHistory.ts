/**
 * @file useExecutionHistory.ts
 * @description Hook para gerenciar histórico de execuções
 * @module hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  TaskExecution,
  CreateExecutionDTO,
  UpdateExecutionDTO,
  ExecutionFilters,
  ExecutionStats,
  ExecutionPeriod,
} from '@/types/execution-history';

interface UseExecutionHistoryOptions {
  autoFetch?: boolean;
  initialFilters?: ExecutionFilters;
}

interface UseExecutionHistoryReturn {
  // Estados
  executions: TaskExecution[];
  stats: ExecutionStats | null;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
  total: number;

  // Filtros
  filters: ExecutionFilters;
  setFilters: (filters: ExecutionFilters) => void;
  setPeriod: (period: ExecutionPeriod) => void;
  setClientId: (clientId: string | undefined) => void;

  // Ações
  fetchExecutions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createExecution: (data: CreateExecutionDTO) => Promise<TaskExecution | null>;
  updateExecution: (id: string, data: UpdateExecutionDTO) => Promise<TaskExecution | null>;
  deleteExecution: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const DEFAULT_FILTERS: ExecutionFilters = {
  period: 'month',
  limit: 50,
  offset: 0,
};

export function useExecutionHistory(
  options: UseExecutionHistoryOptions = {}
): UseExecutionHistoryReturn {
  const { autoFetch = true, initialFilters = {} } = options;

  // Estados
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFiltersState] = useState<ExecutionFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  /**
   * Busca execuções com filtros aplicados
   */
  const fetchExecutions = useCallback(async () => {
    console.log('[useExecutionHistory] Iniciando fetchExecutions com filtros:', filters);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.period) {
        params.append('period', filters.period);
      }
      if (filters.clientId) {
        params.append('clientId', filters.clientId);
      }
      if (filters.actionType) {
        params.append('actionType', filters.actionType);
      }
      if (filters.result) {
        params.append('result', filters.result);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.offset) {
        params.append('offset', filters.offset.toString());
      }

      const response = await fetch(`/api/executions?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar execuções');
      }

      const data = await response.json();
      setExecutions(data.executions);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useExecutionHistory] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Busca estatísticas
   */
  const fetchStats = useCallback(async () => {
    console.log('[useExecutionHistory] Iniciando fetchStats com filtros:', { period: filters.period, clientId: filters.clientId });
    setStatsLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters.period) {
        params.append('period', filters.period);
      }
      if (filters.clientId) {
        params.append('clientId', filters.clientId);
      }

      const response = await fetch(`/api/executions/stats?${params.toString()}`);
      console.log('[useExecutionHistory] fetchStats response status:', response.status);

      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const data = await response.json();
      console.log('[useExecutionHistory] fetchStats dados recebidos:', data);
      setStats(data);
    } catch (err) {
      console.error('[useExecutionHistory] Erro ao buscar stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.period, filters.clientId]);

  /**
   * Cria uma nova execução
   */
  const createExecution = useCallback(
    async (data: CreateExecutionDTO): Promise<TaskExecution | null> => {
      console.log('[useExecutionHistory] Criando execução:', { actionType: data.actionType, title: data.title });
      try {
        const response = await fetch('/api/executions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        console.log('[useExecutionHistory] createExecution response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[useExecutionHistory] createExecution erro:', errorData);
          throw new Error(errorData.error || 'Erro ao criar execução');
        }

        const execution = await response.json();
        console.log('[useExecutionHistory] Execução criada com sucesso:', { id: execution.id });

        // Adiciona à lista local
        setExecutions((prev) => [execution, ...prev]);
        setTotal((prev) => prev + 1);

        // Atualiza stats
        fetchStats();

        return execution;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        console.error('[useExecutionHistory] Erro ao criar:', err);
        return null;
      }
    },
    [fetchStats]
  );

  /**
   * Atualiza uma execução
   */
  const updateExecution = useCallback(
    async (id: string, data: UpdateExecutionDTO): Promise<TaskExecution | null> => {
      console.log('[useExecutionHistory] Atualizando execução:', { id, data });
      try {
        const response = await fetch(`/api/executions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        console.log('[useExecutionHistory] updateExecution response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[useExecutionHistory] updateExecution erro:', errorData);
          throw new Error(errorData.error || 'Erro ao atualizar execução');
        }

        const execution = await response.json();
        console.log('[useExecutionHistory] Execução atualizada com sucesso:', { id: execution.id });

        // Atualiza na lista local
        setExecutions((prev) =>
          prev.map((e) => (e.id === id ? execution : e))
        );

        return execution;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        console.error('[useExecutionHistory] Erro ao atualizar:', err);
        return null;
      }
    },
    []
  );

  /**
   * Remove uma execução
   */
  const deleteExecution = useCallback(async (id: string): Promise<boolean> => {
    console.log('[useExecutionHistory] Deletando execução:', id);
    try {
      const response = await fetch(`/api/executions/${id}`, {
        method: 'DELETE',
      });
      console.log('[useExecutionHistory] deleteExecution response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useExecutionHistory] deleteExecution erro:', errorData);
        throw new Error(errorData.error || 'Erro ao deletar execução');
      }

      console.log('[useExecutionHistory] Execução deletada com sucesso:', id);
      // Remove da lista local
      setExecutions((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => prev - 1);

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      console.error('[useExecutionHistory] Erro ao deletar:', err);
      return false;
    }
  }, []);

  /**
   * Atualiza filtros
   */
  const setFilters = useCallback((newFilters: ExecutionFilters) => {
    console.log('[useExecutionHistory] Atualizando filtros:', newFilters);
    setFiltersState((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  }, []);

  /**
   * Atalho para alterar período
   */
  const setPeriod = useCallback((period: ExecutionPeriod) => {
    setFiltersState((prev) => ({ ...prev, period, offset: 0 }));
  }, []);

  /**
   * Atalho para alterar cliente
   */
  const setClientId = useCallback((clientId: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, clientId, offset: 0 }));
  }, []);

  /**
   * Recarrega tudo
   */
  const refresh = useCallback(async () => {
    await Promise.all([fetchExecutions(), fetchStats()]);
  }, [fetchExecutions, fetchStats]);

  // Auto-fetch inicial e quando filtros mudam
  useEffect(() => {
    console.log('[useExecutionHistory] useEffect disparado - autoFetch:', autoFetch);
    if (autoFetch) {
      console.log('[useExecutionHistory] Chamando fetchExecutions e fetchStats automaticamente');
      fetchExecutions();
      fetchStats();
    }
  }, [autoFetch, fetchExecutions, fetchStats]);

  return {
    executions,
    stats,
    loading,
    statsLoading,
    error,
    total,
    filters,
    setFilters,
    setPeriod,
    setClientId,
    fetchExecutions,
    fetchStats,
    createExecution,
    updateExecution,
    deleteExecution,
    refresh,
  };
}
