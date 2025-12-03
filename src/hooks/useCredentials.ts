/**
 * @file useCredentials.ts
 * @description Hook para gerenciamento de credenciais do cliente
 * @module hooks
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ClientCredential, CreateCredentialDTO, UpdateCredentialDTO } from '@/types';

interface UseCredentialsState {
  credentials: ClientCredential[];
  loading: boolean;
  error: string | null;
}

interface UseCredentialsReturn extends UseCredentialsState {
  fetchCredentials: () => Promise<void>;
  createCredential: (data: CreateCredentialDTO) => Promise<ClientCredential | null>;
  updateCredential: (id: string, data: UpdateCredentialDTO) => Promise<ClientCredential | null>;
  deleteCredential: (id: string) => Promise<boolean>;
}

/**
 * Hook para operações com credenciais de um cliente
 */
export function useCredentials(clientId: string): UseCredentialsReturn {
  const [state, setState] = useState<UseCredentialsState>({
    credentials: [],
    loading: true,
    error: null,
  });

  /**
   * Busca todas as credenciais do cliente
   */
  const fetchCredentials = useCallback(async () => {
    if (!clientId) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/clients/${clientId}/credentials`);

      if (!response.ok) {
        throw new Error('Erro ao buscar credenciais');
      }

      const data = await response.json();
      setState({ credentials: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar credenciais';
      console.error('[useCredentials] fetchCredentials error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [clientId]);

  /**
   * Cria uma nova credencial
   */
  const createCredential = useCallback(async (data: CreateCredentialDTO): Promise<ClientCredential | null> => {
    if (!clientId) {
      return null;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar credencial');
      }

      const newCredential = await response.json();

      setState((prev) => ({
        ...prev,
        credentials: [...prev.credentials, newCredential].sort((a, b) =>
          a.platform.localeCompare(b.platform)
        ),
      }));

      return newCredential;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar credencial';
      console.error('[useCredentials] createCredential error:', err);
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, [clientId]);

  /**
   * Atualiza uma credencial existente
   */
  const updateCredential = useCallback(async (id: string, data: UpdateCredentialDTO): Promise<ClientCredential | null> => {
    if (!clientId) {
      return null;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/credentials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar credencial');
      }

      const updatedCredential = await response.json();

      setState((prev) => ({
        ...prev,
        credentials: prev.credentials
          .map((c) => (c.id === id ? updatedCredential : c))
          .sort((a, b) => a.platform.localeCompare(b.platform)),
      }));

      return updatedCredential;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar credencial';
      console.error('[useCredentials] updateCredential error:', err);
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, [clientId]);

  /**
   * Remove uma credencial
   */
  const deleteCredential = useCallback(async (id: string): Promise<boolean> => {
    if (!clientId) {
      return false;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/credentials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir credencial');
      }

      setState((prev) => ({
        ...prev,
        credentials: prev.credentials.filter((c) => c.id !== id),
      }));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir credencial';
      console.error('[useCredentials] deleteCredential error:', err);
      setState((prev) => ({ ...prev, error: message }));
      return false;
    }
  }, [clientId]);

  // Carrega credenciais ao montar
  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  return {
    ...state,
    fetchCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
  };
}
