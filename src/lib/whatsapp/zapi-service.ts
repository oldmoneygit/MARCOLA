/**
 * @file zapi-service.ts
 * @description Serviço de integração com Z-API para envio de mensagens WhatsApp
 * @module lib/whatsapp
 *
 * @example
 * // Usando singleton com credenciais do .env
 * import { getZAPIService } from '@/lib/whatsapp';
 * const service = await getZAPIService(userId);
 * await service.sendText({ phone: '5511999999999', message: 'Olá!' });
 */

import { createClient } from '@supabase/supabase-js';

import type {
  ZAPIConfig,
  SendTextParams,
  SendTextResponse,
  SendButtonsParams,
  SendImageParams,
  SendDocumentParams,
  SendAudioParams,
  SendAudioBase64Params,
  ZAPIStatus,
  QRCodeResponse,
} from '@/types/whatsapp';

// ═══════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL DO SERVIÇO Z-API
// ═══════════════════════════════════════════════════════════════

/**
 * Serviço para integração com Z-API WhatsApp
 * Permite enviar mensagens de texto, imagens, documentos e mais
 */
export class ZAPIService {
  private config: ZAPIConfig;

  constructor(config: ZAPIConfig) {
    this.config = config;
  }

  /**
   * Monta a URL base da API
   */
  private getBaseUrl(): string {
    return `https://api.z-api.io/instances/${this.config.instanceId}/token/${this.config.token}`;
  }

  /**
   * Monta os headers da requisição
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.clientToken) {
      headers['Client-Token'] = this.config.clientToken;
    }

    return headers;
  }

  /**
   * Formata número de telefone para padrão brasileiro
   * @param phone - Número de telefone (pode conter formatação)
   * @returns Número formatado (55 + DDD + número)
   */
  private formatPhone(phone: string): string {
    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '');

    // Se começar com 0, remove
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Se não tiver código do país, adiciona 55 (Brasil)
    if (cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Envia mensagem de texto simples
   */
  async sendText(params: SendTextParams): Promise<SendTextResponse> {
    const url = `${this.getBaseUrl()}/send-text`;
    const phone = this.formatPhone(params.phone);

    console.log(`📱 [Z-API] Enviando mensagem para ${phone}`);
    console.log(`📱 [Z-API] URL: ${url}`);

    const body = {
      phone,
      message: params.message,
      ...(params.delayMessage && { delayMessage: params.delayMessage }),
      ...(params.delayTyping && { delayTyping: params.delayTyping }),
    };

    console.log(`📱 [Z-API] Body:`, JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`📱 [Z-API] Response status: ${response.status}`);
    console.log(`📱 [Z-API] Response body: ${responseText}`);

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        // Response não é JSON
      }
      const errorMessage = (errorData.message as string) || (errorData.error as string) || `Erro Z-API: ${response.status} - ${responseText}`;
      console.error('❌ [Z-API] Erro:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ [Z-API] Mensagem enviada:', data.messageId);
    return data;
  }

