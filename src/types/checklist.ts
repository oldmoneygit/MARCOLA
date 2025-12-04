/**
 * @file checklist.ts
 * @description Tipos relacionados a checklists de rotina
 * @module types
 */

/** Frequência do checklist */
export type ChecklistFrequency = 'daily' | '3days' | 'weekly' | 'biweekly' | 'monthly';

/** Item do checklist de rotina */
export interface RoutineChecklistItem {
  id: string;
  text: string;
  category?: string;
  is_checked: boolean;
  notes?: string;
  alert_if_unchecked: boolean;
}

/**
 * Checklist de rotina
 */
export interface RoutineChecklist {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  frequency: ChecklistFrequency;
  items: RoutineChecklistItem[];
  is_template: boolean;
  completed_at: string | null;
  completed_by: string | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  /** Relação com cliente */
  client?: {
    id: string;
    name: string;
  };
}

// =============================================================================
// DTOs
// =============================================================================

export interface CreateRoutineChecklistDTO {
  client_id?: string;
  name: string;
  description?: string;
  frequency: ChecklistFrequency;
  items?: RoutineChecklistItem[];
  is_template?: boolean;
}

export interface UpdateRoutineChecklistDTO {
  name?: string;
  description?: string;
  frequency?: ChecklistFrequency;
  items?: RoutineChecklistItem[];
  completion_percentage?: number;
  completed_at?: string;
}

// =============================================================================
// Configuração
// =============================================================================

export const CHECKLIST_FREQUENCY_CONFIG: Record<ChecklistFrequency, {
  label: string;
  shortLabel: string;
  days: number;
  icon: string;
  bgColor: string;
  textColor: string;
}> = {
  daily: {
    label: 'Diário',
    shortLabel: 'Diário',
    days: 1,
    icon: 'calendar-day',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
  },
  '3days': {
    label: '3 em 3 dias',
    shortLabel: '3 dias',
    days: 3,
    icon: 'calendar-range',
    bgColor: 'bg-violet-500/20',
    textColor: 'text-violet-400',
  },
  weekly: {
    label: 'Semanal',
    shortLabel: 'Semanal',
    days: 7,
    icon: 'calendar-week',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
  },
  biweekly: {
    label: 'Quinzenal',
    shortLabel: 'Quinzenal',
    days: 14,
    icon: 'calendar',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
  },
  monthly: {
    label: 'Mensal',
    shortLabel: 'Mensal',
    days: 30,
    icon: 'calendar-month',
    bgColor: 'bg-pink-500/20',
    textColor: 'text-pink-400',
  },
};
