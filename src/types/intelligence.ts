/**
 * @file intelligence.ts
 * @description Tipos para o sistema de Client Intelligence
 * @module types
 */

import type { ContentType, Platform } from './calendar';

// =============================================================================
// Knowledge Base Types
// =============================================================================

/**
 * Perfil básico do cliente na base de conhecimento
 */
export interface KnowledgeBaseProfile {
  business_name: string;
  segment: string;
  niche_details: string;
  location: string;
  operating_since?: string;
}

/**
 * Informações de contato na base de conhecimento
 */
export interface KnowledgeBaseContact {
  primary_name: string;
  phone: string;
  email: string;
  best_contact_time?: string;
}

/**
 * Informações financeiras na base de conhecimento
 */
export interface KnowledgeBaseFinancial {
  monthly_fee: number;
  payment_day: number;
  average_ticket: number;
  profit_margin?: number;
  monthly_ad_budget?: number;
  total_received?: number;
}

/**
 * Presença digital na base de conhecimento
 */
export interface KnowledgeBaseDigitalPresence {
  instagram?: string;
  facebook?: string;
  website?: string;
  google_business?: string;
  other_platforms?: string[];
}

/**
 * Estratégia na base de conhecimento
 */
export interface KnowledgeBaseStrategy {
  main_objectives: string[];
  target_audience: string;
  unique_selling_points: string[];
  competitors?: string[];
  tone_of_voice?: string;
  content_pillars?: string[];
}

/**
 * Recursos disponíveis na base de conhecimento
 */
export interface KnowledgeBaseResources {
  has_photos: boolean;
  has_videos: boolean;
  has_testimonials: boolean;
  brand_assets?: string;
  drive_folder?: string;
}

/**
 * Análise de nicho na base de conhecimento
 */
export interface KnowledgeBaseNicheAnalysis {
  market_position: string;
  growth_opportunities: string[];
  main_challenges: string[];
  seasonal_peaks: string[];
}

/**
 * Metadados da base de conhecimento
 */
export interface KnowledgeBaseMeta {
  completeness_score: number;
  last_updated: string;
  version: number;
}

/**
 * Base de conhecimento completa do cliente
 */
export interface ClientKnowledgeBase {
  profile: KnowledgeBaseProfile;
  contact: KnowledgeBaseContact;
  financial: KnowledgeBaseFinancial;
  digital_presence: KnowledgeBaseDigitalPresence;
  strategy: KnowledgeBaseStrategy;
  resources: KnowledgeBaseResources;
  niche_analysis: KnowledgeBaseNicheAnalysis;
  meta: KnowledgeBaseMeta;
}

// =============================================================================
// Content Suggestions Types
// =============================================================================

/**
 * Objetivo do conteúdo
 */
export type ContentObjective = 'awareness' | 'engagement' | 'conversion' | 'retention';

/**
 * Prioridade do conteúdo
 */
export type ContentPriority = 'high' | 'medium' | 'low';

/**
 * Esforço estimado para criação
 */
export type ContentEffort = 'quick' | 'medium' | 'complex';

/**
 * Sugestão de conteúdo personalizada
 */
export interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  platform: Platform[];
  objective: ContentObjective;
  priority: ContentPriority;
  estimated_effort: ContentEffort;
  suggested_copy?: string;
  visual_suggestion?: string;
  hashtags?: string[];
  best_time_to_post?: string;
  based_on: string;
  reasoning: string;
}

// =============================================================================
// Seasonal Offers Types
// =============================================================================

/**
 * Tipo de ângulo criativo para ofertas
 */
export type CreativeAngleType =
  | 'bundle'
  | 'gamification'
  | 'upsell'
  | 'partnership'
  | 'early_bird'
  | 'referral'
  | 'guarantee'
  | 'experience'
  | 'scarcity'
  | 'giveaway'
  | 'percentage'
  | 'fixed';

/**
 * Ângulo criativo para uma oferta
 */
