/**
 * @file MeetingUpdateConfirmation.tsx
 * @description Card de confirmação para atualização/remarcação de reunião
 * @module components/assistant/cards
 */

'use client';

import { useState } from 'react';
import { Calendar, Clock, User, MapPin, Check, X, Edit3, Loader2, ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MeetingUpdateConfirmationData } from '@/lib/assistant/types';

interface MeetingUpdateConfirmationProps {
  data: MeetingUpdateConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: MeetingUpdateConfirmationData) => void;
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
 * Card de confirmação de atualização de reunião
 */
export function MeetingUpdateConfirmation({
  data,
  onConfirm,
  onCancel,
  onEdit,
  isExecuting = false
}: MeetingUpdateConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const hasDateChange = data.newDate && data.newDate !== data.currentDate;
  const hasTimeChange = data.newTime && data.newTime !== data.currentTime;
  const hasTypeChange = data.newType && data.newType !== data.type;

  // Modo de edição
  if (isEditing) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-amber-400 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Editar Remarcação
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-zinc-400">Nova Data</label>
            <input
              type="date"
              value={editData.newDate || editData.currentDate}
              onChange={(e) => setEditData({ ...editData, newDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Novo Horário</label>
            <input
              type="time"
              value={editData.newTime || editData.currentTime}
              onChange={(e) => setEditData({ ...editData, newTime: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Tipo</label>
            <select
              value={editData.newType || editData.type || ''}
              onChange={(e) => setEditData({ ...editData, newType: e.target.value as 'online' | 'presencial' })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Manter atual</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onEdit?.(editData);
              setIsEditing(false);
            }}
            className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
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
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-amber-400 flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5" />
        Remarcar Reunião
      </h3>

      <div className="space-y-3 mb-4">
        {/* Cliente */}
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="w-4 h-4 text-zinc-500" />
          <span className="font-medium">{data.clientName}</span>
          {data.contactName && (
            <span className="text-zinc-500">({data.contactName})</span>
          )}
        </div>

        {/* Data - mostrar mudança se houver */}
        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="w-4 h-4 text-zinc-500" />
          {hasDateChange && data.newDate ? (
            <div className="flex items-center gap-2">
              <span className="line-through text-zinc-500">{formatDate(data.currentDate)}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium">{formatDate(data.newDate)}</span>
            </div>
          ) : (
            <span>{formatDate(data.currentDate)}</span>
          )}
        </div>

        {/* Horário - mostrar mudança se houver */}
        <div className="flex items-center gap-2 text-zinc-300">
          <Clock className="w-4 h-4 text-zinc-500" />
          {hasTimeChange ? (
            <div className="flex items-center gap-2">
              <span className="line-through text-zinc-500">{data.currentTime}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium">{data.newTime}</span>
            </div>
          ) : (
            <span>{data.currentTime}</span>
          )}
        </div>

        {/* Tipo - mostrar mudança se houver */}
        {(data.type || data.newType) && (
          <div className="flex items-center gap-2 text-zinc-300">
            <MapPin className="w-4 h-4 text-zinc-500" />
            {hasTypeChange ? (
              <div className="flex items-center gap-2">
                <span className="line-through text-zinc-500 capitalize">{data.type}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-medium capitalize">{data.newType}</span>
              </div>
            ) : (
              <span className="capitalize">{data.type}</span>
            )}
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
              ? 'bg-amber-500/50 text-amber-200 cursor-wait'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          )}
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Remarcando...
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
    </div>
  );
}
