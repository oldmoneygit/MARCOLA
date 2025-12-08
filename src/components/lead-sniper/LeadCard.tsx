/**
 * @file LeadCard.tsx
 * @description Card para exibição de um lead prospectado
 * @module components/lead-sniper
 */

'use client';

import {
  Phone,
  Globe,
  MapPin,
  Star,
  MessageCircle,
  ExternalLink,
  TrendingUp,
  Megaphone,
  BarChart3,
  Sparkles,
  Brain,
  Stethoscope,
} from 'lucide-react';

import type { LeadProspectado } from '@/types/lead-sniper';

interface LeadCardProps {
  lead: LeadProspectado;
  onClick?: (lead: LeadProspectado) => void;
  onWhatsApp?: (lead: LeadProspectado) => void;
  onAnalisarIA?: (lead: LeadProspectado) => void;
  onDiagnostico?: (lead: LeadProspectado) => void;
  isAnalyzing?: boolean;
}

const CLASSIFICACAO_CONFIG = {
  HOT: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'HOT',
  },
  WARM: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'WARM',
  },
  COOL: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    label: 'COOL',
  },
  COLD: {
    bg: 'bg-zinc-500/20',
    border: 'border-zinc-500/30',
    text: 'text-zinc-400',
    label: 'COLD',
  },
};

const STATUS_CONFIG = {
  NOVO: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  CONTATADO: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  RESPONDEU: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  INTERESSADO: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  FECHADO: { bg: 'bg-green-500/20', text: 'text-green-400' },
  PERDIDO: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

const MARKETING_CONFIG = {
  NAO_VERIFICADO: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400', label: 'Não verificado' },
  NENHUM: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', label: 'Sem marketing' },
  BASICO: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', label: 'Marketing básico' },
  AVANCADO: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Marketing avançado' },
  SEM_SITE: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'Sem site' },
};

