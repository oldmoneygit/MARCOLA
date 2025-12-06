/**
 * @file ClientSelector.tsx
 * @description Card de seleção de cliente quando há múltiplos resultados
 * @module components/assistant/cards
 */

'use client';

import { User, Building, X } from 'lucide-react';

import type { ClientSelectData } from '@/lib/assistant/types';

interface ClientSelectorProps {
  data: ClientSelectData;
  onSelect: (clientId: string) => void;
  onCancel: () => void;
}

/**
 * Card de seleção de cliente (desambiguação)
 */
export function ClientSelector({
  data,
  onSelect,
  onCancel
}: ClientSelectorProps) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
      <h3 className="font-semibold text-yellow-400 flex items-center gap-2 mb-2">
        <User className="w-5 h-5" />
        Qual cliente você quis dizer?
      </h3>

      <p className="text-sm text-zinc-400 mb-4">
        Encontrei {data.candidates.length} clientes com &quot;{data.query}&quot;:
      </p>

      <div className="space-y-2 mb-4">
        {data.candidates.map((client) => (
          <button
            key={client.id}
            onClick={() => onSelect(client.id)}
            className="w-full p-3 bg-zinc-800 border border-white/10 rounded-lg hover:border-yellow-500/50 hover:bg-zinc-800/80 text-left flex items-center gap-3 transition-all group"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
              <User className="w-5 h-5 text-zinc-400 group-hover:text-yellow-400" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-200 truncate">
                {client.name}
              </p>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                {client.contactName && (
                  <span className="truncate">{client.contactName}</span>
                )}
                {client.contactName && client.niche && (
                  <span>•</span>
                )}
                {client.niche && (
                  <span className="flex items-center gap-1 truncate">
                    <Building className="w-3 h-3" />
                    {client.niche}
                  </span>
                )}
              </div>
            </div>

            {/* Indicador de seleção */}
            <div className="w-6 h-6 rounded-full border-2 border-zinc-600 group-hover:border-yellow-500 group-hover:bg-yellow-500/20 transition-colors" />
          </button>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="w-full py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2"
      >
        <X className="w-4 h-4" />
        Cancelar
      </button>
    </div>
  );
}
