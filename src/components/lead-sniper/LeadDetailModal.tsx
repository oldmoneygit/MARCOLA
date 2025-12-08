/**
 * @file LeadDetailModal.tsx
 * @description Modal de detalhes do lead com histórico de interações
 * @module components/lead-sniper
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Phone,
  Globe,
  MapPin,
  Star,
  MessageCircle,
  ExternalLink,
  Clock,
  TrendingUp,
  Send,
  Loader2,
  Mail,
  PhoneCall,
  Calendar,
  FileText,
  Megaphone,
  BarChart3,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import type { LeadProspectado, LeadInteracao, LeadStatus } from '@/types/lead-sniper';

interface LeadDetailModalProps {
  lead: LeadProspectado;
  onClose: () => void;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'NOVO', label: 'Novo', color: 'text-violet-400' },
  { value: 'CONTATADO', label: 'Contatado', color: 'text-blue-400' },
  { value: 'RESPONDEU', label: 'Respondeu', color: 'text-emerald-400' },
  { value: 'INTERESSADO', label: 'Interessado', color: 'text-amber-400' },
  { value: 'FECHADO', label: 'Fechado', color: 'text-green-400' },
  { value: 'PERDIDO', label: 'Perdido', color: 'text-red-400' },
];

const INTERACAO_TIPOS = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'LIGACAO', label: 'Ligação', icon: PhoneCall },
  { value: 'REUNIAO', label: 'Reunião', icon: Calendar },
  { value: 'NOTA', label: 'Nota', icon: FileText },
];

export function LeadDetailModal({ lead, onClose, onStatusChange }: LeadDetailModalProps) {
  const [interacoes, setInteracoes] = useState<LeadInteracao[]>([]);
  const [isLoadingInteracoes, setIsLoadingInteracoes] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Estado de marketing digital
  const [adsVerificado, setAdsVerificado] = useState(lead.adsVerificado || false);
  const [isVerificandoAds, setIsVerificandoAds] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [leadData, setLeadData] = useState(lead);

  // Form para nova interação
  const [showNovaInteracao, setShowNovaInteracao] = useState(false);
  const [novaInteracao, setNovaInteracao] = useState({
    tipo: 'NOTA' as string,
    direcao: 'ENVIADO' as string,
    conteudo: '',
  });
  const [isSavingInteracao, setIsSavingInteracao] = useState(false);

  const fetchInteracoes = useCallback(async () => {
    setIsLoadingInteracoes(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/interacoes`);
      const data = await response.json();
      if (response.ok) {
        setInteracoes(data.interacoes);
      }
    } catch (error) {
      console.error('[LeadDetailModal] Erro ao buscar interações:', error);
    } finally {
      setIsLoadingInteracoes(false);
    }
  }, [lead.id]);

  useEffect(() => {
    fetchInteracoes();
  }, [fetchInteracoes]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setCurrentStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(lead.id, newStatus);
        }
      }
    } catch (error) {
      console.error('[LeadDetailModal] Erro ao atualizar status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveInteracao = async () => {
    if (!novaInteracao.conteudo.trim()) {
      return;
    }

    setIsSavingInteracao(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/interacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaInteracao),
      });

      if (response.ok) {
        const data = await response.json();
        setInteracoes([data.interacao, ...interacoes]);
        setNovaInteracao({ tipo: 'NOTA', direcao: 'ENVIADO', conteudo: '' });
        setShowNovaInteracao(false);
      }
    } catch (error) {
      console.error('[LeadDetailModal] Erro ao salvar interação:', error);
    } finally {
      setIsSavingInteracao(false);
    }
  };

  const handleVerificarAds = async () => {
    if (!lead.site) {
      setAdsError('Lead não possui site para verificação');
      return;
    }

    setIsVerificandoAds(true);
    setAdsError(null);

    try {
      const response = await fetch(`/api/leads/${lead.id}/verificar-ads`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na verificação');
      }

      setLeadData(data.lead);
      setAdsVerificado(true);
    } catch (error) {
      setAdsError(error instanceof Error ? error.message : 'Erro ao verificar ads');
    } finally {
      setIsVerificandoAds(false);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden backdrop-blur-xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/[0.08]">
          <div>
            <h2 className="text-xl font-semibold text-white">{lead.nome}</h2>
            {lead.cidade && (
              <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {lead.endereco || `${lead.cidade}, ${lead.estado}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-center">
              <TrendingUp className="w-5 h-5 text-violet-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{lead.score}</p>
              <p className="text-xs text-zinc-500">Score</p>
            </div>
            <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-center">
              <span className={`text-lg font-bold ${
                lead.classificacao === 'HOT' ? 'text-red-400' :
                lead.classificacao === 'WARM' ? 'text-orange-400' :
                lead.classificacao === 'COOL' ? 'text-blue-400' : 'text-zinc-400'
              }`}>
                {lead.classificacao}
              </span>
              <p className="text-xs text-zinc-500 mt-1">Classificação</p>
            </div>
            {lead.rating && (
              <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-bold text-white">{lead.rating}</span>
                </div>
                <p className="text-xs text-zinc-500">{lead.totalReviews} avaliações</p>
              </div>
            )}
            <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-center">
              <p className="text-lg font-bold text-white">P{lead.prioridade}</p>
              <p className="text-xs text-zinc-500">Prioridade</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdatingStatus}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    currentStatus === option.value
                      ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                      : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:bg-white/[0.06]'
                  } border`}
                >
                  {option.label}
                </button>
              ))}
              {isUpdatingStatus && <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />}
            </div>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Contato</h3>
            <div className="flex flex-wrap gap-2">
              {lead.telefone && (
                <a
                  href={`tel:${lead.telefone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {lead.telefone}
                </a>
              )}
              {lead.temWhatsapp && lead.linkWhatsapp && (
                <a
                  href={lead.linkWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              {lead.site && (
                <a
                  href={lead.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] rounded-lg text-zinc-300 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Site
                </a>
              )}
              {lead.googleMapsUrl && (
                <a
                  href={lead.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] rounded-lg text-zinc-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Oportunidades */}
          {lead.oportunidades && lead.oportunidades.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Oportunidades Identificadas</h3>
              <div className="flex flex-wrap gap-2">
                {lead.oportunidades.map((op, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm text-violet-300"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Marketing Digital */}
          {lead.temSite && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-300">Marketing Digital</h3>
                {!adsVerificado && (
                  <button
                    onClick={handleVerificarAds}
                    disabled={isVerificandoAds}
                    className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 disabled:opacity-50"
                  >
                    {isVerificandoAds ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Verificar Ads
                  </button>
                )}
              </div>

              {adsError && (
                <div className="flex items-center gap-2 p-3 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">{adsError}</p>
                </div>
              )}

              {adsVerificado ? (
                <div className="space-y-3">
                  {/* Nível de Marketing */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Nível:</span>
                    <span className={`px-2 py-1 rounded-lg text-sm ${
                      leadData.nivelMarketingDigital === 'AVANCADO'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : leadData.nivelMarketingDigital === 'BASICO'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {leadData.nivelMarketingDigital === 'AVANCADO' ? 'Avançado' :
                       leadData.nivelMarketingDigital === 'BASICO' ? 'Básico' : 'Nenhum'}
                    </span>
                  </div>

                  {/* Indicadores de Ads */}
                  <div className="flex flex-wrap gap-2">
                    {leadData.fazGoogleAds && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                        <Megaphone className="w-4 h-4" />
                        Google Ads
                      </span>
                    )}
                    {leadData.fazFacebookAds && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
                        <Megaphone className="w-4 h-4" />
                        Meta Ads
                      </span>
                    )}
                    {leadData.usaGoogleAnalytics && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-400">
                        <BarChart3 className="w-4 h-4" />
                        Google Analytics
                      </span>
                    )}
                    {leadData.usaGoogleTagManager && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm text-cyan-400">
                        <BarChart3 className="w-4 h-4" />
                        GTM
                      </span>
                    )}
                    {leadData.usaHotjar && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg text-sm text-pink-400">
                        <BarChart3 className="w-4 h-4" />
                        Hotjar
                      </span>
                    )}
                    {leadData.usaRdStation && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-400">
                        <BarChart3 className="w-4 h-4" />
                        RD Station
                      </span>
                    )}
                    {!leadData.fazGoogleAds && !leadData.fazFacebookAds && !leadData.usaGoogleAnalytics && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-zinc-500/10 border border-zinc-500/20 rounded-lg text-sm text-zinc-400">
                        <AlertCircle className="w-4 h-4" />
                        Nenhuma ferramenta detectada
                      </span>
                    )}
                  </div>

                  {/* Data da verificação */}
                  {leadData.adsVerificadoEm && (
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verificado em {formatDate(leadData.adsVerificadoEm)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-zinc-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Clique em &ldquo;Verificar Ads&rdquo; para analisar o site</p>
                </div>
              )}
            </div>
          )}

          {/* Interações */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-300">Histórico de Interações</h3>
              <button
                onClick={() => setShowNovaInteracao(!showNovaInteracao)}
                className="text-sm text-violet-400 hover:text-violet-300"
              >
                {showNovaInteracao ? 'Cancelar' : '+ Nova Interação'}
              </button>
            </div>

            {/* Form Nova Interação */}
            {showNovaInteracao && (
              <div className="mb-4 p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl space-y-3">
                <div className="flex gap-2">
                  {INTERACAO_TIPOS.map((tipo) => (
                    <button
                      key={tipo.value}
                      onClick={() => setNovaInteracao((prev) => ({ ...prev, tipo: tipo.value }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        novaInteracao.tipo === tipo.value
                          ? 'bg-violet-600/30 text-violet-300'
                          : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      <tipo.icon className="w-4 h-4" />
                      {tipo.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={novaInteracao.conteudo}
                  onChange={(e) => setNovaInteracao((prev) => ({ ...prev, conteudo: e.target.value }))}
                  placeholder="Descreva a interação..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveInteracao}
                    disabled={isSavingInteracao || !novaInteracao.conteudo.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {isSavingInteracao ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Interações */}
            {isLoadingInteracoes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : interacoes.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma interação registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interacoes.map((interacao) => {
                  const TipoIcon = INTERACAO_TIPOS.find((t) => t.value === interacao.tipo)?.icon || FileText;
                  return (
                    <div
                      key={interacao.id}
                      className="flex gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-lg"
                    >
                      <div className="p-2 bg-white/[0.05] rounded-lg h-fit">
                        <TipoIcon className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-zinc-300">
                            {INTERACAO_TIPOS.find((t) => t.value === interacao.tipo)?.label}
                          </span>
                          {interacao.direcao && (
                            <span className="text-xs text-zinc-500">
                              ({interacao.direcao === 'ENVIADO' ? 'Enviado' : 'Recebido'})
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">{interacao.conteudo}</p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {formatDate(interacao.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
