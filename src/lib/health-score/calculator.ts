/**
 * @file calculator.ts
 * @description Serviço de cálculo automático do Health Score do cliente
 * @module lib/health-score
 */

import type {
  HealthScoreComponents,
  HealthScoreDetails,
  ClientHealthScore,
} from '@/types';
import {
  getHealthScoreLevel,
  getHealthScoreTrend,
  HEALTH_SCORE_COMPONENT_CONFIG,
} from '@/types';

// =============================================================================
// Interfaces de entrada
// =============================================================================

interface ReportData {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  period_start: string;
  period_end: string;
}

interface AdData {
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number | null;
  conversions: number;
}

interface TaskData {
  total: number;
  completed: number;
  overdue: number;
}

interface PaymentData {
  total: number;
  paid: number;
  overdue: number;
  on_time: number;
}

interface ContentData {
  total: number;
  approved: number;
  published: number;
  on_schedule: number;
}

interface ClientData {
  monthly_value: number;
  average_ticket: number | null;
  monthly_ad_budget: number | null;
}

export interface HealthScoreInput {
  clientId: string;
  clientData: ClientData;
  reports: ReportData[];
  ads: AdData[];
  tasks: TaskData;
  payments: PaymentData;
  content: ContentData;
  previousScore: number | null;
}

// =============================================================================
// Benchmarks da indústria para normalização
// =============================================================================

const BENCHMARKS = {
  // Performance de anúncios
  ctr: {
    excellent: 3.0,  // >= 3% CTR é excelente
    good: 1.5,       // >= 1.5% é bom
    warning: 0.8,    // >= 0.8% é aceitável
    min: 0.3,        // abaixo disso é crítico
  },
  cpc: {
    excellent: 0.5,  // <= R$0.50 é excelente
    good: 1.5,       // <= R$1.50 é bom
    warning: 3.0,    // <= R$3.00 é aceitável
    max: 5.0,        // acima disso é crítico
  },
  roas: {
    excellent: 5.0,  // >= 5x é excelente
    good: 3.0,       // >= 3x é bom
    warning: 2.0,    // >= 2x é aceitável
    min: 1.0,        // abaixo disso é crítico
  },
  conversionRate: {
    excellent: 5.0,  // >= 5% é excelente
    good: 2.5,       // >= 2.5% é bom
    warning: 1.0,    // >= 1% é aceitável
    min: 0.5,        // abaixo disso é crítico
  },
  // Engajamento
  taskCompletion: {
    excellent: 90,   // >= 90% é excelente
    good: 70,        // >= 70% é bom
    warning: 50,     // >= 50% é aceitável
    min: 30,         // abaixo disso é crítico
  },
  // Financeiro
  paymentOnTime: {
    excellent: 95,   // >= 95% é excelente
    good: 80,        // >= 80% é bom
    warning: 60,     // >= 60% é aceitável
    min: 40,         // abaixo disso é crítico
  },
  // Compliance
  approvalRate: {
    excellent: 95,   // >= 95% é excelente
    good: 80,        // >= 80% é bom
    warning: 60,     // >= 60% é aceitável
    min: 40,         // abaixo disso é crítico
  },
};

// =============================================================================
// Funções de normalização (0-100)
// =============================================================================

/**
 * Normaliza um valor "quanto maior melhor" para escala 0-100
 */
function normalizeHigherIsBetter(
  value: number,
  benchmark: { excellent: number; good: number; warning: number; min: number }
): number {
  if (value >= benchmark.excellent) {
    return 100;
  }
  if (value >= benchmark.good) {
    // Interpola entre 75-100
    return 75 + ((value - benchmark.good) / (benchmark.excellent - benchmark.good)) * 25;
  }
  if (value >= benchmark.warning) {
    // Interpola entre 50-75
    return 50 + ((value - benchmark.warning) / (benchmark.good - benchmark.warning)) * 25;
  }
  if (value >= benchmark.min) {
    // Interpola entre 25-50
    return 25 + ((value - benchmark.min) / (benchmark.warning - benchmark.min)) * 25;
  }
  // Interpola entre 0-25
  return Math.max(0, (value / benchmark.min) * 25);
}

/**
 * Normaliza um valor "quanto menor melhor" para escala 0-100
 */
