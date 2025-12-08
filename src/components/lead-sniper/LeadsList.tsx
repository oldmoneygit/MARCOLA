/**
 * @file LeadsList.tsx
 * @description Lista de leads com filtros e paginação
 * @module components/lead-sniper
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
} from 'lucide-react';

import { LeadCard } from './LeadCard';
import { AnaliseIAModal } from './AnaliseIAModal';
import { ModalDiagnostico } from './ModalDiagnostico';
import { ModalEnviarWhatsApp } from '@/components/whatsapp-evolution';
import { getNichosPorCategoria, getNichoNome } from '@/lib/lead-sniper';
import type { LeadProspectado, LeadClassificacao, LeadStatus, NivelMarketingDigital, TipoNegocio } from '@/types/lead-sniper';

interface LeadsListProps {
  onLeadClick?: (lead: LeadProspectado) => void;
  pesquisaId?: string;
}

interface Filters {
  classificacao: LeadClassificacao | '';
  status: LeadStatus | '';
  cidade: string;
  tipoNegocio: TipoNegocio | '';
  temWhatsapp: boolean | null;
  temSite: boolean | null;
  nivelMarketing: NivelMarketingDigital | '';
  search: string;
}

const CLASSIFICACOES: LeadClassificacao[] = ['HOT', 'WARM', 'COOL', 'COLD'];
const STATUSES: LeadStatus[] = ['NOVO', 'CONTATADO', 'RESPONDEU', 'INTERESSADO', 'FECHADO', 'PERDIDO'];
const NIVEIS_MARKETING: { value: NivelMarketingDigital; label: string }[] = [
  { value: 'NAO_VERIFICADO', label: 'Não verificado' },
  { value: 'NENHUM', label: 'Sem marketing' },
  { value: 'BASICO', label: 'Marketing básico' },
  { value: 'AVANCADO', label: 'Marketing avançado' },
];

export function LeadsList({ onLeadClick, pesquisaId }: LeadsListProps) {
  const [leads, setLeads] = useState<LeadProspectado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estado para análise IA
  const [selectedLeadForIA, setSelectedLeadForIA] = useState<LeadProspectado | null>(null);
  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);

  // Estado para WhatsApp Evolution
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<LeadProspectado | null>(null);

  // Estado para Diagnóstico Profundo
  const [selectedLeadForDiagnostico, setSelectedLeadForDiagnostico] = useState<LeadProspectado | null>(null);

  const [filters, setFilters] = useState<Filters>({
    classificacao: '',
    status: '',
    cidade: '',
    tipoNegocio: '',
    temWhatsapp: null,
    temSite: null,
    nivelMarketing: '',
    search: '',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });

  const [cidades, setCidades] = useState<string[]>([]);

  const fetchLeads = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', pagination.limit.toString());

      if (pesquisaId) {
        params.set('pesquisaId', pesquisaId);
      }
      if (filters.classificacao) {
        params.set('classificacao', filters.classificacao);
      }
      if (filters.status) {
        params.set('status', filters.status);
      }
      if (filters.cidade) {
        params.set('cidade', filters.cidade);
      }
      if (filters.tipoNegocio) {
        params.set('tipoNegocio', filters.tipoNegocio);
      }
      if (filters.temWhatsapp !== null) {
        params.set('temWhatsapp', filters.temWhatsapp.toString());
      }
      if (filters.temSite !== null) {
        params.set('temSite', filters.temSite.toString());
      }
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.nivelMarketing) {
        params.set('nivelMarketing', filters.nivelMarketing);
      }

      const response = await fetch(`/api/leads?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar leads');
      }

      setLeads(data.leads);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        hasMore: data.pagination.hasMore,
      });

      // Extrair cidades únicas para filtro
      if (page === 1 && data.leads.length > 0) {
        const cidadesSet = new Set(data.leads.map((l: LeadProspectado) => l.cidade).filter(Boolean));
        const uniqueCidades = Array.from(cidadesSet) as string[];
        setCidades(uniqueCidades);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit, pesquisaId]);

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

  const handleFilterChange = (key: keyof Filters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      classificacao: '',
      status: '',
      cidade: '',
      tipoNegocio: '',
      temWhatsapp: null,
      temSite: null,
      nivelMarketing: '',
      search: '',
    });
  };

  const hasActiveFilters = filters.classificacao || filters.status || filters.cidade ||
    filters.tipoNegocio || filters.temWhatsapp !== null || filters.temSite !== null ||
    filters.nivelMarketing || filters.search;

  // Handler para abrir modal de análise IA
  const handleAnalisarIA = (lead: LeadProspectado) => {
    setSelectedLeadForIA(lead);
  };

  // Handler para executar análise IA
  const handleExecuteAnaliseIA = async () => {
    if (!selectedLeadForIA) {
      return;
    }

    setAnalyzingLeadId(selectedLeadForIA.id);

    try {
      const response = await fetch(`/api/leads/${selectedLeadForIA.id}/analisar-ia`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar lead');
      }

      // Atualizar o lead na lista com os dados da análise
      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === selectedLeadForIA.id ? data.lead : l
        )
      );

      // Atualizar o lead selecionado para mostrar os resultados no modal
      setSelectedLeadForIA(data.lead);
    } catch (err) {
      console.error('[LeadsList] Erro ao analisar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao analisar lead');
    } finally {
      setAnalyzingLeadId(null);
    }
  };

  // Handler para abrir modal de WhatsApp
  const handleEnviarWhatsApp = (lead: LeadProspectado) => {
    setSelectedLeadForWhatsApp(lead);
  };

  // Handler para quando mensagem é enviada com sucesso
  const handleWhatsAppSuccess = () => {
    if (selectedLeadForWhatsApp) {
      // Atualizar o lead na lista com status CONTATADO
      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === selectedLeadForWhatsApp.id
            ? { ...l, status: 'CONTATADO' as LeadStatus, dataContato: new Date().toISOString() }
            : l
        )
      );
    }
  };

  // Handler para abrir modal de Diagnóstico
  const handleDiagnostico = (lead: LeadProspectado) => {
    setSelectedLeadForDiagnostico(lead);
  };

  return (
    <div className="space-y-4">
      {/* Header com busca e filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, endereço..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-violet-600/20 border-violet-500/30 text-violet-400'
                : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:bg-white/[0.06]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-violet-400" />
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => fetchLeads(1)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-zinc-400 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Classificação */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Classificação</label>
              <select
                value={filters.classificacao}
                onChange={(e) => handleFilterChange('classificacao', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Todas</option>
                {CLASSIFICACOES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Todos</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Cidade</label>
              <select
                value={filters.cidade}
                onChange={(e) => handleFilterChange('cidade', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Todas</option>
                {cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Negócio */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Tipo de Negócio</label>
              <select
                value={filters.tipoNegocio}
                onChange={(e) => handleFilterChange('tipoNegocio', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 [&>option]:bg-zinc-900 [&>option]:text-white [&>optgroup]:bg-zinc-800 [&>optgroup]:text-zinc-400"
              >
                <option value="" className="bg-zinc-900 text-zinc-400">Todos</option>
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
              {filters.tipoNegocio && (
                <span className="text-xs text-violet-400 mt-1 block">
                  {getNichoNome(filters.tipoNegocio)}
                </span>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">WhatsApp</label>
              <select
                value={filters.temWhatsapp === null ? '' : filters.temWhatsapp.toString()}
                onChange={(e) => handleFilterChange('temWhatsapp', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Todos</option>
                <option value="true">Com WhatsApp</option>
                <option value="false">Sem WhatsApp</option>
              </select>
            </div>

            {/* Site */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Site</label>
              <select
                value={filters.temSite === null ? '' : filters.temSite.toString()}
                onChange={(e) => handleFilterChange('temSite', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Todos</option>
                <option value="true">Com Site</option>
                <option value="false">Sem Site</option>
              </select>
            </div>

            {/* Nível de Marketing */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Marketing</label>
              <select
                value={filters.nivelMarketing}
                onChange={(e) => handleFilterChange('nivelMarketing', e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Todos</option>
                {NIVEIS_MARKETING.map((nivel) => (
                  <option key={nivel.value} value={nivel.value}>{nivel.label}</option>
                ))}
              </select>
            </div>

            {/* Limpar */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full px-3 py-2 text-sm text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-zinc-400">
          <Users className="w-4 h-4" />
          <span>{pagination.total} leads encontrados</span>
        </div>
        <span className="text-zinc-500">
          Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit) || 1}
        </span>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => fetchLeads(pagination.page)}
            className="ml-auto text-sm text-red-400 hover:text-red-300"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      )}

      {/* Lista de Leads */}
      {!isLoading && !error && (
        <>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum lead encontrado</h3>
              <p className="text-zinc-400">
                {hasActiveFilters
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Execute uma pesquisa de mercado para começar a prospectar leads.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={onLeadClick}
                  onWhatsApp={handleEnviarWhatsApp}
                  onAnalisarIA={handleAnalisarIA}
                  onDiagnostico={handleDiagnostico}
                  isAnalyzing={analyzingLeadId === lead.id}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchLeads(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-zinc-400 hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>

              <span className="px-4 py-2 text-zinc-400">
                {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
              </span>

              <button
                onClick={() => fetchLeads(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-zinc-400 hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Análise IA */}
      {selectedLeadForIA && (
        <AnaliseIAModal
          lead={selectedLeadForIA}
          isOpen={true}
          onClose={() => setSelectedLeadForIA(null)}
          onAnalyze={handleExecuteAnaliseIA}
          isLoading={analyzingLeadId === selectedLeadForIA.id}
        />
      )}

      {/* Modal de WhatsApp Evolution */}
      {selectedLeadForWhatsApp && (
        <ModalEnviarWhatsApp
          lead={selectedLeadForWhatsApp}
          isOpen={true}
          onClose={() => setSelectedLeadForWhatsApp(null)}
          onSuccess={handleWhatsAppSuccess}
        />
      )}

      {/* Modal de Diagnóstico Profundo */}
      {selectedLeadForDiagnostico && (
        <ModalDiagnostico
          leadId={selectedLeadForDiagnostico.id}
          leadNome={selectedLeadForDiagnostico.nome}
          isOpen={true}
          onClose={() => setSelectedLeadForDiagnostico(null)}
        />
      )}
    </div>
  );
}
