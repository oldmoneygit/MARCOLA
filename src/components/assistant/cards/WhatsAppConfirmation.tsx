/**
 * @file WhatsAppConfirmation.tsx
 * @description Card de confirmação para envio de mensagem WhatsApp
 * @module components/assistant/cards
 */

'use client';

import { useState } from 'react';
import { MessageSquare, User, Phone, Check, X, Edit3, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { WhatsAppConfirmationData } from '@/lib/assistant/types';

interface WhatsAppConfirmationProps {
  data: WhatsAppConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: WhatsAppConfirmationData) => void;
  isExecuting?: boolean;
  showActions?: boolean;
}

/**
 * Formata número de telefone para exibição
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 13) {
    // Formato: +55 (11) 99999-9999
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 11) {
    // Formato: (11) 99999-9999
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Card de confirmação de WhatsApp
 */
export function WhatsAppConfirmation({
  data,
  onConfirm,
  onCancel,
  onEdit,
  isExecuting = false,
  showActions = true
}: WhatsAppConfirmationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(data.message);

  // Modo de edição
  if (isEditing) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-green-400 flex items-center gap-2">
          <Edit3 className="w-5 h-5" />
          Editar Mensagem
        </h3>

        <div>
          <label className="text-sm text-zinc-400">Mensagem</label>
          <textarea
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={5}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onEdit?.({ ...data, message: editMessage });
              setIsEditing(false);
            }}
            className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Salvar
          </button>
          <button
            onClick={() => {
              setEditMessage(data.message);
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
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-green-400 flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5" />
        Confirmar Mensagem WhatsApp
      </h3>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="w-4 h-4 text-zinc-500" />
          <span className="font-medium">{data.contactName}</span>
          <span className="text-zinc-500">({data.clientName})</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-300">
          <Phone className="w-4 h-4 text-zinc-500" />
          <span>{formatPhone(data.phone)}</span>
        </div>
      </div>

      {/* Preview da mensagem */}
      <div className="bg-zinc-800/50 rounded-lg p-3 mb-4 border border-white/5">
        <p className="text-xs text-zinc-500 mb-1">Mensagem:</p>
        <p className="text-zinc-200 whitespace-pre-wrap text-sm">
          {data.message}
        </p>
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
                Enviando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Enviar
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
