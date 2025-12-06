/**
 * @file ContentSuggestionsGrid.tsx
 * @description Grid de sugestões de conteúdo personalizadas
 * @module components/intelligence
 */

'use client';

import { useState } from 'react';

import { GlassCard, Icon, StatusBadge } from '@/components/ui';

import type { ContentSuggestion, ContentPriority, ContentEffort } from '@/types/intelligence';
import type { ContentType, Platform } from '@/types/calendar';

interface ContentSuggestionsGridProps {
  /** Lista de sugestões de conteúdo */
  suggestions: ContentSuggestion[];
}

/**
 * Configuração de ícones por tipo de conteúdo
 */
const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  post: 'image',
  video: 'video',
  reels: 'film',
  stories: 'smartphone',
  promo: 'tag',
  campaign: 'target',
  event: 'calendar',
  other: 'file',
  meeting: 'users',
};

/**
 * Configuração de cores por prioridade
 */
const PRIORITY_CONFIG: Record<ContentPriority, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  high: { label: 'Alta', variant: 'danger' },
  medium: { label: 'Média', variant: 'warning' },
  low: { label: 'Baixa', variant: 'success' },
};

/**
 * Configuração de esforço
 */
const EFFORT_CONFIG: Record<ContentEffort, { label: string; icon: string }> = {
  quick: { label: 'Rápido', icon: 'zap' },
  medium: { label: 'Médio', icon: 'clock' },
  complex: { label: 'Complexo', icon: 'layers' },
};

/**
 * Configuração de plataformas
 */
const PLATFORM_ICONS: Record<Platform, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'video',
  youtube: 'youtube',
  linkedin: 'linkedin',
  google: 'globe',
};

interface SuggestionCardProps {
  suggestion: ContentSuggestion;
  onSelect?: (suggestion: ContentSuggestion) => void;
}

/**
 * Card individual de sugestão
 */
function SuggestionCard({ suggestion, onSelect }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const priorityConfig = PRIORITY_CONFIG[suggestion.priority];
  const effortConfig = EFFORT_CONFIG[suggestion.estimated_effort];
  const contentIcon = CONTENT_TYPE_ICONS[suggestion.content_type] || 'file';

  return (
    <GlassCard
      className="p-5 hover:border-violet-500/30 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Icon name={contentIcon} size="md" className="text-violet-400" />
          </div>
          <div>
            <h4 className="font-medium text-white line-clamp-2">
              {suggestion.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={priorityConfig.variant} size="sm" label={priorityConfig.label} />
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Icon name={effortConfig.icon} size="xs" />
                {effortConfig.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm text-zinc-400 ${expanded ? '' : 'line-clamp-2'}`}>
        {suggestion.description}
      </p>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4">
          {/* Platforms */}
          {suggestion.platform && suggestion.platform.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Plataformas</p>
              <div className="flex flex-wrap gap-2">
                {suggestion.platform.map((platform) => (
                  <span
                    key={platform}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.05] text-xs text-zinc-300"
                  >
                    <Icon
                      name={PLATFORM_ICONS[platform] || 'globe'}
                      size="xs"
                    />
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Copy */}
          {suggestion.suggested_copy && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Sugestão de texto</p>
              <p className="text-sm text-zinc-300 italic bg-white/[0.03] rounded-lg p-3">
                &ldquo;{suggestion.suggested_copy}&rdquo;
              </p>
            </div>
          )}

          {/* Visual Suggestion */}
          {suggestion.visual_suggestion && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Sugestão visual</p>
              <p className="text-sm text-zinc-400">
                {suggestion.visual_suggestion}
              </p>
            </div>
          )}

          {/* Hashtags */}
          {suggestion.hashtags && suggestion.hashtags.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Hashtags</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Best Time */}
          {suggestion.best_time_to_post && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Icon name="clock" size="sm" />
              <span>Melhor horário: {suggestion.best_time_to_post}</span>
            </div>
          )}

          {/* Reasoning */}
          {suggestion.reasoning && (
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-xs text-violet-400 mb-1 flex items-center gap-1.5">
                <Icon name="lightbulb" size="xs" />
                Por que esta sugestão?
              </p>
              <p className="text-sm text-zinc-300">{suggestion.reasoning}</p>
            </div>
          )}

          {/* Action Button */}
          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(suggestion);
              }}
              className="w-full mt-2 py-2 px-4 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Icon name="plus" size="sm" />
              Adicionar ao Calendário
            </button>
          )}
        </div>
      )}

      {/* Expand indicator */}
      <div className="flex justify-center mt-3">
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size="sm"
          className="text-zinc-500"
        />
      </div>
    </GlassCard>
  );
}

/**
 * Grid de sugestões de conteúdo
 */
export function ContentSuggestionsGrid({
  suggestions,
}: ContentSuggestionsGridProps) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 text-zinc-400">
          <Icon name="lightbulb" size="md" />
          <p className="text-sm">Nenhuma sugestão de conteúdo disponível</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Icon name="lightbulb" size="md" className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Sugestões de Conteúdo
            </h3>
            <p className="text-sm text-zinc-400">
              {suggestions.length} sugestões personalizadas
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
}
