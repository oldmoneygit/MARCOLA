/**
 * @file analysis.ts
 * @description Tipos relacionados ao módulo de análise e sugestões
 * @module types
 */

/**
 * Severidade da sugestão
 */
export type SuggestionSeverity = 'urgent' | 'warning' | 'info';

/**
 * Tipo da sugestão
 */
export type SuggestionType =
  | 'creative_fatigue'
  | 'scale_opportunity'
  | 'pause_ad'
  | 'low_diversity'
  | 'high_cpa'
  | 'low_ctr'
  | 'budget_optimization';

/**
 * Status da sugestão
 */
export type SuggestionStatus = 'pending' | 'applied' | 'dismissed';

/**
 * Interface de sugestão
 */
export interface Suggestion {
  id: string;
  client_id: string;
  user_id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  title: string;
  description: string;
  actions: string[];
  status: SuggestionStatus;
  created_at: string;
  updated_at: string;
}

/**
 * DTO para criar sugestão
 */
export interface CreateSuggestionDTO {
  client_id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  title: string;
  description: string;
  actions: string[];
}

/**
 * Dados de diversidade criativa (Andromeda)
 */
export interface CreativeDiversity {
  clientId: string;
  clientName: string;
  creativesCount: number;
  isOptimal: boolean;
  recommendation: string;
}

/**
 * Resultado da análise de fadiga criativa
 */
export interface FatigueAnalysis {
  adId: string;
  adName: string;
  ctrTrend: number;
  cpaTrend: number;
  isFatigued: boolean;
  severity: SuggestionSeverity;
  daysActive: number;
}

/**
 * Score do algoritmo Andromeda
 */
export interface AndromedaScore {
  score: number;
  status: 'optimal' | 'warning' | 'critical';
  creativesCount: number;
  recommendedMin: number;
  recommendedMax: number;
}

/**
 * Resumo de sugestões por cliente
 */
export interface SuggestionsSummary {
  total: number;
  urgent: number;
  warning: number;
  info: number;
  byClient: {
    clientId: string;
    clientName: string;
    count: number;
  }[];
}
