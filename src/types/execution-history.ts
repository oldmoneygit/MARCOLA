/**
 * @file execution-history.ts
 * @description Tipos para o sistema de Histórico de Execuções
 * @module types
 */

// ==================== ENUMS / TIPOS BASE ====================

/**
 * Tipos de ação que podem ser registradas
 */
export type ExecutionActionType =
  | 'task_created'
  | 'task_started'
  | 'task_completed'
  | 'task_cancelled'
  | 'optimization_applied'
  | 'manual_action';

/**
 * Tipos de otimização disponíveis
 */
export type OptimizationType =
  | 'campaign_adjustment'
  | 'budget_change'
  | 'targeting_tweak'
  | 'creative_update'
  | 'bid_strategy'
  | 'audience_expansion'
  | 'other';

/**
 * Resultados possíveis de uma execução
 */
export type ExecutionResult = 'success' | 'partial' | 'failed' | 'pending';

/**
 * Períodos de filtro disponíveis
 */
export type ExecutionPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

// ==================== INTERFACES ====================

/**
 * Métricas de resultado de uma execução
 */
export interface ExecutionMetrics {
  roas?: number;
  cpc?: number;
  ctr?: number;
  cpl?: number;
  conversions?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
}

/**
 * Execução de tarefa registrada
 */
export interface TaskExecution {
  id: string;
  userId: string;
  taskId: string | null;
  clientId: string | null;

  // Dados do cliente (join)
  clientName?: string;

  // Dados da tarefa (join)
  taskTitle?: string;

  // Ação
  actionType: ExecutionActionType;
  title: string;
  description?: string;

  // Otimização
  optimizationType?: OptimizationType;
  optimizationDetails?: string;

  // Resultado
  result?: ExecutionResult;
  resultMetrics?: ExecutionMetrics;

  // Executor
  executedBy?: string;
  executedByName?: string;
  executedAt: string;

  // Metadados
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * DTO para criar uma execução
 */
export interface CreateExecutionDTO {
  taskId?: string;
  clientId?: string;
  actionType: ExecutionActionType;
  title: string;
  description?: string;
  optimizationType?: OptimizationType;
  optimizationDetails?: string;
  result?: ExecutionResult;
  resultMetrics?: ExecutionMetrics;
  executedBy?: string;
  executedAt?: string;
  notes?: string;
}

/**
 * DTO para atualizar uma execução
 */
export interface UpdateExecutionDTO {
  title?: string;
  description?: string;
  optimizationType?: OptimizationType;
  optimizationDetails?: string;
  result?: ExecutionResult;
  resultMetrics?: ExecutionMetrics;
  notes?: string;
}

/**
 * Filtros para buscar execuções
 */
export interface ExecutionFilters {
  period?: ExecutionPeriod;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  actionType?: ExecutionActionType;
  optimizationType?: OptimizationType;
  result?: ExecutionResult;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Estatísticas de execuções
 */
export interface ExecutionStats {
  total: number;
  byActionType: Record<ExecutionActionType, number>;
  byResult: Record<ExecutionResult, number>;
  optimizationsCount: number;
  successRate: number;
  periodLabel: string;
}

// ==================== CONFIGS ====================

/**
 * Labels para tipos de ação
 */
export const ACTION_TYPE_LABELS: Record<ExecutionActionType, string> = {
  task_created: 'Tarefa Criada',
  task_started: 'Tarefa Iniciada',
  task_completed: 'Tarefa Concluída',
  task_cancelled: 'Tarefa Cancelada',
  optimization_applied: 'Otimização Aplicada',
  manual_action: 'Ação Manual',
};

/**
 * Labels para tipos de otimização
 */
export const OPTIMIZATION_TYPE_LABELS: Record<OptimizationType, string> = {
  campaign_adjustment: 'Ajuste de Campanha',
  budget_change: 'Alteração de Orçamento',
  targeting_tweak: 'Ajuste de Segmentação',
  creative_update: 'Atualização de Criativo',
  bid_strategy: 'Estratégia de Lance',
  audience_expansion: 'Expansão de Público',
  other: 'Outro',
};

/**
 * Labels para resultados
 */
export const RESULT_LABELS: Record<ExecutionResult, string> = {
  success: 'Sucesso',
  partial: 'Parcial',
  failed: 'Falhou',
  pending: 'Pendente',
};

/**
 * Cores para resultados
 */
export const RESULT_COLORS: Record<ExecutionResult, { bg: string; text: string; border: string }> = {
  success: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  partial: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  failed: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  pending: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
};

/**
 * Labels para períodos de filtro
 */
export const PERIOD_LABELS: Record<ExecutionPeriod, string> = {
  week: 'Última Semana',
  month: 'Último Mês',
  quarter: 'Último Trimestre',
  year: 'Último Ano',
  all: 'Todo o Período',
};

/**
 * Ícones para tipos de ação (Lucide icon names)
 */
export const ACTION_TYPE_ICONS: Record<ExecutionActionType, string> = {
  task_created: 'Plus',
  task_started: 'Play',
  task_completed: 'CheckCircle',
  task_cancelled: 'XCircle',
  optimization_applied: 'Sparkles',
  manual_action: 'Hand',
};

// ==================== UTILS ====================

/**
 * Calcula a data inicial baseada no período
 */
export function getStartDateFromPeriod(period: ExecutionPeriod): Date | null {
  const now = new Date();

  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
      return null;
    default:
      return new Date(now.setMonth(now.getMonth() - 1)); // default: mês
  }
}
