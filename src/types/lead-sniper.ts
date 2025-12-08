/**
 * @file lead-sniper.ts
 * @description Tipos para o sistema Lead Sniper de pesquisa de mercado
 * @module types
 */

// ==================== TIPOS DE NEGÓCIO ====================

export type TipoNegocio =
  // Saúde & Fitness
  | 'gym'
  | 'physiotherapist'
  | 'spa'
  // Alimentação
  | 'restaurant'
  | 'cafe'
  | 'bakery'
  | 'bar'
  | 'meal_delivery'
  // Beleza & Estética
  | 'beauty_salon'
  | 'hair_care'
  | 'nail_salon'
  // Saúde
  | 'dentist'
  | 'doctor'
  | 'veterinary_care'
  | 'pharmacy'
  | 'hospital'
  // Pets
  | 'pet_store'
  // Imóveis & Construção
  | 'real_estate_agency'
  | 'general_contractor'
  | 'hardware_store'
  // Automotivo
  | 'car_dealer'
  | 'car_repair'
  | 'car_wash'
  // Varejo
  | 'clothing_store'
  | 'shoe_store'
  | 'jewelry_store'
  | 'electronics_store'
  | 'furniture_store'
  | 'home_goods_store'
  | 'supermarket'
  // Serviços Profissionais
  | 'lawyer'
  | 'accounting'
  | 'insurance_agency'
  // Educação
  | 'school'
  | 'university'
  | 'driving_school'
  | 'language_school'
  // Eventos & Lazer
  | 'event_venue'
  | 'night_club'
  | 'movie_theater'
  | 'bowling_alley'
  // Hospedagem
  | 'lodging'
  | 'campground';

export interface TipoNegocioInfo {
  id: TipoNegocio;
  nome: string;
  nomePlural: string;
  icone: string;
}

// ==================== CIDADE ====================

export interface CidadeConfig {
  nome: string;
  lat: number;
  lng: number;
  raio: number;
}

export interface CidadeProspeccao {
  id: string;
  nome: string;
  estado: string;
  lat: number;
  lng: number;
  raioPadrao: number;
  regiao: string;
  ativo: boolean;
}

// ==================== PESQUISA DE MERCADO ====================

export interface PesquisaMercadoParams {
  tipo: TipoNegocio;
  cidades: CidadeConfig[];
  scoreMinimo?: number;
  maxPorCidade?: number;
  clienteId?: string;
}

export interface PesquisaMercado {
  id: string;
  userId: string;
  clienteId?: string;
  requestId: string;
  tipoNegocio: TipoNegocio;
  cidadesBuscadas: CidadeConfig[];
  scoreMinimo: number;
  maxPorCidade: number;
  totalLeads: number;
  leadsHot: number;
  leadsWarm: number;
  leadsCool: number;
  leadsCold: number;
  comWhatsapp: number;
  semSite: number;
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  executadoEm?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== LEAD ====================

export type LeadClassificacao = 'HOT' | 'WARM' | 'COOL' | 'COLD';
export type LeadClassificacaoIA = 'HOT' | 'WARM' | 'COOL' | 'COLD';
export type LeadStatus = 'NOVO' | 'CONTATADO' | 'RESPONDEU' | 'INTERESSADO' | 'FECHADO' | 'PERDIDO';
export type LeadOportunidade = 'SEM_SITE' | 'SITE_HTTP' | 'POUCAS_AVALIACOES' | 'NOTA_BAIXA' | 'SEM_HORARIO' | 'MARKETING_BASICO' | 'SEM_MARKETING';
export type NivelMarketingDigital = 'NAO_VERIFICADO' | 'NENHUM' | 'BASICO' | 'AVANCADO' | 'SEM_SITE';
export type NivelOportunidade = 'MAXIMO' | 'ALTO' | 'MEDIO' | 'BAIXO';

// ==================== ANÁLISE IA ====================

export interface ArgumentoVenda {
  titulo: string;
  argumento: string;
  gatilho: string;
}

export interface ReviewAnalise {
  rating: number;
  texto: string;
}

export interface AnaliseIA {
  scoreBase: number;
  bonusMarketing: number;
  scoreFinal: number;
  classificacao: LeadClassificacaoIA;
  resumo: string;
  pontosFortes: string[];
  pontosFracos: string[];
  oportunidadesMarketing: string[];
  argumentosVenda: string[];
  abordagemSugerida: string;
  mensagemWhatsApp: string;
}

export interface LeadProspectado {
  id: string;
  pesquisaId?: string;
  userId: string;
  clienteId?: string;