  /**
   * Envia mensagem com botões de ação
   */
  async sendButtons(params: SendButtonsParams): Promise<SendTextResponse> {
    const url = `${this.getBaseUrl()}/send-button-list`;
    const phone = this.formatPhone(params.phone);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        phone,
        message: params.message,
        buttonList: {
          buttons: params.buttons.map((btn) => ({
            id: btn.id,
            label: btn.label,
          })),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ao enviar botões: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Envia imagem com legenda opcional
   */
  async sendImage(params: SendImageParams): Promise<SendTextResponse> {
    const url = `${this.getBaseUrl()}/send-image`;
    const phone = this.formatPhone(params.phone);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        phone,
        image: params.image,
        caption: params.caption || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ao enviar imagem: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Envia documento (PDF, DOC, etc.)
   */
  async sendDocument(params: SendDocumentParams): Promise<SendTextResponse> {
    const url = `${this.getBaseUrl()}/send-document`;
    const phone = this.formatPhone(params.phone);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        phone,
        document: params.document,
        fileName: params.fileName || 'documento.pdf',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ao enviar documento: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Envia áudio via URL
   * @param params - Parâmetros do áudio (phone, audio URL)
   * @returns Resposta do envio com messageId
   */
  async sendAudio(params: SendAudioParams): Promise<SendTextResponse> {
    const url = `${this.getBaseUrl()}/send-audio`;
    const phone = this.formatPhone(params.phone);

    console.log(`🎙️ [Z-API] Enviando áudio para ${phone}`);
    console.log(`🎙️ [Z-API] URL do áudio: ${params.audio}`);

    const body = {
      phone,
      audio: params.audio,
      ...(params.delayMessage && { delayMessage: params.delayMessage }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`🎙️ [Z-API] Response status: ${response.status}`);
    console.log(`🎙️ [Z-API] Response body: ${responseText}`);

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        // Response não é JSON
      }
      const errorMessage = (errorData.message as string) || (errorData.error as string) || `Erro Z-API: ${response.status} - ${responseText}`;
      console.error('❌ [Z-API] Erro ao enviar áudio:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ [Z-API] Áudio enviado:', data.messageId);
    return data;
  }

  /**
   * Envia áudio em Base64
   * @param params - Parâmetros (phone, base64, mimeType)
   * @returns Resposta do envio com messageId
   */
  async sendAudioBase64(params: SendAudioBase64Params): Promise<SendTextResponse> {
    const url = `${this.getBaseUrl()}/send-audio`;
    const phone = this.formatPhone(params.phone);

    console.log(`🎙️ [Z-API] Enviando áudio Base64 para ${phone}`);

    const body = {
      phone,
      audio: `data:${params.mimeType || 'audio/webm'};base64,${params.base64}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`🎙️ [Z-API] Response status: ${response.status}`);

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        // Response não é JSON
      }
      const errorMessage = (errorData.message as string) || (errorData.error as string) || `Erro Z-API: ${response.status}`;
      console.error('❌ [Z-API] Erro ao enviar áudio Base64:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    console.log('✅ [Z-API] Áudio Base64 enviado:', data.messageId);
    return data;
  }

  /**
   * Verifica status da conexão WhatsApp
   */
  async getStatus(): Promise<ZAPIStatus> {
    const url = `${this.getBaseUrl()}/status`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return {
          connected: false,
          smartphoneConnected: false,
          error: `Erro ao verificar status: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        connected: data.connected || false,
        smartphoneConnected: data.smartphoneConnected || false,
        error: data.error || null,
      };
    } catch (error) {
      console.error('[Z-API] Erro ao verificar status:', error);
      return {
        connected: false,
        smartphoneConnected: false,
        error: 'Erro de conexão com Z-API',
      };
    }
  }

  /**
   * Obtém QR Code para conexão (usado na primeira conexão)
   */
  async getQRCode(): Promise<QRCodeResponse | null> {
    const url = `${this.getBaseUrl()}/qr-code/image`;

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('[Z-API] Erro ao obter QR Code:', error);
      return null;
    }
  }

  /**
   * Desconecta a sessão do WhatsApp
   */
  async disconnect(): Promise<boolean> {
    const url = `${this.getBaseUrl()}/disconnect`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('[Z-API] Erro ao desconectar:', error);
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES HELPER PARA MULTI-TENANT
// ═══════════════════════════════════════════════════════════════

/**
 * Obtém as credenciais Z-API do usuário do banco de dados
 * @param userId - ID do usuário autenticado
 */
export async function getUserZAPIConfig(userId: string): Promise<ZAPIConfig | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[Z-API] Supabase não configurado');
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('whatsapp_settings')
    .select('zapi_instance_id, zapi_token, zapi_client_token')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Z-API] Erro ao buscar credenciais:', error);
    return null;
  }

  if (!data?.zapi_instance_id || !data?.zapi_token) {
    return null;
  }

  return {
    instanceId: data.zapi_instance_id,
    token: data.zapi_token,
    clientToken: data.zapi_client_token || undefined,
  };
}

/**
 * Cria instância do serviço Z-API para um usuário específico
 * @param userId - ID do usuário autenticado
 */
export async function getZAPIServiceForUser(userId: string): Promise<ZAPIService | null> {
  const config = await getUserZAPIConfig(userId);

  if (!config) {
    return null;
  }

  return new ZAPIService(config);
}

/**
 * Retorna serviço Z-API com credenciais do .env (fallback)
 */
export function getDefaultZAPIService(): ZAPIService | null {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;

  if (!instanceId || !token) {
    console.warn('[Z-API] Credenciais não configuradas no .env');
    return null;
  }

  return new ZAPIService({
    instanceId,
    token,
    clientToken: process.env.ZAPI_CLIENT_TOKEN,
  });
}

/**
 * Obtém serviço Z-API: primeiro tenta do usuário, depois fallback para .env
 * @param userId - ID do usuário (opcional)
 */
export async function getZAPIService(userId?: string): Promise<ZAPIService | null> {
  // Se tem userId, tenta pegar credenciais do usuário
  if (userId) {
    const userService = await getZAPIServiceForUser(userId);
    if (userService) {
      return userService;
    }
  }

  // Fallback para credenciais do .env
  return getDefaultZAPIService();
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON PARA USO SIMPLES (quando não precisa de multi-tenant)
// ═══════════════════════════════════════════════════════════════

let defaultServiceInstance: ZAPIService | null = null;

/**
 * Retorna instância singleton do serviço Z-API
 * Útil para scripts e tarefas agendadas
 */
export function getZAPIServiceSingleton(): ZAPIService | null {
  if (!defaultServiceInstance) {
    defaultServiceInstance = getDefaultZAPIService();
  }
  return defaultServiceInstance;
}
