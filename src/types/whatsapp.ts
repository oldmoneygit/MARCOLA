/**
 * @file whatsapp.ts
 * @description Tipos relacionados à integração Z-API WhatsApp
 * @module types
 *
 * @example
 * import type { SendTextParams, MessageLog } from '@/types/whatsapp';
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO Z-API
// ═══════════════════════════════════════════════════════════════

/**
 * Configuração de conexão com Z-API
 */
export interface ZAPIConfig {
  instanceId: string;
  token: string;
  clientToken?: string;
}

// ═══════════════════════════════════════════════════════════════
// PARÂMETROS DE ENVIO
// ═══════════════════════════════════════════════════════════════

/**
 * Parâmetros para envio de mensagem de texto
 */
export interface SendTextParams {
  /** Número de telefone (DDI+DDD+Número, ex: 5511999999999) */
  phone: string;
  /** Texto da mensagem */
  message: string;
  /** Delay entre mensagens (1-15 segundos) */
  delayMessage?: number;
  /** Tempo mostrando "Digitando..." (1-15 segundos) */
  delayTyping?: number;
}

/**
 * Parâmetros para envio de mensagem com botões
 */
export interface SendButtonsParams {
  phone: string;
  message: string;
  buttons: Array<{
    id: string;
    label: string;
  }>;
}

/**
 * Parâmetros para envio de imagem
 */
export interface SendImageParams {
  phone: string;
  /** URL da imagem */
  image: string;
  /** Legenda da imagem */
  caption?: string;
}

/**
 * Parâmetros para envio de documento
 */
export interface SendDocumentParams {
  phone: string;
  /** URL do documento */
  document: string;
  /** Nome do arquivo */
  fileName?: string;
}

// ═══════════════════════════════════════════════════════════════
// RESPOSTAS DA API
// ═══════════════════════════════════════════════════════════════

/**
 * Resposta do envio de mensagem
 */
export interface SendTextResponse {
  zaapId: string;
  messageId: string;
  id: string;
}

/**
 * Status da conexão Z-API
 */
export interface ZAPIStatus {
  connected: boolean;
  smartphoneConnected: boolean;
  error: string | null;
}

/**
 * Resposta do QR Code
 */
export interface QRCodeResponse {
  value?: string;
  base64?: string;
}

// ═══════════════════════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Tipos de eventos de webhook
 */
export type WebhookEventType =
  | 'Send'
  | 'Receive'
  | 'Connect'
  | 'Disconnect'
  | 'Present'
  | 'DeliveryCallback';

/**
 * Evento recebido via webhook
 */
export interface WebhookEvent {
  type: WebhookEventType;
  phone?: string;
  messageId?: string;
  text?: string;
  timestamp?: number;
  status?: string;
  instanceId?: string;
}

// ═══════════════════════════════════════════════════════════════
// LOGS DE MENSAGENS
// ═══════════════════════════════════════════════════════════════

/**
 * Tipo de mensagem (enviada ou recebida)
 */
export type MessageType = 'sent' | 'received';

/**
 * Status da mensagem
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Log de mensagem WhatsApp
 */
export interface MessageLog {
  id: string;
  user_id: string;
  client_id: string | null;
  phone: string;
  message: string;
  template_type: MessageTemplateType | null;
  type: MessageType;
  status: MessageStatus;
  zapi_message_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
}

/**
 * Log de mensagem com dados do cliente
 */
export interface MessageLogWithClient extends MessageLog {
  client?: {
    id: string;
    name: string;
    contact_name: string | null;
  } | null;
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATES DE MENSAGEM
// ═══════════════════════════════════════════════════════════════

/**
 * Tipos de templates disponíveis
 */
export type MessageTemplateType =
  | 'payment_reminder'
  | 'payment_overdue'
  | 'task_completed'
  | 'task_assigned'
  | 'report_ready'
  | 'custom';

/**
 * Template de mensagem WhatsApp
 */
export interface WhatsAppTemplate {
  type: MessageTemplateType;
  title: string;
  description: string;
  template: string;
  variables: string[];
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES DO USUÁRIO
// ═══════════════════════════════════════════════════════════════

/**
 * Configurações de WhatsApp do usuário
 */
export interface WhatsAppSettings {
  id: string;
  user_id: string;

  // Credenciais Z-API (Multi-tenant)
  zapi_instance_id: string | null;
  zapi_token: string | null;
  zapi_client_token: string | null;

