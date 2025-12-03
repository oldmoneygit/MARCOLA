/**
 * @file task.ts
 * @description Tipos relacionados a tarefas e templates
 * @module types
 */

/** Prioridade da tarefa */
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

/** Status da tarefa */
export type TaskStatus = 'todo' | 'doing' | 'done' | 'cancelled';

/** Recorrência da tarefa */
export type TaskRecurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly';

/**
 * Template de tarefa por segmento/nicho
 */
export interface TaskTemplate {
  id: string;
  user_id: string;
  segment: string;
  title: string;
  description: string | null;
  default_priority: TaskPriority;
  default_days_offset: number;
  is_recurring: boolean;
  recurrence: TaskRecurrence | null;
  send_whatsapp: boolean;
  whatsapp_template: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Tarefa vinculada a um cliente
 */
export interface Task {
  id: string;
  client_id: string;
  user_id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_recurring: boolean;
  recurrence: TaskRecurrence | null;
  next_recurrence_date: string | null;
  send_whatsapp: boolean;
  whatsapp_message: string | null;
  notified_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Relação com cliente (quando join) */
  client?: {
    id: string;
    name: string;
    contact_phone: string | null;
    contact_name: string | null;
  };
}

/**
 * Nota de acompanhamento do cliente
 */
export interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DTOs (Data Transfer Objects)
// =============================================================================

/**
 * DTO para criar tarefa
 */
export interface CreateTaskDTO {
  client_id: string;
  template_id?: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority?: TaskPriority;
  is_recurring?: boolean;
  recurrence?: TaskRecurrence;
  send_whatsapp?: boolean;
  whatsapp_message?: string;
}

/**
 * DTO para atualizar tarefa
 */
export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: TaskStatus;
}

/**
 * DTO para criar template de tarefa
 */
export interface CreateTaskTemplateDTO {
  segment: string;
  title: string;
  description?: string;
  default_priority?: TaskPriority;
  default_days_offset?: number;
  is_recurring?: boolean;
  recurrence?: TaskRecurrence;
  send_whatsapp?: boolean;
  whatsapp_template?: string;
  order_index?: number;
}

/**
 * DTO para atualizar template de tarefa
 */
export interface UpdateTaskTemplateDTO extends Partial<CreateTaskTemplateDTO> {
  is_active?: boolean;
}

/**
 * DTO para criar nota
 */
export interface CreateClientNoteDTO {
  client_id: string;
  content: string;
  is_pinned?: boolean;
}

/**
 * DTO para atualizar nota
 */
export interface UpdateClientNoteDTO {
  content?: string;
  is_pinned?: boolean;
}

/**
 * DTO para aplicar templates a um cliente
 */
export interface ApplyTemplatesDTO {
  client_id: string;
  template_ids: string[];
}

// =============================================================================
// Constantes de Configuração
// =============================================================================

/** Configuração de prioridades */
export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; icon: string; className: string }> = {
  urgent: {
    label: 'Urgente',
    icon: '🔴',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  high: {
    label: 'Alta',
    icon: '🟠',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  medium: {
    label: 'Média',
    icon: '🟡',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  low: {
    label: 'Baixa',
    icon: '🟢',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
};

/** Configuração de status */
export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: 'A fazer',
    className: 'bg-zinc-500/20 text-zinc-400',
  },
  doing: {
    label: 'Fazendo',
    className: 'bg-blue-500/20 text-blue-400',
  },
  done: {
    label: 'Concluída',
    className: 'bg-emerald-500/20 text-emerald-400',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-red-500/20 text-red-400',
  },
};

/** Configuração de recorrência */
export const TASK_RECURRENCE_CONFIG: Record<TaskRecurrence, { label: string; days: number }> = {
  daily: { label: 'Diária', days: 1 },
  weekly: { label: 'Semanal', days: 7 },
  biweekly: { label: 'Quinzenal', days: 14 },
  monthly: { label: 'Mensal', days: 30 },
};
