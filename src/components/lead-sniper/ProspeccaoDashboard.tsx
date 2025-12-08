/**
 * @file ProspeccaoDashboard.tsx
 * @description Dashboard principal de prospecção com estatísticas e ações rápidas
 * @module components/lead-sniper
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  Users,
  MessageCircle,
  Globe,
  Flame,
  Thermometer,
  Snowflake,
  BarChart3,
  Clock,
  MapPin,
  Loader2,
  RefreshCw,
  Megaphone,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Stethoscope,
  Search,
} from 'lucide-react';

import { NovaPesquisaFormV3 } from './NovaPesquisaFormV3';

interface DashboardStats {
  total: number;
  porClassificacao: {
    HOT: number;
    WARM: number;
    COOL: number;
    COLD: number;
  };
  porStatus: Record<string, number>;
  porCidade: Record<string, number>;
  comWhatsapp: number;
  semSite: number;
  scoreMedia: number;
  totalPesquisas: number;
  ultimaPesquisa: {
    id: string;
    tipoNegocio: string;
    createdAt: string;
    totalLeads: number;
  } | null;
  marketingDigital?: {
    semMarketing: number;
    marketingBasico: number;
    marketingAvancado: number;
    naoVerificado: number;
    fazGoogleAds: number;
    fazFacebookAds: number;
  };
}

interface VerificacaoResult {
  total: number;
  sucesso: number;
  erro: number;
  comGoogleAds: number;
  comFacebookAds: number;
  semMarketing: number;
}

export function ProspeccaoDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNovaPesquisa, setShowNovaPesquisa] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Estados para verificação em massa
  const [pendentesVerificacao, setPendentesVerificacao] = useState<number>(0);
  const [isVerificando, setIsVerificando] = useState(false);
  const [verificacaoResult, setVerificacaoResult] = useState<VerificacaoResult | null>(null);
  const [verificacaoError, setVerificacaoError] = useState<string | null>(null);

  const fetchPendentes = async () => {
    try {
      const response = await fetch('/api/leads/verificar-ads-massa');
      const data = await response.json();
      if (response.ok) {
        setPendentesVerificacao(data.pendentes);
      }
    } catch (error) {
      console.error('[ProspeccaoDashboard] Erro ao buscar pendentes:', error);
    }
  };

  const handleVerificarTodos = async () => {
    setIsVerificando(true);
    setVerificacaoResult(null);
    setVerificacaoError(null);

    try {
      const response = await fetch('/api/leads/verificar-ads-massa', {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na verificação');
      }

      setVerificacaoResult(data.resultados);
      // Atualizar stats e pendentes após verificação
      fetchStats();
      fetchPendentes();
    } catch (error) {
      setVerificacaoError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsVerificando(false);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/leads/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('[ProspeccaoDashboard] Erro ao buscar stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPendentes();
  }, []);

  const handlePesquisaSuccess = () => {
    setShowNovaPesquisa(false);
    fetchStats();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Help Section - Explicação das Funcionalidades */}
      {showHelp && (
        <div className="backdrop-blur-xl bg-gradient-to-r from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-400" />
              Como funciona o Lead Sniper
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-zinc-400 hover:text-white text-sm"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nova Pesquisa */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-violet-500/20">
                  <Search className="w-4 h-4 text-violet-400" />
                </div>
                <h4 className="font-medium text-white">Nova Pesquisa</h4>
              </div>
              <p className="text-xs text-zinc-400 mb-2">
                Busca leads no Google Maps e gera mensagens de abordagem com IA.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded text-[10px]">Google Maps</span>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded text-[10px]">Icebreakers IA</span>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20">
                  <Stethoscope className="w-4 h-4 text-cyan-400" />
                </div>
                <h4 className="font-medium text-white">Diagnóstico</h4>
                <span className="px-1.5 py-0.5 bg-cyan-500 text-white rounded text-[10px] font-medium">IA</span>
              </div>
              <p className="text-xs text-zinc-400 mb-2">
                Análise profunda do lead com pontos fortes/fracos, estratégias e mensagens prontas.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded text-[10px]">Estratégias</span>
                <span className="px-2 py-0.5 bg-pink-500/10 text-pink-300 rounded text-[10px]">Mensagens</span>
              </div>
            </div>

            {/* Verificar Ads */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                </div>
                <h4 className="font-medium text-white">Verificar Ads</h4>
              </div>
              <p className="text-xs text-zinc-400 mb-2">
                Detecta se o lead usa Google Ads, Meta Ads, Analytics e outras ferramentas.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-red-500/10 text-red-300 rounded text-[10px]">Google Ads</span>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-[10px]">Meta Ads</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 mt-4 text-center">
            💡 Dica: Use o <strong className="text-cyan-400">Diagnóstico</strong> nos leads HOT/WARM para obter estratégias personalizadas
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <HelpCircle className="w-4 h-4" />
          {showHelp ? 'Ocultar ajuda' : 'Como funciona?'}
        </button>

        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-zinc-400 hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => setShowNovaPesquisa(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white rounded-xl transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Nova Pesquisa
          </button>
        </div>
      </div>

      {/* Modal Nova Pesquisa v3 */}
      {showNovaPesquisa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl p-6">
            <NovaPesquisaFormV3
              onSuccess={handlePesquisaSuccess}
              onCancel={() => setShowNovaPesquisa(false)}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total de Leads */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm text-zinc-400">Total de Leads</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.total || 0}</p>
        </div>

        {/* Score Médio */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-zinc-400">Score Médio</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.scoreMedia || 0}</p>
        </div>

        {/* Com WhatsApp */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-zinc-400">Com WhatsApp</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.comWhatsapp || 0}</p>
        </div>

        {/* Sem Site */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Globe className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-zinc-400">Sem Site</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.semSite || 0}</p>
        </div>
      </div>

      {/* Classificação */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          Leads por Classificação
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* HOT */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-red-400" />
              <span className="text-sm font-medium text-red-400">HOT</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.porClassificacao?.HOT || 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Alta prioridade</p>
          </div>

          {/* WARM */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">WARM</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.porClassificacao?.WARM || 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Boa oportunidade</p>
          </div>

          {/* COOL */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Snowflake className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">COOL</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.porClassificacao?.COOL || 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Potencial moderado</p>
          </div>

          {/* COLD */}
          <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Snowflake className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-400">COLD</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats?.porClassificacao?.COLD || 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Baixa prioridade</p>
          </div>
        </div>
      </div>

      {/* Grid: Cidades + Última Pesquisa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Cidades */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-violet-400" />
            Leads por Cidade
          </h2>

          {stats?.porCidade && Object.keys(stats.porCidade).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.porCidade)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cidade, count]) => (
                  <div key={cidade} className="flex items-center justify-between">
                    <span className="text-zinc-300">{cidade}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{
                            width: `${(count / stats.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-zinc-400 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-4">
              Nenhum dado de cidade disponível
            </p>
          )}
        </div>

        {/* Última Pesquisa */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Última Pesquisa
          </h2>

          {stats?.ultimaPesquisa ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tipo de Negócio</span>
                <span className="text-white font-medium capitalize">
                  {stats.ultimaPesquisa.tipoNegocio.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Data</span>
                <span className="text-white">
                  {formatDate(stats.ultimaPesquisa.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Leads Encontrados</span>
                <span className="text-white font-medium">
                  {stats.ultimaPesquisa.totalLeads}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total de Pesquisas</span>
                <span className="text-white font-medium">{stats.totalPesquisas}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 mb-4">Nenhuma pesquisa realizada ainda</p>
              <button
                onClick={() => setShowNovaPesquisa(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                Fazer Primeira Pesquisa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Marketing Digital */}
      {stats?.marketingDigital && stats.total > 0 && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-violet-400" />
              Marketing Digital
            </h2>

            {/* Botão de Verificação em Massa */}
            <div className="flex items-center gap-3">
              {pendentesVerificacao > 0 && (
                <span className="text-sm text-zinc-400">
                  {pendentesVerificacao} pendente{pendentesVerificacao !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={handleVerificarTodos}
                disabled={isVerificando || pendentesVerificacao === 0}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                {isVerificando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Verificar Todos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultado da Verificação */}
          {verificacaoResult && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-emerald-400">
                  Verificação concluída!
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-sm">
                <div>
                  <p className="text-white font-bold">{verificacaoResult.total}</p>
                  <p className="text-zinc-500 text-xs">Total</p>
                </div>
                <div>
                  <p className="text-emerald-400 font-bold">{verificacaoResult.sucesso}</p>
                  <p className="text-zinc-500 text-xs">Sucesso</p>
                </div>
                <div>
                  <p className="text-red-400 font-bold">{verificacaoResult.erro}</p>
                  <p className="text-zinc-500 text-xs">Erros</p>
                </div>
                <div>
                  <p className="text-red-400 font-bold">{verificacaoResult.comGoogleAds}</p>
                  <p className="text-zinc-500 text-xs">Google Ads</p>
                </div>
                <div>
                  <p className="text-blue-400 font-bold">{verificacaoResult.comFacebookAds}</p>
                  <p className="text-zinc-500 text-xs">Meta Ads</p>
                </div>
                <div>
                  <p className="text-amber-400 font-bold">{verificacaoResult.semMarketing}</p>
                  <p className="text-zinc-500 text-xs">Sem MKT</p>
                </div>
              </div>
              <button
                onClick={() => setVerificacaoResult(null)}
                className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Erro na Verificação */}
          {verificacaoError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-400">{verificacaoError}</span>
              <button
                onClick={() => setVerificacaoError(null)}
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-300"
              >
                Fechar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Não Verificado */}
            <div className="bg-zinc-500/10 border border-zinc-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-zinc-400">
                {stats.marketingDigital.naoVerificado}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Não verificados</p>
            </div>

            {/* Sem Marketing */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {stats.marketingDigital.semMarketing}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Sem marketing</p>
            </div>

            {/* Marketing Básico */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.marketingDigital.marketingBasico}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Marketing básico</p>
            </div>

            {/* Marketing Avançado */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {stats.marketingDigital.marketingAvancado}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Marketing avançado</p>
            </div>

            {/* Google Ads */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">
                {stats.marketingDigital.fazGoogleAds}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Google Ads</p>
            </div>

            {/* Meta Ads */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {stats.marketingDigital.fazFacebookAds}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Meta Ads</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Pipeline */}
      {stats?.porStatus && Object.keys(stats.porStatus).length > 0 && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Pipeline de Leads
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { key: 'NOVO', label: 'Novos', color: 'violet' },
              { key: 'CONTATADO', label: 'Contatados', color: 'blue' },
              { key: 'RESPONDEU', label: 'Responderam', color: 'emerald' },
              { key: 'INTERESSADO', label: 'Interessados', color: 'amber' },
              { key: 'FECHADO', label: 'Fechados', color: 'green' },
              { key: 'PERDIDO', label: 'Perdidos', color: 'red' },
            ].map((status) => (
              <div
                key={status.key}
                className={`bg-${status.color}-500/10 border border-${status.color}-500/20 rounded-xl p-3 text-center`}
              >
                <p className={`text-2xl font-bold text-${status.color}-400`}>
                  {stats.porStatus[status.key] || 0}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{status.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
