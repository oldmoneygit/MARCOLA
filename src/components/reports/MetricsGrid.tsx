/**
 * @file MetricsGrid.tsx
 * @description Grid de métricas de performance
 * @module components/reports
 */

import { MetricCard } from '@/components/ui';
import { formatCurrency, formatCompactNumber, formatPercent } from '@/lib/utils';

import type { ReportMetrics } from '@/types';

interface MetricsGridProps {
  metrics: ReportMetrics;
  previousMetrics?: ReportMetrics;
}

/**
 * Ícones para os cards de métricas
 */
const MetricIcons = {
  spend: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  impressions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  clicks: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  ),
  conversions: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ctr: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  cpc: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
  ),
  cpa: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  cpm: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

/**
 * Calcula variação percentual
 */
function calculateChange(current: number, previous: number): number | undefined {
  if (!previous || previous === 0) {
    return undefined;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Grid de métricas do relatório
 */
export function MetricsGrid({ metrics, previousMetrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Investimento */}
      <MetricCard
        title="Investimento"
        value={formatCurrency(metrics.totalSpend)}
        icon={MetricIcons.spend}
        change={previousMetrics ? calculateChange(metrics.totalSpend, previousMetrics.totalSpend) : undefined}
      />

      {/* Impressões */}
      <MetricCard
        title="Impressões"
        value={formatCompactNumber(metrics.totalImpressions)}
        icon={MetricIcons.impressions}
        change={previousMetrics ? calculateChange(metrics.totalImpressions, previousMetrics.totalImpressions) : undefined}
      />

      {/* Cliques */}
      <MetricCard
        title="Cliques"
        value={formatCompactNumber(metrics.totalClicks)}
        icon={MetricIcons.clicks}
        change={previousMetrics ? calculateChange(metrics.totalClicks, previousMetrics.totalClicks) : undefined}
      />

      {/* Conversões */}
      <MetricCard
        title="Conversões"
        value={metrics.totalConversions.toString()}
        icon={MetricIcons.conversions}
        change={previousMetrics ? calculateChange(metrics.totalConversions, previousMetrics.totalConversions) : undefined}
      />

      {/* CTR */}
      <MetricCard
        title="CTR"
        value={formatPercent(metrics.averageCTR)}
        icon={MetricIcons.ctr}
        change={previousMetrics ? calculateChange(metrics.averageCTR, previousMetrics.averageCTR) : undefined}
      />

      {/* CPC */}
      <MetricCard
        title="CPC"
        value={formatCurrency(metrics.averageCPC)}
        icon={MetricIcons.cpc}
        change={previousMetrics ? calculateChange(metrics.averageCPC, previousMetrics.averageCPC) : undefined}
        positiveIsGood={false}
      />

      {/* CPA */}
      <MetricCard
        title="CPA"
        value={formatCurrency(metrics.averageCPA)}
        icon={MetricIcons.cpa}
        change={previousMetrics ? calculateChange(metrics.averageCPA, previousMetrics.averageCPA) : undefined}
        positiveIsGood={false}
      />

      {/* CPM */}
      <MetricCard
        title="CPM"
        value={formatCurrency(metrics.averageCPM)}
        icon={MetricIcons.cpm}
        change={previousMetrics ? calculateChange(metrics.averageCPM, previousMetrics.averageCPM) : undefined}
        positiveIsGood={false}
      />
    </div>
  );
}