export interface OfferAngle {
  angle_name: string;
  offer_type: CreativeAngleType;
  offer_description: string;
  discount_value?: string;
  original_price: number;
  offer_price: number;
  margin_impact: number;
  break_even_sales: number;
  target_audience: string;
  hook: string;
  why_this_works: string;
}

/**
 * Nível de orçamento
 */
export type BudgetLevel = 'minimum' | 'recommended' | 'aggressive';

/**
 * Opção de orçamento para oferta
 */
export interface BudgetOption {
  level: BudgetLevel;
  budget: number;
  expected_reach: string;
  expected_leads: string;
  expected_sales: string;
  roi_estimate: string;
}

/**
 * Timeline da oferta
 */
export interface OfferTimeline {
  teaser_start: string;
  promotion_start: string;
  peak_day: string;
  promotion_end: string;
}

/**
 * Oferta sazonal completa
 */
export interface SeasonalOffer {
  id: string;
  title: string;
  description: string;
  seasonal_date: string;
  seasonal_name: string;
  offer_angles: OfferAngle[];
  budget_options: BudgetOption[];
  timeline: OfferTimeline;
  relevance_score: number;
  reasoning: string;
}

// =============================================================================
// Client Intelligence Types
// =============================================================================

/**
 * Inteligência completa do cliente
 */
export interface ClientIntelligence {
  id: string;
  client_id: string;
  user_id: string;
  knowledge_base: ClientKnowledgeBase | null;
  executive_summary: string | null;
  content_suggestions: ContentSuggestion[];
  seasonal_offers: SeasonalOffer[];
  ai_model: string;
  tokens_used: number;
  last_generated_at: string;
  generation_count: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DTOs
// =============================================================================

/**
 * DTO para gerar inteligência
 */
export interface GenerateIntelligenceDTO {
  client_id: string;
  force?: boolean;
}

/**
 * DTO para regenerar inteligência
 */
export interface RegenerateIntelligenceDTO {
  client_id: string;
  force?: boolean;
}

/**
 * Resposta da API de inteligência
 */
export interface IntelligenceResponse {
  success: boolean;
  data?: ClientIntelligence;
  error?: string;
}

// =============================================================================
// UI Helper Types
// =============================================================================

/**
 * Estado do hook useClientIntelligence
 */
export interface UseClientIntelligenceState {
  intelligence: ClientIntelligence | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
}

/**
 * Configuração de emoji/ícone por tipo de conteúdo
 */
export const CONTENT_TYPE_EMOJI: Record<ContentType, string> = {
  post: '📸',
  video: '🎬',
  reels: '🎞️',
  stories: '📱',
  promo: '🎯',
  campaign: '🚀',
  event: '📅',
  other: '📌',
  meeting: '🤝',
};

/**
 * Cores por prioridade
 */
export const PRIORITY_COLORS: Record<ContentPriority, { bg: string; text: string; border: string }> = {
  high: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  medium: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
  },
  low: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
};

/**
 * Labels de esforço
 */
export const EFFORT_LABELS: Record<ContentEffort, string> = {
  quick: '⚡ Rápido',
  medium: '🔧 Médio',
  complex: '🏗️ Complexo',
};

/**
 * Labels de tipo de ângulo criativo
 */
export const CREATIVE_ANGLE_LABELS: Record<CreativeAngleType, { label: string; emoji: string }> = {
  bundle: { label: 'Combo/Bundle', emoji: '📦' },
  gamification: { label: 'Gamificação', emoji: '🎮' },
  upsell: { label: 'Upsell', emoji: '⬆️' },
  partnership: { label: 'Parceria', emoji: '🤝' },
  early_bird: { label: 'Early Bird', emoji: '🐦' },
  referral: { label: 'Indicação', emoji: '👥' },
  guarantee: { label: 'Garantia', emoji: '✅' },
  experience: { label: 'Experiência', emoji: '✨' },
  scarcity: { label: 'Escassez', emoji: '⏰' },
  giveaway: { label: 'Sorteio', emoji: '🎁' },
  percentage: { label: 'Desconto %', emoji: '💰' },
  fixed: { label: 'Valor Fixo', emoji: '💵' },
};
