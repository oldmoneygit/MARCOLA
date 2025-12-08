/**
 * @file AnaliseIAModal.tsx
 * @description Modal para exibição da análise IA de um lead
 * @module components/lead-sniper
 */

'use client';

import { useState } from 'react';
import {
  X,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Target,
  MessageCircle,
  Copy,
  Check,
  TrendingUp,
  Loader2,
  Zap,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

import type { LeadProspectado } from '@/types/lead-sniper';

interface AnaliseIAModalProps {
  lead: LeadProspectado;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze?: () => Promise<void>;
  isLoading?: boolean;
}

const CLASSIFICACAO_CONFIG = {
  HOT: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'HOT',
    gradient: 'from-red-500 to-orange-500',
  },
  WARM: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'WARM',
    gradient: 'from-orange-500 to-amber-500',
  },
  COOL: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    label: 'COOL',
    gradient: 'from-blue-500 to-cyan-500',
  },
  COLD: {
    bg: 'bg-zinc-500/20',
    border: 'border-zinc-500/30',
    text: 'text-zinc-400',
    label: 'COLD',
    gradient: 'from-zinc-500 to-slate-500',
  },
};

const NIVEL_OPORTUNIDADE_CONFIG = {
  MAXIMO: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'Máximo',
  },
  ALTO: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
    label: 'Alto',
  },
  MEDIO: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'Médio',
  },
  BAIXO: {
    bg: 'bg-zinc-500/20',
    border: 'border-zinc-500/30',
    text: 'text-zinc-400',
    label: 'Baixo',
  },
};

export function AnaliseIAModal({
  lead,
  isOpen,
  onClose,
  onAnalyze,
  isLoading,
}: AnaliseIAModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const hasAnalysis = lead.analisadoIAEm && lead.scoreFinal !== undefined;
  const classConfig = lead.classificacaoIA
    ? CLASSIFICACAO_CONFIG[lead.classificacaoIA]
    : CLASSIFICACAO_CONFIG.COLD;
  const nivelOpConfig = lead.nivelOportunidade
    ? NIVEL_OPORTUNIDADE_CONFIG[lead.nivelOportunidade]
    : null;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const handleAnalyze = async () => {
    if (onAnalyze) {
      await onAnalyze();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-zinc-900/95 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Análise IA</h2>
              <p className="text-sm text-zinc-400">{lead.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sem análise - Mostrar botão para analisar */}
          {!hasAnalysis && (
            <div className="text-center py-8">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 mb-4">
                <Sparkles className="w-12 h-12 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Analisar Lead com IA
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Use inteligência artificial para analisar este lead e obter insights
                detalhados, argumentos de venda e uma mensagem personalizada para WhatsApp.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Iniciar Análise IA
                  </>
                )}
              </button>
            </div>
          )}

          {/* Com análise - Mostrar resultados */}
          {hasAnalysis && (
            <>
              {/* Score e Classificação */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Score Final */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-zinc-400">Score Final</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{lead.scoreFinal}</p>
                  {(lead.scoreBase !== undefined || lead.bonusMarketing !== undefined) && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {lead.scoreBase ?? 0} base + {lead.bonusMarketing ?? 0} bônus
                    </p>
                  )}
                </div>

                {/* Classificação */}
                <div
                  className={`p-4 rounded-xl ${classConfig.bg} border ${classConfig.border}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Classificação</span>
                  </div>
                  <p className={`text-3xl font-bold ${classConfig.text}`}>
                    {classConfig.label}
                  </p>
                </div>

                {/* Nível de Oportunidade */}
                {nivelOpConfig && (
                  <div
                    className={`p-4 rounded-xl ${nivelOpConfig.bg} border ${nivelOpConfig.border}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-400">Oportunidade</span>
                    </div>
                    <p className={`text-2xl font-bold ${nivelOpConfig.text}`}>
                      {nivelOpConfig.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Resumo */}
              {lead.resumoIA && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Resumo</h3>
                  <p className="text-white">{lead.resumoIA}</p>
                </div>
              )}

              {/* Pontos Fortes e Fracos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pontos Fortes */}
                {lead.pontosFortes && lead.pontosFortes.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-medium text-emerald-400">
                        Pontos Fortes
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {lead.pontosFortes.map((ponto, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-zinc-300 flex items-start gap-2"
                        >
                          <span className="text-emerald-400 mt-1">•</span>
                          {ponto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pontos Fracos */}
                {lead.pontosFracos && lead.pontosFracos.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsDown className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-medium text-amber-400">
                        Pontos Fracos
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {lead.pontosFracos.map((ponto, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-zinc-300 flex items-start gap-2"
                        >
                          <span className="text-amber-400 mt-1">•</span>
                          {ponto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Oportunidades de Marketing */}
              {lead.oportunidadesMarketing && lead.oportunidadesMarketing.length > 0 && (
                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-medium text-violet-400">
                      Oportunidades de Marketing
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {lead.oportunidadesMarketing.map((op, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-violet-400 mt-1">•</span>
                        {op}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Argumentos de Venda */}
              {lead.argumentosVenda && lead.argumentosVenda.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-medium text-blue-400">
                      Argumentos de Venda
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {lead.argumentosVenda.map((arg, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-blue-400 mt-1">•</span>
                        {arg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Abordagem Sugerida */}
              {lead.abordagemSugerida && (
                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-medium text-cyan-400">
                      Abordagem Sugerida
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-300">{lead.abordagemSugerida}</p>
                </div>
              )}

              {/* Reclamações Comuns */}
              {lead.reclamacoesComuns && lead.reclamacoesComuns.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-medium text-rose-400">
                      Pontos de Atenção (Reviews)
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {lead.reclamacoesComuns.map((reclamacao, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-zinc-300 flex items-start gap-2"
                      >
                        <span className="text-rose-400 mt-1">•</span>
                        {reclamacao}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mensagem WhatsApp Sugerida */}
              {lead.mensagemWhatsappSugerida && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-medium text-emerald-400">
                        Mensagem WhatsApp Sugerida
                      </h3>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(lead.mensagemWhatsappSugerida || '', 'whatsapp')
                      }
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors"
                    >
                      {copiedField === 'whatsapp' ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                    {lead.mensagemWhatsappSugerida}
                  </p>
                </div>
              )}

              {/* Footer com data da análise */}
              {lead.analisadoIAEm && (
                <p className="text-xs text-zinc-500 text-center">
                  Análise realizada em{' '}
                  {new Date(lead.analisadoIAEm).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
