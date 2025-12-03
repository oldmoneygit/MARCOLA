/**
 * @file IntelligenceLoadingSkeleton.tsx
 * @description Skeleton de loading durante geração de inteligência
 * @module components/intelligence
 */

'use client';

import { GlassCard } from '@/components/ui';

interface IntelligenceLoadingSkeletonProps {
  /** Mensagem personalizada de loading */
  message?: string;
}

/**
 * Skeleton de loading para inteligência do cliente
 */
export function IntelligenceLoadingSkeleton({
  message = 'Analisando dados do cliente...',
}: IntelligenceLoadingSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-violet-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Gerando Inteligência
            </h3>
            <p className="text-sm text-violet-400">{message}</p>
          </div>
        </div>
      </GlassCard>

      {/* Progress Steps */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          {[
            'Processando dados do cliente',
            'Analisando briefing e estratégia',
            'Gerando sugestões de conteúdo',
            'Calculando ofertas sazonais',
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  index === 0
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/[0.05] text-zinc-500'
                }`}
              >
                {index === 0 ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-sm ${
                  index === 0 ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Skeleton Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <GlassCard key={i} className="p-6">
            <div className="h-4 bg-white/[0.05] rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-white/[0.05] rounded w-full" />
              <div className="h-3 bg-white/[0.05] rounded w-5/6" />
              <div className="h-3 bg-white/[0.05] rounded w-4/6" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-zinc-500">
        Este processo pode levar até 30 segundos dependendo da quantidade de
        dados
      </p>
    </div>
  );
}
