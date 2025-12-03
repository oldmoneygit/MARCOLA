/**
 * @file calendar.ts
 * @description Tipos relacionados ao calendário de conteúdo
 * @module types
 */

/** Tipo de conteúdo */
export type ContentType = 'post' | 'video' | 'reels' | 'stories' | 'promo' | 'campaign' | 'event' | 'other';

/** Status do conteúdo */
export type ContentStatus = 'planned' | 'creating' | 'review' | 'approved' | 'published' | 'cancelled';

/** Plataforma de publicação */
export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'google' | 'youtube' | 'linkedin';

/** Recorrência do template de calendário */
export type CalendarRecurrence = 'weekly' | 'biweekly' | 'monthly';

/**
 * Evento do calendário de conteúdo
 */
export interface CalendarEvent {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: ContentType;
  scheduled_date: string;
  scheduled_time: string | null;
  status: ContentStatus;
  platform: Platform[];
  color: string | null;
  attachments: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Relação com cliente (quando join) */
  client?: {
    id: string;
    name: string;
  };
}

/**
 * Template de conteúdo recorrente
 */
export interface CalendarTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: ContentType;
  platform: Platform[];
  color: string | null;
  recurrence: CalendarRecurrence | null;
  day_of_week: number | null;
  day_of_month: number | null;
  is_active: boolean;
  created_at: string;
}

// =============================================================================
// DTOs (Data Transfer Objects)
// =============================================================================

/**
 * DTO para criar evento no calendário
 */
export interface CreateCalendarEventDTO {
  client_id: string;
  title: string;
  description?: string;
  type: ContentType;
  scheduled_date: string;
  scheduled_time?: string;
  platform?: Platform[];
  color?: string;
  notes?: string;
}

/**
 * DTO para atualizar evento no calendário
 */
export interface UpdateCalendarEventDTO extends Partial<CreateCalendarEventDTO> {
  status?: ContentStatus;
  attachments?: string[];
}

/**
 * DTO para criar template de calendário
 */
export interface CreateCalendarTemplateDTO {
  name: string;
  description?: string;
  type: ContentType;
  platform?: Platform[];
  color?: string;
  recurrence?: CalendarRecurrence;
  day_of_week?: number;
  day_of_month?: number;
}

/**
 * DTO para atualizar template de calendário
 */
export interface UpdateCalendarTemplateDTO extends Partial<CreateCalendarTemplateDTO> {
  is_active?: boolean;
}

// =============================================================================
// Helpers de Visualização
// =============================================================================

/**
 * Representação de um dia no calendário
 */
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

/**
 * Representação de um mês no calendário
 */
export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

// =============================================================================
// Constantes de Configuração
// =============================================================================

/** Configuração de tipos de conteúdo */
export const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: string; className: string }> = {
  post: {
    label: 'Post',
    icon: 'image',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  video: {
    label: 'Vídeo',
    icon: 'video',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  reels: {
    label: 'Reels',
    icon: 'reels',
    className: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  },
  stories: {
    label: 'Stories',
    icon: 'stories',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  promo: {
    label: 'Promoção',
    icon: 'promo',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  campaign: {
    label: 'Campanha',
    icon: 'campaign',
    className: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  },
  event: {
    label: 'Evento',
    icon: 'events',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  other: {
    label: 'Outro',
    icon: 'pin',
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  },
};

/** Configuração de status de conteúdo */
export const CONTENT_STATUS_CONFIG: Record<ContentStatus, { label: string; className: string }> = {
  planned: {
    label: 'Planejado',
    className: 'bg-zinc-500/20 text-zinc-400',
  },
  creating: {
    label: 'Criando',
    className: 'bg-blue-500/20 text-blue-400',
  },
  review: {
    label: 'Em Revisão',
    className: 'bg-yellow-500/20 text-yellow-400',
  },
  approved: {
    label: 'Aprovado',
    className: 'bg-emerald-500/20 text-emerald-400',
  },
  published: {
    label: 'Publicado',
    className: 'bg-green-500/20 text-green-400',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-500/20 text-red-400',
  },
};

/** Configuração de plataformas */
export const PLATFORM_CONFIG: Record<Platform, { label: string; icon: string; color: string }> = {
  instagram: {
    label: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
  },
  facebook: {
    label: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
  },
  tiktok: {
    label: 'TikTok',
    icon: 'tiktok',
    color: '#000000',
  },
  google: {
    label: 'Google',
    icon: 'google',
    color: '#4285F4',
  },
  youtube: {
    label: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
  },
};

/** Dias da semana em português */
export const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

/** Meses em português */
export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;
