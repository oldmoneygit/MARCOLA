/**
 * @file service.ts
 * @description Serviço de integração WhatsApp via N8N (intermediário para Evolution API)
 * @module lib/whatsapp-evolution
 *
 * Este service usa N8N como proxy para a Evolution API, resolvendo:
 * - Problemas de CORS
 * - Segurança (API Keys ficam no servidor)
 * - Centralização de lógica
 */

import type {
  WhatsAppResponse,
  CriarInstanciaResponse,
  QRCodeResponse,
  StatusResponse,
  SendMessageResponse,
} from '@/types/whatsapp-evolution';

// N8N Webhook Base URL
const N8N_WEBHOOK_BASE = 'https://n8n.srv1180872.hstgr.cloud/webhook';

// Timeout padrão de 30 segundos
const DEFAULT_TIMEOUT = 30 * 1000;

/**
 * Faz requisição com timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout na requisição WhatsApp');
    }
    throw error;
  }
}

/**
 * Criar nova instância WhatsApp via N8N
 * @param instanceName - Nome único da instância
 * @returns Resposta com dados da instância criada e QR Code
 */
export async function criarInstanciaWhatsApp(
  instanceName: string
): Promise<CriarInstanciaResponse> {
  try {
    const response = await fetchWithTimeout(
      `${N8N_WEBHOOK_BASE}/wa/criar`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[criarInstanciaWhatsApp] Erro N8N:', errorData);
      throw new Error(`Erro ao criar instância: ${response.status}`);
    }

    // Lidar com resposta vazia ou não-JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Resposta vazia do servidor ao criar instância');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Resposta inválida do servidor ao criar instância');
    }

    return {
      success: true,
      instanceName: data.instance?.instanceName || instanceName,
      instanceId: data.instance?.instanceId,
      qrcode: data.qrcode?.base64,
      pairingCode: data.qrcode?.pairingCode || data.qrcode?.code,
      message: 'Instância criada com sucesso',
    };
  } catch (error) {
    console.error('[criarInstanciaWhatsApp] Erro:', error);
    throw error;
  }
}

/**
 * Obter QR Code para conexão via N8N
 * @param instanceName - Nome da instância
 * @returns QR Code em base64 e código de pareamento
 */
export async function obterQRCode(instanceName: string): Promise<QRCodeResponse> {
  try {
    const response = await fetchWithTimeout(
      `${N8N_WEBHOOK_BASE}/wa/qrcode`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[obterQRCode] Erro N8N:', errorData);
      throw new Error(`Erro ao obter QR Code: ${response.status}`);
    }

    // Lidar com resposta vazia ou não-JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('QR Code não disponível - resposta vazia do servidor');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('QR Code não disponível - resposta inválida do servidor');
    }

    if (!data.base64) {
      throw new Error('QR Code não retornado pelo servidor');
    }

    return {
      success: true,
      qrcode: data.base64,
      pairingCode: data.pairingCode || data.code,
    };
  } catch (error) {
    console.error('[obterQRCode] Erro:', error);
    throw error;
  }
}

/**
 * Verificar status da conexão via N8N
 * @param instanceName - Nome da instância
 * @returns Status da conexão
 */