function normalizeLowerIsBetter(
  value: number,
  benchmark: { excellent: number; good: number; warning: number; max: number }
): number {
  if (value <= benchmark.excellent) {
    return 100;
  }
  if (value <= benchmark.good) {
    // Interpola entre 75-100
    return 100 - ((value - benchmark.excellent) / (benchmark.good - benchmark.excellent)) * 25;
  }
  if (value <= benchmark.warning) {
    // Interpola entre 50-75
    return 75 - ((value - benchmark.good) / (benchmark.warning - benchmark.good)) * 25;
  }
  if (value <= benchmark.max) {
    // Interpola entre 25-50
    return 50 - ((value - benchmark.warning) / (benchmark.max - benchmark.warning)) * 25;
  }
  // Abaixo de 25
  return Math.max(0, 25 - ((value - benchmark.max) / benchmark.max) * 25);
}

/**
 * Normaliza uma porcentagem diretamente
 */
function normalizePercentage(
  percentage: number,
  benchmark: { excellent: number; good: number; warning: number; min: number }
): number {
  return normalizeHigherIsBetter(percentage, benchmark);
}

// =============================================================================
// Cálculo de componentes
// =============================================================================

/**
 * Calcula o score de performance (35% do total)
 * Baseado em: CTR, CPC, ROAS, taxa de conversão
 */
function calculatePerformanceScore(ads: AdData[]): {
  score: number;
  details: HealthScoreDetails['performance'];
} {
  if (ads.length === 0) {
    return {
      score: 50, // Score neutro se não há dados
      details: {
        ctr: 0,
        cpc: 0,
        conversions: 0,
        roas: 0,
        trend: 'stable',
      },
    };
  }

  // Médias ponderadas por spend (não temos spend por ad, então usamos média simples)
  const avgCtr = ads.reduce((sum, ad) => sum + (ad.ctr || 0), 0) / ads.length;
  const avgCpc = ads.reduce((sum, ad) => sum + (ad.cpc || 0), 0) / ads.length;
  const avgRoas = ads.filter(ad => ad.roas !== null).reduce((sum, ad) => sum + (ad.roas || 0), 0) /
    (ads.filter(ad => ad.roas !== null).length || 1);
  const totalConversions = ads.reduce((sum, ad) => sum + (ad.conversions || 0), 0);

  // Normaliza cada métrica
  const ctrScore = normalizeHigherIsBetter(avgCtr, BENCHMARKS.ctr);
  const cpcScore = normalizeLowerIsBetter(avgCpc, BENCHMARKS.cpc);
  const roasScore = avgRoas > 0 ? normalizeHigherIsBetter(avgRoas, BENCHMARKS.roas) : 50;

  // Conversões - usa uma escala relativa
  const conversionScore = totalConversions > 0
    ? Math.min(100, 50 + (totalConversions * 2))
    : 30;

  // Peso: CTR 25%, CPC 25%, ROAS 30%, Conversões 20%
  const score = (ctrScore * 0.25) + (cpcScore * 0.25) + (roasScore * 0.30) + (conversionScore * 0.20);

  return {
    score: Math.round(score),
    details: {
      ctr: Math.round(avgCtr * 100) / 100,
      cpc: Math.round(avgCpc * 100) / 100,
      conversions: totalConversions,
      roas: Math.round(avgRoas * 100) / 100,
      trend: 'stable', // Será calculado comparando com período anterior
    },
  };
}

/**
 * Calcula o score de engajamento (25% do total)
 * Baseado em: taxa de conclusão de tarefas, frequência de interação
 */
function calculateEngagementScore(tasks: TaskData): {
  score: number;
  details: HealthScoreDetails['engagement'];
} {
  const taskCompletionRate = tasks.total > 0
    ? (tasks.completed / tasks.total) * 100
    : 50;

  const overdueRate = tasks.total > 0
    ? (tasks.overdue / tasks.total) * 100
    : 0;

  // Penaliza tarefas atrasadas
  const taskScore = normalizePercentage(taskCompletionRate, BENCHMARKS.taskCompletion);
  const overduePenalty = overdueRate > 0 ? Math.min(20, overdueRate / 2) : 0;

  const score = Math.max(0, taskScore - overduePenalty);

  return {
    score: Math.round(score),
    details: {
      response_rate: 0, // Não temos dados de resposta ainda
      task_completion: Math.round(taskCompletionRate),
      meeting_attendance: 100, // Placeholder - assumimos 100% por padrão
      feedback_frequency: 0, // Não temos dados de feedback ainda
    },
  };
}

