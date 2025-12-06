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

/** Cores de destaque disponíveis para MetricCard - Emerald Teal Theme */
type AccentColor = 'teal' | 'emerald' | 'amber' | 'rose' | 'blue' | 'cyan' | 'violet';

/** Configuração de cores de destaque - Emerald Teal Theme */
const ACCENT_COLORS: Record<AccentColor, {
  border: string;
  iconBg: string;
  iconColor: string;
  glow: string;
}> = {
  // Cor principal do tema
  teal: {
    border: 'border-l-[#BDCDCF]',
    iconBg: 'bg-[#BDCDCF]/10',
    iconColor: 'text-[#BDCDCF]',
    glow: 'shadow-[#BDCDCF]/10',
  },
  emerald: {
    border: 'border-l-[#7ED4A6]',
    iconBg: 'bg-[#7ED4A6]/10',
    iconColor: 'text-[#7ED4A6]',
    glow: 'shadow-[#7ED4A6]/10',
  },
  amber: {
    border: 'border-l-[#E3B8B8]',
    iconBg: 'bg-[#E3B8B8]/10',
    iconColor: 'text-[#E3B8B8]',
    glow: 'shadow-[#E3B8B8]/10',
  },
  rose: {
    border: 'border-l-[#E3B8B8]',
    iconBg: 'bg-[#E3B8B8]/10',
    iconColor: 'text-[#E3B8B8]',
    glow: 'shadow-[#E3B8B8]/10',
  },
  blue: {
    border: 'border-l-[#8FAAAD]',
    iconBg: 'bg-[#8FAAAD]/10',
    iconColor: 'text-[#8FAAAD]',
    glow: 'shadow-[#8FAAAD]/10',
  },
  cyan: {
    border: 'border-l-[#BDCDCF]',
    iconBg: 'bg-[#BDCDCF]/10',
    iconColor: 'text-[#BDCDCF]',
    glow: 'shadow-[#BDCDCF]/10',
  },
  // Legacy - mapeia para teal
  violet: {
    border: 'border-l-[#BDCDCF]',
    iconBg: 'bg-[#BDCDCF]/10',
    iconColor: 'text-[#BDCDCF]',
    glow: 'shadow-[#BDCDCF]/10',
  },
};

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
  /** Cor de destaque (borda 3D à esquerda) */
  accent?: AccentColor;
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
  accent,
  className,
}: MetricCardProps) {
  const trendDirection = trend ?? getTrendDirection(change);

  // Determina se a tendência é positiva ou negativa para o negócio
  const isPositiveTrend =
    trendDirection === 'up' ? positiveIsGood : !positiveIsGood;

  // Cores do tema Emerald Teal
  const trendColors = {
    positive: 'text-[#7ED4A6]',
    negative: 'text-[#E57373]',
    neutral: 'text-[#6B8A8D]',
  };

  const getTrendColor = () => {
    if (trendDirection === 'neutral') {
      return trendColors.neutral;
    }
    return isPositiveTrend ? trendColors.positive : trendColors.negative;
  };

  // Configuração de cor de destaque
  const accentConfig = accent ? ACCENT_COLORS[accent] : null;

  return (
    <GlassCard
      hover
      className={cn(
        'relative overflow-hidden',
        // Borda 3D à esquerda quando tem accent
        accent && 'border-l-[3px]',
        accentConfig?.border,
        // Sombra sutil com a cor do accent
        accent && `shadow-lg ${accentConfig?.glow}`,
        className
      )}
    >
      {/* Background gradient decorativo sutil */}
      <div
        className={cn(
          'absolute top-0 right-0 w-40 h-40',
          'bg-gradient-to-bl from-white/[0.02] to-transparent',
          'rounded-full blur-3xl -translate-y-1/2 translate-x-1/2'
        )}
        aria-hidden="true"
      />

      <div className="relative">
        {/* Header com ícone e título */}
        <div className="flex items-start justify-between mb-4">
          <span className="text-sm text-zinc-400">{title}</span>
          {icon && (
            <div className={cn(
              'p-2 rounded-xl',
              accentConfig ? `${accentConfig.iconBg} ${accentConfig.iconColor}` : 'bg-white/[0.05] text-zinc-400'
            )}>
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
export type { MetricCardProps, TrendDirection, AccentColor };
