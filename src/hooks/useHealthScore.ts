/**
 * @file useHealthScore.ts
 * @description Hook para gerenciar Health Score de clientes
 * @module hooks
 *
 * @example
 * const { healthScore, loading, calculate, refetch } = useHealthScore(clientId);
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ClientHealthScore } from '@/types';

interface UseHealthScoreOptions {
  /** ID do cliente */
  clientId: string;
  /** Buscar automaticamente ao montar */
  autoFetch?: boolean;
}

interface UseHealthScoreReturn {
  /** Dados do Health Score */
  healthScore: ClientHealthScore | null;
  /** Score numérico simplificado */
  score: number | null;
  /** Se está carregando */
  loading: boolean;
  /** Se está calculando */
  calculating: boolean;
  /** Mensagem de erro */
  error: string | null;
  /** Se o score foi cacheado */
  cached: boolean;
  /** Última atualização */
  lastUpdated: string | null;
  /** Buscar score atual */
  refetch: () => Promise<void>;
  /** Calcular/recalcular score */
  calculate: () => Promise<ClientHealthScore | null>;
}

/**
 * Hook para gerenciar Health Score de um cliente
 */
export function useHealthScore({
  clientId,
  autoFetch = true,
}: UseHealthScoreOptions): UseHealthScoreReturn {
  const [healthScore, setHealthScore] = useState<ClientHealthScore | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  /**
   * Busca o Health Score atual
   */
  const refetch = useCallback(async () => {
    if (!clientId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}/health-score`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao buscar Health Score');
      }

      const data = await response.json();

      setScore(data.score);
      setCached(data.cached || false);
      setLastUpdated(data.last_updated);

      // Se tem histórico com detalhes, monta o objeto completo
      if (data.history) {
        setHealthScore({
          client_id: clientId,
          overall_score: data.score || data.history.overall_score,
          level: getLevel(data.score || data.history.overall_score),
          components: {
            performance_score: data.history.performance_score || 0,
            engagement_score: data.history.engagement_score || 0,
            financial_score: data.history.financial_score || 0,
            compliance_score: data.history.compliance_score || 0,
          },
          details: data.history.details || getDefaultDetails(),
          calculated_at: data.history.calculated_at,
          previous_score: null,
          trend: 'stable',
          recommendations: [],
        });
      } else if (data.score !== null) {
        // Score existe mas sem histórico detalhado
        setHealthScore({
          client_id: clientId,
          overall_score: data.score,
          level: getLevel(data.score),
          components: {
            performance_score: 0,
            engagement_score: 0,
            financial_score: 0,
            compliance_score: 0,
          },
          details: getDefaultDetails(),
          calculated_at: data.last_updated || new Date().toISOString(),
          previous_score: null,
          trend: 'stable',
          recommendations: [],
        });
      }
    } catch (err) {
      console.error('[useHealthScore] Error fetching:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar Health Score');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  /**
   * Calcula/recalcula o Health Score
   */
  const calculate = useCallback(async (): Promise<ClientHealthScore | null> => {
    if (!clientId) {
      return null;
    }

    try {
      setCalculating(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}/health-score`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao calcular Health Score');
      }

      const data = await response.json();

      if (data.success && data.healthScore) {
        setHealthScore(data.healthScore);
        setScore(data.healthScore.overall_score);
        setCached(false);
        setLastUpdated(data.healthScore.calculated_at);
        return data.healthScore;
      }

      return null;
    } catch (err) {
      console.error('[useHealthScore] Error calculating:', err);
      setError(err instanceof Error ? err.message : 'Erro ao calcular Health Score');
      return null;
    } finally {
      setCalculating(false);
    }
  }, [clientId]);

  // Auto-fetch ao montar
  useEffect(() => {
    if (autoFetch && clientId) {
      refetch();
    }
  }, [autoFetch, clientId, refetch]);

  return {
    healthScore,
    score,
    loading,
    calculating,
    error,
    cached,
    lastUpdated,
    refetch,
    calculate,
  };
}

// =============================================================================
// Helpers
// =============================================================================

function getLevel(score: number | null): 'critical' | 'warning' | 'good' | 'excellent' {
  if (score === null) {
    return 'warning';
  }
  if (score >= 80) {
    return 'excellent';
  }
  if (score >= 60) {
    return 'good';
  }
  if (score >= 40) {
    return 'warning';
  }
  return 'critical';
}

function getDefaultDetails() {
  return {
    performance: { ctr: 0, cpc: 0, conversions: 0, roas: 0, trend: 'stable' as const },
    engagement: { response_rate: 0, task_completion: 0, meeting_attendance: 100, feedback_frequency: 0 },
    financial: { payment_timeliness: 100, budget_utilization: 0, contract_value: 0, growth_rate: 0 },
    compliance: { content_approval_rate: 80, brand_guidelines_adherence: 80, deadline_compliance: 80, communication_quality: 75 },
  };
}

export type { UseHealthScoreOptions, UseHealthScoreReturn };
