/**
 * @file useReports.ts
 * @description Hook para gerenciamento de relatórios
 * @module hooks
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Ad, CSVImportData, Report, ReportMetrics } from '@/types';

interface UseReportsState {
  reports: Report[];
  loading: boolean;
  error: string | null;
}

interface UseReportsReturn extends UseReportsState {
  fetchReports: (clientId?: string) => Promise<void>;
  getReport: (id: string) => Promise<{ report: Report; ads: Ad[] } | null>;
  importReport: (data: CSVImportData) => Promise<Report | null>;
  deleteReport: (id: string) => Promise<boolean>;
  getReportMetrics: (reportId: string) => ReportMetrics | null;
  reportsByClient: Record<string, Report[]>;
}

/**
 * Hook para operações com relatórios
 */
export function useReports(): UseReportsReturn {
  const [state, setState] = useState<UseReportsState>({
    reports: [],
    loading: true,
    error: null,
  });

  /**
   * Busca todos os relatórios
   */
  const fetchReports = useCallback(async (clientId?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const url = clientId ? `/api/reports?clientId=${clientId}` : '/api/reports';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar relatórios');
      }

      const data = await response.json();
      setState({ reports: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar relatórios';
      console.error('[useReports] fetchReports error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  /**
   * Busca um relatório específico com seus anúncios
   */
  const getReport = useCallback(async (id: string): Promise<{ report: Report; ads: Ad[] } | null> => {
    try {
      const response = await fetch(`/api/reports/${id}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('[useReports] getReport error:', err);
      return null;
    }
  }, []);

  /**
   * Importa um novo relatório
   */
  const importReport = useCallback(async (data: CSVImportData): Promise<Report | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/reports/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao importar relatório');
      }

      const result = await response.json();
      const newReport = result.report as Report;

      setState((prev) => ({
        ...prev,
        reports: [newReport, ...prev.reports],
        loading: false,
      }));

      return newReport;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao importar relatório';
      console.error('[useReports] importReport error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  /**
   * Deleta um relatório
   */
  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir relatório');
      }

      setState((prev) => ({
        ...prev,
        reports: prev.reports.filter((r) => r.id !== id),
        loading: false,
      }));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir relatório';
      console.error('[useReports] deleteReport error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return false;
    }
  }, []);

  /**
   * Calcula métricas de um relatório baseado nos totais salvos
   */
  const getReportMetrics = useCallback((reportId: string): ReportMetrics | null => {
    const report = state.reports.find((r) => r.id === reportId);
    if (!report) {
      return null;
    }

    return {
      totalSpend: report.total_spend,
      totalImpressions: report.total_impressions,
      totalClicks: report.total_clicks,
      totalConversions: report.total_conversions,
      averageCTR: report.total_impressions > 0
        ? (report.total_clicks / report.total_impressions) * 100
        : 0,
      averageCPC: report.total_clicks > 0
        ? report.total_spend / report.total_clicks
        : 0,
      averageCPA: report.total_conversions > 0
        ? report.total_spend / report.total_conversions
        : 0,
      averageCPM: report.total_impressions > 0
        ? (report.total_spend / report.total_impressions) * 1000
        : 0,
    };
  }, [state.reports]);

  /**
   * Agrupa relatórios por cliente
   */
  const reportsByClient = useMemo(() => {
    return state.reports.reduce<Record<string, Report[]>>((acc, report) => {
      const clientId = report.client_id;
      if (!acc[clientId]) {
        acc[clientId] = [];
      }
      acc[clientId].push(report);
      return acc;
    }, {});
  }, [state.reports]);

  // Carrega relatórios iniciais
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    ...state,
    fetchReports,
    getReport,
    importReport,
    deleteReport,
    getReportMetrics,
    reportsByClient,
  };
}
