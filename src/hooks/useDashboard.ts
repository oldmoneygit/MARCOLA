/**
 * @file useDashboard.ts
 * @description Hook para gerenciamento de dados do dashboard
 * @module hooks
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Interface para dados do dashboard
 */
interface DashboardData {
  totalInvestment: number;
  investmentChange: number;
  activeClients: number;
  clientsChange: number;
  averageCPA: number;
  cpaChange: number;
  pendingAlerts: number;
  alertsChange: number;
  recentSuggestions: Array<{
    id: string;
    type: string;
    severity: 'urgent' | 'warning' | 'info';
    title: string;
    description: string;
    clientName: string;
  }>;
  clientsNeedingAttention: Array<{
    id: string;
    name: string;
    issue: string;
    severity: 'danger' | 'warning';
  }>;
}

/**
 * Interface do hook useDashboard
 */
interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Hook para gerenciamento de dados do dashboard
 */
export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega dados do dashboard
   */
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard');

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sessão expirada. Faça login novamente.');
          return;
        }
        throw new Error('Erro ao carregar dashboard');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error('[useDashboard] Error loading dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza dados do dashboard
   */
  const refresh = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
