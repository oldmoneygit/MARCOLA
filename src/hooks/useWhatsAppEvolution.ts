/**
 * @file useWhatsAppEvolution.ts
 * @description Hook para gerenciar conexão WhatsApp via Evolution API
 * @module hooks
 *
 * Este hook provê verificação automática e persistente do status do WhatsApp,
 * garantindo que o usuário esteja sempre pronto para enviar mensagens automáticas.
 *
 * @example
 * const { isConnected, isReady, status, refresh } = useWhatsAppEvolution();
 * if (isReady) {
 *   // Pode enviar mensagens
 * }
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type WhatsAppEvolutionStatus =
  | 'checking'      // Verificando status
  | 'connected'     // Conectado e pronto
  | 'disconnected'  // Desconectado, precisa reconectar
  | 'no_instance'   // Sem instância criada
  | 'error';        // Erro na verificação

export interface WhatsAppEvolutionState {
  status: WhatsAppEvolutionStatus;
  isConnected: boolean;
  isReady: boolean;
  instanceName: string | null;
  lastCheck: Date | null;
  error: string | null;
}

interface UseWhatsAppEvolutionOptions {
  /** Intervalo de heartbeat em ms (default: 60000 = 1 minuto) */
  heartbeatInterval?: number;
  /** Verificar automaticamente ao montar (default: true) */
  autoCheck?: boolean;
  /** Ativar heartbeat automático (default: true) */
  enableHeartbeat?: boolean;
  /** Callback quando status muda */
  onStatusChange?: (status: WhatsAppEvolutionStatus) => void;
  /** Callback quando conecta */
  onConnect?: (instanceName: string) => void;
  /** Callback quando desconecta */
  onDisconnect?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const DEFAULT_HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutos (menos agressivo)
const MIN_HEARTBEAT_INTERVAL = 30 * 1000; // 30 segundos mínimo

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * Hook para gerenciar status de conexão do WhatsApp Evolution
 * Verifica automaticamente a conexão e mantém o estado sincronizado
 */
