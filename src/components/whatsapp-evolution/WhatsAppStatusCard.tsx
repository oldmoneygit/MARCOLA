/**
 * @file WhatsAppStatusCard.tsx
 * @description Card para exibir status da conexão WhatsApp
 * @module components/whatsapp-evolution
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Smartphone, Loader2, Unplug, Link2 } from 'lucide-react';

import { ModalConectarWhatsApp } from './ModalConectarWhatsApp';

interface WhatsAppStatusCardProps {
  onStatusChange?: (connected: boolean) => void;
}

export function WhatsAppStatusCard({ onStatusChange }: WhatsAppStatusCardProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp-evolution/status');
      const data = await response.json();
      setConnected(data.connected);
      onStatusChange?.(data.connected);
    } catch (err) {
      setConnected(false);
      onStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp?')) {
      return;
    }

    try {
      setDisconnecting(true);
      await fetch('/api/whatsapp-evolution/instancia', {
        method: 'DELETE',
      });
      setConnected(false);
      onStatusChange?.(false);
    } catch (err) {
      console.error('[WhatsAppStatusCard] Erro ao desconectar:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnected = () => {
    setConnected(true);
    setShowModal(false);
    onStatusChange?.(true);
  };

  if (loading) {
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
                connected ? 'bg-emerald-500/20' : 'bg-zinc-500/20'
              }`}
            >
              <Smartphone
                className={`w-5 h-5 ${connected ? 'text-emerald-400' : 'text-zinc-400'}`}
              />
            </div>

            <div>
              <h3 className="font-medium text-white">WhatsApp</h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-emerald-500' : 'bg-zinc-500'
                  }`}
                />
                <span
                  className={`text-sm ${
                    connected ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  {connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>

          {connected ? (
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

      <ModalConectarWhatsApp
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnected={handleConnected}
      />
    </>
  );
}
