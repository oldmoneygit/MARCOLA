/**
 * @file useWhatsApp.ts
 * @description Hook para gerenciar envio de mensagens WhatsApp
 * @module hooks
 *
 * @example
 * const { sendMessage, sending, error } = useWhatsApp();
 * await sendMessage({ phone: '11999999999', message: 'Olá!' });
 */

'use client';

import { useState, useCallback } from 'react';

import type {
  MessageTemplateType,
  MessageLog,
  WhatsAppTemplate,
  SendWhatsAppResponse,
} from '@/types/whatsapp';

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface SendMessageParams {
  phone: string;
  message?: string;
  templateType?: MessageTemplateType;
  variables?: Record<string, string>;
  clientId?: string;
}

interface WhatsAppStatus {
  connected: boolean;
  smartphoneConnected?: boolean;
  configured: boolean;
  error?: string | null;
  settings?: {
    auto_payment_reminder: boolean;
    reminder_days_before: number;
    auto_overdue_notification: boolean;
    auto_task_notification: boolean;
    send_start_hour: number;
    send_end_hour: number;
  } | null;
}

interface MessageHistory {
  messages: MessageLog[];
  total: number;
  limit: number;
  offset: number;
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

/**
 * Hook para gerenciar envio de mensagens WhatsApp via Z-API
 */
export function useWhatsApp() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  /**
   * Envia mensagem WhatsApp
   */
  const sendMessage = useCallback(
    async (params: SendMessageParams): Promise<SendWhatsAppResponse> => {
      setSending(true);
      setError(null);
      setLastMessageId(null);

      try {
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao enviar mensagem');
        }

        setLastMessageId(data.messageId);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw err;
      } finally {
        setSending(false);
      }
    },
    []
  );

  /**
   * Verifica status da conexão WhatsApp
   */
  const getStatus = useCallback(async (): Promise<WhatsAppStatus> => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar status');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar status';
      return {
        connected: false,
        configured: false,
        error: errorMessage,
      };
    }
  }, []);

  /**
   * Busca histórico de mensagens
   */
  const getHistory = useCallback(
    async (options?: { clientId?: string; limit?: number; offset?: number; status?: string }): Promise<MessageHistory> => {
      try {
        const params = new URLSearchParams();
        if (options?.clientId) {
          params.set('clientId', options.clientId);
        }
        if (options?.limit) {
          params.set('limit', options.limit.toString());
        }
        if (options?.offset) {
          params.set('offset', options.offset.toString());
        }
        if (options?.status) {
          params.set('status', options.status);
        }

        const url = `/api/whatsapp/history${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar histórico');
        }

        return data;
      } catch (err) {
        console.error('[useWhatsApp] Erro ao buscar histórico:', err);
        return {
          messages: [],
          total: 0,
          limit: 50,
          offset: 0,
        };
      }
    },
    []
  );

  /**
   * Busca templates disponíveis
   */
  const getTemplates = useCallback(async (includePreview = false): Promise<WhatsAppTemplate[]> => {
    try {
      const url = `/api/whatsapp/templates${includePreview ? '?preview=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar templates');
      }

      return data;
    } catch (err) {
      console.error('[useWhatsApp] Erro ao buscar templates:', err);
      return [];
    }
  }, []);

  /**
   * Salva credenciais Z-API
   */
  const saveCredentials = useCallback(
    async (credentials: {
      instanceId: string;
      token: string;
      clientToken?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch('/api/whatsapp/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || 'Erro ao salvar credenciais' };
        }

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar credenciais';
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * Remove credenciais Z-API
   */
  const removeCredentials = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/whatsapp/settings', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erro ao remover credenciais' };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover credenciais';
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Limpa o estado de erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    sending,
    error,
    lastMessageId,

    // Ações
    sendMessage,
    getStatus,
    getHistory,
    getTemplates,
    saveCredentials,
    removeCredentials,
    clearError,
  };
}
