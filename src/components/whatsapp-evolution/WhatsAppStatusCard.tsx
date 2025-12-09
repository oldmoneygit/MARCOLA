/**
 * @file WhatsAppStatusCard.tsx
 * @description Card para exibir status da conexão WhatsApp com verificação automática
 * @module components/whatsapp-evolution
 *
 * @example
 * <WhatsAppStatusCard onStatusChange={(connected) => console.log(connected)} />
 */

'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Loader2, Unplug, Link2, RefreshCw } from 'lucide-react';

import { useWhatsAppEvolution } from '@/hooks/useWhatsAppEvolution';
import { ModalConectarWhatsApp } from './ModalConectarWhatsApp';

interface WhatsAppStatusCardProps {
  onStatusChange?: (connected: boolean) => void;
}

export function WhatsAppStatusCard({ onStatusChange }: WhatsAppStatusCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const {
    status,
    isConnected,
    lastCheck,
    error,
    disconnect,
    refresh,
  } = useWhatsAppEvolution({
    enableHeartbeat: false, // Desabilitado - usuário usa botão refresh manual
    onStatusChange: (newStatus) => {
      onStatusChange?.(newStatus === 'connected');
    },
  });

  // Notificar mudança de conexão
  useEffect(() => {
    onStatusChange?.(isConnected);
  }, [isConnected, onStatusChange]);

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp?')) {
      return;
    }

    try {
      setDisconnecting(true);
      await disconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnected = () => {
    setShowModal(false);
    refresh();
  };

  const isLoading = status === 'checking';

  if (isLoading && !lastCheck) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-full" />
          <div>
            <div className="h-4 bg-zinc-700 rounded w-24 mb-2" />
            <div className="h-3 bg-zinc-700 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isConnected ? 'bg-emerald-500/20' : 'bg-zinc-500/20'
              }`}
            >
              <Smartphone
                className={`w-5 h-5 ${isConnected ? 'text-emerald-400' : 'text-zinc-400'}`}
              />
            </div>

            <div>
              <h3 className="font-medium text-white">WhatsApp</h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'bg-zinc-500'
                  }`}
                />
                <span
                  className={`text-sm ${
                    isConnected
                      ? 'text-emerald-400'
                      : status === 'error'
                      ? 'text-red-400'
                      : 'text-zinc-500'
                  }`}
                >
                  {isConnected
                    ? 'Conectado'
                    : status === 'error'
                    ? 'Erro'
                    : status === 'no_instance'
                    ? 'Não configurado'
                    : 'Desconectado'}
                </span>
                {status === 'checking' && (
                  <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />
                )}
              </div>
              {error && (
                <p className="text-xs text-red-400 mt-1">{error}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de refresh */}
            <button
              onClick={() => refresh()}
              disabled={status === 'checking'}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar status"
            >
              <RefreshCw className={`w-4 h-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
            </button>

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-4 py-2 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unplug className="w-4 h-4" />
                )}
                <span className="text-sm">Desconectar</span>
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <Link2 className="w-4 h-4" />
                <span className="text-sm">Conectar</span>
              </button>
            )}
          </div>
        </div>

        {/* Última verificação */}
        {lastCheck && (
          <p className="text-xs text-zinc-600 mt-3 text-right">
            Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </div>

      <ModalConectarWhatsApp
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnected={handleConnected}
      />
    </>
  );
}
