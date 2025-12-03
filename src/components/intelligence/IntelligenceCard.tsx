/**
 * @file IntelligenceCard.tsx
 * @description Card resumo da inteligência do cliente
 * @module components/intelligence
 */

'use client';

import { GlassCard, Icon, StatusBadge } from '@/components/ui';
import { GenerateIntelligenceButton } from './GenerateIntelligenceButton';

import type { ClientIntelligence } from '@/types/intelligence';

interface IntelligenceCardProps {
  /** Dados da inteligência do cliente */
  intelligence: ClientIntelligence | null;
  /** Se está carregando */
  loading?: boolean;
  /** Se está gerando */
  generating?: boolean;
  /** Se está desatualizada */
  isStale?: boolean;
  /** Callback para gerar/regenerar */
  onGenerate: () => void;
}

/**
 * Card resumo da inteligência do cliente
 * Exibe métricas e status da inteligência
 */
export function IntelligenceCard({
  intelligence,
  loading = false,
  generating = false,
  isStale = false,
  onGenerate,
}: IntelligenceCardProps) {
  if (loading) {
    return (
      <GlassCard className="p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.05]" />
          <div className="flex-1">
            <div className="h-4 bg-white/[0.05] rounded w-1/3 mb-2" />
            <div className="h-3 bg-white/[0.05] rounded w-1/2" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!intelligence) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Icon name="sparkles" size="lg" className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Client Intelligence
              </h3>
              <p className="text-sm text-zinc-400">
                Gere insights personalizados para este cliente
              </p>
            </div>
          </div>
          <GenerateIntelligenceButton
            hasExisting={false}
            generating={generating}
            onClick={onGenerate}
          />
        </div>
      </GlassCard>
    );
  }

  const suggestionsCount = intelligence.content_suggestions?.length || 0;
  const offersCount = intelligence.seasonal_offers?.length || 0;
  const lastGenerated = new Date(intelligence.last_generated_at);
  const daysSinceGeneration = Math.floor(
    (Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
            <Icon name="brain" size="lg" className="text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                Client Intelligence
              </h3>
              {isStale ? (
                <StatusBadge status="warning" size="sm" label="Desatualizado" />
              ) : (
                <StatusBadge status="success" size="sm" label="Atualizado" />
              )}
            </div>
            <p className="text-sm text-zinc-400">
              Gerado há {daysSinceGeneration} dia{daysSinceGeneration !== 1 ? 's' : ''}{' '}
              ({intelligence.generation_count}x)
            </p>
          </div>
        </div>
        <GenerateIntelligenceButton
          hasExisting={true}
          generating={generating}
          isStale={isStale}
          onClick={onGenerate}
          variant="secondary"
          size="sm"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="lightbulb" size="sm" className="text-emerald-400" />
            <span className="text-xs text-zinc-500">Sugestões</span>
          </div>
          <p className="text-2xl font-bold text-white">{suggestionsCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="gift" size="sm" className="text-amber-400" />
            <span className="text-xs text-zinc-500">Ofertas</span>
          </div>
          <p className="text-2xl font-bold text-white">{offersCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="cpu" size="sm" className="text-blue-400" />
            <span className="text-xs text-zinc-500">Tokens</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(intelligence.tokens_used / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      {/* Model info */}
      <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
        <span>Modelo: {intelligence.ai_model}</span>
        <span>
          Última atualização:{' '}
          {lastGenerated.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </GlassCard>
  );
}
