/**
 * @file SuggestionCard.tsx
 * @description Card de sugestão individual
 * @module components/analysis
 */

'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui';

import type { Suggestion, SuggestionSeverity } from '@/types';

interface SuggestionCardProps {
  suggestion: Suggestion & { client?: { id: string; name: string; segment: string } };
  onApply: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

/**
 * Configuração de severidade
 */
const SEVERITY_CONFIG: Record<SuggestionSeverity, {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconColor: string;
}> = {
  urgent: {
    label: 'URGENTE',
    bgColor: 'bg-red-500/5',
    textColor: 'text-red-400',
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-400',
  },
  warning: {
    label: 'ATENÇÃO',
    bgColor: 'bg-amber-500/5',
    textColor: 'text-amber-400',
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-400',
  },
  info: {
    label: 'SUGESTÃO',
    bgColor: 'bg-blue-500/5',
    textColor: 'text-blue-400',
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-400',
  },
};

/**
 * Ícone por severidade
 */
function SeverityIcon({ severity }: { severity: SuggestionSeverity }) {
  const config = SEVERITY_CONFIG[severity];

  if (severity === 'urgent') {
    return (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  if (severity === 'warning') {
    return (
      <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }

  return (
    <svg className={`w-5 h-5 ${config.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

/**
 * Card de sugestão
 */
export function SuggestionCard({ suggestion, onApply, onDismiss }: SuggestionCardProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[suggestion.severity];

  const handleApply = useCallback(async () => {
    setLoading(true);
    try {
      await onApply(suggestion.id);
    } finally {
      setLoading(false);
    }
  }, [suggestion.id, onApply]);

  const handleDismiss = useCallback(async () => {
    setLoading(true);
    try {
      await onDismiss(suggestion.id);
    } finally {
      setLoading(false);
    }
  }, [suggestion.id, onDismiss]);

  return (
    <div className={`rounded-xl ${config.bgColor} border-l-2 ${config.borderColor} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-white/[0.05]">
            <SeverityIcon severity={suggestion.severity} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-white">{suggestion.title}</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-white/[0.05] ${config.textColor}`}>
                {config.label}
              </span>
            </div>

            {suggestion.client && (
              <p className="text-xs text-zinc-500 mb-2">{suggestion.client.name}</p>
            )}

            <p className="text-sm text-zinc-400">{suggestion.description}</p>

            {suggestion.actions && suggestion.actions.length > 0 && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-3 text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  {expanded ? 'Ocultar ações' : 'Ver ações recomendadas'}
                  <svg
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expanded && (
                  <ul className="mt-3 space-y-2">
                    {suggestion.actions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-zinc-400">
                        <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                        </svg>
                        {action}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/[0.05]">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDismiss}
            disabled={loading}
          >
            Ignorar
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            loading={loading}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
