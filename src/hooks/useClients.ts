/**
 * @file useClients.ts
 * @description Hook para gerenciamento de clientes
 * @module hooks
 *
 * @example
 * const { clients, loading, createClient, updateClient } = useClients();
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Client, ClientStatus, CreateClientDTO, UpdateClientDTO } from '@/types';

interface UseClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
}

interface UseClientsReturn extends UseClientsState {
  /** Busca todos os clientes */
  fetchClients: () => Promise<void>;
  /** Busca um cliente específico */
  getClient: (id: string) => Client | undefined;
  /** Cria um novo cliente */
  createClient: (data: CreateClientDTO) => Promise<Client>;
  /** Atualiza um cliente existente */
  updateClient: (id: string, data: UpdateClientDTO) => Promise<Client>;
  /** Deleta um cliente */
  deleteClient: (id: string) => Promise<void>;
  /** Atualiza o status de um cliente */
  updateStatus: (id: string, status: ClientStatus) => Promise<void>;
  /** Clientes ativos */
  activeClients: Client[];
  /** Clientes pausados */
  pausedClients: Client[];
  /** Clientes inativos */
  inactiveClients: Client[];
  /** Total de clientes */
  totalClients: number;
  /** Valor mensal total */
  totalMonthlyValue: number;
}

/**
 * Hook para gerenciamento de clientes
 */
export function useClients(): UseClientsReturn {
  const [state, setState] = useState<UseClientsState>({
    clients: [],
    loading: true,
    error: null,
  });

  /**
   * Busca todos os clientes da API
   */
  const fetchClients = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/clients');

      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }

      const data = await response.json();
      setState({ clients: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar clientes';
      console.error('[useClients] fetchClients error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  /**
   * Busca um cliente específico pelo ID
   */
  const getClient = useCallback(
    (id: string) => {
      return state.clients.find((client) => client.id === id);
    },
    [state.clients]
  );

  /**
   * Cria um novo cliente
   */
  const createClient = useCallback(async (data: CreateClientDTO): Promise<Client> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar cliente');
      }

      const newClient = await response.json();

      setState((prev) => ({
        ...prev,
        clients: [...prev.clients, newClient],
        loading: false,
      }));

      return newClient;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar cliente';
      console.error('[useClients] createClient error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  /**
   * Atualiza um cliente existente
   */
  const updateClient = useCallback(
    async (id: string, data: UpdateClientDTO): Promise<Client> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar cliente');
        }

        const updatedClient = await response.json();

        setState((prev) => ({
          ...prev,
          clients: prev.clients.map((c) => (c.id === id ? updatedClient : c)),
          loading: false,
        }));

        return updatedClient;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
        console.error('[useClients] updateClient error:', err);
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  /**
   * Deleta um cliente
   */
  const deleteClient = useCallback(async (id: string): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar cliente');
      }

      setState((prev) => ({
        ...prev,
        clients: prev.clients.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar cliente';
      console.error('[useClients] deleteClient error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  /**
   * Atualiza o status de um cliente
   */
  const updateStatus = useCallback(
    async (id: string, status: ClientStatus): Promise<void> => {
      await updateClient(id, { status });
    },
    [updateClient]
  );

  // Computed values
  const activeClients = useMemo(
    () => state.clients.filter((c) => c.status === 'active'),
    [state.clients]
  );

  const pausedClients = useMemo(
    () => state.clients.filter((c) => c.status === 'paused'),
    [state.clients]
  );

  const inactiveClients = useMemo(
    () => state.clients.filter((c) => c.status === 'inactive'),
    [state.clients]
  );

  const totalClients = state.clients.length;

  const totalMonthlyValue = useMemo(
    () => activeClients.reduce((sum, c) => sum + c.monthly_value, 0),
    [activeClients]
  );

  // Fetch inicial
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    ...state,
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    updateStatus,
    activeClients,
    pausedClients,
    inactiveClients,
    totalClients,
    totalMonthlyValue,
  };
}