  // Status da conexão
  is_connected: boolean;
  connected_phone: string | null;
  connected_at: string | null;
  credentials_validated_at: string | null;

  // Configurações de notificação automática
  auto_payment_reminder: boolean;
  reminder_days_before: number;
  auto_overdue_notification: boolean;
  auto_task_notification: boolean;

  // Horário permitido para envio
  send_start_hour: number;
  send_end_hour: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * DTO para atualizar configurações de WhatsApp
 */
export interface UpdateWhatsAppSettingsDTO {
  zapi_instance_id?: string;
  zapi_token?: string;
  zapi_client_token?: string;
  auto_payment_reminder?: boolean;
  reminder_days_before?: number;
  auto_overdue_notification?: boolean;
  auto_task_notification?: boolean;
  send_start_hour?: number;
  send_end_hour?: number;
}

// ═══════════════════════════════════════════════════════════════
// DTOs DE ENVIO
// ═══════════════════════════════════════════════════════════════

/**
 * DTO para enviar mensagem WhatsApp
 */
export interface SendWhatsAppDTO {
  phone: string;
  message?: string;
  templateType?: MessageTemplateType;
  variables?: Record<string, string>;
  clientId?: string;
}

/**
 * Resposta do envio de mensagem
 */
export interface SendWhatsAppResponse {
  success: boolean;
  messageId?: string;
  logId?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// ÁUDIO
// ═══════════════════════════════════════════════════════════════

/**
 * Parâmetros para envio de áudio
 */
export interface SendAudioParams {
  /** Número de telefone (DDI+DDD+Número) */
  phone: string;
  /** URL do áudio (deve ser acessível publicamente) */
  audio: string;
  /** Delay entre mensagens (1-15 segundos) */
  delayMessage?: number;
}

/**
 * Parâmetros para envio de áudio em Base64
 */
export interface SendAudioBase64Params {
  phone: string;
  /** Áudio em Base64 */
  base64: string;
  /** MIME type do áudio */
  mimeType?: string;
}

/**
 * Tipo de mídia da mensagem
 */
export type MessageMediaType = 'text' | 'audio' | 'image' | 'document';

// ═══════════════════════════════════════════════════════════════
// TEMPLATES PERSONALIZADOS (BANCO DE DADOS)
// ═══════════════════════════════════════════════════════════════

/**
 * Categorias de templates
 */
export type TemplateCategory = 'payment' | 'followup' | 'onboarding' | 'report' | 'custom';

/**
 * Template de texto personalizado salvo no banco
 */
export interface TextTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  template: string;
  variables: string[];
  is_ai_generated: boolean;
  ai_prompt: string | null;
  usage_count: number;
  last_used_at: string | null;
  is_active: boolean;
  is_favorite: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * Template de áudio pré-gravado
 */
export interface AudioTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  audio_url: string;
  audio_path: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  mime_type: string;
  transcription: string | null;
  usage_count: number;
  last_used_at: string | null;
  is_active: boolean;
  is_favorite: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/**
 * Áudio temporário para envio único
 */
export interface TempAudio {
  id: string;
  user_id: string;
  client_id: string | null;
  audio_url: string;
  audio_path: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  mime_type: string;
  status: 'pending' | 'sent' | 'saved_as_template' | 'deleted';
  sent_at: string | null;
  message_log_id: string | null;
  save_as_template: boolean;
  template_name: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * DTO para criar template de texto
 */
export interface CreateTextTemplateDTO {
  name: string;
  description?: string;
  category: TemplateCategory;
  template: string;
  variables?: string[];
  is_ai_generated?: boolean;
  ai_prompt?: string;
}

/**
 * DTO para criar template de áudio
 */
export interface CreateAudioTemplateDTO {
  name: string;
  description?: string;
  category: TemplateCategory;
  audio_url: string;
  audio_path: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  mime_type?: string;
  transcription?: string;
}

/**
 * DTO para upload de áudio temporário
 */
export interface UploadTempAudioDTO {
  client_id?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  mime_type?: string;
  save_as_template?: boolean;
  template_name?: string;
}

/**
 * DTO para enviar áudio WhatsApp
 */
export interface SendWhatsAppAudioDTO {
  phone: string;
  audioUrl: string;
  clientId?: string;
  templateId?: string;
  tempAudioId?: string;
}

/**
 * Resposta do envio de áudio
 */
export interface SendWhatsAppAudioResponse {
  success: boolean;
  messageId?: string;
  logId?: string;
  error?: string;
}
