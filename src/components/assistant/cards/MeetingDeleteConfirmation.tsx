/**
 * @file MeetingDeleteConfirmation.tsx
 * @description Card de confirmação para exclusão de reunião
 * @module components/assistant/cards
 */

'use client';

import { Calendar, Clock, User, MapPin, Trash2, X, Loader2, AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MeetingDeleteConfirmationData } from '@/lib/assistant/types';

interface MeetingDeleteConfirmationProps {
  data: MeetingDeleteConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

/**
 * Formata data para exibição em português
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Card de confirmação de exclusão de reunião
 */
export function MeetingDeleteConfirmation({
  data,
  onConfirm,
  onCancel,
  isExecuting = false
}: MeetingDeleteConfirmationProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5" />
        Excluir Reunião
      </h3>

      <p className="text-sm text-zinc-400 mb-3">
        Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
      </p>

      <div className="space-y-2 mb-4 bg-zinc-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="w-4 h-4 text-zinc-500" />
          <span className="font-medium">{data.clientName}</span>
          {data.contactName && (
            <span className="text-zinc-500">({data.contactName})</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span>{formatDate(data.date)}</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-300">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span>{data.time}</span>
        </div>

        {data.type && (
          <div className="flex items-center gap-2 text-zinc-300">
            <MapPin className="w-4 h-4 text-zinc-500" />
            <span className="capitalize">{data.type}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className={cn(
            'flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
            isExecuting
              ? 'bg-red-500/50 text-red-200 cursor-wait'
              : 'bg-red-500 text-white hover:bg-red-600'
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Excluindo...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Excluir Reunião
            </>
          )}
        </button>

        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
