/**
 * @file GenericConfirmation.tsx
 * @description Card de confirmação genérico para ações sem tipo específico
 * @module components/assistant/cards
 */

'use client';

import { AlertCircle, Check, X, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { GenericConfirmationData } from '@/lib/assistant/types';

interface GenericConfirmationProps {
  data: GenericConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

/**
 * Formata valor para exibição legível
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Formata nome do campo para exibição
 */
function formatFieldName(key: string): string {
  // Converte camelCase/snake_case para texto legível
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Card de confirmação genérico
 */
export function GenericConfirmation({
  data,
  onConfirm,
  onCancel,
  isExecuting = false
}: GenericConfirmationProps) {
  const details = data.details || {};
  const detailEntries = Object.entries(details).filter(
    ([key]) => !['toolName', 'type'].includes(key)
  );

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-amber-400 flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5" />
        {data.title || 'Confirmar Ação'}
      </h3>

      {data.description && (
        <p className="text-zinc-300 mb-4">{data.description}</p>
      )}

      {/* Detalhes da ação */}
      {detailEntries.length > 0 && (
        <div className="bg-zinc-800/50 rounded-lg p-3 mb-4 space-y-2">
          {detailEntries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start">
              <span className="text-zinc-400 text-sm">{formatFieldName(key)}:</span>
              <span className="text-zinc-200 text-sm text-right max-w-[60%] break-words">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className={cn(
            'flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
            isExecuting
              ? 'bg-green-500/50 text-green-200 cursor-wait'
              : 'bg-green-500 text-white hover:bg-green-600'
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Confirmar
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
