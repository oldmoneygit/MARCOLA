/**
 * @file meetings.ts
 * @description Tipos específicos para o módulo de Reuniões
 * @module types
 */

// ═══════════════════════════════════════════════════════════════
// ENUMS E TIPOS BASE
// ═══════════════════════════════════════════════════════════════

/** Tipo da reunião */
export type MeetingType = 'online' | 'presencial';

/** Status da reunião */
export type MeetingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';

/** Prioridade da reunião */
export type MeetingPriority = 'low' | 'medium' | 'high' | 'urgent';

// ═══════════════════════════════════════════════════════════════
// INTERFACES PRINCIPAIS
// ═══════════════════════════════════════════════════════════════

/**
 * Reunião completa
 */
export interface Meeting {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_minutes: number;
  type: MeetingType;
  status: MeetingStatus;
  priority: MeetingPriority;
  location: string | null;
  meeting_link: string | null;
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  // Relações
  client?: {
    id: string;
    name: string;
    contact_name?: string;
    avatar_url?: string;
  };
}

/**
 * Reunião com informações formatadas para exibição
 */
export interface MeetingWithDisplay extends Meeting {
  displayDate: string;
  displayTime: string;
  displayDateTime: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  daysUntil: number;
}

// ═══════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════

/**
 * DTO para criar reunião
 */
export interface CreateMeetingDTO {
  client_id?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration_minutes?: number;
  type: MeetingType;
  priority?: MeetingPriority;
  location?: string;
  meeting_link?: string;
  notes?: string;
}

/**
 * DTO para atualizar reunião
 */
export interface UpdateMeetingDTO extends Partial<CreateMeetingDTO> {
  status?: MeetingStatus;
}

/**
 * Filtros para listagem de reuniões
 */
export interface MeetingFilters {
  client_id?: string;
  status?: MeetingStatus;
  type?: MeetingType;
  start_date?: string;
  end_date?: string;
  upcoming_only?: boolean;
  search?: string;
}

// ═══════════════════════════════════════════════════════════════
// ESTATÍSTICAS
// ═══════════════════════════════════════════════════════════════

/**
 * Estatísticas de reuniões
 */
export interface MeetingStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  thisWeek: number;
  thisMonth: number;
  upcomingToday: number;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÕES VISUAIS
// ═══════════════════════════════════════════════════════════════

/** Configuração de tipos de reunião */
export const MEETING_TYPE_CONFIG: Record<MeetingType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  online: {
    label: 'Online',
    icon: 'video',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
  },
  presencial: {
    label: 'Presencial',
    icon: 'map-pin',
    color: 'emerald',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
  },
};

/** Configuração de status de reunião */
export const MEETING_STATUS_CONFIG: Record<MeetingStatus, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  scheduled: {
    label: 'Agendada',
    icon: 'calendar',
    color: 'slate',
    bgColor: 'bg-slate-500/20',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
  },
  confirmed: {
    label: 'Confirmada',
    icon: 'check-circle',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  completed: {
    label: 'Realizada',
    icon: 'check',
    color: 'emerald',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  cancelled: {
    label: 'Cancelada',
    icon: 'x-circle',
    color: 'red',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  rescheduled: {
    label: 'Reagendada',
    icon: 'refresh-cw',
    color: 'amber',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
};

/** Configuração de prioridade */
export const MEETING_PRIORITY_CONFIG: Record<MeetingPriority, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  low: {
    label: 'Baixa',
    icon: 'minus',
    color: 'slate',
    bgColor: 'bg-slate-500/20',
    textColor: 'text-slate-400',
  },
  medium: {
    label: 'Média',
    icon: 'equal',
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
  },
  high: {
    label: 'Alta',
    icon: 'chevron-up',
    color: 'amber',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
  },
  urgent: {
    label: 'Urgente',
    icon: 'alert-triangle',
    color: 'red',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
  },
};
