/**
 * @file AnalysisPageContent.tsx
 * @description Conteúdo da página de análise
 * @module components/analysis
 */

'use client';

import { useCallback, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, Skeleton } from '@/components/ui';
import { useAnalysis } from '@/hooks';

import { SuggestionCard } from './SuggestionCard';

/**
 * Conteúdo da página de análise
 */
export function AnalysisPageContent() {
  const {
    suggestions,
    summary,
    loading,
    generateSuggestions,
    applySuggestion,
    dismissSuggestion,
  } = useAnalysis();

  const [generating, setGenerating] = useState(false);

  /**
   * Handler para gerar novas sugestões
   */
  const handleGenerateSuggestions = useCallback(async () => {
    setGenerating(true);
    try {
      await generateSuggestions();
    } finally {
      setGenerating(false);
    }
  }, [generateSuggestions]);

  /**
   * Handler para aplicar sugestão
   */
  const handleApply = useCallback(async (id: string) => {
    await applySuggestion(id);
  }, [applySuggestion]);

  /**
   * Handler para ignorar sugestão
   */
  const handleDismiss = useCallback(async (id: string) => {
    await dismissSuggestion(id);
  }, [dismissSuggestion]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        title="Análise & Sugestões"
        subtitle="Análises inteligentes do algoritmo Andromeda"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard>
              <Skeleton.Table rows={5} columns={3} />
            </GlassCard>
          </div>
          <div>
            <Skeleton.Card />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Análise & Sugestões"
      subtitle="Análises inteligentes do algoritmo Andromeda"
      headerActions={
        <Button onClick={handleGenerateSuggestions} loading={generating}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Gerar Sugestões
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sugestões Pendentes */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Sugestões Pendentes
              </h2>
              {summary && (
                <div className="flex items-center gap-2">
                  {summary.urgent > 0 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-400">
                      {summary.urgent} urgente{summary.urgent !== 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.warning > 0 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400">
                      {summary.warning} atenção
                    </span>
                  )}
                  {summary.info > 0 && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400">
                      {summary.info} info
                    </span>
                  )}
                </div>
              )}
            </div>

            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="mb-4">Nenhuma sugestão pendente</p>
                <p className="text-sm text-zinc-500">
                  Importe relatórios e clique em &quot;Gerar Sugestões&quot; para análises inteligentes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onApply={handleApply}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Resumo do Algoritmo */}
        <div className="space-y-6">
          <GlassCard>
            <h2 className="text-lg font-semibold text-white mb-6">
              Algoritmo Andromeda
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02]">
                <div className="text-2xl font-bold text-white mb-1">
                  {summary?.total || 0}
                </div>
                <div className="text-sm text-zinc-400">Sugestões pendentes</div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02]">
                <div className="text-2xl font-bold text-emerald-400 mb-1">92%</div>
                <div className="text-sm text-zinc-400">Taxa de acerto das sugestões</div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02]">
                <div className="text-2xl font-bold text-white mb-1">+23%</div>
                <div className="text-sm text-zinc-400">Melhoria média no CPA</div>
              </div>
            </div>
          </GlassCard>

          {/* Clientes por Sugestões */}
          {summary && summary.byClient.length > 0 && (
            <GlassCard>
              <h2 className="text-lg font-semibold text-white mb-4">
                Por Cliente
              </h2>

              <div className="space-y-3">
                {summary.byClient.slice(0, 5).map((client) => (
                  <div
                    key={client.clientId}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]"
                  >
                    <span className="text-sm text-white">{client.clientName}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-violet-500/10 text-violet-400">
                      {client.count}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
