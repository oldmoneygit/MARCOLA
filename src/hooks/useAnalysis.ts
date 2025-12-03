/**
 * @file useAnalysis.ts
 * @description Hook para gerenciamento do módulo de análise
 * @module hooks
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import type {
  Suggestion,
  SuggestionStatus,
  SuggestionsSummary,
} from '@/types';

interface SuggestionWithClient extends Suggestion {
  client?: {
    id: string;
    name: string;
    segment: string;
  };
}

interface UseAnalysisReturn {
  suggestions: SuggestionWithClient[];
  summary: SuggestionsSummary | null;
  loading: boolean;
  error: string | null;
  loadSuggestions: () => Promise<void>;
  generateSuggestions: () => Promise<number>;
  updateSuggestionStatus: (id: string, status: SuggestionStatus) => Promise<boolean>;
  dismissSuggestion: (id: string) => Promise<boolean>;
  applySuggestion: (id: string) => Promise<boolean>;
}

/**
 * Hook para gerenciamento de análises
 */
export function useAnalysis(): UseAnalysisReturn {
  const [suggestions, setSuggestions] = useState<SuggestionWithClient[]>([]);
  const [summary, setSummary] = useState<SuggestionsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula resumo das sugestões
   */
  const calculateSummary = useCallback((suggestionsList: SuggestionWithClient[]): SuggestionsSummary => {
    const pending = suggestionsList.filter(s => s.status === 'pending');

    const byClientMap = new Map<string, { clientId: string; clientName: string; count: number }>();

    pending.forEach(s => {
      const existing = byClientMap.get(s.client_id);
      if (existing) {
        existing.count++;
      } else {
        byClientMap.set(s.client_id, {
          clientId: s.client_id,
          clientName: s.client?.name || 'Cliente Desconhecido',
          count: 1,
        });
      }
    });

    return {
      total: pending.length,
      urgent: pending.filter(s => s.severity === 'urgent').length,
      warning: pending.filter(s => s.severity === 'warning').length,
      info: pending.filter(s => s.severity === 'info').length,
      byClient: Array.from(byClientMap.values()),
    };
  }, []);

  /**
   * Carrega sugestões
   */
  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/suggestions?status=pending');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao carregar sugestões');
      }

      const data = await response.json();
      setSuggestions(data);
      setSummary(calculateSummary(data));
    } catch (err) {
      console.error('[useAnalysis] Error loading suggestions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar sugestões');
    } finally {
      setLoading(false);
    }
  }, [calculateSummary]);

  /**
   * Gera novas sugestões
   */
  const generateSuggestions = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/suggestions/generate', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar sugestões');
      }

      const data = await response.json();
      await loadSuggestions();
      return data.generated || 0;
    } catch (err) {
      console.error('[useAnalysis] Error generating suggestions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar sugestões');
      return 0;
    }
  }, [loadSuggestions]);

  /**
   * Atualiza status de sugestão
   */
  const updateSuggestionStatus = useCallback(async (
    id: string,
    status: SuggestionStatus
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar sugestão');
      }

      await loadSuggestions();
      return true;
    } catch (err) {
      console.error('[useAnalysis] Error updating suggestion:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar sugestão');
      return false;
    }
  }, [loadSuggestions]);

  /**
   * Marca sugestão como aplicada
   */
  const applySuggestion = useCallback(async (id: string): Promise<boolean> => {
    return updateSuggestionStatus(id, 'applied');
  }, [updateSuggestionStatus]);

  /**
   * Descarta sugestão
   */
  const dismissSuggestion = useCallback(async (id: string): Promise<boolean> => {
    return updateSuggestionStatus(id, 'dismissed');
  }, [updateSuggestionStatus]);

  // Carrega sugestões ao montar
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    summary,
    loading,
    error,
    loadSuggestions,
    generateSuggestions,
    updateSuggestionStatus,
    dismissSuggestion,
    applySuggestion,
  };
}
