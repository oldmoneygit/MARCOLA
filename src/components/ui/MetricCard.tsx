/**
 * @file MetricCard.tsx
 * @description Componente de card para exibição de métricas
 * @module components/ui
 *
 * @example
 * <MetricCard
 *   title="Total Investido"
 *   value="R$ 45.230"
 *   change={12.5}
 *   icon={<DollarIcon />}
 * />
 *
 * @example
 * <MetricCard
 *   title="CPA Médio"
 *   value="R$ 18,50"
 *   change={-5.2}
 *   trend="down"
 *   trendLabel="vs. mês anterior"
 * />
 */

import { cn } from '@/lib/utils';

import { GlassCard } from './GlassCard';

type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  /** Título da métrica */
  title: string;
  /** Valor principal da métrica */
  value: string | number;
  /** Ícone da métrica */
  icon?: React.ReactNode;
  /** Percentual de mudança */
  change?: number;
  /** Direção da tendência (se não fornecido, calcula baseado no change) */
  trend?: TrendDirection;
  /** Label da tendência (ex: "vs. mês anterior") */
  trendLabel?: string;
  /** Se valores positivos são bons (default true, ex: para CPA seria false) */
  positiveIsGood?: boolean;
  /** Se está carregando */
  loading?: boolean;
  /** Classes adicionais */
  className?: string;
}

/**
 * Retorna a direção da tendência baseado no valor de change
 */
function getTrendDirection(change: number | undefined): TrendDirection {
  if (change === undefined || change === 0) {
    return 'neutral';
  }
  return change > 0 ? 'up' : 'down';
}

/**
 * Card para exibição de métricas com suporte a
 * tendências, ícones e estados de loading
 */
function MetricCard({
  title,
  value,
  icon,
  change,
  trend,
  trendLabel,
  positiveIsGood = true,
  loading = false,
  className,
}: MetricCardProps) {
  const trendDirection = trend ?? getTrendDirection(change);

  // Determina se a tendência é positiva ou negativa para o negócio
  const isPositiveTrend =
    trendDirection === 'up' ? positiveIsGood : !positiveIsGood;

  const trendColors = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-zinc-400',
  };

  const getTrendColor = () => {
    if (trendDirection === 'neutral') {
      return trendColors.neutral;
    }
    return isPositiveTrend ? trendColors.positive : trendColors.negative;
  };

  return (
    <GlassCard hover className={cn('relative overflow-hidden', className)}>
      {/* Background gradient decorativo */}
      <div
        className={cn(
          'absolute top-0 right-0 w-32 h-32',
          'bg-gradient-to-bl from-violet-500/10 to-transparent',
          'rounded-full blur-2xl -translate-y-1/2 translate-x-1/2'
        )}
        aria-hidden="true"
      />

      <div className="relative">
        {/* Header com ícone e título */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm text-zinc-400">{title}</span>
          {icon && (
            <div className="p-2 rounded-xl bg-white/[0.05] text-zinc-400">
              {icon}
            </div>
          )}
        </div>

        {/* Valor principal */}
        {loading ? (
          <div className="h-9 w-32 bg-white/[0.05] rounded-lg animate-pulse" />
        ) : (
          <div className="text-3xl font-bold text-white tracking-tight">
            {value}
          </div>
        )}

        {/* Tendência */}
        {change !== undefined && !loading && (
          <div className="flex items-center gap-1.5 mt-3">
            {/* Ícone de tendência */}
            <span className={cn('flex items-center', getTrendColor())}>
              {trendDirection === 'up' && (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              )}
              {trendDirection === 'down' && (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              {trendDirection === 'neutral' && (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14"
                  />
                </svg>
              )}
            </span>

            {/* Percentual */}
            <span className={cn('text-sm font-medium', getTrendColor())}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>

            {/* Label */}
            {trendLabel && (
              <span className="text-sm text-zinc-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export { MetricCard };
export type { MetricCardProps, TrendDirection };
