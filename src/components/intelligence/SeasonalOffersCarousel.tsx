/**
 * @file SeasonalOffersCarousel.tsx
 * @description Carrossel de ofertas sazonais com detalhes financeiros
 * @module components/intelligence
 */

'use client';

import { useState } from 'react';

import { GlassCard, Icon, Button } from '@/components/ui';

import type { SeasonalOffer, OfferAngle, BudgetOption, BudgetLevel } from '@/types/intelligence';
import { CREATIVE_ANGLE_LABELS } from '@/types/intelligence';

interface SeasonalOffersCarouselProps {
  /** Lista de ofertas sazonais */
  offers: SeasonalOffer[];
}

/**
 * Formata valor em Real
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Cores por nível de orçamento
 */
const BUDGET_COLORS: Record<BudgetLevel, { bg: string; text: string; border: string }> = {
  minimum: {
    bg: 'bg-zinc-500/20',
    text: 'text-zinc-300',
    border: 'border-zinc-500/40',
  },
  recommended: {
    bg: 'bg-violet-500/20',
    text: 'text-violet-300',
    border: 'border-violet-500/40',
  },
  aggressive: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
  },
};

const BUDGET_LABELS: Record<BudgetLevel, string> = {
  minimum: 'Mínimo',
  recommended: 'Recomendado',
  aggressive: 'Agressivo',
};

/**
 * Card de ângulo criativo
 */
function AngleCard({ angle }: { angle: OfferAngle }) {
  const config = CREATIVE_ANGLE_LABELS[angle.offer_type] || { label: angle.offer_type, emoji: '' };

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/30 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{config.emoji}</span>
        <div>
          <h5 className="font-medium text-white">{angle.angle_name}</h5>
          <span className="text-xs text-violet-400">{config.label}</span>
        </div>
      </div>

      <p className="text-sm text-zinc-400 mb-4">{angle.offer_description}</p>

      {/* Pricing */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-xs text-zinc-500">De</p>
          <p className="text-sm text-zinc-400 line-through">
            {formatCurrency(angle.original_price)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Por</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(angle.offer_price)}
          </p>
        </div>
        {angle.discount_value && (
          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium">
            {angle.discount_value}
          </span>
        )}
      </div>

      {/* Financial Impact */}
      <div className="space-y-2 p-3 rounded-lg bg-white/[0.02]">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Impacto na Margem</span>
          <span className={angle.margin_impact >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {angle.margin_impact}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Break-even</span>
          <span className="text-white">{angle.break_even_sales} vendas</span>
        </div>
      </div>

      {/* Hook */}
      <div className="mt-4 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
        <p className="text-xs text-violet-400 mb-1">Hook de copywriting</p>
        <p className="text-sm text-white italic">&ldquo;{angle.hook}&rdquo;</p>
      </div>
    </div>
  );
}

/**
 * Opções de orçamento
 */
function BudgetOptions({ options }: { options: BudgetOption[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map((option) => {
        const colors = BUDGET_COLORS[option.level];
        return (
          <div
            key={option.level}
            className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${colors.text}`}>
                {BUDGET_LABELS[option.level]}
              </span>
              <span className="text-lg font-bold text-white">
                {formatCurrency(option.budget)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Alcance</span>
                <span className="text-zinc-300">{option.expected_reach}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Leads</span>
                <span className="text-zinc-300">{option.expected_leads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Vendas</span>
                <span className="text-zinc-300">{option.expected_sales}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.08]">
                <span className="text-zinc-500">ROI Estimado</span>
                <span className="text-emerald-400 font-medium">
                  {option.roi_estimate}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Card de oferta sazonal
 */
function OfferCard({ offer }: { offer: SeasonalOffer }) {
  const [activeTab, setActiveTab] = useState<'angles' | 'budget' | 'timeline'>('angles');

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-medium">
              {offer.seasonal_name}
            </span>
            <span className="text-xs text-zinc-500">
              {new Date(offer.seasonal_date).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <h4 className="text-lg font-semibold text-white mb-1">
            {offer.title}
          </h4>
          <p className="text-sm text-zinc-400">{offer.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <span className="text-2xl">
              {offer.relevance_score >= 8 ? '🔥' : offer.relevance_score >= 6 ? '⭐' : '💡'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'angles', label: 'Ângulos Criativos', icon: 'target' },
          { id: 'budget', label: 'Orçamento', icon: 'wallet' },
          { id: 'timeline', label: 'Timeline', icon: 'calendar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Icon name={tab.icon} size="sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeTab === 'angles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offer.offer_angles.map((angle, index) => (
              <AngleCard key={index} angle={angle} />
            ))}
          </div>
        )}

        {activeTab === 'budget' && (
          <BudgetOptions options={offer.budget_options} />
        )}

        {activeTab === 'timeline' && (
          <div className="relative pl-6">
            {[
              { date: offer.timeline.teaser_start, label: 'Início do Teaser', icon: 'megaphone' },
              { date: offer.timeline.promotion_start, label: 'Início da Promoção', icon: 'play' },
              { date: offer.timeline.peak_day, label: 'Dia de Pico', icon: 'trending-up' },
              { date: offer.timeline.promotion_end, label: 'Fim da Promoção', icon: 'flag' },
            ].map((item, index) => (
              <div key={index} className="relative pb-8 last:pb-0">
                {/* Line */}
                {index < 3 && (
                  <div className="absolute left-0 top-6 w-px h-full bg-gradient-to-b from-violet-500 to-transparent" />
                )}
                {/* Dot */}
                <div className="absolute -left-3 w-6 h-6 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center">
                  <Icon name={item.icon} size="xs" className="text-violet-400" />
                </div>
                {/* Content */}
                <div className="ml-6">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(item.date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reasoning */}
      {offer.reasoning && (
        <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
            <Icon name="lightbulb" size="xs" />
            Por que esta oferta?
          </p>
          <p className="text-sm text-zinc-300">{offer.reasoning}</p>
        </div>
      )}
    </GlassCard>
  );
}

/**
 * Carrossel de ofertas sazonais
 */
export function SeasonalOffersCarousel({ offers }: SeasonalOffersCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!offers || offers.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 text-zinc-400">
          <Icon name="calendar" size="md" />
          <p className="text-sm">Nenhuma oferta sazonal disponível</p>
        </div>
      </GlassCard>
    );
  }

  const currentOffer = offers[currentIndex];

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Icon name="gift" size="md" className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Ofertas Sazonais
            </h3>
            <p className="text-sm text-zinc-400">
              {offers.length} ofertas personalizadas
            </p>
          </div>
        </div>

        {offers.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentIndex((prev) => (prev > 0 ? prev - 1 : offers.length - 1))
              }
            >
              <Icon name="chevron-left" size="sm" />
            </Button>
            <span className="text-sm text-zinc-400">
              {currentIndex + 1} / {offers.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentIndex((prev) => (prev < offers.length - 1 ? prev + 1 : 0))
              }
            >
              <Icon name="chevron-right" size="sm" />
            </Button>
          </div>
        )}
      </div>

      {/* Current Offer */}
      {currentOffer && <OfferCard offer={currentOffer} />}

      {/* Dots */}
      {offers.length > 1 && (
        <div className="flex justify-center gap-2">
          {offers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-violet-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