export async function verificarStatus(instanceName: string): Promise<StatusResponse> {
  try {
    const response = await fetchWithTimeout(
      `${N8N_WEBHOOK_BASE}/wa/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      },
      10 * 1000 // Timeout menor para status
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[verificarStatus] Erro N8N:', errorData);
      throw new Error(`Erro ao verificar status: ${response.status}`);
    }

    // Lidar com resposta vazia ou não-JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      // Resposta vazia significa desconectado ou instância não existe
      return {
        success: true,
        connected: false,
        state: 'close',
        message: 'Instância não encontrada ou desconectada',
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Se não for JSON válido, assumir desconectado
      return {
        success: true,
        connected: false,
        state: 'close',
        message: 'Resposta inválida do servidor',
      };
    }

    // N8N retorna: "open", "close", "connecting"
    const state = data.instance?.state || data.state || 'close';
    const connected = state === 'open';

    return {
      success: true,
      connected,
      state,
      message: connected ? 'Conectado' : 'Desconectado',
    };
  } catch (error) {
    console.error('[verificarStatus] Erro:', error);
    // Retorna desconectado em caso de erro
    return {
      success: false,
      connected: false,
      state: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Verificar se está conectado (helper)
 * @param instanceName - Nome da instância
 * @returns true se conectado
 */
export async function estaConectado(instanceName: string): Promise<boolean> {
  try {
    const status = await verificarStatus(instanceName);
    return status.connected;
  } catch {
    return false;
  }
}

/**
 * Enviar mensagem via WhatsApp através do N8N
 * @param instanceName - Nome da instância
 * @param numero - Número de destino (formato: 5519999999999)
 * @param mensagem - Mensagem a ser enviada
 * @returns Resposta com ID da mensagem
 */
export async function enviarMensagem(
  instanceName: string,
  numero: string,
  mensagem: string
): Promise<SendMessageResponse> {
  try {
    // Formatar número (remover não-dígitos)
    const numeroFormatado = numero.replace(/\D/g, '');

    const response = await fetchWithTimeout(
      `${N8N_WEBHOOK_BASE}/wa/enviar`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName,
          number: numeroFormatado,
          text: mensagem,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[enviarMensagem] Erro N8N:', errorData);
      throw new Error(`Erro ao enviar mensagem: ${response.status}`);
    }

    // Lidar com resposta vazia ou não-JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      // Resposta vazia pode significar sucesso sem dados
      return {
        success: true,
        message: 'Mensagem enviada',
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Se não for JSON, assumir sucesso
      return {
        success: true,
        message: 'Mensagem enviada',
      };
    }

    return {
      success: true,
      messageId: data.key?.id || data.messageId,
      message: 'Mensagem enviada com sucesso',
    };
  } catch (error) {
    console.error('[enviarMensagem] Erro:', error);
    throw error;
  }
}

/**
 * Desconectar instância WhatsApp via N8N
 * @param instanceName - Nome da instância
 * @returns Resposta de sucesso
 */
export async function desconectarWhatsApp(
  instanceName: string
): Promise<WhatsAppResponse> {
  try {
    const response = await fetchWithTimeout(
      `${N8N_WEBHOOK_BASE}/wa/desconectar`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[desconectarWhatsApp] Erro N8N:', errorData);
      throw new Error(`Erro ao desconectar: ${response.status}`);
    }

    return {
      success: true,
      message: 'Desconectado com sucesso',
    };
  } catch (error) {
    console.error('[desconectarWhatsApp] Erro:', error);
    throw error;
  }
}

/**
 * Deletar instância WhatsApp completamente
 * @param instanceName - Nome da instância
 * @returns Resposta de sucesso
 */
export async function deletarInstancia(
  instanceName: string
): Promise<WhatsAppResponse> {
  // Por enquanto usa o mesmo endpoint de desconectar
  // TODO: Criar endpoint específico no N8N se necessário
  return desconectarWhatsApp(instanceName);
}

/**
 * Buscar todas as instâncias (placeholder)
 * @returns Lista de instâncias
 */
export async function listarInstancias(): Promise<{ instances: Array<{ instanceName: string; state: string }> }> {
  // TODO: Implementar endpoint no N8N para listar instâncias
  console.warn('[listarInstancias] Endpoint não implementado no N8N');
  return { instances: [] };
}

/**
 * Formatar número para padrão brasileiro
 * @param numero - Número em qualquer formato
 * @returns Número formatado (55XXXXXXXXXXX)
 */
export function formatarNumero(numero: string): string {
  // Remove tudo que não é número
  const apenasNumeros = numero.replace(/\D/g, '');

  // Se não começar com 55, adiciona
  if (!apenasNumeros.startsWith('55')) {
    return `55${apenasNumeros}`;
  }

  return apenasNumeros;
}

/**
 * Enviar mensagem para lead (com formatação automática)
 * @param instanceName - Nome da instância
 * @param telefone - Telefone do lead
 * @param mensagem - Mensagem a ser enviada
 * @returns Resposta com ID da mensagem
 */
export async function enviarMensagemParaLead(
  instanceName: string,
  telefone: string,
  mensagem: string
): Promise<SendMessageResponse> {
  const numeroFormatado = formatarNumero(telefone);
  return enviarMensagem(instanceName, numeroFormatado, mensagem);
}

/**
 * Gera nome de instância único para um gestor
 * @param gestorId - ID do gestor (UUID)
 * @returns Nome da instância no formato lead_{id}_{timestamp}
 */
export function gerarNomeInstancia(gestorId: string): string {
  const prefix = gestorId.replace(/-/g, '').substring(0, 8);
  const timestamp = Date.now().toString(36);
  return `lead_${prefix}_${timestamp}`;
}

/**
 * Mapeia dados do banco para o formato TypeScript
 */
export function mapDbInstanciaToTs(dbData: Record<string, unknown>) {
  return {
    id: dbData.id as string,
    gestorId: dbData.gestor_id as string,
    instanceName: dbData.instance_name as string,
    status: dbData.status as string,
    phoneNumber: dbData.phone_number as string | undefined,
    connectedAt: dbData.connected_at as string | undefined,
    disconnectedAt: dbData.disconnected_at as string | undefined,
    createdAt: dbData.created_at as string,
    updatedAt: dbData.updated_at as string,
  };
}

/**
 * Mapeia dados do banco de mensagens para o formato TypeScript
 */
export function mapDbMensagemToTs(dbData: Record<string, unknown>) {
  return {
    id: dbData.id as string,
    instanciaId: dbData.instancia_id as string,
    leadId: dbData.lead_id as string | undefined,
    numeroDestino: dbData.numero_destino as string,
    mensagem: dbData.mensagem as string,
    messageId: dbData.message_id as string | undefined,
    status: dbData.status as string,
    enviadoEm: dbData.enviado_em as string,
    erro: dbData.erro as string | undefined,
  };
}
