/**
 * @file ReportDetailPageContent.tsx
 * @description Conteúdo da página de detalhe do relatório
 * @module components/reports
 */

'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdsTable, MetricsGrid } from '@/components/reports';
import { Button, GlassCard, Skeleton } from '@/components/ui';
import { useReports } from '@/hooks';

import type { Ad, Report, ReportMetrics } from '@/types';

/**
 * Formata data para exibição
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Calcula métricas do relatório
 */
function calculateMetrics(report: Report, ads: Ad[]): ReportMetrics {
  const totalSpend = report.total_spend;
  const totalImpressions = report.total_impressions;
  const totalClicks = report.total_clicks;
  const totalConversions = report.total_conversions;

  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const averageCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const averageCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    averageCTR,
    averageCPC,
    averageCPA,
    averageCPM,
    adsCount: ads.length,
    winnersCount: ads.filter(a => a.status === 'winner').length,
    fatigueCount: ads.filter(a => a.status === 'fatigue').length,
  };
}

/**
 * Conteúdo da página de detalhe do relatório
 */
export function ReportDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { getReport } = useReports();

  const [report, setReport] = useState<Report | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportId = params.id as string;

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      setError(null);

      try {
        const data = await getReport(reportId);
        if (data) {
          setReport(data.report);
          setAds(data.ads || []);
        } else {
          setError('Relatório não encontrado');
        }
      } catch (err) {
        console.error('[ReportDetailPageContent] Error loading report:', err);
        setError('Erro ao carregar relatório');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [reportId, getReport]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        title="Carregando..."
        subtitle="Aguarde"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton.Card key={i} />
            ))}
          </div>
          <GlassCard>
            <Skeleton.Table rows={10} columns={8} />
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <DashboardLayout
        title="Erro"
        subtitle={error || 'Relatório não encontrado'}
      >
        <GlassCard>
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-zinc-400 mb-6">{error || 'Relatório não encontrado'}</p>
            <Button onClick={() => router.push('/reports')}>
              Voltar para Relatórios
            </Button>
          </div>
        </GlassCard>
      </DashboardLayout>
    );
  }

  const metrics = calculateMetrics(report, ads);
  const periodLabel = `${formatDate(report.period_start)} - ${formatDate(report.period_end)}`;

  return (
    <DashboardLayout
      title={
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span>Relatório</span>
        </div>
      }
      subtitle={periodLabel}
    >
      <div className="space-y-6">
        {/* Métricas */}
        <MetricsGrid metrics={metrics} />

        {/* Resumo de Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.winnersCount}</p>
              <p className="text-sm text-zinc-400">Anúncios Winners</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.fatigueCount}</p>
              <p className="text-sm text-zinc-400">Em Fadiga</p>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.adsCount}</p>
              <p className="text-sm text-zinc-400">Total de Anúncios</p>
            </div>
          </GlassCard>
        </div>

        {/* Tabela de Anúncios */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Anúncios</h2>
            <span className="text-sm text-zinc-400">{ads.length} anúncios</span>
          </div>

          {ads.length > 0 ? (
            <AdsTable ads={ads} />
          ) : (
            <div className="text-center py-12 text-zinc-400">
              <p>Nenhum anúncio encontrado neste relatório.</p>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
