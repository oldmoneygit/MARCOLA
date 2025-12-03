/**
 * @file ai.ts
 * @description Tipos para integração com IA (OpenRouter)
 * @module types
 */

import type { SuggestionSeverity } from './analysis';
import type { CreateClientDTO } from './client';

// ============================================
// SMART CLIENT CREATOR TYPES
// ============================================

/**
 * Resposta da extração de dados do cliente via IA
 */
export interface ParsedClientData {
  /** Dados extraídos do texto */
  extracted: Partial<CreateClientDTO>;
  /** Nível de confiança da extração (0-1) */
  confidence: number;
  /** Campos que não foram encontrados no texto */
  missing_fields: string[];
  /** Sugestões para o usuário */
  suggestions: string[];
  /** Texto original processado */
  original_text: string;
}

/**
 * Status da transcrição de áudio
 */
export type TranscriptionStatus = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

/**
 * Resultado da transcrição de áudio
 */
export interface TranscriptionResult {
  /** Texto transcrito */
  text: string;
  /** Duração do áudio em segundos */
  duration: number;
  /** Idioma detectado */
  language: string;
}

/**
 * Estado do SmartClientCreator
 */
export interface SmartClientState {
  /** Modo de entrada ativo */
  inputMode: 'text' | 'audio';
  /** Texto livre inserido */
  rawText: string;
  /** Status do processamento */
  processingStatus: 'idle' | 'processing' | 'success' | 'error';
  /** Dados parseados pela IA */
  parsedData: ParsedClientData | null;
  /** Mensagem de erro */
  error: string | null;
  /** Status da transcrição */
  transcriptionStatus: TranscriptionStatus;
}

/**
 * Tipos de sugestão gerada pela IA
 */
export type AISuggestionType =
  | 'optimization'
  | 'budget'
  | 'creative'
  | 'audience'
  | 'pause';

/**
 * Ação sugerida pela IA
 */
export interface SuggestionAction {
  /** Texto do botão/ação */
  label: string;
  /** Identificador da ação */
  action: string;
  /** Dados adicionais para a ação */
  data?: Record<string, unknown>;
}

/**
 * Sugestão gerada pela IA
 */
export interface AISuggestion {
  /** Tipo da sugestão */
  type: AISuggestionType;
  /** Severidade/urgência */
  severity: SuggestionSeverity;
  /** Título curto */
  title: string;
  /** Descrição detalhada */
  description: string;
  /** IDs dos anúncios afetados */
  affectedAds: string[];
  /** Ações disponíveis */
  actions: SuggestionAction[];
}

/**
 * Recomendação de otimização
 */
export interface AIRecommendation {
  /** Prioridade da recomendação */
  priority: 'high' | 'medium' | 'low';
  /** Ação recomendada */
  action: string;
  /** Impacto esperado */
  expectedImpact: string;
}

/**
 * Resultado da análise de performance pela IA
 */
export interface AIAnalysisResult {
  /** Resumo executivo */
  summary: string;
  /** Score de performance (0-100) */
  score: number;
  /** Pontos fortes identificados */
  strengths: string[];
  /** Pontos fracos identificados */
  weaknesses: string[];
  /** Oportunidades de melhoria */
  opportunities: string[];
  /** Recomendações detalhadas */
  recommendations: AIRecommendation[];
}

/**
 * Dados de performance de um anúncio para contexto
 */
export interface AdPerformanceData {
  /** ID do anúncio */
  id: string;
  /** Nome do anúncio */
  name: string;
  /** Valor gasto */
  spend: number;
  /** Número de impressões */
  impressions: number;
  /** Número de cliques */
  clicks: number;
  /** Número de conversões */
  conversions: number;
  /** Taxa de cliques (%) */
  ctr: number;
  /** Custo por clique */
  cpc: number;
  /** Custo por aquisição */
  cpa: number;
  /** Status do anúncio */
  status: string;
}

/**
 * Contexto de performance para análise
 */
export interface AdPerformanceContext {
  /** Período da análise */
  period: {
    start: string;
    end: string;
  };
  /** Totais agregados */
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  /** Médias calculadas */
  averages: {
    ctr: number;
    cpc: number;
    cpa: number;
  };
  /** Dados dos anúncios */
  ads: AdPerformanceData[];
}

/**
 * Configuração de modelo para uso
 */
export interface AIModelConfig {
  /** ID do modelo no OpenRouter */
  modelId: string;
  /** Temperatura (criatividade) */
  temperature?: number;
  /** Máximo de tokens na resposta */
  maxTokens?: number;
  /** Top P para sampling */
  topP?: number;
}

/**
 * Status de uma requisição à IA
 */
export type AIRequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Estado de uma requisição à IA
 */
export interface AIRequestState<T = unknown> {
  /** Status atual */
  status: AIRequestStatus;
  /** Dados retornados */
  data: T | null;
  /** Erro se houver */
  error: string | null;
}
