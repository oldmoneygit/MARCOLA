/**
 * @file HealthScoreCard.tsx
 * @description Componente para exibição do Health Score do cliente
 * @module components/clients
 *
 * @example
 * <HealthScoreCard clientId={client.id} />
 */

'use client';

import { useCallback } from 'react';

import { cn } from '@/lib/utils';
import { GlassCard, Button, Icon, Skeleton } from '@/components/ui';
import { useHealthScore } from '@/hooks';
import { HEALTH_SCORE_LEVEL_CONFIG, HEALTH_SCORE_COMPONENT_CONFIG } from '@/types';

interface HealthScoreCardProps {
  /** ID do cliente */
  clientId: string;
  /** Variante de exibição */
  variant?: 'full' | 'compact' | 'mini';
  /** Classes adicionais */
  className?: string;
}

/**
 * Card de exibição do Health Score
 * Mostra score geral, componentes e recomendações
 */
function HealthScoreCard({
  clientId,
  variant = 'full',
  className,
}: HealthScoreCardProps) {
  const {
    healthScore,
    score,
    loading,
    calculating,
    error,
    cached,
    lastUpdated,
    calculate,
  } = useHealthScore({ clientId });

  const handleCalculate = useCallback(async () => {
    await calculate();
  }, [calculate]);

  // Loading state
  if (loading) {
    return (
      <GlassCard className={cn('p-4', className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </GlassCard>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassCard className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <Icon name="alert-circle" size="sm" />
            <span className="text-sm">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCalculate}>
            Tentar novamente
          </Button>
        </div>
      </GlassCard>
    );
  }

  // No score yet
  if (score === null) {
    return (
      <GlassCard className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-700/50 flex items-center justify-center">
              <Icon name="activity" size="md" className="text-zinc-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">Health Score</p>
              <p className="text-zinc-500 text-xs">Não calculado ainda</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCalculate}
            disabled={calculating}
            className="gap-2"
          >
            {calculating ? (
              <>
                <Icon name="loader-2" size="sm" className="animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Icon name="calculator" size="sm" />
                Calcular
              </>
            )}
          </Button>
        </div>
      </GlassCard>
    );
  }

  const level = healthScore?.level || 'warning';
  const config = HEALTH_SCORE_LEVEL_CONFIG[level];

  // Mini variant - just the score badge
  if (variant === 'mini') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg',
          'border text-xs font-semibold',
          config.bgColor,
          config.textColor,
          config.borderColor,
          className
        )}
      >
        <Icon name={config.icon} size="xs" />
        {score}
      </div>
    );
  }

  // Compact variant - score circle + label
  if (variant === 'compact') {
    return (
      <GlassCard className={cn('p-3', className)}>
        <div className="flex items-center gap-3">
          {/* Score Circle */}
          <div className="relative">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-zinc-700"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(score / 100) * 150.8} 150.8`}
                className={config.textColor}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-lg font-bold', config.textColor)}>{score}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Health Score</p>
            <p className={cn('text-sm font-medium', config.textColor)}>{config.label}</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Full variant
  return (
    <GlassCard className={cn('p-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Score Circle */}
          <div className="relative">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-zinc-700"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={`${(score / 100) * 213.6} 213.6`}
                className={config.textColor}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-2xl font-bold', config.textColor)}>{score}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Health Score</h3>
            <div className={cn('flex items-center gap-1.5', config.textColor)}>
              <Icon name={config.icon} size="sm" />
              <span className="font-medium">{config.label}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{config.description}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCalculate}
          disabled={calculating}
          className="gap-1"
        >
          {calculating ? (
            <Icon name="loader-2" size="sm" className="animate-spin" />
          ) : (
            <Icon name="refresh-cw" size="sm" />
          )}
          {calculating ? 'Calculando...' : 'Recalcular'}
        </Button>
      </div>

      {/* Components breakdown */}
      {healthScore && (
        <div className="space-y-3 mb-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">Componentes</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(healthScore.components) as [keyof typeof HEALTH_SCORE_COMPONENT_CONFIG, number][]).map(
              ([key, value]) => {
                const componentConfig = HEALTH_SCORE_COMPONENT_CONFIG[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                  >
                    <Icon name={componentConfig.icon} size="sm" className="text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-400 truncate">{componentConfig.label}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-zinc-300 w-8">{value}</span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {healthScore?.recommendations && healthScore.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">Recomendações</p>
          <div className="space-y-1.5">
            {healthScore.recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <Icon name="lightbulb" size="xs" className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          {cached && (
            <>
              <Icon name="database" size="xs" />
              <span>Cache</span>
              <span className="mx-1">•</span>
            </>
          )}
          {lastUpdated && (
            <span>
              Atualizado em {new Date(lastUpdated).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {healthScore?.trend && healthScore.trend !== 'stable' && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            healthScore.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
          )}>
            <Icon
              name={healthScore.trend === 'up' ? 'trending-up' : 'trending-down'}
              size="xs"
            />
            <span>{healthScore.trend === 'up' ? 'Subindo' : 'Caindo'}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export { HealthScoreCard };
export type { HealthScoreCardProps };