  // Identificador Google
  googlePlaceId?: string;

  // Dados do Lead
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  whatsapp?: string;
  linkWhatsapp?: string;
  site?: string;
  googleMapsUrl?: string;

  // Métricas Google
  rating?: number;
  totalReviews: number;
  tipos: string[];
  horarioFuncionamento: string[];

  // Score e Classificação
  score: number;
  classificacao: LeadClassificacao;
  prioridade: 1 | 2 | 3 | 4;
  oportunidades: LeadOportunidade[];

  // Flags
  temSite: boolean;
  siteSeguro: boolean;
  temTelefone: boolean;
  temWhatsapp: boolean;

  // Verificação de Ads/Marketing Digital
  fazGoogleAds: boolean;
  fazFacebookAds: boolean;
  usaGoogleAnalytics: boolean;
  usaGoogleTagManager: boolean;
  usaHotjar: boolean;
  usaRdStation: boolean;
  usaTiktokAds: boolean;
  usaLinkedinAds: boolean;
  adsDetalhes: string[];
  nivelMarketingDigital: NivelMarketingDigital;
  adsVerificado: boolean;
  adsVerificadoEm?: string;

  // Nível de oportunidade
  nivelOportunidade?: NivelOportunidade;

  // Análise IA
  scoreBase?: number;
  bonusMarketing?: number;
  scoreFinal?: number;
  classificacaoIA?: LeadClassificacaoIA;
  resumoIA?: string;
  pontosFortes?: string[];
  pontosFracos?: string[];
  oportunidadesMarketing?: string[];
  argumentosVenda?: string[];
  abordagemSugerida?: string;
  mensagemWhatsappSugerida?: string;
  reclamacoesComuns?: string[];
  analisadoIAEm?: string;

  // Status de Follow-up
  status: LeadStatus;
  dataContato?: string;
  dataResposta?: string;
  notas?: string;

  // Metadados
  tipoNegocio: TipoNegocio;
  capturedAt?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== INTERAÇÃO ====================

export type InteracaoTipo = 'WHATSAPP' | 'EMAIL' | 'LIGACAO' | 'REUNIAO' | 'NOTA';
export type InteracaoDirecao = 'ENVIADO' | 'RECEBIDO';
export type InteracaoResultado = 'ENVIADO' | 'ENTREGUE' | 'LIDO' | 'RESPONDEU' | 'SEM_RESPOSTA' | 'AGENDADO' | 'REALIZADO';

export interface LeadInteracao {
  id: string;
  leadId: string;
  userId: string;
  tipo: InteracaoTipo;
  direcao?: InteracaoDirecao;
  conteudo?: string;
  resultado?: InteracaoResultado;
  createdAt: string;
}

// ==================== API RESPONSES ====================

export interface LeadSniperWebhookRequest {
  tipo: TipoNegocio;
  cidades: CidadeConfig[];
  scoreMinimo: number;
  maxPorCidade: number;
  clienteId?: string;
  projetoId?: string;
  requestId: string;
}

export interface LeadSniperWebhookResponse {
  success: boolean;
  requestId: string;
  clienteId?: string;
  projetoId?: string;
  error?: string;

  meta: {
    tipoNegocio: TipoNegocio;
    cidadesBuscadas: string[];
    scoreMinimo: number;
    executadoEm: string;
  };

  estatisticas: {
    total: number;
    hot: number;
    warm: number;
    cool: number;
    cold: number;
    comWhatsapp: number;
    semSite: number;
    siteHttp: number;
  };

  estatisticasPorCidade: Record<string, {
    total: number;
    hot: number;
    warm: number;
    cool: number;
  }>;

  leads: LeadFromWebhook[];
}

export interface LeadFromWebhook {
  googlePlaceId: string;
  requestId: string;
  clienteId?: string;
  projetoId?: string;

  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone?: string;
  whatsapp?: string;
  linkWhatsapp?: string;
  site?: string;
  googleMapsUrl: string;

  rating?: number;
  totalReviews: number;
  tipos: string[];
  horarioFuncionamento: string[];

