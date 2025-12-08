/**
 * @file lead-sniper-v3.ts
 * @description Tipos para o Lead Sniper v3 AI com icebreakers gerados por IA
 * @module types
 */

// ==================== REQUEST v3 ====================

export interface LeadSniperV3Request {
  /** Tipo de negócio para buscar (ex: "academia", "restaurante") */
  tipo_negocio: string;
  /** Cidade para buscar */
  cidade: string;
  /** Estado (default: "SP") */
  estado?: string;
  /** Quantidade de leads (default: 20, max: 50) */
  quantidade?: number;
  /** Nome da agência para personalização */
  nome_agencia?: string;
  /** Especialidade da agência */
  especialidade?: string;
  /** Proposta de valor */
  proposta?: string;
  /** Tom de voz para icebreakers */
  tom_voz?: 'profissional' | 'amigável' | 'descontraído' | 'formal';
}

// ==================== RESPONSE v3 ====================

export interface LeadSniperV3Response {
  success: boolean;
  versao: string;
  requestId: string;
  error?: string;

  meta: {
    tipoNegocio: string;
    cidade: string;
    estado: string;
    fonte: string;
    iaModel: string;
    executadoEm: string;
  };

  estatisticas: {
    total: number;
    hot: number;
    warm: number;
    cool: number;
    comWhatsapp: number;
    comSite: number;
    semSite: number;
    sitesScraped: number;
    icebreakersPorIA: number;
    icebreakersFallback: number;
    comIcebreaker: number;
  };

  leads: LeadV3[];
}

// ==================== LEAD v3 ====================

/** Classificação do lead (v3 não tem COLD) */
export type LeadClassificacaoV3 = 'HOT' | 'WARM' | 'COOL';

/** Oportunidades identificadas */
export type LeadOportunidadeV3 =
  | 'SEM_SITE'
  | 'SITE_HTTP'
  | 'POUCAS_AVALIACOES'
  | 'RATING_BAIXO'
  | 'BOA_REPUTACAO'
  | 'SEM_HORARIO'
  | 'SEM_CONTATO';

/** Gatilhos para icebreaker */
export type GatilhoIcebreaker = 'dor' | 'oportunidade' | 'elogio' | 'curiosidade' | 'urgencia';

/** Informações do site scraped */
export interface SiteInfoV3 {
  title: string;
  description: string;
  h1: string;
}

/** Lead retornado pela API v3 */
export interface LeadV3 {
  /** ID interno do lead (número sequencial) */
  id: number;
  /** Nome da empresa */
  nome: string;
  /** Endereço completo */
  endereco: string;
  /** Bairro */
  bairro: string;
  /** Cidade */
  cidade: string;
  /** Telefone formatado */
  telefone: string;
  /** Link direto para WhatsApp */
  linkWhatsapp: string | null;
  /** URL do website */
  website: string | null;
  /** Nota no Google */
  rating: number;
  /** Total de avaliações */
  totalAvaliacoes: number;
  /** Categoria do negócio no Google */
  categoria: string;
  /** Google Place ID */
  placeId: string;
  /** URL do Google Maps */
  googleMapsUrl: string;
  /** Tipo de negócio buscado */
  tipoNegocio: string;
  /** Oportunidades identificadas */
  oportunidades: LeadOportunidadeV3[];
  /** Score de 0-100 */
  score: number;
  /** Classificação HOT/WARM/COOL */
  classificacao: LeadClassificacaoV3;
  /** Fonte dos dados */
  fonte: string;
  /** Se o site foi scraped */
  siteScraped: boolean;
  /** Informações extraídas do site */
  siteInfo: SiteInfoV3 | null;
  /** Mensagem de icebreaker personalizada */
  icebreaker: string;
  /** Gatilho usado no icebreaker */
  gatilho: string;
  /** Se foi gerado por IA ou fallback */
  icebreakerGeradoPorIA: boolean;
  /** Timestamp de enriquecimento */
  enrichedAt: string;
}

// ==================== TIPOS PARA NICHOS v3 ====================

export const NICHOS_V3 = [
  { value: 'academia', label: 'Academia/Gym' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'clinica', label: 'Clínica Médica' },
  { value: 'dentista', label: 'Dentista' },
  { value: 'salao', label: 'Salão de Beleza' },
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'pet', label: 'Pet Shop/Veterinário' },
  { value: 'oficina', label: 'Oficina Mecânica' },
  { value: 'loja', label: 'Loja/Comércio' },
  { value: 'imobiliaria', label: 'Imobiliária' },
  { value: 'advocacia', label: 'Advocacia' },
  { value: 'contabilidade', label: 'Contabilidade' },
  { value: 'escola', label: 'Escola/Curso' },
  { value: 'hotel', label: 'Hotel/Pousada' },
  { value: 'outro', label: 'Outro' },
] as const;

export type NichoV3 = (typeof NICHOS_V3)[number]['value'];

export const ESTADOS_BRASIL = [
  'SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE', 'DF', 'GO', 'ES',
  'PA', 'MA', 'MT', 'MS', 'PB', 'RN', 'AL', 'SE', 'PI', 'RO', 'TO', 'AC', 'AM', 'AP', 'RR',
] as const;

export type EstadoBrasil = (typeof ESTADOS_BRASIL)[number];

export const TONS_VOZ = [
  { value: 'profissional', label: 'Profissional' },
  { value: 'amigável', label: 'Amigável' },
  { value: 'descontraído', label: 'Descontraído' },
  { value: 'formal', label: 'Formal' },
] as const;

export type TomVoz = (typeof TONS_VOZ)[number]['value'];

// ==================== LIMITES v3 ====================

export const LEAD_SNIPER_V3_LIMITS = {
  MIN_QUANTIDADE: 5,
  MAX_QUANTIDADE: 50,
  DEFAULT_QUANTIDADE: 20,
  DEFAULT_ESTADO: 'SP',
  DEFAULT_TOM_VOZ: 'profissional',
  /** Timeout em ms (10 minutos - workflows podem demorar) */
  TIMEOUT: 10 * 60 * 1000,
} as const;

// ==================== MAPEAMENTO DB ====================

/**
 * Mapeia um lead v3 para o formato do banco de dados
 */
export interface LeadV3DbInsert {
  pesquisa_id: string;
  user_id: string;
  lead_sniper_id: number;
  place_id: string;
  nome: string;
  endereco: string;
  bairro: string | null;
  cidade: string;
  estado: string;
  telefone: string | null;
  link_whatsapp: string | null;
  website: string | null;
  rating: number | null;
  total_avaliacoes: number;
  categoria: string | null;
  google_maps_url: string;
  tipo_negocio: string;
  oportunidades: string[];
  score: number;
  classificacao: LeadClassificacaoV3;
  fonte: string;
  site_scraped: boolean;
  site_info: SiteInfoV3 | null;
  icebreaker: string;
  gatilho: string;
  icebreaker_gerado_por_ia: boolean;
  enriched_at: string;
  status: 'NOVO';
}

/**
 * Interface para pesquisa v3
 */
export interface PesquisaV3DbInsert {
  user_id: string;
  request_id: string;
  tipo_negocio: string;
  cidade: string;
  estado: string;
  quantidade: number;
  nome_agencia: string | null;
  especialidade: string | null;
  tom_voz: string | null;
  total_leads: number;
  leads_hot: number;
  leads_warm: number;
  leads_cool: number;
  com_whatsapp: number;
  com_site: number;
  sem_site: number;
  sites_scraped: number;
  icebreakers_por_ia: number;
  status: 'processing' | 'completed' | 'failed';
  versao: string;
}