export function LeadCard({ lead, onClick, onWhatsApp, onAnalisarIA, onDiagnostico, isAnalyzing }: LeadCardProps) {
  const classConfig = CLASSIFICACAO_CONFIG[lead.classificacao];
  const statusConfig = STATUS_CONFIG[lead.status];
  const marketingConfig = MARKETING_CONFIG[lead.nivelMarketingDigital || 'NAO_VERIFICADO'];

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWhatsApp) {
      onWhatsApp(lead);
    } else if (lead.linkWhatsapp) {
      window.open(lead.linkWhatsapp, '_blank');
    }
  };

  const handleAnalisarIAClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAnalisarIA && !isAnalyzing) {
      onAnalisarIA(lead);
    }
  };

  const handleDiagnosticoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDiagnostico) {
      onDiagnostico(lead);
    }
  };

  return (
    <div
      onClick={() => onClick?.(lead)}
      className={`
        backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4
        hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{lead.nome}</h3>
          {lead.cidade && (
            <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {lead.cidade}{lead.estado ? `, ${lead.estado}` : ''}
            </p>
          )}
        </div>

        {/* Classificação Badge */}
        <div className={`px-2 py-1 rounded-lg ${classConfig.bg} ${classConfig.border} border`}>
          <span className={`text-xs font-bold ${classConfig.text}`}>
            {classConfig.label}
          </span>
        </div>
      </div>

      {/* Score e Status */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg">
          <TrendingUp className="w-3 h-3 text-violet-400" />
          <span className="text-xs text-zinc-300">Score: {lead.score}</span>
        </div>

        {/* Score IA */}
        {lead.scoreFinal !== undefined && (
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 rounded-lg">
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span className="text-xs text-violet-300">IA: {lead.scoreFinal}</span>
          </div>
        )}

        <div className={`px-2 py-1 rounded-lg ${statusConfig.bg}`}>
          <span className={`text-xs ${statusConfig.text}`}>{lead.status}</span>
        </div>

        {lead.rating && (
          <div className="flex items-center gap-1 px-2 py-1 bg-white/[0.05] rounded-lg">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs text-zinc-300">{lead.rating}</span>
            {lead.totalReviews > 0 && (
              <span className="text-xs text-zinc-500">({lead.totalReviews})</span>
            )}
          </div>
        )}
      </div>

      {/* Indicadores */}
      <div className="flex flex-wrap gap-2 mb-3">
        {lead.temWhatsapp && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
            <MessageCircle className="w-3 h-3" />
            WhatsApp
          </span>
        )}
        {lead.temTelefone && !lead.temWhatsapp && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
            <Phone className="w-3 h-3" />
            Telefone
          </span>
        )}
        {!lead.temSite && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
            <Globe className="w-3 h-3" />
            Sem Site
          </span>
        )}
        {lead.temSite && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-500/10 border border-zinc-500/20 rounded-lg text-xs text-zinc-400">
            <Globe className="w-3 h-3" />
            Com Site
          </span>
        )}

        {/* Indicadores de Ads */}
        {lead.adsVerificado && (
          <>
            {lead.fazGoogleAds && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                <Megaphone className="w-3 h-3" />
                Google Ads
              </span>
            )}
            {lead.fazFacebookAds && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
                <Megaphone className="w-3 h-3" />
                Meta Ads
              </span>
            )}
            {lead.usaGoogleAnalytics && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400">
                <BarChart3 className="w-3 h-3" />
                GA
              </span>
            )}
          </>
        )}

        {/* Nível de Marketing */}
        {lead.temSite && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 ${marketingConfig.bg} border ${marketingConfig.border} rounded-lg text-xs ${marketingConfig.text}`}>
            <BarChart3 className="w-3 h-3" />
            {marketingConfig.label}
          </span>
        )}
      </div>

      {/* Oportunidades */}
      {lead.oportunidades && lead.oportunidades.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-zinc-500 mb-1">Oportunidades:</p>
          <div className="flex flex-wrap gap-1">
            {lead.oportunidades.slice(0, 3).map((op, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300"
              >
                {op}
              </span>
            ))}
            {lead.oportunidades.length > 3 && (
              <span className="text-xs text-zinc-500">
                +{lead.oportunidades.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
        {/* Botão Diagnóstico Profundo - RECOMENDADO */}
        {onDiagnostico && (
          <button
            onClick={handleDiagnosticoClick}
            className="group relative flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm transition-colors"
            title="Diagnóstico Completo: Análise profunda com IA incluindo pontos fortes/fracos, estratégias, mensagens prontas e abordagem comercial"
          >
            <Stethoscope className="w-4 h-4" />
            <span className="hidden sm:inline">Diagnóstico</span>
            {/* Badge Recomendado */}
            <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[10px] bg-cyan-500 text-white rounded-full font-medium">
              IA
            </span>
          </button>
        )}

        {/* Botão Análise Rápida (Legado) - Mostrar apenas se já foi analisado */}
        {onAnalisarIA && lead.googlePlaceId && lead.analisadoIAEm && (
          <button
            onClick={handleAnalisarIAClick}
            disabled={isAnalyzing}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Ver análise rápida anterior (use Diagnóstico para análise completa)"
          >
            {isAnalyzing ? (
              <>
                <Brain className="w-4 h-4 animate-pulse" />
                <span className="hidden sm:inline">...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Análise</span>
              </>
            )}
          </button>
        )}

        {lead.temWhatsapp && lead.linkWhatsapp && (
          <button
            onClick={handleWhatsAppClick}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm transition-colors"
            title="Enviar mensagem via WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        )}

        {lead.telefone && (
          <a
            href={`tel:${lead.telefone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors"
            title={`Ligar para ${lead.telefone}`}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}

        {lead.googleMapsUrl && (
          <a
            href={lead.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] rounded-lg text-zinc-400 text-sm transition-colors"
            title="Ver no Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
