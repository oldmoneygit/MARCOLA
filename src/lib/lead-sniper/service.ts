/**
 * @file service.ts
 * @description Serviço para integração com o Lead Sniper (n8n webhook)
 * @module lib/lead-sniper
 */

import type {
  PesquisaMercadoParams,
  LeadSniperWebhookRequest,
  LeadSniperWebhookResponse,
  LeadFilters,
  LeadStats,
  LeadClassificacao,
  LeadClassificacaoIA,
  LeadStatus,
  NivelMarketingDigital,
  NivelOportunidade,
  VerificarAdsRequest,
  VerificarAdsResponse,
  AdsVerificationResult,
  AnalisarLeadIARequest,
  AnalisarLeadIAResponse,
} from '@/types/lead-sniper';

import { LEAD_SNIPER_WEBHOOKS, ANALISE_WEBHOOKS } from '@/lib/n8n-webhooks';

// URLs centralizadas via n8n-webhooks.ts
const WEBHOOK_URL = LEAD_SNIPER_WEBHOOKS.V2; // LEGADO - usar V3_AI para novas pesquisas
const ADS_VERIFICATION_URL = ANALISE_WEBHOOKS.VERIFICAR_ADS;
const ANALISE_IA_URL = ANALISE_WEBHOOKS.ANALISAR_LEAD; // LEGADO - usar DIAGNOSTICO para análise completa

// Limites para evitar sobrecarga do n8n (testado: funciona com até ~50 leads)
export const LEAD_SNIPER_LIMITS = {
  MAX_CIDADES: 3,
  MAX_POR_CIDADE: 15,
  MAX_TOTAL_LEADS: 50,
  DEFAULT_MAX_POR_CIDADE: 10,
  DEFAULT_SCORE_MINIMO: 40,
} as const;

/**
 * Gera um ID único para a requisição
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Valida os parâmetros da pesquisa contra os limites
 * @throws Error se os parâmetros excederem os limites
 */
export function validarParametrosPesquisa(params: PesquisaMercadoParams): void {
  const { MAX_CIDADES, MAX_POR_CIDADE, MAX_TOTAL_LEADS } = LEAD_SNIPER_LIMITS;

  if (params.cidades.length > MAX_CIDADES) {
    throw new Error(
      `Limite de ${MAX_CIDADES} cidades por pesquisa. Você selecionou ${params.cidades.length}. ` +
      `Faça pesquisas separadas para mais cidades.`
    );
  }

  const maxPorCidade = params.maxPorCidade ?? LEAD_SNIPER_LIMITS.DEFAULT_MAX_POR_CIDADE;
  if (maxPorCidade > MAX_POR_CIDADE) {
    throw new Error(
      `Limite de ${MAX_POR_CIDADE} leads por cidade. Reduza o valor de "Max por Cidade".`
    );
  }

  const potentialTotal = params.cidades.length * maxPorCidade;
  if (potentialTotal > MAX_TOTAL_LEADS) {
    throw new Error(
      `A combinação de ${params.cidades.length} cidades × ${maxPorCidade} leads = ${potentialTotal} leads potenciais ` +
      `excede o limite de ${MAX_TOTAL_LEADS}. Reduza as cidades ou o número de leads por cidade.`
    );
  }
}

/**
 * Executa pesquisa para UMA cidade via webhook n8n
 */
