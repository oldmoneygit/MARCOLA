/**
 * @file NovaPesquisaForm.tsx
 * @description Formulário para criar nova pesquisa de mercado
 * @module components/lead-sniper
 */

'use client';

import { useState } from 'react';
import {
  Search,
  MapPin,
  Target,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';

import {
  CIDADES_CAMPINAS,
  LEAD_SNIPER_LIMITS,
  getNichosPorCategoria,
  getNichoInfo,
} from '@/lib/lead-sniper';
import type { TipoNegocio, CidadeConfig } from '@/types/lead-sniper';

interface NovaPesquisaFormProps {
  onSuccess?: (result: unknown) => void;
  onCancel?: () => void;
}

export function NovaPesquisaForm({ onSuccess, onCancel }: NovaPesquisaFormProps) {
  const [tipoNegocio, setTipoNegocio] = useState<TipoNegocio | ''>('');
  const [cidadesSelecionadas, setCidadesSelecionadas] = useState<CidadeConfig[]>([]);
  const [scoreMinimo, setScoreMinimo] = useState<number>(LEAD_SNIPER_LIMITS.DEFAULT_SCORE_MINIMO);
  const [maxPorCidade, setMaxPorCidade] = useState<number>(LEAD_SNIPER_LIMITS.DEFAULT_MAX_POR_CIDADE);

  // Cálculo de leads potenciais e validação
  const potentialLeads = cidadesSelecionadas.length * maxPorCidade;
  const exceedsLimit = potentialLeads > LEAD_SNIPER_LIMITS.MAX_TOTAL_LEADS;
  const excedesCidades = cidadesSelecionadas.length > LEAD_SNIPER_LIMITS.MAX_CIDADES;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    leadsNovos: number;
    leadsDuplicados: number;
    estatisticas: Record<string, number>;
  } | null>(null);

  const handleAddCidade = (cidade: typeof CIDADES_CAMPINAS[number]) => {
    if (cidadesSelecionadas.length >= LEAD_SNIPER_LIMITS.MAX_CIDADES) {
      setError(`Limite de ${LEAD_SNIPER_LIMITS.MAX_CIDADES} cidades por pesquisa. Faça pesquisas separadas.`);
      return;
    }
    if (!cidadesSelecionadas.find((c) => c.nome === cidade.nome)) {
      setCidadesSelecionadas([...cidadesSelecionadas, cidade]);
      setError(null);
    }
  };

  const handleRemoveCidade = (nome: string) => {
    setCidadesSelecionadas(cidadesSelecionadas.filter((c) => c.nome !== nome));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!tipoNegocio) {
      setError('Selecione um tipo de negócio');
      return;
    }

    if (cidadesSelecionadas.length === 0) {
      setError('Selecione pelo menos uma cidade');
      return;
    }

    if (cidadesSelecionadas.length > LEAD_SNIPER_LIMITS.MAX_CIDADES) {
      setError(`Limite de ${LEAD_SNIPER_LIMITS.MAX_CIDADES} cidades. Remova ${cidadesSelecionadas.length - LEAD_SNIPER_LIMITS.MAX_CIDADES} cidade(s).`);
      return;
    }

    if (potentialLeads > LEAD_SNIPER_LIMITS.MAX_TOTAL_LEADS) {
      setError(`Combinação excede ${LEAD_SNIPER_LIMITS.MAX_TOTAL_LEADS} leads. Reduza cidades ou leads por cidade.`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/pesquisa-mercado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoNegocio,
          cidades: cidadesSelecionadas,
          scoreMinimo,
          maxPorCidade,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar pesquisa');
      }

      setResult({
        leadsNovos: data.leadsNovos,
        leadsDuplicados: data.leadsDuplicados,
        estatisticas: data.estatisticas,
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const cidadesDisponiveis = CIDADES_CAMPINAS.filter(
    (c) => !cidadesSelecionadas.find((s) => s.nome === c.nome)
  );

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
              {result.leadsNovos} novos leads encontrados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{result.estatisticas.hot}</p>
            <p className="text-sm text-zinc-400">HOT</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{result.estatisticas.warm}</p>
            <p className="text-sm text-zinc-400">WARM</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{result.estatisticas.cool}</p>
            <p className="text-sm text-zinc-400">COOL</p>
          </div>
          <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-zinc-400">{result.estatisticas.cold}</p>
            <p className="text-sm text-zinc-400">COLD</p>
          </div>
        </div>

        {result.leadsDuplicados > 0 && (
          <p className="text-sm text-zinc-500 mb-4">
            {result.leadsDuplicados} leads já existiam no sistema
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setResult(null);
              setTipoNegocio('');
              setCidadesSelecionadas([]);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Negócio */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Tipo de Negócio
        </label>
        <select
          value={tipoNegocio}
          onChange={(e) => setTipoNegocio(e.target.value as TipoNegocio)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all [&>option]:bg-zinc-900 [&>option]:text-white [&>optgroup]:bg-zinc-800 [&>optgroup]:text-zinc-400"
        >
          <option value="" className="bg-zinc-900 text-zinc-400">
            Escolha um nicho...
          </option>
          {getNichosPorCategoria().map((cat) => (
            <optgroup key={cat.id} label={`${cat.icone} ${cat.nome}`} className="bg-zinc-800 text-zinc-400 font-medium">
              {cat.nichos.map((nicho) => (
                <option key={nicho.codigo} value={nicho.codigo} className="bg-zinc-900 text-white py-1">
                  {nicho.icone} {nicho.nome}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Preview do nicho selecionado */}
        {tipoNegocio && (
          <div className="mt-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            {(() => {
              const nichoInfo = getNichoInfo(tipoNegocio);
              return nichoInfo ? (
                <p className="text-sm text-violet-300">
                  <span className="text-xl mr-2">{nichoInfo.icone}</span>
                  Buscando: <strong className="text-white">{nichoInfo.nome}</strong>
                </p>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Cidades */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Cidades ({cidadesSelecionadas.length}/{LEAD_SNIPER_LIMITS.MAX_CIDADES})
          {cidadesSelecionadas.length >= LEAD_SNIPER_LIMITS.MAX_CIDADES && (
            <span className="ml-2 text-xs text-amber-400">Limite atingido</span>
          )}
        </label>

        {/* Cidades selecionadas */}
        {cidadesSelecionadas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {cidadesSelecionadas.map((cidade) => (
              <span
                key={cidade.nome}
                className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600/20 border border-violet-500/30 rounded-full text-sm text-violet-300"
              >
                {cidade.nome}
                <button
                  type="button"
                  onClick={() => handleRemoveCidade(cidade.nome)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Cidades disponíveis */}
        <div className="flex flex-wrap gap-2">
          {cidadesDisponiveis.map((cidade) => (
            <button
              key={cidade.nome}
              type="button"
              onClick={() => handleAddCidade(cidade)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white/[0.03] border border-white/[0.08] rounded-full text-sm text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" />
              {cidade.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <Target className="inline w-4 h-4 mr-1" />
            Score Mínimo: {scoreMinimo}
          </label>
          <input
            type="range"
            min="0"
            max="80"
            step="10"
            value={scoreMinimo}
            onChange={(e) => setScoreMinimo(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>0</span>
            <span>40</span>
            <span>80</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Max por Cidade: {maxPorCidade}
          </label>
          <input
            type="range"
            min="5"
            max={LEAD_SNIPER_LIMITS.MAX_POR_CIDADE}
            step="5"
            value={maxPorCidade}
            onChange={(e) => setMaxPorCidade(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>5</span>
            <span>10</span>
            <span>{LEAD_SNIPER_LIMITS.MAX_POR_CIDADE}</span>
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || !tipoNegocio || cidadesSelecionadas.length === 0 || exceedsLimit || excedesCidades}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Buscando Leads...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Iniciar Pesquisa
            </>
          )}
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

      {/* Info de custo e limites */}
      <div className="space-y-1">
        <p className="text-xs text-zinc-500 text-center">
          Leads potenciais: {potentialLeads} / {LEAD_SNIPER_LIMITS.MAX_TOTAL_LEADS} ({cidadesSelecionadas.length} cidades × {maxPorCidade} por cidade)
        </p>
        <p className="text-xs text-zinc-500 text-center">
          Custo estimado: ~${(cidadesSelecionadas.length * 0.032).toFixed(2)} ({cidadesSelecionadas.length} cidades × $0.032)
        </p>
        {exceedsLimit && (
          <p className="text-xs text-amber-400 text-center">
            ⚠️ Excede limite de {LEAD_SNIPER_LIMITS.MAX_TOTAL_LEADS} leads. Reduza cidades ou leads por cidade.
          </p>
        )}
      </div>
    </form>
  );
}