  score: number;
  classificacao: LeadClassificacao;
  prioridade: 1 | 2 | 3 | 4;
  oportunidades: LeadOportunidade[];

  temSite: boolean;
  siteSeguro: boolean;
  temTelefone: boolean;
  temWhatsapp: boolean;

  tipoNegocio: TipoNegocio;
  capturedAt: string;
  source: string;
  status: 'NOVO';
}

// ==================== FILTROS ====================

export interface LeadFilters {
  classificacao?: LeadClassificacao;
  status?: LeadStatus;
  cidade?: string;
  tipoNegocio?: TipoNegocio;
  temWhatsapp?: boolean;
  temSite?: boolean;
  scoreMin?: number;
  scoreMax?: number;
  pesquisaId?: string;
  nivelMarketingDigital?: NivelMarketingDigital;
  adsVerificado?: boolean;
  fazAds?: boolean;
}

// ==================== ESTATÍSTICAS ====================

export interface LeadStats {
  total: number;
  porClassificacao: Record<LeadClassificacao, number>;
  porStatus: Record<LeadStatus, number>;
  porCidade: Record<string, number>;
  comWhatsapp: number;
  semSite: number;
  scoreMedia: number;
  marketingDigital: {
    semMarketing: number;
    marketingBasico: number;
    marketingAvancado: number;
    naoVerificado: number;
    fazGoogleAds: number;
    fazFacebookAds: number;
  };
}

// ==================== DTOs ====================

export interface CreatePesquisaDTO {
  tipo: TipoNegocio;
  cidades: CidadeConfig[];
  scoreMinimo?: number;
  maxPorCidade?: number;
  clienteId?: string;
}

export interface UpdateLeadDTO {
  status?: LeadStatus;
  notas?: string;
}

export interface CreateInteracaoDTO {
  tipo: InteracaoTipo;
  direcao?: InteracaoDirecao;
  conteudo?: string;
  resultado?: InteracaoResultado;
}

// ==================== VERIFICAÇÃO DE ADS ====================

export interface VerificarAdsRequest {
  site: string;
  leadId?: string;
}

export interface VerificarAdsResponse {
  success: boolean;
  site: string;
  leadId?: string;

  fazGoogleAds: boolean;
  fazFacebookAds: boolean;
  usaGoogleAnalytics: boolean;
  usaGoogleTagManager: boolean;
  usaHotjar: boolean;
  usaRDStation: boolean;
  usaTikTokAds: boolean;
  usaLinkedInAds: boolean;

  adsDetalhes: string[];
  nivelMarketingDigital: NivelMarketingDigital;

  scoreBonus: number;
  oportunidade?: LeadOportunidade;
  verificadoEm: string;

  error?: string;
}

export interface AdsVerificationResult {
  fazGoogleAds: boolean;
  fazFacebookAds: boolean;
  usaGoogleAnalytics: boolean;
  usaGoogleTagManager: boolean;
  usaHotjar: boolean;
  usaRdStation: boolean;
  usaTiktokAds: boolean;
  usaLinkedinAds: boolean;
  adsDetalhes: string[];
  nivelMarketingDigital: NivelMarketingDigital;
  scoreBonus: number;
  oportunidade?: LeadOportunidade;
}

// ==================== ANÁLISE IA API ====================

export interface AnalisarLeadIARequest {
  placeId: string;
  leadId?: string;
}

export interface AnalisarLeadIAResponse {
  success: boolean;
  placeId: string;
  leadId?: string;
  error?: string;

  negocio: {
    nome: string;
    endereco: string;
    telefone?: string;
    site?: string;
    rating?: number;
    totalReviews: number;
  };

  reviews: {
    lista: ReviewAnalise[];
    resumoIA: string[];
  };

  marketingDigital: {
    temSite: boolean;
    fazGoogleAds: boolean;
    fazFacebookAds: boolean;
    usaGoogleAnalytics: boolean;
    usaGoogleTagManager: boolean;
    usaHotjar: boolean;
    usaRDStation: boolean;
    nivelMarketingDigital: NivelMarketingDigital;
    adsDetalhes: string[];
    nivelOportunidade: NivelOportunidade;
  };

  analiseIA: AnaliseIA;

  analisadoEm: string;
}
