/**
 * @file useClientIntelligence.ts
 * @description Hook para gerenciar inteligência de cliente
 * @module hooks
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ClientIntelligence } from '@/types/intelligence';

interface UseClientIntelligenceOptions {
  clientId: string;
  autoFetch?: boolean;
}

interface UseClientIntelligenceReturn {
  intelligence: ClientIntelligence | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  generate: () => Promise<void>;
  regenerate: () => Promise<void>;
  remove: () => Promise<void>;
  refetch: () => Promise<void>;
  isStale: boolean;
}

/**
 * Verifica se a inteligência está desatualizada (mais de 30 dias)
 */
function checkIsStale(intelligence: ClientIntelligence | null, daysThreshold = 30): boolean {
  if (!intelligence?.last_generated_at) {
    return false;
  }

  const generatedAt = new Date(intelligence.last_generated_at);
  const now = new Date();
  const diffTime = now.getTime() - generatedAt.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays > daysThreshold;
}

/**
 * Hook para gerenciar inteligência de cliente
 *
 * @param options - Opções do hook
 * @returns Estado e funções para gerenciar inteligência
 *
 * @example
 * const { intelligence, loading, generating, generate } = useClientIntelligence({
 *   clientId: client.id,
 *   autoFetch: true,
 * });
 */
export function useClientIntelligence({
  clientId,
  autoFetch = true,
}: UseClientIntelligenceOptions): UseClientIntelligenceReturn {
  const [intelligence, setIntelligence] = useState<ClientIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca a inteligência do cliente
   */
  const fetchIntelligence = useCallback(async () => {
    if (!clientId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/intelligence/${clientId}`);

      if (response.status === 404) {
        // Não existe ainda, mas não é um erro
        setIntelligence(null);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao buscar inteligência');
      }

      const data = await response.json();
      setIntelligence(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setIntelligence(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Gera inteligência para o cliente
   */
  const generate = useCallback(async () => {
    if (!clientId) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ client_id: clientId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar inteligência');
      }

      const data = await response.json();
      setIntelligence(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setGenerating(false);
    }
  }, [clientId]);

  /**
   * Regenera inteligência para o cliente
   */
  const regenerate = useCallback(async () => {
    if (!clientId) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/intelligence/${clientId}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao regenerar inteligência');
      }

      const data = await response.json();
      setIntelligence(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setGenerating(false);
    }
  }, [clientId]);

  /**
   * Remove a inteligência do cliente
   */
  const remove = useCallback(async () => {
    if (!clientId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/intelligence/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover inteligência');
      }

      setIntelligence(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Auto fetch ao montar
  useEffect(() => {
    if (autoFetch && clientId) {
      fetchIntelligence();
    }
  }, [autoFetch, clientId, fetchIntelligence]);

  return {
    intelligence,
    loading,
    generating,
    error,
    generate,
    regenerate,
    remove,
    refetch: fetchIntelligence,
    isStale: checkIsStale(intelligence),
  };
}
