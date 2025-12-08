/**
 * @file DiagnosticoCard.tsx
 * @description Card expandível para exibição de diagnóstico profundo de lead
 * @module components/lead-sniper
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Target,
  MessageCircle,
  Copy,
  Check,
  TrendingUp,
  Lightbulb,
  DollarSign,
  Clock,
  Building2,
  Globe,
  AlertTriangle,
  Flame,
  Snowflake,
  Sun,
  RefreshCw,
  Send,
} from 'lucide-react';

import type {
  DiagnosticoCompleto,
  DiagnosticoMensagem,
  LeadTemperatura,
} from '@/types/diagnostico';

interface DiagnosticoCardProps {
  diagnostico: DiagnosticoCompleto;
  onRefresh?: () => void;
  onSendMessage?: (mensagem: DiagnosticoMensagem) => void;
  loading?: boolean;
}

const TEMPERATURA_CONFIG: Record<LeadTemperatura, {
  bg: string;
  border: string;
  text: string;
  label: string;
  icon: typeof Flame;
  gradient: string;
}> = {
  HOT: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'HOT',
    icon: Flame,
    gradient: 'from-red-500 to-orange-500',
  },
  WARM: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'WARM',
    icon: Sun,
    gradient: 'from-amber-500 to-yellow-500',
  },
  COOL: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    label: 'COOL',
    icon: Snowflake,
    gradient: 'from-blue-500 to-cyan-500',
  },
};

const IMPACTO_CONFIG = {
  alto: { color: 'text-red-400', bg: 'bg-red-500/20', icon: '🔴' },
  medio: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: '🟡' },
  baixo: { color: 'text-green-400', bg: 'bg-green-500/20', icon: '🟢' },
};

export function DiagnosticoCard({
  diagnostico,
  onRefresh,
  onSendMessage,
  loading,
}: DiagnosticoCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('resumo');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Proteção contra dados incompletos do diagnóstico
  const temperatura = diagnostico?.classificacao?.temperatura || 'COOL';
  const score = diagnostico?.classificacao?.score || 0;
  const motivo = diagnostico?.classificacao?.motivo || 'Sem classificação disponível';

  // Proteção para empresa
  const nichoDetectado = diagnostico?.empresa?.nichoDetectado || 'Não detectado';
  const presencaDigital = diagnostico?.empresa?.presencaDigital || 'baixa';

  // Proteção para análise
  const resumo = diagnostico?.diagnostico?.resumo || '';
  const detalhes = diagnostico?.diagnostico?.detalhes || '';
  const nivelMaturidade = diagnostico?.diagnostico?.nivelMaturidade || 'iniciante';
  const urgencia = diagnostico?.diagnostico?.urgencia || 'baixa';

  // Proteção para arrays
  const pontosFortes = diagnostico?.pontosFortes || [];
  const pontosFracos = diagnostico?.pontosFracos || [];
  const oportunidades = diagnostico?.oportunidades || [];
  const mensagens = diagnostico?.mensagens || [];

  // Proteção para estratégia (garantir que cada propriedade tenha valor padrão)
  const estrategiaRaw = diagnostico?.estrategia || {};
  const estrategia = {
    objetivo: estrategiaRaw.objetivo || '',
    acoes: estrategiaRaw.acoes || [],
    investimentoSugerido: {
      min: estrategiaRaw.investimentoSugerido?.min || 0,
      max: estrategiaRaw.investimentoSugerido?.max || 0,
      moeda: estrategiaRaw.investimentoSugerido?.moeda || 'R$',
    },
    resultadosEsperados: estrategiaRaw.resultadosEsperados || [],
    prazoResultados: estrategiaRaw.prazoResultados || '',
  };

  // Proteção para abordagem (garantir que cada propriedade tenha valor padrão)
  const abordagemRaw = diagnostico?.abordagem || {};
  const abordagem = {
    tom: abordagemRaw.tom || 'consultivo' as const,
    angulo: abordagemRaw.angulo || '',
    gatilhos: abordagemRaw.gatilhos || [],
    objecoesPrevistas: abordagemRaw.objecoesPrevistas || [],
    respostasObjecoes: abordagemRaw.respostasObjecoes || {},
  };

  const tempConfig = useMemo(() => {
    return TEMPERATURA_CONFIG[temperatura] || TEMPERATURA_CONFIG.COOL;
  }, [temperatura]);

  const TempIcon = tempConfig.icon;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const renderSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    color: string = 'violet'
  ) => {
    const isExpanded = expandedSection === id;
    const bgColor = `bg-${color}-500/10`;
    const borderColor = `border-${color}-500/20`;

    return (
      <div className={`rounded-xl ${bgColor} border ${borderColor} overflow-hidden`}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-zinc-300">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>
        {isExpanded && <div className="px-4 pb-4">{content}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header com Score e Classificação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Score */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-zinc-400">Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{score}</p>
        </div>

        {/* Temperatura */}
        <div className={`p-4 rounded-xl ${tempConfig.bg} border ${tempConfig.border}`}>
          <div className="flex items-center gap-2 mb-1">
            <TempIcon className={`w-4 h-4 ${tempConfig.text}`} />
            <span className="text-xs text-zinc-400">Temperatura</span>
          </div>
          <p className={`text-2xl font-bold ${tempConfig.text}`}>{tempConfig.label}</p>
        </div>

        {/* Nicho */}
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-zinc-400">Nicho</span>
          </div>
          <p className="text-sm font-medium text-white truncate">
            {nichoDetectado}
          </p>
        </div>

        {/* Presença Digital */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-400">Presença Digital</span>
          </div>
          <p className="text-sm font-medium text-white capitalize">
            {presencaDigital}
          </p>
        </div>
      </div>

      {/* Motivo da Classificação */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
        <p className="text-sm text-zinc-300">
          <span className="text-zinc-500">Motivo:</span> {motivo}
        </p>
      </div>

      {/* Seções Expansíveis */}
      <div className="space-y-3">
        {/* Resumo do Diagnóstico */}
        {renderSection(
          'resumo',
          'Resumo do Diagnóstico',
          <Lightbulb className="w-4 h-4 text-violet-400" />,
          <div className="space-y-2">
            <p className="text-sm text-zinc-300">{resumo}</p>
            {detalhes && (
              <p className="text-xs text-zinc-500">{detalhes}</p>
            )}
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-zinc-400">
                Maturidade:{' '}
                <span className="text-zinc-200 capitalize">
                  {nivelMaturidade}
                </span>
              </span>
              <span className="text-zinc-400">
                Urgência:{' '}
                <span
                  className={
                    urgencia === 'critica'
                      ? 'text-red-400'
                      : urgencia === 'alta'
                        ? 'text-amber-400'
                        : 'text-zinc-200'
                  }
                >
                  {urgencia}
                </span>
              </span>
            </div>
          </div>,
          'violet'
        )}

        {/* Pontos Fortes */}
        {pontosFortes.length > 0 &&
          renderSection(
            'fortes',
            `Pontos Fortes (${pontosFortes.length})`,
            <ThumbsUp className="w-4 h-4 text-emerald-400" />,
            <ul className="space-y-2">
              {pontosFortes.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  <div>
                    <p className="text-sm text-zinc-200">{ponto.titulo}</p>
                    <p className="text-xs text-zinc-500">{ponto.descricao}</p>
                  </div>
                </li>
              ))}
            </ul>,
            'emerald'
          )}

        {/* Pontos Fracos */}
        {pontosFracos.length > 0 &&
          renderSection(
            'fracos',
            `Pontos Fracos (${pontosFracos.length})`,
            <ThumbsDown className="w-4 h-4 text-amber-400" />,
            <ul className="space-y-2">
              {pontosFracos.map((ponto, idx) => {
                const impactoConfig = IMPACTO_CONFIG[ponto.impacto] || IMPACTO_CONFIG.medio;
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1">{impactoConfig.icon}</span>
                    <div>
                      <p className="text-sm text-zinc-200">{ponto.titulo}</p>
                      <p className="text-xs text-zinc-500">{ponto.descricao}</p>
                    </div>
                  </li>
                );
              })}
            </ul>,
            'amber'
          )}

        {/* Oportunidades */}
        {oportunidades.length > 0 &&
          renderSection(
            'oportunidades',
            `Oportunidades (${oportunidades.length})`,
            <Target className="w-4 h-4 text-blue-400" />,
            <ul className="space-y-3">
              {oportunidades.map((op, idx) => (
                <li key={idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-sm font-medium text-zinc-200">{op.titulo}</p>
                  <p className="text-xs text-zinc-500 mt-1">{op.descricao}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-zinc-400">
                      ROI: <span className="text-blue-400 capitalize">{op.potencialROI}</span>
                    </span>
                    <span className="text-zinc-400">
                      Prazo:{' '}
                      <span className="text-zinc-200 capitalize">{op.prazoImplementacao}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>,
            'blue'
          )}

        {/* Estratégia */}
        {renderSection(
          'estrategia',
          'Estratégia Sugerida',
          <DollarSign className="w-4 h-4 text-green-400" />,
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Objetivo</p>
              <p className="text-sm text-zinc-200">{estrategia.objetivo}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-2">Ações Recomendadas</p>
              <ul className="space-y-1">
                {estrategia.acoes.map((acao, idx) => (
                  <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-green-400">{idx + 1}.</span>
                    {acao}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/[0.03]">
                <p className="text-xs text-zinc-500 mb-1">Investimento Sugerido</p>
                <p className="text-sm text-green-400 font-medium">
                  {estrategia.investimentoSugerido.moeda}{' '}
                  {estrategia.investimentoSugerido.min.toLocaleString()} -{' '}
                  {estrategia.investimentoSugerido.max.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.03]">
                <p className="text-xs text-zinc-500 mb-1">Prazo para Resultados</p>
                <p className="text-sm text-zinc-200">{estrategia.prazoResultados}</p>
              </div>
            </div>
          </div>,
          'green'
        )}

        {/* Abordagem */}
        {renderSection(
          'abordagem',
          'Abordagem Comercial',
          <MessageCircle className="w-4 h-4 text-pink-400" />,
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="p-2 px-3 rounded-lg bg-pink-500/20 text-pink-300 text-xs">
                Tom: {abordagem.tom}
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Ângulo de Abordagem</p>
              <p className="text-sm text-zinc-200">{abordagem.angulo}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-2">Gatilhos Mentais</p>
              <div className="flex flex-wrap gap-2">
                {abordagem.gatilhos.map((gatilho, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-pink-500/20 text-pink-300 rounded-lg"
                  >
                    {gatilho}
                  </span>
                ))}
              </div>
            </div>
            {abordagem.objecoesPrevistas.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">Objeções Previstas</p>
                <ul className="space-y-2">
                  {abordagem.objecoesPrevistas.map((obj, idx) => (
                    <li key={idx} className="text-sm">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400 mt-1 flex-shrink-0" />
                        <span className="text-zinc-300">{obj}</span>
                      </div>
                      {abordagem.respostasObjecoes[obj] && (
                        <p className="text-xs text-zinc-500 ml-5 mt-1">
                          → {abordagem.respostasObjecoes[obj]}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>,
          'pink'
        )}

        {/* Mensagens */}
        {mensagens.length > 0 &&
          renderSection(
            'mensagens',
            `Mensagens Prontas (${mensagens.length})`,
            <Send className="w-4 h-4 text-cyan-400" />,
            <div className="space-y-4">
              {mensagens.map((msg, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-300 rounded capitalize">
                        {msg.tipo}
                      </span>
                      <span className="text-xs text-zinc-500 capitalize">
                        via {msg.canalRecomendado}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onSendMessage && (
                        <button
                          onClick={() => onSendMessage(msg)}
                          className="p-1.5 hover:bg-cyan-500/20 rounded-lg transition-colors"
                          title="Enviar mensagem"
                        >
                          <Send className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(msg.conteudo, `msg-${idx}`)}
                        className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                        title="Copiar mensagem"
                      >
                        {copiedField === `msg-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {msg.assunto && (
                    <p className="text-xs text-zinc-500 mb-1">Assunto: {msg.assunto}</p>
                  )}
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{msg.conteudo}</p>
                  {msg.melhorHorario && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
                      <Clock className="w-3 h-3" />
                      Melhor horário: {msg.melhorHorario}
                    </div>
                  )}
                </div>
              ))}
            </div>,
            'cyan'
          )}
      </div>

      {/* Footer com ações */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
        <p className="text-xs text-zinc-500">
          Diagnóstico de {new Date(diagnostico.criadoEm).toLocaleDateString('pt-BR')}
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
}
