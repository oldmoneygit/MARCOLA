/**
 * @file MeetingConfirmation.tsx
 * @description Card de confirmação para agendamento de reunião
 * @module components/assistant/cards
 */

'use client';

import { useState } from 'react';
import { Calendar, Clock, User, MapPin, Check, X, Edit3, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MeetingConfirmationData } from '@/lib/assistant/types';

interface MeetingConfirmationProps {
  data: MeetingConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: MeetingConfirmationData) => void;
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
 * Card de confirmação de reunião
 */
export function MeetingConfirmation({
  data,
  onConfirm,
  onCancel,
  onEdit,
  isExecuting = false,
  showActions = true
}: MeetingConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  // Modo de edição
  if (isEditing) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-blue-400 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Editar Reunião
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-zinc-400">Data</label>
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Horário</label>
            <input
              type="time"
              value={editData.time}
              onChange={(e) => setEditData({ ...editData, time: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Tipo</label>
            <select
              value={editData.type || ''}
              onChange={(e) => setEditData({ ...editData, type: e.target.value as 'online' | 'presencial' })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecionar...</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-zinc-400">Notas (opcional)</label>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onEdit?.(editData);
              setIsEditing(false);
            }}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
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
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-blue-400 flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5" />
        Confirmar Reunião
      </h3>

      <div className="space-y-2 mb-4">
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

        {data.notes && (
          <p className="text-sm text-zinc-400 mt-2 pl-6">
            {data.notes}
          </p>
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
                ? 'bg-green-500/50 text-green-200 cursor-wait'
                : 'bg-green-500 text-white hover:bg-green-600'
            )}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar
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
