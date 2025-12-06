/**
 * @file ReminderConfirmation.tsx
 * @description Card de confirmação para criação de lembrete
 * @module components/assistant/cards
 */

'use client';

import { useState } from 'react';
import { Bell, Calendar, Clock, User, Check, X, Edit3, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ReminderConfirmationData } from '@/lib/assistant/types';

interface ReminderConfirmationProps {
  data: ReminderConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: ReminderConfirmationData) => void;
  isExecuting?: boolean;
  showActions?: boolean;
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
 * Card de confirmação de lembrete
 */
export function ReminderConfirmation({
  data,
  onConfirm,
  onCancel,
  onEdit,
  isExecuting = false,
  showActions = true
}: ReminderConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  // Modo de edição
  if (isEditing) {
    return (
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-cyan-400 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Editar Lembrete
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-zinc-400">Mensagem</label>
            <textarea
              value={editData.message}
              onChange={(e) => setEditData({ ...editData, message: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400">Data</label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Horário (opcional)</label>
              <input
                type="time"
                value={editData.time || ''}
                onChange={(e) => setEditData({ ...editData, time: e.target.value || undefined })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onEdit?.(editData);
              setIsEditing(false);
            }}
            className="flex-1 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
          >
            Salvar
          </button>
          <button
            onClick={() => {
              setEditData(data);
              setIsEditing(false);
            }}
            className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Modo de visualização
  return (
    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-cyan-400 flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5" />
        Confirmar Lembrete
      </h3>

      <div className="space-y-2 mb-4">
        <p className="font-medium text-zinc-200">{data.message}</p>

        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span>{formatDate(data.date)}</span>
        </div>

        {data.time && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span>{data.time}</span>
          </div>
        )}

        {data.clientName && (
          <div className="flex items-center gap-2 text-zinc-300">
            <User className="w-4 h-4 text-zinc-500" />
            <span>Relacionado a: {data.clientName}</span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={cn(
              'flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
              isExecuting
                ? 'bg-cyan-500/50 text-cyan-200 cursor-wait'
                : 'bg-cyan-500 text-white hover:bg-cyan-600'
            )}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Criar
              </>
            )}
          </button>

          <button
            onClick={() => setIsEditing(true)}
            disabled={isExecuting}
            className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Edit3 className="w-4 h-4" />
            Editar
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
      )}
    </div>
  );
}