/**
 * Calcula o score financeiro (25% do total)
 * Baseado em: pontualidade de pagamentos, utilização de orçamento
 */
function calculateFinancialScore(
  payments: PaymentData,
  clientData: ClientData
): {
  score: number;
  details: HealthScoreDetails['financial'];
} {
  const paymentOnTimeRate = payments.total > 0
    ? (payments.on_time / payments.total) * 100
    : 100; // Se não há pagamentos, assume 100%

  const overdueRate = payments.total > 0
    ? (payments.overdue / payments.total) * 100
    : 0;

  // Score base de pagamentos
  const paymentScore = normalizePercentage(paymentOnTimeRate, BENCHMARKS.paymentOnTime);

  // Penalidade severa para pagamentos atrasados
  const overduePenalty = overdueRate > 0 ? Math.min(30, overdueRate) : 0;

  const score = Math.max(0, paymentScore - overduePenalty);

  return {
    score: Math.round(score),
    details: {
      payment_timeliness: Math.round(paymentOnTimeRate),
      budget_utilization: 80, // Placeholder - precisaria de dados de gastos vs orçamento
      contract_value: clientData.monthly_value || 0,
      growth_rate: 0, // Precisaria de histórico para calcular
    },
  };
}

/**
 * Calcula o score de compliance (15% do total)
 * Baseado em: taxa de aprovação de conteúdo, aderência a prazos
 */
function calculateComplianceScore(content: ContentData): {
  score: number;
  details: HealthScoreDetails['compliance'];
} {
  const approvalRate = content.total > 0
    ? (content.approved / content.total) * 100
    : 80; // Se não há conteúdo, assume 80%

  const publishedRate = content.total > 0
    ? (content.published / content.total) * 100
    : 50;

  const onScheduleRate = content.total > 0
    ? (content.on_schedule / content.total) * 100
    : 80;

  // Score de aprovação
  const approvalScore = normalizePercentage(approvalRate, BENCHMARKS.approvalRate);

  // Score de publicação
  const publishScore = publishedRate > 0 ? Math.min(100, publishedRate + 20) : 50;

  // Score de prazo
  const scheduleScore = normalizePercentage(onScheduleRate, BENCHMARKS.approvalRate);

  // Peso: Aprovação 40%, Publicação 30%, Prazo 30%
  const score = (approvalScore * 0.4) + (publishScore * 0.3) + (scheduleScore * 0.3);

  return {
    score: Math.round(score),
    details: {
      content_approval_rate: Math.round(approvalRate),
      brand_guidelines_adherence: 80, // Placeholder
      deadline_compliance: Math.round(onScheduleRate),
      communication_quality: 75, // Placeholder
    },
  };
}

// =============================================================================
// Geração de recomendações
// =============================================================================

function generateRecommendations(
  components: HealthScoreComponents,
  details: HealthScoreDetails
): string[] {
  const recommendations: string[] = [];

  // Performance
  if (components.performance_score < 50) {
    if (details.performance.ctr < BENCHMARKS.ctr.warning) {
      recommendations.push('CTR abaixo do esperado - considere revisar criativos e segmentação');
    }
    if (details.performance.cpc > BENCHMARKS.cpc.warning) {
      recommendations.push('CPC alto - otimize lances e qualidade dos anúncios');
    }
    if (details.performance.roas < BENCHMARKS.roas.warning) {
      recommendations.push('ROAS baixo - revise estratégia de conversão e funil de vendas');
    }
  }

  // Engajamento
  if (components.engagement_score < 50) {
    if (details.engagement.task_completion < 50) {
      recommendations.push('Baixa taxa de conclusão de tarefas - priorize tarefas pendentes');
    }
  }

  // Financeiro
  if (components.financial_score < 50) {
    if (details.financial.payment_timeliness < 70) {
      recommendations.push('Pagamentos frequentemente atrasados - revisar comunicação de cobrança');
    }
  }

  // Compliance
  if (components.compliance_score < 50) {
    if (details.compliance.content_approval_rate < 70) {
      recommendations.push('Taxa de aprovação de conteúdo baixa - alinhar expectativas com cliente');
    }
    if (details.compliance.deadline_compliance < 70) {
      recommendations.push('Prazos não estão sendo cumpridos - revisar planejamento de conteúdo');
    }
  }

  // Se tudo está bem
  if (recommendations.length === 0) {
    recommendations.push('Cliente em bom estado - mantenha o acompanhamento regular');
  }

  return recommendations;
}

