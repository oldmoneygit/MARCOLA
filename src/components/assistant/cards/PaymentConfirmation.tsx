/**
 * @file PaymentConfirmation.tsx
 * @description Card de confirmação para criação de cobrança
 * @module components/assistant/cards
 */

'use client';

import { useState } from 'react';
import { DollarSign, User, Calendar, Check, X, Edit3, Loader2 } from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import type { PaymentConfirmationData } from '@/lib/assistant/types';

interface PaymentConfirmationProps {
  data: PaymentConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: PaymentConfirmationData) => void;
  isExecuting?: boolean;
  showActions?: boolean;
}

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
 * Card de confirmação de cobrança/pagamento
 */
export function PaymentConfirmation({
  data,
  onConfirm,
  onCancel,
  onEdit,
  isExecuting = false,
  showActions = true
}: PaymentConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  // Modo de edição
  if (isEditing) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-amber-400 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Editar Cobrança
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-zinc-400">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Vencimento</label>
            <input
              type="date"
              value={editData.dueDate}
              onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Descrição (opcional)</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
        <DollarSign className="w-5 h-5" />
        Confirmar Cobrança
      </h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="w-4 h-4 text-zinc-500" />
          <span className="font-medium">{data.clientName}</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-300">
          <DollarSign className="w-4 h-4 text-zinc-500" />
          <span className="text-xl font-bold text-amber-400">
            {formatCurrency(data.amount)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span>Vencimento: {formatDate(data.dueDate)}</span>
        </div>

        {data.description && (
          <p className="text-sm text-zinc-400 pl-6">
            {data.description}
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
                ? 'bg-amber-500/50 text-amber-200 cursor-wait'
                : 'bg-amber-500 text-white hover:bg-amber-600'
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