async function executarPesquisaCidade(
  params: PesquisaMercadoParams,
  cidade: PesquisaMercadoParams['cidades'][0],
  requestId: string
): Promise<LeadSniperWebhookResponse> {
  const payload: LeadSniperWebhookRequest = {
    tipo: params.tipo,
    cidades: [cidade], // Apenas 1 cidade por requisição
    scoreMinimo: params.scoreMinimo ?? LEAD_SNIPER_LIMITS.DEFAULT_SCORE_MINIMO,
    maxPorCidade: params.maxPorCidade ?? LEAD_SNIPER_LIMITS.DEFAULT_MAX_POR_CIDADE,
    clienteId: params.clienteId,
    requestId: `${requestId}_${cidade.nome.replace(/\s+/g, '_')}`,
  };

  // Timeout de 2 minutos por cidade
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2 * 60 * 1000);

  console.log(`[executarPesquisaCidade] Buscando: ${cidade.nome}...`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro no webhook: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error(`Resposta vazia para ${cidade.nome}`);
    }

    const data: LeadSniperWebhookResponse = JSON.parse(responseText);

    if (!data.success) {
      throw new Error(data.error || `Falha na pesquisa de ${cidade.nome}`);
    }

    console.log(`[executarPesquisaCidade] ${cidade.nome}: ${data.leads?.length || 0} leads`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout na busca de ${cidade.nome}`);
    }
    throw error;
  }
}

/**
 * Executa a pesquisa de mercado via webhook n8n
 * IMPORTANTE: Faz requisições sequenciais (1 cidade por vez) para evitar problemas no n8n
 */
export async function executarPesquisaWebhook(
  params: PesquisaMercadoParams
): Promise<LeadSniperWebhookResponse> {
  // Validar parâmetros antes de fazer a requisição
  validarParametrosPesquisa(params);

  const requestId = generateRequestId();
  const cidades = params.cidades;

  console.log('\n');
  console.log('='.repeat(80));
  console.log(`[executarPesquisaWebhook] Iniciando pesquisa para ${cidades.length} cidade(s)...`);
  console.log('='.repeat(80));

  // Fazer requisições sequenciais para cada cidade
  const resultados: LeadSniperWebhookResponse[] = [];

  for (const cidade of cidades) {
    try {
      const resultado = await executarPesquisaCidade(params, cidade, requestId);
      resultados.push(resultado);
    } catch (error) {
      console.error(`[executarPesquisaWebhook] Erro em ${cidade.nome}:`, error);
      // Continua para a próxima cidade mesmo se uma falhar
    }
  }

  if (resultados.length === 0) {
    throw new Error('Nenhuma cidade retornou resultados');
  }

  // Combinar todos os resultados em uma única resposta
  const allLeads = resultados.flatMap((r) => r.leads || []);
  const cidadesBuscadas = cidades.map((c) => c.nome);

  // Calcular estatísticas combinadas
  const estatisticas = {
    total: allLeads.length,
    hot: allLeads.filter((l) => l.classificacao === 'HOT').length,
    warm: allLeads.filter((l) => l.classificacao === 'WARM').length,
    cool: allLeads.filter((l) => l.classificacao === 'COOL').length,
    cold: allLeads.filter((l) => l.classificacao === 'COLD').length,
    comWhatsapp: allLeads.filter((l) => l.temWhatsapp).length,
    semSite: allLeads.filter((l) => !l.temSite).length,
    siteHttp: allLeads.filter((l) => l.site && !l.siteSeguro).length,
  };

  // Estatísticas por cidade
  const estatisticasPorCidade: Record<string, { total: number; hot: number; warm: number; cool: number }> = {};
  for (const lead of allLeads) {
    const cidade = lead.cidade || 'Desconhecida';
    if (!estatisticasPorCidade[cidade]) {
      estatisticasPorCidade[cidade] = { total: 0, hot: 0, warm: 0, cool: 0 };
    }
    estatisticasPorCidade[cidade].total++;
    if (lead.classificacao === 'HOT') {
      estatisticasPorCidade[cidade].hot++;
    }
    if (lead.classificacao === 'WARM') {
      estatisticasPorCidade[cidade].warm++;
    }
    if (lead.classificacao === 'COOL') {
      estatisticasPorCidade[cidade].cool++;
    }
  }

  const combinedResponse: LeadSniperWebhookResponse = {
    success: true,
    requestId,
    clienteId: params.clienteId,
    meta: {
      tipoNegocio: params.tipo,
      cidadesBuscadas,
      scoreMinimo: params.scoreMinimo ?? LEAD_SNIPER_LIMITS.DEFAULT_SCORE_MINIMO,
      executadoEm: new Date().toISOString(),
    },
    estatisticas,
    estatisticasPorCidade,
    leads: allLeads,
  };

  // Log do resultado combinado
  console.log('\n');
  console.log('='.repeat(80));
  console.log('[RESULTADO COMBINADO]');
  console.log('='.repeat(80));
  console.log(`Cidades buscadas: ${cidadesBuscadas.join(', ')}`);
  console.log(`Total de leads: ${allLeads.length}`);
  console.log('Por cidade:', estatisticasPorCidade);
  console.log('Estatísticas:', estatisticas);
  console.log('='.repeat(80));
  console.log('\n');

  return combinedResponse;
}

/**
 * Executa verificação de ads de um lead via webhook n8n
 * @param site - URL do site a verificar
 * @param leadId - ID opcional do lead para rastreamento
 * @returns Resultado da verificação de ads
 */
export async function verificarAdsWebhook(
  site: string,
  leadId?: string
): Promise<VerificarAdsResponse> {
  const payload: VerificarAdsRequest = {
    site,
    leadId,
  };

  const response = await fetch(ADS_VERIFICATION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erro no webhook de ads: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Falha na verificação de ads');
  }

  return data as VerificarAdsResponse;
}

/**
 * Calcula o nível de marketing digital baseado nos dados de verificação
 * @param result - Resultado da verificação de ads
 * @returns Nível de marketing digital
 */
export function calcularNivelMarketing(result: AdsVerificationResult): NivelMarketingDigital {
  const { fazGoogleAds, fazFacebookAds, usaGoogleAnalytics, usaGoogleTagManager } = result;

  // AVANCADO: Faz ads + analytics
  if ((fazGoogleAds || fazFacebookAds) && (usaGoogleAnalytics || usaGoogleTagManager)) {
    return 'AVANCADO';
  }

  // BASICO: Tem analytics ou faz ads
  if (fazGoogleAds || fazFacebookAds || usaGoogleAnalytics || usaGoogleTagManager) {
    return 'BASICO';
  }

  // NENHUM: Não usa nada
  return 'NENHUM';
}

/**
 * Mapeia resultado da verificação de ads para o formato do banco de dados
 * @param result - Resultado da verificação
 * @returns Objeto para update no banco
 */
export function mapAdsResultToDb(result: AdsVerificationResult) {
  return {
    faz_google_ads: result.fazGoogleAds,
    faz_facebook_ads: result.fazFacebookAds,
    usa_google_analytics: result.usaGoogleAnalytics,
    usa_google_tag_manager: result.usaGoogleTagManager,
    usa_hotjar: result.usaHotjar,
    usa_rd_station: result.usaRdStation,
    usa_tiktok_ads: result.usaTiktokAds,
    usa_linkedin_ads: result.usaLinkedinAds,
    ads_detalhes: result.adsDetalhes || [],
    nivel_marketing_digital: calcularNivelMarketing(result),
    ads_verificado: true,
    ads_verificado_em: new Date().toISOString(),
  };
}

/**
 * Executa análise IA de um lead via webhook n8n
 * @param placeId - Google Place ID do lead
 * @param leadId - ID do lead no banco de dados
 * @returns Resultado da análise IA
 */
export async function analisarLeadIAWebhook(
  placeId: string,
  leadId: string
): Promise<AnalisarLeadIAResponse> {
  const payload: AnalisarLeadIARequest = {
    placeId,
    leadId,
  };

  // Timeout de 2 minutos para análise IA
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2 * 60 * 1000);

  console.log(`[analisarLeadIAWebhook] Analisando lead ${leadId}...`);

  try {
    const response = await fetch(ANALISE_IA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro no webhook de análise IA: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Falha na análise IA do lead');
    }

    console.log(`[analisarLeadIAWebhook] Lead ${leadId} analisado com sucesso. Score IA: ${data.analiseIA?.scoreIA}`);

    return data as AnalisarLeadIAResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout na análise IA do lead');
    }
    throw error;
  }
}

/**
 * Mapeia resultado da análise IA para o formato do banco de dados
 * @param result - Resultado da análise IA
 * @returns Objeto para update no banco
 */
export function mapAnaliseIAToDb(result: AnalisarLeadIAResponse) {
  const { analiseIA, marketingDigital, reviews } = result;

  return {
    // Marketing Digital
    faz_google_ads: marketingDigital.fazGoogleAds,
    faz_facebook_ads: marketingDigital.fazFacebookAds,
    usa_google_analytics: marketingDigital.usaGoogleAnalytics,
    usa_google_tag_manager: marketingDigital.usaGoogleTagManager,
    usa_hotjar: marketingDigital.usaHotjar,
    usa_rd_station: marketingDigital.usaRDStation,
    nivel_marketing_digital: marketingDigital.nivelMarketingDigital,
    ads_detalhes: marketingDigital.adsDetalhes || [],
    nivel_oportunidade: marketingDigital.nivelOportunidade,
    ads_verificado: true,
    ads_verificado_em: result.analisadoEm || new Date().toISOString(),

    // Análise IA - Scores
    score_base: analiseIA.scoreBase,
    bonus_marketing: analiseIA.bonusMarketing,
    score_final: analiseIA.scoreFinal,
    classificacao_ia: analiseIA.classificacao,

    // Análise IA - Conteúdo
    resumo_ia: analiseIA.resumo,
    pontos_fortes: analiseIA.pontosFortes || [],
    pontos_fracos: analiseIA.pontosFracos || [],
    oportunidades_marketing: analiseIA.oportunidadesMarketing || [],
    argumentos_venda: analiseIA.argumentosVenda || [],
    abordagem_sugerida: analiseIA.abordagemSugerida,
    mensagem_whatsapp_sugerida: analiseIA.mensagemWhatsApp,

    // Reviews
    reclamacoes_comuns: reviews?.resumoIA || [],

    // Metadata
    analisado_ia_em: result.analisadoEm || new Date().toISOString(),
  };
}

/**
 * Mapeia dados do webhook para o formato do banco de dados
 */
export function mapWebhookLeadToDb(
  lead: LeadSniperWebhookResponse['leads'][0],
  userId: string,
  pesquisaId: string
) {
  return {
    pesquisa_id: pesquisaId,
    user_id: userId,
    cliente_id: lead.clienteId || null,
    google_place_id: lead.googlePlaceId,
    nome: lead.nome,
    endereco: lead.endereco,
    cidade: lead.cidade,
    estado: lead.estado,
    telefone: lead.telefone || null,
    whatsapp: lead.whatsapp || null,
    link_whatsapp: lead.linkWhatsapp || null,
    site: lead.site || null,
    google_maps_url: lead.googleMapsUrl,
    rating: lead.rating || null,
    total_reviews: lead.totalReviews || 0,
    tipos: lead.tipos || [],
    horario_funcionamento: lead.horarioFuncionamento || [],
    score: lead.score,
    classificacao: lead.classificacao,
    prioridade: lead.prioridade,
    oportunidades: lead.oportunidades || [],
    tem_site: lead.temSite,
    site_seguro: lead.siteSeguro,
    tem_telefone: lead.temTelefone,
    tem_whatsapp: lead.temWhatsapp,
    tipo_negocio: lead.tipoNegocio,
    captured_at: lead.capturedAt,
    source: lead.source,
    status: 'NOVO',
  };
}

/**
 * Mapeia dados do banco para o formato TypeScript
 */
export function mapDbLeadToTs(dbLead: Record<string, unknown>) {
  return {
    id: dbLead.id as string,
    pesquisaId: dbLead.pesquisa_id as string | undefined,
    userId: dbLead.user_id as string,
    clienteId: dbLead.cliente_id as string | undefined,
    googlePlaceId: dbLead.google_place_id as string | undefined,
    nome: dbLead.nome as string,
    endereco: dbLead.endereco as string | undefined,
    cidade: dbLead.cidade as string | undefined,
    estado: dbLead.estado as string | undefined,
    telefone: dbLead.telefone as string | undefined,
    whatsapp: dbLead.whatsapp as string | undefined,
    linkWhatsapp: dbLead.link_whatsapp as string | undefined,
    site: dbLead.site as string | undefined,
    googleMapsUrl: dbLead.google_maps_url as string | undefined,
    rating: dbLead.rating as number | undefined,
    totalReviews: (dbLead.total_reviews as number) || 0,
    tipos: (dbLead.tipos as string[]) || [],
    horarioFuncionamento: (dbLead.horario_funcionamento as string[]) || [],
    score: (dbLead.score as number) || 0,
    classificacao: dbLead.classificacao as LeadClassificacao,
    prioridade: dbLead.prioridade as 1 | 2 | 3 | 4,
    oportunidades: (dbLead.oportunidades as string[]) || [],
    temSite: dbLead.tem_site as boolean,
    siteSeguro: dbLead.site_seguro as boolean,
    temTelefone: dbLead.tem_telefone as boolean,
    temWhatsapp: dbLead.tem_whatsapp as boolean,
    // Campos de verificação de Ads
    fazGoogleAds: (dbLead.faz_google_ads as boolean) || false,
    fazFacebookAds: (dbLead.faz_facebook_ads as boolean) || false,
    usaGoogleAnalytics: (dbLead.usa_google_analytics as boolean) || false,
    usaGoogleTagManager: (dbLead.usa_google_tag_manager as boolean) || false,
    usaHotjar: (dbLead.usa_hotjar as boolean) || false,
    usaRdStation: (dbLead.usa_rd_station as boolean) || false,
    usaTiktokAds: (dbLead.usa_tiktok_ads as boolean) || false,
    usaLinkedinAds: (dbLead.usa_linkedin_ads as boolean) || false,
    adsDetalhes: (dbLead.ads_detalhes as string[]) || [],
    nivelMarketingDigital: (dbLead.nivel_marketing_digital as NivelMarketingDigital) || 'NAO_VERIFICADO',
    adsVerificado: (dbLead.ads_verificado as boolean) || false,
    adsVerificadoEm: dbLead.ads_verificado_em as string | undefined,
    // Nível de Oportunidade
    nivelOportunidade: dbLead.nivel_oportunidade as NivelOportunidade | undefined,
    // Campos de Análise IA
    scoreBase: dbLead.score_base as number | undefined,
    bonusMarketing: dbLead.bonus_marketing as number | undefined,
    scoreFinal: dbLead.score_final as number | undefined,
    classificacaoIA: dbLead.classificacao_ia as LeadClassificacaoIA | undefined,
    resumoIA: dbLead.resumo_ia as string | undefined,
    pontosFortes: (dbLead.pontos_fortes as string[]) || [],
    pontosFracos: (dbLead.pontos_fracos as string[]) || [],
    oportunidadesMarketing: (dbLead.oportunidades_marketing as string[]) || [],
    argumentosVenda: (dbLead.argumentos_venda as string[]) || [],
    abordagemSugerida: dbLead.abordagem_sugerida as string | undefined,
    mensagemWhatsappSugerida: dbLead.mensagem_whatsapp_sugerida as string | undefined,
    reclamacoesComuns: (dbLead.reclamacoes_comuns as string[]) || [],
    analisadoIAEm: dbLead.analisado_ia_em as string | undefined,
    status: dbLead.status as LeadStatus,
    dataContato: dbLead.data_contato as string | undefined,
    dataResposta: dbLead.data_resposta as string | undefined,
    notas: dbLead.notas as string | undefined,
    tipoNegocio: dbLead.tipo_negocio as string,
    capturedAt: dbLead.captured_at as string | undefined,
    source: (dbLead.source as string) || 'google_places_api',
    createdAt: dbLead.created_at as string,
    updatedAt: dbLead.updated_at as string,
  };
}

/**
 * Mapeia dados do banco de pesquisa para TypeScript
 */
export function mapDbPesquisaToTs(dbPesquisa: Record<string, unknown>) {
  return {
    id: dbPesquisa.id as string,
    userId: dbPesquisa.user_id as string,
    clienteId: dbPesquisa.cliente_id as string | undefined,
    requestId: dbPesquisa.request_id as string,
    tipoNegocio: dbPesquisa.tipo_negocio as string,
    cidadesBuscadas: dbPesquisa.cidades_buscadas as unknown[],
    scoreMinimo: dbPesquisa.score_minimo as number,
    maxPorCidade: dbPesquisa.max_por_cidade as number,
    totalLeads: dbPesquisa.total_leads as number,
    leadsHot: dbPesquisa.leads_hot as number,
    leadsWarm: dbPesquisa.leads_warm as number,
    leadsCool: dbPesquisa.leads_cool as number,
    leadsCold: dbPesquisa.leads_cold as number,
    comWhatsapp: dbPesquisa.com_whatsapp as number,
    semSite: dbPesquisa.sem_site as number,
    status: dbPesquisa.status as string,
    errorMessage: dbPesquisa.error_message as string | undefined,
    executadoEm: dbPesquisa.executado_em as string | undefined,
    createdAt: dbPesquisa.created_at as string,
    updatedAt: dbPesquisa.updated_at as string,
  };
}

/**
 * Constrói query de filtros para leads
 */
export function buildLeadFiltersQuery(filters: LeadFilters) {
  const conditions: string[] = [];

  if (filters.classificacao) {
    conditions.push(`classificacao.eq.${filters.classificacao}`);
  }
  if (filters.status) {
    conditions.push(`status.eq.${filters.status}`);
  }
  if (filters.cidade) {
    conditions.push(`cidade.ilike.%${filters.cidade}%`);
  }
  if (filters.tipoNegocio) {
    conditions.push(`tipo_negocio.eq.${filters.tipoNegocio}`);
  }
  if (filters.temWhatsapp !== undefined) {
    conditions.push(`tem_whatsapp.eq.${filters.temWhatsapp}`);
  }
  if (filters.temSite !== undefined) {
    conditions.push(`tem_site.eq.${filters.temSite}`);
  }
  if (filters.scoreMin !== undefined) {
    conditions.push(`score.gte.${filters.scoreMin}`);
  }
  if (filters.scoreMax !== undefined) {
    conditions.push(`score.lte.${filters.scoreMax}`);
  }
  if (filters.pesquisaId) {
    conditions.push(`pesquisa_id.eq.${filters.pesquisaId}`);
  }
  if (filters.nivelMarketingDigital) {
    conditions.push(`nivel_marketing_digital.eq.${filters.nivelMarketingDigital}`);
  }
  if (filters.adsVerificado !== undefined) {
    conditions.push(`ads_verificado.eq.${filters.adsVerificado}`);
  }
  if (filters.fazAds !== undefined) {
    if (filters.fazAds) {
      conditions.push(`or(faz_google_ads.eq.true,faz_facebook_ads.eq.true)`);
    }
  }

  return conditions;
}

/**
 * Calcula estatísticas dos leads
 */
export function calculateLeadStats(leads: unknown[]): LeadStats {
  const stats: LeadStats = {
    total: leads.length,
    porClassificacao: { HOT: 0, WARM: 0, COOL: 0, COLD: 0 },
    porStatus: { NOVO: 0, CONTATADO: 0, RESPONDEU: 0, INTERESSADO: 0, FECHADO: 0, PERDIDO: 0 },
    porCidade: {},
    comWhatsapp: 0,
    semSite: 0,
    scoreMedia: 0,
    marketingDigital: {
      semMarketing: 0,
      marketingBasico: 0,
      marketingAvancado: 0,
      naoVerificado: 0,
      fazGoogleAds: 0,
      fazFacebookAds: 0,
    },
  };

  let scoreTotal = 0;

  for (const lead of leads) {
    const l = lead as Record<string, unknown>;

    // Por classificação
    const classificacao = l.classificacao as LeadClassificacao;
    if (classificacao && stats.porClassificacao[classificacao] !== undefined) {
      stats.porClassificacao[classificacao]++;
    }

    // Por status
    const status = l.status as LeadStatus;
    if (status && stats.porStatus[status] !== undefined) {
      stats.porStatus[status]++;
    }

    // Por cidade
    const cidade = l.cidade as string;
    if (cidade) {
      stats.porCidade[cidade] = (stats.porCidade[cidade] || 0) + 1;
    }

    // Flags
    if (l.tem_whatsapp) {
      stats.comWhatsapp++;
    }
    if (!l.tem_site) {
      stats.semSite++;
    }

    // Score
    scoreTotal += (l.score as number) || 0;

    // Marketing Digital Stats
    const nivelMarketing = l.nivel_marketing_digital as NivelMarketingDigital;
    if (nivelMarketing === 'NENHUM') {
      stats.marketingDigital.semMarketing++;
    } else if (nivelMarketing === 'BASICO') {
      stats.marketingDigital.marketingBasico++;
    } else if (nivelMarketing === 'AVANCADO') {
      stats.marketingDigital.marketingAvancado++;
    } else {
      stats.marketingDigital.naoVerificado++;
    }

    if (l.faz_google_ads) {
      stats.marketingDigital.fazGoogleAds++;
    }
    if (l.faz_facebook_ads) {
      stats.marketingDigital.fazFacebookAds++;
    }
  }

  stats.scoreMedia = leads.length > 0 ? Math.round(scoreTotal / leads.length) : 0;

  return stats;
}

/**
 * Tipos de negócio com informações completas
 */
export const TIPOS_NEGOCIO = [
  { id: 'gym', nome: 'Academia', nomePlural: 'Academias', icone: 'Dumbbell' },
  { id: 'restaurant', nome: 'Restaurante', nomePlural: 'Restaurantes', icone: 'Utensils' },
  { id: 'beauty_salon', nome: 'Salão de Beleza', nomePlural: 'Salões de Beleza', icone: 'Scissors' },
  { id: 'dentist', nome: 'Dentista', nomePlural: 'Dentistas', icone: 'Smile' },
  { id: 'doctor', nome: 'Médico/Clínica', nomePlural: 'Médicos/Clínicas', icone: 'Stethoscope' },
  { id: 'lawyer', nome: 'Advogado', nomePlural: 'Advogados', icone: 'Scale' },
  { id: 'real_estate_agency', nome: 'Imobiliária', nomePlural: 'Imobiliárias', icone: 'Home' },
  { id: 'car_dealer', nome: 'Concessionária', nomePlural: 'Concessionárias', icone: 'Car' },
  { id: 'pet_store', nome: 'Pet Shop', nomePlural: 'Pet Shops', icone: 'PawPrint' },
  { id: 'veterinary_care', nome: 'Veterinário', nomePlural: 'Veterinários', icone: 'HeartPulse' },
  { id: 'pharmacy', nome: 'Farmácia', nomePlural: 'Farmácias', icone: 'Pill' },
  { id: 'bakery', nome: 'Padaria', nomePlural: 'Padarias', icone: 'Croissant' },
  { id: 'cafe', nome: 'Cafeteria', nomePlural: 'Cafeterias', icone: 'Coffee' },
  { id: 'bar', nome: 'Bar', nomePlural: 'Bares', icone: 'Beer' },
  { id: 'clothing_store', nome: 'Loja de Roupa', nomePlural: 'Lojas de Roupa', icone: 'Shirt' },
  { id: 'electronics_store', nome: 'Eletrônicos', nomePlural: 'Lojas de Eletrônicos', icone: 'Smartphone' },
  { id: 'furniture_store', nome: 'Loja de Móveis', nomePlural: 'Lojas de Móveis', icone: 'Sofa' },
  { id: 'supermarket', nome: 'Supermercado', nomePlural: 'Supermercados', icone: 'ShoppingCart' },
] as const;

/**
 * Cidades pré-configuradas da região de Campinas
 */
export const CIDADES_CAMPINAS = [
  { nome: 'Campinas', lat: -22.9099, lng: -47.0626, raio: 8000 },
  { nome: 'Paulínia', lat: -22.7612, lng: -47.1543, raio: 5000 },
  { nome: 'Sumaré', lat: -22.8217, lng: -47.2669, raio: 5000 },
  { nome: 'Hortolândia', lat: -22.8584, lng: -47.2200, raio: 5000 },
  { nome: 'Valinhos', lat: -22.9708, lng: -46.9958, raio: 4000 },
  { nome: 'Vinhedo', lat: -23.0297, lng: -46.9756, raio: 4000 },
  { nome: 'Indaiatuba', lat: -23.0903, lng: -47.2181, raio: 6000 },
  { nome: 'Americana', lat: -22.7394, lng: -47.3316, raio: 5000 },
  { nome: 'Santa Bárbara d\'Oeste', lat: -22.7554, lng: -47.4145, raio: 5000 },
  { nome: 'Nova Odessa', lat: -22.7775, lng: -47.2942, raio: 4000 },
] as const;

// ============================================
// SCORING LOCAL (FALLBACK)
// ============================================

interface LeadScoreInput {
  temSite?: boolean;
  siteSeguro?: boolean;
  rating?: number;
  totalReviews?: number;
  temTelefone?: boolean;
  temWhatsapp?: boolean;
  temHorario?: boolean;
  nivelMarketing?: NivelMarketingDigital;
}

interface LeadScoreResult {
  score: number;
  classificacao: LeadClassificacao;
  prioridade: number;
  oportunidades: string[];
}

/**
 * Calcula score de um lead localmente (fallback se n8n falhar)
 * Implementa a mesma lógica do prompt do Lead Sniper
 *
 * Critérios de Pontuação (0-100):
 * - Sem site: +30 pontos
 * - Site HTTP (não HTTPS): +25 pontos
 * - Poucas avaliações (<50): +20 pontos
 * - Sem telefone/WhatsApp: +15 pontos
 * - Rating baixo (<4.0): +10 pontos
 * - Sem horário definido: +5 pontos
 * - Sem marketing digital: +20 pontos (bônus)
 * - Marketing básico: +10 pontos (bônus)
 */
export function calcularScoreLocal(input: LeadScoreInput): LeadScoreResult {
  let score = 0;
  const oportunidades: string[] = [];

  // Sem site: +30 pontos
  if (!input.temSite) {
    score += 30;
    oportunidades.push('SEM_SITE');
  }

  // Site HTTP (não seguro): +25 pontos
  if (input.temSite && !input.siteSeguro) {
    score += 25;
    oportunidades.push('SITE_HTTP');
  }

  // Poucas avaliações (<50): +20 pontos
  if (!input.totalReviews || input.totalReviews < 50) {
    score += 20;
    oportunidades.push('POUCAS_AVALIACOES');
  }

  // Sem telefone/WhatsApp: +15 pontos
  if (!input.temTelefone && !input.temWhatsapp) {
    score += 15;
    oportunidades.push('SEM_CONTATO');
  }

  // Rating baixo (<4.0): +10 pontos
  if (!input.rating || input.rating < 4.0) {
    score += 10;
    oportunidades.push('NOTA_BAIXA');
  }

  // Sem horário definido: +5 pontos
  if (!input.temHorario) {
    score += 5;
    oportunidades.push('SEM_HORARIO');
  }

  // Bônus de marketing digital
  if (input.nivelMarketing === 'NENHUM') {
    score += 20;
    oportunidades.push('SEM_MARKETING');
  } else if (input.nivelMarketing === 'BASICO') {
    score += 10;
    oportunidades.push('MARKETING_BASICO');
  }

  // Limitar score a 100
  score = Math.min(score, 100);

  // Determinar classificação
  let classificacao: LeadClassificacao;
  let prioridade: number;

  if (score >= 80) {
    classificacao = 'HOT';
    prioridade = 1;
  } else if (score >= 60) {
    classificacao = 'WARM';
    prioridade = 2;
  } else if (score >= 40) {
    classificacao = 'COOL';
    prioridade = 3;
  } else {
    classificacao = 'COLD';
    prioridade = 4;
  }

  return {
    score,
    classificacao,
    prioridade,
    oportunidades,
  };
}

/**
 * Recalcula score e classificação de leads no banco de dados
 * Útil para atualizar leads antigos ou quando n8n não calculou corretamente
 */
export function recalcularScoreLead(dbLead: Record<string, unknown>): LeadScoreResult {
  return calcularScoreLocal({
    temSite: dbLead.tem_site as boolean,
    siteSeguro: dbLead.site_seguro as boolean,
    rating: dbLead.rating as number,
    totalReviews: dbLead.total_reviews as number,
    temTelefone: dbLead.tem_telefone as boolean,
    temWhatsapp: dbLead.tem_whatsapp as boolean,
    temHorario: Array.isArray(dbLead.horario_funcionamento) && (dbLead.horario_funcionamento as unknown[]).length > 0,
    nivelMarketing: dbLead.nivel_marketing_digital as NivelMarketingDigital,
  });
}