// =============================================================================
// Função principal de cálculo
// =============================================================================

/**
 * Calcula o Health Score completo de um cliente
 */
export function calculateHealthScore(input: HealthScoreInput): ClientHealthScore {
  // Calcula cada componente
  const performance = calculatePerformanceScore(input.ads);
  const engagement = calculateEngagementScore(input.tasks);
  const financial = calculateFinancialScore(input.payments, input.clientData);
  const compliance = calculateComplianceScore(input.content);

  // Monta os componentes
  const components: HealthScoreComponents = {
    performance_score: performance.score,
    engagement_score: engagement.score,
    financial_score: financial.score,
    compliance_score: compliance.score,
  };

  // Monta os detalhes
  const details: HealthScoreDetails = {
    performance: performance.details,
    engagement: engagement.details,
    financial: financial.details,
    compliance: compliance.details,
  };

  // Calcula score geral com pesos
  const weights = HEALTH_SCORE_COMPONENT_CONFIG;
  const overallScore = Math.round(
    (components.performance_score * weights.performance_score.weight) +
    (components.engagement_score * weights.engagement_score.weight) +
    (components.financial_score * weights.financial_score.weight) +
    (components.compliance_score * weights.compliance_score.weight)
  );

  // Determina nível e tendência
  const level = getHealthScoreLevel(overallScore);
  const trend = getHealthScoreTrend(overallScore, input.previousScore);

  // Gera recomendações
  const recommendations = generateRecommendations(components, details);

  return {
    client_id: input.clientId,
    overall_score: overallScore,
    level,
    components,
    details,
    calculated_at: new Date().toISOString(),
    previous_score: input.previousScore,
    trend,
    recommendations,
  };
}

/**
 * Calcula score simplificado quando não há dados suficientes
 */
export function calculateSimplifiedHealthScore(
  clientId: string,
  hasReports: boolean,
  hasTasks: boolean,
  hasPayments: boolean,
  previousScore: number | null
): ClientHealthScore {
  // Score base de 60 (bom)
  let baseScore = 60;

  // Ajusta baseado na presença de dados
  if (!hasReports) {
    baseScore -= 10;
  }
  if (!hasTasks) {
    baseScore -= 5;
  }
  if (!hasPayments) {
    baseScore -= 5;
  }

  const level = getHealthScoreLevel(baseScore);
  const trend = getHealthScoreTrend(baseScore, previousScore);

  return {
    client_id: clientId,
    overall_score: baseScore,
    level,
    components: {
      performance_score: hasReports ? 60 : 50,
      engagement_score: hasTasks ? 60 : 50,
      financial_score: hasPayments ? 70 : 50,
      compliance_score: 60,
    },
    details: {
      performance: { ctr: 0, cpc: 0, conversions: 0, roas: 0, trend: 'stable' },
      engagement: { response_rate: 0, task_completion: 0, meeting_attendance: 100, feedback_frequency: 0 },
      financial: { payment_timeliness: 100, budget_utilization: 0, contract_value: 0, growth_rate: 0 },
      compliance: { content_approval_rate: 80, brand_guidelines_adherence: 80, deadline_compliance: 80, communication_quality: 75 },
    },
    calculated_at: new Date().toISOString(),
    previous_score: previousScore,
    trend,
    recommendations: [
      'Dados insuficientes para análise completa',
      hasReports ? '' : 'Importe relatórios de anúncios para melhorar a análise',
      hasTasks ? '' : 'Crie tarefas para acompanhar o engajamento',
      hasPayments ? '' : 'Registre pagamentos para análise financeira',
    ].filter(Boolean),
  };
}
