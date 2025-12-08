/**
 * @file index.ts
 * @description Exportações do módulo Lead Sniper
 * @module lib/lead-sniper
 */

export {
  // Funções de serviço
  executarPesquisaWebhook,
  verificarAdsWebhook,
  analisarLeadIAWebhook,
  validarParametrosPesquisa,
  calcularNivelMarketing,
  mapAdsResultToDb,
  mapAnaliseIAToDb,
  mapWebhookLeadToDb,
  mapDbLeadToTs,
  mapDbPesquisaToTs,
  buildLeadFiltersQuery,
  calculateLeadStats,
  // Scoring local (fallback)
  calcularScoreLocal,
  recalcularScoreLead,
  // Constantes
  LEAD_SNIPER_LIMITS,
  TIPOS_NEGOCIO,
  CIDADES_CAMPINAS,
} from './service';

// Exportar nichos
export {
  CATEGORIAS_NICHOS,
  NICHOS_DISPONIVEIS,
  getNichosPorCategoria,
  getNichoInfo,
  getNichoNome,
  getNichoIcone,
} from './nichos';

export type { CategoriaInfo, NichoInfo } from './nichos';

// ============================================
// LEAD SNIPER v3 AI (com icebreakers)
// ============================================
export {
  // Função principal v3
  executarPesquisaV3,
  validarParametrosV3,
  // Mapeamento banco de dados v3
  mapLeadV3ToDb,
  mapPesquisaV3ToDb,
  mapDbLeadToV3,
  // Estatísticas v3
  calcularEstatisticasV3,
  // Helpers de UI v3
  getCorClassificacaoV3,
  getEmojiClassificacaoV3,
  getBgClassificacaoV3,
  formatarOportunidades,
  MENSAGENS_LOADING_V3,
} from './service-v3';

// Exportar tipos v3
export type {
  LeadSniperV3Request,
  LeadSniperV3Response,
  LeadV3,
  LeadV3DbInsert,
  PesquisaV3DbInsert,
  LeadClassificacaoV3,
  LeadOportunidadeV3,
  SiteInfoV3,
  NichoV3,
  TomVoz,
} from '@/types/lead-sniper-v3';

export {
  NICHOS_V3,
  ESTADOS_BRASIL,
  TONS_VOZ,
  LEAD_SNIPER_V3_LIMITS,
} from '@/types/lead-sniper-v3';
