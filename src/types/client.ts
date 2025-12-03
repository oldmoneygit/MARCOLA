/**
 * @file client.ts
 * @description Tipos relacionados a clientes
 * @module types
 */

import type { BriefingData } from './briefing';

/**
 * Status possíveis de um cliente
 */
export type ClientStatus = 'active' | 'paused' | 'inactive';

/**
 * Frequência de reuniões com o cliente
 */
export type MeetingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'on_demand';

/**
 * Interface principal do Cliente
 */
export interface Client {
  id: string;
  user_id: string;
  name: string;
  segment: string;
  status: ClientStatus;

  // Contato
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;

  // Financeiro
  monthly_value: number;
  due_day: number;
  average_ticket: number | null;

  // Localização
  city: string | null;
  address: string | null;

  // Redes sociais
  instagram_url: string | null;
  facebook_page_id: string | null;

  // Links e recursos
  ads_account_url: string | null;
  website_url: string | null;
  drive_url: string | null;
  menu_url: string | null;
  assets_links: string | null;

  // Estratégia
  peak_hours: string | null;
  differentials: string | null;
  ideal_customer: string | null;
  goals_short_term: string | null;
  goals_long_term: string | null;

  // Gestão e produção
  meeting_frequency: MeetingFrequency | null;
  image_authorization: boolean | null;
  content_request: string | null;

  // Observações
  notes: string | null;

  // Personalização visual
  avatar_url: string | null;
  brand_colors: BrandColors | null;

  // Briefing/Questionário
  briefing_data: BriefingData | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Cores da marca extraídas do avatar
 */
export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * DTO para criação de cliente
 */
export interface CreateClientDTO {
  // Obrigatórios
  name: string;
  segment: string;
  monthly_value: number;
  due_day: number;

  // Contato (opcionais)
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;

  // Financeiro (opcional)
  average_ticket?: number;

  // Localização (opcional)
  city?: string;
  address?: string;

  // Redes sociais (opcionais)
  instagram_url?: string;
  facebook_page_id?: string;

  // Links e recursos (opcionais)
  ads_account_url?: string;
  website_url?: string;
  drive_url?: string;
  menu_url?: string;
  assets_links?: string;

  // Estratégia (opcionais)
  peak_hours?: string;
  differentials?: string;
  ideal_customer?: string;
  goals_short_term?: string;
  goals_long_term?: string;

  // Gestão e produção (opcionais)
  meeting_frequency?: MeetingFrequency;
  image_authorization?: boolean;
  content_request?: string;

  // Observações (opcional)
  notes?: string;

  // Personalização visual (opcional)
  avatar_url?: string;
  brand_colors?: BrandColors;

  // Briefing/Questionário (opcional)
  briefing_data?: BriefingData;
}

/**
 * DTO para atualização de cliente
 */
export interface UpdateClientDTO extends Partial<CreateClientDTO> {
  status?: ClientStatus;
}

/**
 * Cliente com informações computadas para exibição
 */
export interface ClientWithMetrics extends Client {
  currentCPA?: number;
  leadsThisMonth?: number;
  hasAlert?: boolean;
  alertType?: 'fatigue' | 'overdue' | 'opportunity';
  alertMessage?: string;
}

/**
 * Credencial de acesso de uma plataforma do cliente
 */
export interface ClientCredential {
  id: string;
  client_id: string;
  platform: string;
  login: string;
  password: string;
  url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para criação de credencial
 */
export interface CreateCredentialDTO {
  platform: string;
  login: string;
  password: string;
  url?: string;
  notes?: string;
}

/**
 * DTO para atualização de credencial
 */
export interface UpdateCredentialDTO extends Partial<CreateCredentialDTO> {}

/**
 * Plataformas comuns para sugestão
 */
export const COMMON_PLATFORMS = [
  'Meta Ads',
  'Google Ads',
  'Instagram',
  'Facebook',
  'TikTok Ads',
  'LinkedIn Ads',
  'Twitter/X Ads',
  'Pinterest Ads',
  'Google Analytics',
  'Google Search Console',
  'Gmail',
  'Cardápio Web',
  'Hotjar',
  'RD Station',
  'Mailchimp',
  'HubSpot',
  'WordPress',
  'Shopify',
  'WooCommerce',
  'Outro',
] as const;
