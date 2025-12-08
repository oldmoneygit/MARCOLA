/**
 * @file whatsapp-evolution.ts
 * @description Tipos para integração WhatsApp via Evolution API
 * @module types
 */

// ==================== STATUS ====================

export type WhatsAppInstanceStatus = 'connected' | 'disconnected' | 'connecting';
export type WhatsAppMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

// ==================== INSTÂNCIA ====================

export interface WhatsAppInstancia {
  id: string;
  gestorId: string;
  instanceName: string;
  status: WhatsAppInstanceStatus;
  phoneNumber?: string;
  connectedAt?: string;
  disconnectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== MENSAGEM ====================

export interface WhatsAppMensagem {
  id: string;
  instanciaId: string;
  leadId?: string;
  numeroDestino: string;
  mensagem: string;
  messageId?: string;
  status: WhatsAppMessageStatus;
  enviadoEm: string;
  erro?: string;
}

// ==================== API RESPONSES ====================

export interface WhatsAppResponse {
  success: boolean;
  message?: string;
}

export interface CriarInstanciaResponse extends WhatsAppResponse {
  instanceName: string;
  instanceId?: string;
  qrcode?: string;
  pairingCode?: string;
}

export interface QRCodeResponse extends WhatsAppResponse {
  qrcode?: string | null;
  pairingCode?: string | null;
}

export interface StatusResponse extends WhatsAppResponse {
  connected: boolean;
  state: string;
}

export interface SendMessageResponse extends WhatsAppResponse {
  messageId?: string | null;
  numero?: string;
  status?: string;
}

// ==================== DTOs ====================

export interface CriarInstanciaDTO {
  instanceName: string;
}

export interface EnviarMensagemDTO {
  instanceName: string;
  numero: string;
  mensagem: string;
  leadId?: string;
}

export interface InstanceNameDTO {
  instanceName: string;
}
