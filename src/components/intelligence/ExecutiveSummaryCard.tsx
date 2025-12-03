/**
 * @file ExecutiveSummaryCard.tsx
 * @description Card de resumo executivo do cliente
 * @module components/intelligence
 */

'use client';

import { useState } from 'react';

import { GlassCard, Icon } from '@/components/ui';

interface ExecutiveSummaryCardProps {
  /** Texto do resumo executivo */
  summary: string | null;
  /** Data da última atualização */
  lastUpdated?: string;
}

/**
 * Card que exibe o resumo executivo do cliente
 */
export function ExecutiveSummaryCard({
  summary,
  lastUpdated,
}: ExecutiveSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!summary) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 text-zinc-400">
          <Icon name="file-text" size="md" />
          <p className="text-sm">Nenhum resumo executivo disponível</p>
        </div>
      </GlassCard>
    );
  }

  // Divide o resumo em parágrafos
  const paragraphs = summary.split('\n').filter((p) => p.trim());
  const previewLength = 2;
  const hasMore = paragraphs.length > previewLength;

  const displayedParagraphs = expanded
    ? paragraphs
    : paragraphs.slice(0, previewLength);

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Icon name="file-text" size="md" className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Resumo Executivo
            </h3>
            {lastUpdated && (
              <p className="text-xs text-zinc-500">
                Atualizado em{' '}
                {new Date(lastUpdated).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-invert prose-sm max-w-none">
        {displayedParagraphs.map((paragraph, index) => (
          <p
            key={index}
            className="text-zinc-300 leading-relaxed mb-3 last:mb-0"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Expand/Collapse */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size="sm"
          />
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </GlassCard>
  );
}
