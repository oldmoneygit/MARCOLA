/**
 * @file audit.ts
 * @description Tipos relacionados ao sistema de auditorias
 * @module types
 */

/** Tipo de auditoria */
export type AuditType = 'funnel' | 'competitor' | 'brand' | 'mystery_shopper';

/** Status da auditoria */
export type AuditStatus = 'draft' | 'completed' | 'shared';

// =============================================================================
// Auditoria de Funil
// =============================================================================

export interface FunnelStage {
  name: string;
  conversion_rate: number;
  avg_time: string;
  bottlenecks: string[];
  recommendations: string[];
  score: number;
}

export interface FunnelChannel {
  channel: 'whatsapp' | 'instagram' | 'phone' | 'website' | 'app';
  response_time: string;
  quality_score: number;
  issues: string[];
}

export interface FunnelScript {
  name: string;
  is_updated: boolean;
  effectiveness_score: number;
  suggestions: string[];
}

export interface FunnelAuditData {
  stages: FunnelStage[];
  channels: FunnelChannel[];
  scripts: FunnelScript[];
}

// =============================================================================
// Auditoria de Concorrência
// =============================================================================

export interface CompetitorAnalysis {
  name: string;
  instagram?: string;
  website?: string;
  ads_analysis: {
    active_ads_count: number;
    main_offers: string[];
    creative_types: string[];
    hooks_used: string[];
    estimated_budget: 'low' | 'medium' | 'high';
    quality_score: number;
  };
  positioning: {
    price_level: 'economy' | 'mid' | 'premium';
    main_differentiators: string[];
    target_audience: string;
    tone_of_voice: string;
  };
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface CompetitorAuditData {
  competitors: CompetitorAnalysis[];
  market_gaps: string[];
  differentiation_opportunities: string[];
  threats_to_watch: string[];
  recommended_actions: string[];
}

// =============================================================================
// Auditoria de Marca
// =============================================================================

export interface BrandAuditData {
  visual_consistency: {
    score: number;
    colors_aligned: boolean;
    typography_aligned: boolean;
    imagery_aligned: boolean;
    issues: string[];
  };
  tone_of_voice: {
    score: number;
    consistency: number;
    brand_alignment: number;
    issues: string[];
  };
  positioning: {
    score: number;
    clarity: number;
    differentiation: number;
    value_perception: number;
    issues: string[];
  };
  recommendations: string[];
}

// =============================================================================
// Auditoria Fantasma (Cliente Oculto)
// =============================================================================

export interface DeliveryAudit {
  order_time: string;
  delivery_time: string;
  total_time_minutes: number;
  packaging_score: number;
  food_presentation_score: number;
  food_temperature_score: number;
  delivery_person_score: number;
  app_experience_score: number;
  issues_found: string[];
}

export interface GymAudit {
  first_contact_score: number;
  reception_score: number;
  tour_score: number;
  sales_approach_score: number;
  facilities_score: number;
  cleanliness_score: number;
  equipment_score: number;
  staff_friendliness_score: number;
  issues_found: string[];
}

export interface ServiceAudit {
  initial_contact_score: number;
  professionalism_score: number;
  knowledge_score: number;
  response_time_score: number;
  follow_up_score: number;
  issues_found: string[];
}

export interface MysteryShopperAuditData {
  audit_subtype: 'delivery' | 'gym' | 'service';
  delivery_audit?: DeliveryAudit;
  gym_audit?: GymAudit;
  service_audit?: ServiceAudit;
  photos: string[];
  positive_highlights: string[];
  comparison_with_competitors?: string;
}

// =============================================================================
// Audit Entity
// =============================================================================

export type AuditData = FunnelAuditData | CompetitorAuditData | BrandAuditData | MysteryShopperAuditData;

export interface Audit {
  id: string;
  user_id: string;
  client_id: string;
  type: AuditType;
  title: string;
  description: string | null;
  data: AuditData;
  overall_score: number | null;
  critical_issues: string[];
  quick_wins: string[];
  recommendations: string[];
  attachments: string[];
  status: AuditStatus;
  shared_with_client: boolean;
  shared_at: string | null;
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

export interface CreateAuditDTO {
  client_id: string;
  type: AuditType;
  title: string;
  description?: string;
  data?: Partial<AuditData>;
}

export interface UpdateAuditDTO {
  title?: string;
  description?: string;
  data?: Partial<AuditData>;
  overall_score?: number;
  critical_issues?: string[];
  quick_wins?: string[];
  recommendations?: string[];
  attachments?: string[];
  status?: AuditStatus;
  shared_with_client?: boolean;
}

// =============================================================================
// Configuração
// =============================================================================

export const AUDIT_TYPE_CONFIG: Record<AuditType, {
  label: string;
  icon: string;
  description: string;
  bgColor: string;
  textColor: string;
}> = {
  funnel: {
    label: 'Auditoria de Funil',
    icon: 'filter',
    description: 'Mapear fluxo: Anúncio → Lead → Venda',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
  },
  competitor: {
    label: 'Auditoria de Concorrência',
    icon: 'users',
    description: 'Analisar estratégias dos competidores',
    bgColor: 'bg-violet-500/20',
    textColor: 'text-violet-400',
  },
  brand: {
    label: 'Auditoria de Marca',
    icon: 'palette',
    description: 'Consistência visual e tom de voz',
    bgColor: 'bg-pink-500/20',
    textColor: 'text-pink-400',
  },
  mystery_shopper: {
    label: 'Auditoria Fantasma',
    icon: 'user-secret',
    description: 'Experiência como cliente oculto',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
  },
};

export const AUDIT_STATUS_CONFIG: Record<AuditStatus, {
  label: string;
  bgColor: string;
  textColor: string;
}> = {
  draft: {
    label: 'Rascunho',
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-400',
  },
  completed: {
    label: 'Concluída',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
  },
  shared: {
    label: 'Compartilhada',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
  },
};
