/**
 * @file NovaPesquisaFormV3.tsx
 * @description Formulário para criar nova pesquisa de leads usando Lead Sniper v3 AI
 * @module components/lead-sniper
 *
 * Esta versão é RECOMENDADA pois:
 * - Gera icebreakers personalizados com IA
 * - Faz scraping de sites para análise
 * - Interface mais simples e intuitiva
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Globe,
  MessageSquare,
  Info,
  Zap,
  Building2,
} from 'lucide-react';

import { getNichosPorCategoria, getNichoInfo } from '@/lib/lead-sniper';
import { LEAD_SNIPER_V3_LIMITS } from '@/types/lead-sniper-v3';
import type { LeadSniperV3Response } from '@/types/lead-sniper-v3';
import type { TipoNegocio } from '@/types/lead-sniper';
import { MENSAGENS_LOADING_V3 } from '@/lib/lead-sniper/service-v3';

interface NovaPesquisaFormV3Props {
  onSuccess?: (result: LeadSniperV3Response) => void;
  onCancel?: () => void;
}

export function NovaPesquisaFormV3({ onSuccess, onCancel }: NovaPesquisaFormV3Props) {
  // Form state
  const [tipoNegocio, setTipoNegocio] = useState<string>('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [quantidade, setQuantidade] = useState<number>(LEAD_SNIPER_V3_LIMITS.DEFAULT_QUANTIDADE);
  const [tomVoz, setTomVoz] = useState<'profissional' | 'amigável' | 'descontraído' | 'formal'>('profissional');

  // Config opcional (colapsado por padrão)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [nomeAgencia, setNomeAgencia] = useState('');
  const [especialidade, setEspecialidade] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadSniperV3Response | null>(null);

  // Mensagens progressivas durante loading
  useEffect(() => {
    if (!isLoading) {
      return;
    }

    let currentIndex = 0;
    const firstMessage = MENSAGENS_LOADING_V3[0];
    if (firstMessage) {
      setLoadingMessage(firstMessage.mensagem);
    }

    const interval = setInterval(() => {
      currentIndex++;
      const message = MENSAGENS_LOADING_V3[currentIndex];
      if (message) {
        setLoadingMessage(message.mensagem);
      }
    }, 15000); // Atualiza a cada 15s

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!tipoNegocio) {
      setError('Selecione um tipo de negócio');
      return;
    }

    if (!cidade.trim()) {
      setError('Digite o nome da cidade');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/lead-sniper/v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_negocio: tipoNegocio,
          cidade: cidade.trim(),
          estado,
          quantidade,
          tom_voz: tomVoz,
          nome_agencia: nomeAgencia.trim() || undefined,
          especialidade: especialidade.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar pesquisa');
      }

      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de resultado
  if (result) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pesquisa Concluída!</h3>
            <p className="text-sm text-zinc-400">
              {result.estatisticas.total} leads encontrados em {result.meta.cidade}
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{result.estatisticas.hot}</p>
            <p className="text-xs text-zinc-400">HOT 🔥</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-orange-400">{result.estatisticas.warm}</p>
            <p className="text-xs text-zinc-400">WARM 🟡</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{result.estatisticas.cool}</p>
            <p className="text-xs text-zinc-400">COOL 🔵</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{result.estatisticas.comWhatsapp}</p>
            <p className="text-xs text-zinc-400">WhatsApp</p>
          </div>
        </div>

        {/* Indicadores v3 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-violet-400">{result.estatisticas.icebreakersPorIA}</p>
            <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
              <Bot className="w-3 h-3" />
              Icebreakers IA
            </p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-cyan-400">{result.estatisticas.sitesScraped}</p>
            <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
              <Globe className="w-3 h-3" />
              Sites Analisados
            </p>
          </div>
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-pink-400">{result.estatisticas.semSite}</p>
            <p className="text-xs text-zinc-400">Sem Site</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setResult(null);
              setTipoNegocio('');
              setCidade('');
            }}
            className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            Nova Pesquisa
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 mb-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Buscando Leads...</h3>
        <p className="text-sm text-zinc-400 mb-4">{loadingMessage}</p>
        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 animate-pulse" style={{ width: '60%' }} />
        </div>
        <p className="text-xs text-zinc-500 mt-4">
          Isso pode levar até 2-3 minutos para gerar icebreakers com IA
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header com explicação */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Lead Sniper v3 AI</h3>
            <p className="text-xs text-zinc-400">
              Busca leads no Google Maps e gera mensagens de abordagem personalizadas usando IA.
            </p>
          </div>
        </div>

        {/* Benefícios */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs text-zinc-300">
            <Bot className="w-3 h-3 text-violet-400" />
            Icebreakers por IA
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs text-zinc-300">
            <Globe className="w-3 h-3 text-cyan-400" />
            Scraping de Sites
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs text-zinc-300">
            <Zap className="w-3 h-3 text-amber-400" />
            Score Automático
          </span>
        </div>
      </div>

      {/* Tipo de Negócio */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
          <Building2 className="w-4 h-4 text-violet-400" />
          O que você quer prospectar?
        </label>
        <select
          value={tipoNegocio}
          onChange={(e) => setTipoNegocio(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all [&>option]:bg-zinc-900 [&>option]:text-white [&>optgroup]:bg-zinc-800 [&>optgroup]:text-zinc-400"
        >
          <option value="">Escolha um nicho...</option>
          {getNichosPorCategoria().map((cat) => (
            <optgroup key={cat.id} label={`${cat.icone} ${cat.nome}`}>
              {cat.nichos.map((nicho) => (
                <option key={nicho.codigo} value={nicho.codigo}>
                  {nicho.icone} {nicho.nome}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {tipoNegocio && (
          <div className="mt-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            {(() => {
              const nichoInfo = getNichoInfo(tipoNegocio as TipoNegocio);
              return nichoInfo ? (
                <p className="text-xs text-violet-300">
                  <span className="text-base mr-1">{nichoInfo.icone}</span>
                  Buscando: <strong className="text-white">{nichoInfo.nome}</strong>
                </p>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            Cidade
          </label>
          <input
            type="text"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Ex: Campinas, São Paulo, Curitiba..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Estado
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          >
            <option value="SP">SP</option>
            <option value="RJ">RJ</option>
            <option value="MG">MG</option>
            <option value="PR">PR</option>
            <option value="SC">SC</option>
            <option value="RS">RS</option>
            <option value="BA">BA</option>
            <option value="GO">GO</option>
            <option value="DF">DF</option>
            <option value="CE">CE</option>
            <option value="PE">PE</option>
            <option value="ES">ES</option>
          </select>
        </div>
      </div>

      {/* Quantidade e Tom de Voz */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Quantidade: <span className="text-violet-400">{quantidade}</span> leads
          </label>
          <input
            type="range"
            min={LEAD_SNIPER_V3_LIMITS.MIN_QUANTIDADE}
            max={LEAD_SNIPER_V3_LIMITS.MAX_QUANTIDADE}
            step="5"
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>{LEAD_SNIPER_V3_LIMITS.MIN_QUANTIDADE}</span>
            <span>{LEAD_SNIPER_V3_LIMITS.MAX_QUANTIDADE}</span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            Tom de Voz
          </label>
          <select
            value={tomVoz}
            onChange={(e) => setTomVoz(e.target.value as typeof tomVoz)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          >
            <option value="profissional">👔 Profissional</option>
            <option value="amigável">😊 Amigável</option>
            <option value="descontraído">🎉 Descontraído</option>
            <option value="formal">📋 Formal</option>
          </select>
        </div>
      </div>

      {/* Configurações Avançadas */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          <Info className="w-4 h-4" />
          {showAdvanced ? 'Ocultar' : 'Mostrar'} configurações avançadas
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
            <p className="text-xs text-zinc-500 mb-3">
              Personalize os icebreakers com informações da sua agência
            </p>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Nome da Agência (opcional)
              </label>
              <input
                type="text"
                value={nomeAgencia}
                onChange={(e) => setNomeAgencia(e.target.value)}
                placeholder="Ex: Agência XYZ"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900/50 border border-white/[0.05] text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Especialidade (opcional)
              </label>
              <input
                type="text"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                placeholder="Ex: tráfego pago para academias"
                className="w-full px-3 py-2 rounded-lg bg-zinc-900/50 border border-white/[0.05] text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!tipoNegocio || !cidade.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-xl transition-all"
        >
          <Search className="w-5 h-5" />
          Buscar Leads com IA
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-zinc-500 text-center">
        ⏱️ Tempo estimado: 1-3 minutos • 💰 Custo: ~$0.05 por pesquisa
      </p>
    </form>
  );
}
