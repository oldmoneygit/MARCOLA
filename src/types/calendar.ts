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
export const CONTENT_TYPE_CONFIG: Record<ContentType, {
  label: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  className: string;
}> = {
  post: {
    label: 'Post',
    icon: 'image',
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/25',
    textColor: 'text-blue-200',
    borderColor: 'border-blue-500/60',
    className: 'bg-blue-500/25 text-blue-200 border-blue-500/60',
  },
  video: {
    label: 'Vídeo',
    icon: 'video',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-500/25',
    textColor: 'text-purple-200',
    borderColor: 'border-purple-500/60',
    className: 'bg-purple-500/25 text-purple-200 border-purple-500/60',
  },
  reels: {
    label: 'Reels',
    icon: 'reels',
    iconColor: 'text-pink-500',
    bgColor: 'bg-pink-500/25',
    textColor: 'text-pink-200',
    borderColor: 'border-pink-500/60',
    className: 'bg-pink-500/25 text-pink-200 border-pink-500/60',
  },
  stories: {
    label: 'Stories',
    icon: 'stories',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/25',
    textColor: 'text-orange-200',
    borderColor: 'border-orange-500/60',
    className: 'bg-orange-500/25 text-orange-200 border-orange-500/60',
  },
  promo: {
    label: 'Promoção',
    icon: 'promo',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/25',
    textColor: 'text-emerald-200',
    borderColor: 'border-emerald-500/60',
    className: 'bg-emerald-500/25 text-emerald-200 border-emerald-500/60',
  },
  campaign: {
    label: 'Campanha',
    icon: 'campaign',
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-500/25',
    textColor: 'text-violet-200',
    borderColor: 'border-violet-500/60',
    className: 'bg-violet-500/25 text-violet-200 border-violet-500/60',
  },
  event: {
    label: 'Evento',
    icon: 'events',
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/25',
    textColor: 'text-yellow-200',
    borderColor: 'border-yellow-500/60',
    className: 'bg-yellow-500/25 text-yellow-200 border-yellow-500/60',
  },
  other: {
    label: 'Outro',
    icon: 'pin',
    iconColor: 'text-zinc-500',
    bgColor: 'bg-zinc-500/25',
    textColor: 'text-zinc-200',
    borderColor: 'border-zinc-500/60',
    className: 'bg-zinc-500/25 text-zinc-200 border-zinc-500/60',
  },
};

/** Configuração de status de conteúdo */
export const CONTENT_STATUS_CONFIG: Record<ContentStatus, {
  label: string;
  icon: string;
  iconColor: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  planned: {
    label: 'Planejado',
    icon: 'clock',
    iconColor: 'text-slate-400',
    dotColor: 'bg-slate-500',
    bgColor: 'bg-slate-500/25',
    textColor: 'text-slate-200',
    borderColor: 'border-slate-500/60',
  },
  creating: {
    label: 'Criando',
    icon: 'play',
    iconColor: 'text-blue-500',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-500/25',
    textColor: 'text-blue-200',
    borderColor: 'border-blue-500/60',
  },
  review: {
    label: 'Em Revisão',
    icon: 'alert',
    iconColor: 'text-amber-500',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-500/25',
    textColor: 'text-amber-200',
    borderColor: 'border-amber-500/60',
  },
  approved: {
    label: 'Aprovado',
    icon: 'check',
    iconColor: 'text-emerald-500',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/25',
    textColor: 'text-emerald-200',
    borderColor: 'border-emerald-500/60',
  },
  published: {
    label: 'Publicado',
    icon: 'check-circle',
    iconColor: 'text-green-500',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-500/25',
    textColor: 'text-green-200',
    borderColor: 'border-green-500/60',
  },
  cancelled: {
    label: 'Cancelado',
    icon: 'x-circle',
    iconColor: 'text-red-500',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-500/25',
    textColor: 'text-red-200',
    borderColor: 'border-red-500/60',
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
