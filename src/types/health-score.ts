/**
 * @file health-score.ts
 * @description Tipos relacionados ao Health Score do cliente
 * @module types
 */

/** Nível do Health Score */
export type HealthScoreLevel = 'critical' | 'warning' | 'good' | 'excellent';

/** Componentes do Health Score */
export interface HealthScoreComponents {
  performance_score: number;
  engagement_score: number;
  financial_score: number;
  compliance_score: number;
}

/** Detalhes do cálculo de cada componente */
export interface HealthScoreDetails {
  performance: {
    ctr: number;
    cpc: number;
    conversions: number;
    roas: number;
    trend: 'up' | 'down' | 'stable';
  };
  engagement: {
    response_rate: number;
    task_completion: number;
    meeting_attendance: number;
    feedback_frequency: number;
  };
  financial: {
    payment_timeliness: number;
    budget_utilization: number;
    contract_value: number;
    growth_rate: number;
  };
  compliance: {
    content_approval_rate: number;
    brand_guidelines_adherence: number;
    deadline_compliance: number;
    communication_quality: number;
  };
}

/**
 * Histórico de Health Score
 */
export interface HealthScoreHistory {
  id: string;
  client_id: string;
  performance_score: number | null;
  engagement_score: number | null;
  financial_score: number | null;
  compliance_score: number | null;
  overall_score: number | null;
  details: HealthScoreDetails | null;
  calculated_at: string;
}

/**
 * Health Score completo do cliente
 */
export interface ClientHealthScore {
  client_id: string;
  overall_score: number;
  level: HealthScoreLevel;
  components: HealthScoreComponents;
  details: HealthScoreDetails;
  calculated_at: string;
  previous_score: number | null;
  trend: 'up' | 'down' | 'stable';
  recommendations: string[];
}

// =============================================================================
// Funções de cálculo
// =============================================================================

/**
 * Calcula o nível do Health Score baseado no valor
 */
export function getHealthScoreLevel(score: number): HealthScoreLevel {
  if (score >= 80) {
    return 'excellent';
  }
  if (score >= 60) {
    return 'good';
  }
  if (score >= 40) {
    return 'warning';
  }
  return 'critical';
}

/**
 * Calcula a tendência baseada na diferença de scores
 */
export function getHealthScoreTrend(
  current: number,
  previous: number | null
): 'up' | 'down' | 'stable' {
  if (previous === null) {
    return 'stable';
  }
  const diff = current - previous;
  if (diff > 2) {
    return 'up';
  }
  if (diff < -2) {
    return 'down';
  }
  return 'stable';
}

// =============================================================================
// Configuração
// =============================================================================

export const HEALTH_SCORE_LEVEL_CONFIG: Record<HealthScoreLevel, {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}> = {
  excellent: {
    label: 'Excelente',
    icon: 'trophy',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    description: 'Cliente em ótimo estado, performance acima da média',
  },
  good: {
    label: 'Bom',
    icon: 'thumbs-up',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/50',
    description: 'Cliente estável, com bom desempenho geral',
  },
  warning: {
    label: 'Atenção',
    icon: 'alert-triangle',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    description: 'Cliente precisa de atenção em algumas áreas',
  },
  critical: {
    label: 'Crítico',
    icon: 'alert-circle',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/50',
    description: 'Cliente em situação crítica, ação imediata necessária',
  },
};

export const HEALTH_SCORE_COMPONENT_CONFIG: Record<keyof HealthScoreComponents, {
  label: string;
  icon: string;
  weight: number;
  description: string;
}> = {
  performance_score: {
    label: 'Performance',
    icon: 'trending-up',
    weight: 0.35,
    description: 'Métricas de anúncios: CTR, CPC, ROAS, conversões',
  },
  engagement_score: {
    label: 'Engajamento',
    icon: 'users',
    weight: 0.25,
    description: 'Interação do cliente: respostas, reuniões, feedback',
  },
  financial_score: {
    label: 'Financeiro',
    icon: 'dollar-sign',
    weight: 0.25,
    description: 'Pagamentos, orçamento, valor do contrato',
  },
  compliance_score: {
    label: 'Compliance',
    icon: 'check-circle',
    weight: 0.15,
    description: 'Aprovações, prazos, aderência às guidelines',
  },
};
