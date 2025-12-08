/**
 * @file ModalConectarWhatsApp.tsx
 * @description Modal para conexão do WhatsApp via QR Code usando N8N
 * @module components/whatsapp-evolution
 *
 * Implementa padrão anti-flickering com refs para evitar
 * problemas de estado entre renders e polling infinito.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Smartphone,
  QrCode,
} from 'lucide-react';

// Usar API routes em vez de chamar services diretamente
// para garantir que os dados são salvos no banco

interface ModalConectarWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (instanceName: string) => void;
  userId?: string;
}

type ConnectionStatus = 'loading' | 'qrcode' | 'connected' | 'error' | 'timeout';

// Configurações de polling
const POLLING_INTERVAL = 2000; // 2 segundos
const MAX_POLLING_ATTEMPTS = 30; // 60 segundos total

export function ModalConectarWhatsApp({
  isOpen,
  onClose,
  onConnected,
  userId: _userId,
}: ModalConectarWhatsAppProps) {
  // Estado de UI
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  // Refs para controle anti-flickering
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isTerminalStateRef = useRef(false);
  const attemptCountRef = useRef(0);
  const currentInstanceRef = useRef<string | null>(null);

  /**
   * Limpa o polling e reseta os refs
   */
  const cleanupPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * Reseta todos os estados para uma nova conexão
   */
  const resetState = useCallback(() => {
    cleanupPolling();
    isTerminalStateRef.current = false;
    attemptCountRef.current = 0;
    setQrcode(null);
    setError(null);
  }, [cleanupPolling]);

  /**
   * Verifica status via API route (que atualiza o banco automaticamente)
   */
  const verificarStatusAPI = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/whatsapp-evolution/status');
      const data = await response.json();
      return data.connected === true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Inicia o polling para verificar conexão via API
   */
  const iniciarPolling = useCallback((nome: string) => {
    attemptCountRef.current = 0;
    currentInstanceRef.current = nome;

    pollingRef.current = setInterval(async () => {
      // Verificar estado terminal antes de qualquer ação
      if (isTerminalStateRef.current) {
        cleanupPolling();
        return;
      }

      attemptCountRef.current++;

      // Timeout após máximo de tentativas
      if (attemptCountRef.current >= MAX_POLLING_ATTEMPTS) {
        isTerminalStateRef.current = true;
        cleanupPolling();
        setStatus('timeout');
        setError('Tempo limite excedido. Tente novamente.');
        return;
      }

      try {
        // Usar API route que atualiza o banco automaticamente
        const conectado = await verificarStatusAPI();

        if (conectado && !isTerminalStateRef.current) {
          // CRÍTICO: Marcar estado terminal ANTES de setState
          isTerminalStateRef.current = true;
          cleanupPolling();
          setStatus('connected');
          onConnected(nome);
        }
      } catch (err) {
        console.error('[ModalConectarWhatsApp] Erro no polling:', err);
        // Não falhar no polling, continuar tentando
      }
    }, POLLING_INTERVAL);
  }, [cleanupPolling, onConnected, verificarStatusAPI]);

  /**
   * Inicia processo de conexão via API route (salva no banco)
   */
  const iniciarConexao = useCallback(async () => {
    try {
      resetState();
      setStatus('loading');

      // Criar instância via API route (que salva no banco de dados)
      const response = await fetch('/api/whatsapp-evolution/instancia', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao criar instância');
      }

      const result = await response.json();

      if (!result.success && !result.qrcode) {
        throw new Error('Falha ao criar instância');
      }

      const nome = result.instanceName || result.instancia?.instanceName;
      setInstanceName(nome);

      if (result.qrcode) {
        setQrcode(result.qrcode);
        setStatus('qrcode');
        iniciarPolling(nome);
      } else {
        throw new Error('QR Code não gerado');
      }
    } catch (err) {
      console.error('[ModalConectarWhatsApp] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar QR Code');
      setStatus('error');
    }
  }, [resetState, iniciarPolling]);

  // Inicia conexão quando modal abre
  useEffect(() => {
    if (isOpen) {
      iniciarConexao();
    } else {
      // Cleanup quando fecha
      resetState();
    }
  }, [isOpen, iniciarConexao, resetState]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      cleanupPolling();
    };
  }, [cleanupPolling]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md backdrop-blur-xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Conectar WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Gerando QR Code...</p>
            </div>
          )}

          {/* QR Code */}
          {status === 'qrcode' && qrcode && (
            <div className="text-center">
              <p className="text-zinc-300 mb-4">
                Escaneie o QR Code com seu WhatsApp
              </p>

              <div className="relative inline-block">
                <div className="p-4 bg-white rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrcode}
                    alt="QR Code WhatsApp"
                    className="w-56 h-56"
                  />
                </div>
                <div className="absolute -top-2 -right-2 p-1.5 bg-emerald-500 rounded-full">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-zinc-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  Aguardando conexão... ({attemptCountRef.current}/{MAX_POLLING_ATTEMPTS})
                </span>
              </div>

              <button
                onClick={iniciarConexao}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar novo QR Code
              </button>
            </div>
          )}

          {/* Connected */}
          {status === 'connected' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Conectado!</h3>
              <p className="text-zinc-400 mb-6">
                Seu WhatsApp foi conectado com sucesso.
              </p>
              {instanceName && (
                <p className="text-xs text-zinc-500 mb-4">
                  Instância: {instanceName}
                </p>
              )}
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Timeout */}
          {status === 'timeout' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Tempo Esgotado</h3>
              <p className="text-zinc-400 mb-6">
                O QR Code expirou. Gere um novo para continuar.
              </p>
              <button
                onClick={iniciarConexao}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-colors"
              >
                Gerar novo QR Code
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Erro</h3>
              <p className="text-zinc-400 mb-6">{error}</p>
              <button
                onClick={iniciarConexao}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
