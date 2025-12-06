/**
 * @file TaskConfirmation.tsx
 * @description Card de confirmação para criação de tarefa
 * @module components/assistant/cards
 */

'use client';

import { useState } from 'react';
import { CheckSquare, User, Calendar, Flag, Check, X, Edit3, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { TaskConfirmationData } from '@/lib/assistant/types';

interface TaskConfirmationProps {
  data: TaskConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: TaskConfirmationData) => void;
  isExecuting?: boolean;
  showActions?: boolean;
}

const priorityConfig = {
  low: { label: 'Baixa', color: 'text-green-400 bg-green-500/20' },
  medium: { label: 'Média', color: 'text-yellow-400 bg-yellow-500/20' },
  high: { label: 'Alta', color: 'text-orange-400 bg-orange-500/20' },
  urgent: { label: 'Urgente', color: 'text-red-400 bg-red-500/20' }
};

/**
 * Formata data para exibição em português
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Card de confirmação de tarefa
 */
export function TaskConfirmation({
  data,
  onConfirm,
  onCancel,
  onEdit,
  isExecuting = false,
  showActions = true
}: TaskConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const priority = data.priority || 'medium';
  const priorityInfo = priorityConfig[priority];

  // Modo de edição
  if (isEditing) {
    return (
      <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-violet-400 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Editar Tarefa
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-zinc-400">Título</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Descrição (opcional)</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400">Prazo</label>
              <input
                type="date"
                value={editData.dueDate || ''}
                onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400">Prioridade</label>
              <select
                value={editData.priority || 'medium'}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value as TaskConfirmationData['priority'] })}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onEdit?.(editData);
              setIsEditing(false);
            }}
            className="flex-1 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-medium"
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
    <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-violet-400 flex items-center gap-2 mb-3">
        <CheckSquare className="w-5 h-5" />
        Confirmar Tarefa
      </h3>

      <div className="space-y-2 mb-4">
        <p className="font-medium text-zinc-200 text-lg">{data.title}</p>

        {data.description && (
          <p className="text-zinc-400 text-sm">{data.description}</p>
        )}

        {data.clientName && (
          <div className="flex items-center gap-2 text-zinc-300">
            <User className="w-4 h-4 text-zinc-500" />
            <span>{data.clientName}</span>
          </div>
        )}

        {data.dueDate && (
          <div className="flex items-center gap-2 text-zinc-300">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span>Prazo: {formatDate(data.dueDate)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-zinc-500" />
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            priorityInfo.color
          )}>
            {priorityInfo.label}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={cn(
              'flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
              isExecuting
                ? 'bg-violet-500/50 text-violet-200 cursor-wait'
                : 'bg-violet-500 text-white hover:bg-violet-600'
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