export function useWhatsAppEvolution(options: UseWhatsAppEvolutionOptions = {}) {
  const {
    heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
    autoCheck = true,
    enableHeartbeat = true,
    onStatusChange,
    onConnect,
    onDisconnect,
  } = options;

  // Estado principal
  const [state, setState] = useState<WhatsAppEvolutionState>({
    status: 'checking',
    isConnected: false,
    isReady: false,
    instanceName: null,
    lastCheck: null,
    error: null,
  });

  // Refs para controle
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<WhatsAppEvolutionStatus | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Verifica o status atual do WhatsApp
   */
  const checkStatus = useCallback(async (): Promise<WhatsAppEvolutionState> => {
    try {
      console.log('[useWhatsAppEvolution] Verificando status...');

      const response = await fetch('/api/whatsapp-evolution/status');
      const data = await response.json();

      console.log('[useWhatsAppEvolution] Resposta:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar status');
      }

      // Determinar status baseado na resposta
      let newStatus: WhatsAppEvolutionStatus;
      let instanceName: string | null = null;

      if (!data.hasInstance) {
        newStatus = 'no_instance';
      } else if (data.connected) {
        newStatus = 'connected';
        instanceName = data.instanceName || null;
      } else {
        newStatus = 'disconnected';
        instanceName = data.instanceName || null;
      }

      const newState: WhatsAppEvolutionState = {
        status: newStatus,
        isConnected: newStatus === 'connected',
        isReady: newStatus === 'connected',
        instanceName,
        lastCheck: new Date(),
        error: null,
      };

      // Atualizar estado se montado
      if (isMountedRef.current) {
        setState(newState);

        // Callbacks de mudança de status
        if (previousStatusRef.current !== newStatus) {
          onStatusChange?.(newStatus);

          if (newStatus === 'connected' && instanceName) {
            onConnect?.(instanceName);
          } else if (
            previousStatusRef.current === 'connected' &&
            newStatus !== 'connected'
          ) {
            onDisconnect?.();
          }

          previousStatusRef.current = newStatus;
        }
      }

      return newState;
    } catch (err) {
      console.error('[useWhatsAppEvolution] Erro:', err);

      const errorState: WhatsAppEvolutionState = {
        status: 'error',
        isConnected: false,
        isReady: false,
        instanceName: null,
        lastCheck: new Date(),
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };

      if (isMountedRef.current) {
        setState(errorState);
        onStatusChange?.('error');
      }

      return errorState;
    }
  }, [onStatusChange, onConnect, onDisconnect]);

  /**
   * Força uma reconexão (abre modal de QR Code se necessário)
   */
  const reconnect = useCallback(async (): Promise<{
    success: boolean;
    qrcode?: string;
    connected?: boolean;
    error?: string;
  }> => {
    try {
      console.log('[useWhatsAppEvolution] Iniciando reconexão...');

      const response = await fetch('/api/whatsapp-evolution/instancia', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao reconectar');
      }

      // Se já conectado, atualizar estado
      if (data.connected) {
        if (isMountedRef.current) {
          setState({
            status: 'connected',
            isConnected: true,
            isReady: true,
            instanceName: data.instanceName,
            lastCheck: new Date(),
            error: null,
          });
        }
        return { success: true, connected: true };
      }

      // Se retornou QR Code, precisa escanear
      if (data.qrcode) {
        return {
          success: true,
          qrcode: data.qrcode,
          connected: false,
        };
      }

      return { success: false, error: 'Resposta inesperada' };
    } catch (err) {
      console.error('[useWhatsAppEvolution] Erro ao reconectar:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };
    }
  }, []);

  /**
   * Desconecta o WhatsApp
   */
  const disconnect = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[useWhatsAppEvolution] Desconectando...');

      const response = await fetch('/api/whatsapp-evolution/instancia', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao desconectar');
      }

      if (isMountedRef.current) {
        setState({
          status: 'disconnected',
          isConnected: false,
          isReady: false,
          instanceName: state.instanceName,
          lastCheck: new Date(),
          error: null,
        });
        onDisconnect?.();
      }

      return { success: true };
    } catch (err) {
      console.error('[useWhatsAppEvolution] Erro ao desconectar:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };
    }
  }, [state.instanceName, onDisconnect]);

  /**
   * Envia mensagem via WhatsApp Evolution
   */
  const sendMessage = useCallback(async (
    phone: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    // Verificar se está pronto
    if (!state.isReady) {
      return { success: false, error: 'WhatsApp não está conectado' };
    }

    try {
      const response = await fetch('/api/whatsapp-evolution/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      return { success: true, messageId: data.messageId };
    } catch (err) {
      console.error('[useWhatsAppEvolution] Erro ao enviar:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      };
    }
  }, [state.isReady]);

  /**
   * Inicia o heartbeat para verificação periódica
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    const interval = Math.max(heartbeatInterval, MIN_HEARTBEAT_INTERVAL);
    console.log(`[useWhatsAppEvolution] Iniciando heartbeat (${interval}ms)`);

    heartbeatRef.current = setInterval(() => {
      if (isMountedRef.current) {
        checkStatus();
      }
    }, interval);
  }, [heartbeatInterval, checkStatus]);

  /**
   * Para o heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      console.log('[useWhatsAppEvolution] Heartbeat parado');
    }
  }, []);

  // Efeito de inicialização
  useEffect(() => {
    isMountedRef.current = true;

    // Verificar status inicial
    if (autoCheck) {
      checkStatus();
    }

    // Iniciar heartbeat
    if (enableHeartbeat) {
      startHeartbeat();
    }

    return () => {
      isMountedRef.current = false;
      stopHeartbeat();
    };
  }, [autoCheck, enableHeartbeat, checkStatus, startHeartbeat, stopHeartbeat]);

  // Retorno do hook
  return {
    // Estado
    ...state,

    // Ações
    checkStatus,
    reconnect,
    disconnect,
    sendMessage,

    // Controle do heartbeat
    startHeartbeat,
    stopHeartbeat,

    // Alias úteis
    refresh: checkStatus,
  };
}

// ═══════════════════════════════════════════════════════════════
// HOOK SIMPLIFICADO - Apenas status
// ═══════════════════════════════════════════════════════════════

/**
 * Hook simplificado apenas para verificar se WhatsApp está conectado
 * Útil para componentes que só precisam saber o status
 */
export function useWhatsAppConnected() {
  const { isConnected, isReady, status, refresh } = useWhatsAppEvolution({
    enableHeartbeat: false, // Não precisa de heartbeat contínuo
  });

  return {
    isConnected,
    isReady,
    status,
    refresh,
  };
}

export default useWhatsAppEvolution;
