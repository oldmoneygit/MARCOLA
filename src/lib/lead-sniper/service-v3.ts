/**
 * @file service-v3.ts
 * @description Serviço para integração com o Lead Sniper v3 AI (n8n webhook)
 * @module lib/lead-sniper
 *
 * Esta versão inclui:
 * - Icebreakers gerados por IA
 * - Scraping de sites
 * - Análise integrada (não precisa de chamadas separadas)
 */

import type {
  LeadSniperV3Request,
  LeadSniperV3Response,
  LeadV3,
  LeadV3DbInsert,
  PesquisaV3DbInsert,
  LeadClassificacaoV3,
  LeadOportunidadeV3,
} from '@/types/lead-sniper-v3';

import { LEAD_SNIPER_V3_LIMITS } from '@/types/lead-sniper-v3';
import { LEAD_SNIPER_WEBHOOKS } from '@/lib/n8n-webhooks';

// ============================================
// CONFIGURAÇÃO
// ============================================

/** URL do webhook Lead Sniper v3 AI - ⭐ RECOMENDADO para novas pesquisas */
const WEBHOOK_URL_V3 = LEAD_SNIPER_WEBHOOKS.V3_AI;

/** Timeout de 3 minutos (API pode demorar 60-120s) */
const DEFAULT_TIMEOUT = LEAD_SNIPER_V3_LIMITS.TIMEOUT;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Gera um ID único para a requisição
 */
function generateRequestId(): string {
  return `v3_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Faz requisição com timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout na pesquisa - a API demorou mais de 3 minutos');
    }
    throw error;
  }
}

/**
 * Valida os parâmetros da pesquisa v3
 */
export function validarParametrosV3(params: LeadSniperV3Request): void {
  if (!params.tipo_negocio || params.tipo_negocio.trim() === '') {
    throw new Error('Tipo de negócio é obrigatório');
  }

  if (!params.cidade || params.cidade.trim() === '') {
    throw new Error('Cidade é obrigatória');
  }

  const quantidade = params.quantidade ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_QUANTIDADE;
  if (quantidade < LEAD_SNIPER_V3_LIMITS.MIN_QUANTIDADE) {
    throw new Error(`Quantidade mínima é ${LEAD_SNIPER_V3_LIMITS.MIN_QUANTIDADE}`);
  }

  if (quantidade > LEAD_SNIPER_V3_LIMITS.MAX_QUANTIDADE) {
    throw new Error(`Quantidade máxima é ${LEAD_SNIPER_V3_LIMITS.MAX_QUANTIDADE}`);
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

/**
 * Executa pesquisa de leads via Lead Sniper v3 AI
 *
 * Esta função faz tudo em uma única chamada:
 * - Busca empresas no Google Maps
 * - Faz scraping dos sites
 * - Gera icebreakers com IA
 * - Retorna leads qualificados
 *
 * @param params - Parâmetros da pesquisa
 * @returns Resposta completa com leads e estatísticas
 */
export async function executarPesquisaV3(
  params: LeadSniperV3Request
): Promise<LeadSniperV3Response> {
  // Validar parâmetros
  validarParametrosV3(params);

  const requestId = generateRequestId();

  // Montar payload com defaults
  const payload: LeadSniperV3Request = {
    tipo_negocio: params.tipo_negocio.trim(),
    cidade: params.cidade.trim(),
    estado: params.estado ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_ESTADO,
    quantidade: params.quantidade ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_QUANTIDADE,
    nome_agencia: params.nome_agencia?.trim() || undefined,
    especialidade: params.especialidade?.trim() || undefined,
    proposta: params.proposta?.trim() || undefined,
    tom_voz: params.tom_voz ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_TOM_VOZ,
  };

  console.log('\n');
  console.log('='.repeat(80));
  console.log('[Lead Sniper v3 AI] Iniciando pesquisa...');
  console.log('='.repeat(80));
  console.log('Tipo de negócio:', payload.tipo_negocio);
  console.log('Cidade:', payload.cidade, '-', payload.estado);
  console.log('Quantidade:', payload.quantidade);
  console.log('Tom de voz:', payload.tom_voz);
  console.log('Request ID:', requestId);
  console.log('='.repeat(80));

  try {
    const response = await fetchWithTimeout(WEBHOOK_URL_V3, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Lead Sniper v3] Erro HTTP:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      throw new Error('Resposta vazia do servidor');
    }

    let data: LeadSniperV3Response;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[Lead Sniper v3] JSON inválido:', responseText.substring(0, 200));
      throw new Error('Resposta inválida do servidor');
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha na pesquisa');
    }

    // Log do resultado
    console.log('\n');
    console.log('='.repeat(80));
    console.log('[Lead Sniper v3 AI] Pesquisa concluída!');
    console.log('='.repeat(80));
    console.log('Versão:', data.versao);
    console.log('Total de leads:', data.estatisticas.total);
    console.log('  - HOT:', data.estatisticas.hot);
    console.log('  - WARM:', data.estatisticas.warm);
    console.log('  - COOL:', data.estatisticas.cool);
    console.log('Com WhatsApp:', data.estatisticas.comWhatsapp);
    console.log('Sites scraped:', data.estatisticas.sitesScraped);
    console.log('Icebreakers por IA:', data.estatisticas.icebreakersPorIA);
    console.log('='.repeat(80));
    console.log('\n');

    // Adicionar requestId se não vier na resposta
    return {
      ...data,
      requestId: data.requestId || requestId,
    };
  } catch (error) {
    console.error('[Lead Sniper v3] Erro:', error);
    throw error;
  }
}

// ============================================
// MAPEAMENTO PARA BANCO DE DADOS
// ============================================

/**
 * Mapeia um lead v3 para o formato do banco de dados
 */
export function mapLeadV3ToDb(
  lead: LeadV3,
  userId: string,
  pesquisaId: string,
  estado: string
): LeadV3DbInsert {
  return {
    pesquisa_id: pesquisaId,
    user_id: userId,
    lead_sniper_id: lead.id,
    place_id: lead.placeId,
    nome: lead.nome,
    endereco: lead.endereco,
    bairro: lead.bairro || null,
    cidade: lead.cidade,
    estado: estado,
    telefone: lead.telefone || null,
    link_whatsapp: lead.linkWhatsapp,
    website: lead.website,
    rating: lead.rating || null,
    total_avaliacoes: lead.totalAvaliacoes || 0,
    categoria: lead.categoria || null,
    google_maps_url: lead.googleMapsUrl,
    tipo_negocio: lead.tipoNegocio,
    oportunidades: lead.oportunidades || [],
    score: lead.score,
    classificacao: lead.classificacao,
    fonte: lead.fonte || 'lead_sniper_v3',
    site_scraped: lead.siteScraped || false,
    site_info: lead.siteInfo,
    icebreaker: lead.icebreaker || '',
    gatilho: lead.gatilho || '',
    icebreaker_gerado_por_ia: lead.icebreakerGeradoPorIA ?? true,
    enriched_at: lead.enrichedAt || new Date().toISOString(),
    status: 'NOVO',
  };
}

/**
 * Mapeia a resposta v3 para dados de pesquisa no banco
 */
export function mapPesquisaV3ToDb(
  response: LeadSniperV3Response,
  userId: string,
  params: LeadSniperV3Request
): PesquisaV3DbInsert {
  return {
    user_id: userId,
    request_id: response.requestId,
    tipo_negocio: response.meta.tipoNegocio,
    cidade: response.meta.cidade,
    estado: response.meta.estado,
    quantidade: params.quantidade ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_QUANTIDADE,
    nome_agencia: params.nome_agencia || null,
    especialidade: params.especialidade || null,
    tom_voz: params.tom_voz || null,
    total_leads: response.estatisticas.total,
    leads_hot: response.estatisticas.hot,
    leads_warm: response.estatisticas.warm,
    leads_cool: response.estatisticas.cool,
    com_whatsapp: response.estatisticas.comWhatsapp,
    com_site: response.estatisticas.comSite,
    sem_site: response.estatisticas.semSite,
    sites_scraped: response.estatisticas.sitesScraped,
    icebreakers_por_ia: response.estatisticas.icebreakersPorIA,
    status: 'completed',
    versao: response.versao,
  };
}

// ============================================
// MAPEAMENTO DO BANCO PARA TYPESCRIPT
// ============================================

/**
 * Mapeia um lead do banco de dados para o formato TypeScript
 * Retorna LeadV3 com campos extras do banco (dbId, status)
 */
export function mapDbLeadToV3(dbLead: Record<string, unknown>): LeadV3 & { dbId: string; dbStatus: string } {
  return {
    id: (dbLead.lead_sniper_id as number) || 0,
    nome: dbLead.nome as string,
    endereco: dbLead.endereco as string,
    bairro: (dbLead.bairro as string) || '',
    cidade: dbLead.cidade as string,
    telefone: (dbLead.telefone as string) || '',
    linkWhatsapp: (dbLead.link_whatsapp as string) || null,
    website: (dbLead.website as string) || null,
    rating: (dbLead.rating as number) || 0,
    totalAvaliacoes: (dbLead.total_avaliacoes as number) || 0,
    categoria: (dbLead.categoria as string) || '',
    placeId: (dbLead.place_id as string) || (dbLead.google_place_id as string) || '',
    googleMapsUrl: (dbLead.google_maps_url as string) || '',
    tipoNegocio: (dbLead.tipo_negocio as string) || '',
    oportunidades: (dbLead.oportunidades as LeadOportunidadeV3[]) || [],
    score: (dbLead.score as number) || 0,
    classificacao: (dbLead.classificacao as LeadClassificacaoV3) || 'COOL',
    fonte: (dbLead.fonte as string) || 'lead_sniper_v3',
    siteScraped: (dbLead.site_scraped as boolean) || false,
    siteInfo: (dbLead.site_info as LeadV3['siteInfo']) || null,
    icebreaker: (dbLead.icebreaker as string) || '',
    gatilho: (dbLead.gatilho as string) || '',
    icebreakerGeradoPorIA: (dbLead.icebreaker_gerado_por_ia as boolean) ?? true,
    enrichedAt: (dbLead.enriched_at as string) || '',
    // Campos extras do banco (com nomes diferentes para evitar conflito)
    dbId: (dbLead.id as string) || '',
    dbStatus: (dbLead.status as string) || 'NOVO',
  };
}

// ============================================
// ESTATÍSTICAS
// ============================================

/**
 * Calcula estatísticas de uma lista de leads v3
 */
export function calcularEstatisticasV3(leads: LeadV3[]): LeadSniperV3Response['estatisticas'] {
  return {
    total: leads.length,
    hot: leads.filter((l) => l.classificacao === 'HOT').length,
    warm: leads.filter((l) => l.classificacao === 'WARM').length,
    cool: leads.filter((l) => l.classificacao === 'COOL').length,
    comWhatsapp: leads.filter((l) => l.linkWhatsapp).length,
    comSite: leads.filter((l) => l.website).length,
    semSite: leads.filter((l) => !l.website).length,
    sitesScraped: leads.filter((l) => l.siteScraped).length,
    icebreakersPorIA: leads.filter((l) => l.icebreakerGeradoPorIA).length,
    icebreakersFallback: leads.filter((l) => !l.icebreakerGeradoPorIA && l.icebreaker).length,
    comIcebreaker: leads.filter((l) => l.icebreaker).length,
  };
}

// ============================================
// HELPERS DE UI
// ============================================

/**
 * Retorna cor para classificação
 */
export function getCorClassificacaoV3(classificacao: LeadClassificacaoV3): string {
  switch (classificacao) {
    case 'HOT':
      return 'text-red-500';
    case 'WARM':
      return 'text-yellow-500';
    case 'COOL':
      return 'text-blue-500';
    default:
      return 'text-zinc-500';
  }
}

/**
 * Retorna emoji para classificação
 */
export function getEmojiClassificacaoV3(classificacao: LeadClassificacaoV3): string {
  switch (classificacao) {
    case 'HOT':
      return '🔥';
    case 'WARM':
      return '🟡';
    case 'COOL':
      return '🔵';
    default:
      return '⚪';
  }
}

/**
 * Retorna cor de background para classificação
 */
export function getBgClassificacaoV3(classificacao: LeadClassificacaoV3): string {
  switch (classificacao) {
    case 'HOT':
      return 'bg-red-500/20';
    case 'WARM':
      return 'bg-yellow-500/20';
    case 'COOL':
      return 'bg-blue-500/20';
    default:
      return 'bg-zinc-500/20';
  }
}

/**
 * Formata oportunidades para exibição
 */
export function formatarOportunidades(oportunidades: string[]): string {
  const labels: Record<string, string> = {
    SEM_SITE: 'Sem site',
    SITE_HTTP: 'Site não seguro',
    POUCAS_AVALIACOES: 'Poucas avaliações',
    RATING_BAIXO: 'Nota baixa',
    BOA_REPUTACAO: 'Boa reputação',
    SEM_HORARIO: 'Sem horário',
    SEM_CONTATO: 'Sem contato',
  };

  return oportunidades.map((o) => labels[o] || o).join(', ');
}

/**
 * Mensagens progressivas para loading
 */
export const MENSAGENS_LOADING_V3 = [
  { tempo: 0, mensagem: 'Iniciando pesquisa...' },
  { tempo: 5000, mensagem: 'Buscando empresas no Google Maps...' },
  { tempo: 15000, mensagem: 'Analisando informações dos leads...' },
  { tempo: 30000, mensagem: 'Fazendo scraping dos sites...' },
  { tempo: 60000, mensagem: 'Gerando icebreakers com IA...' },
  { tempo: 90000, mensagem: 'Finalizando análise...' },
  { tempo: 120000, mensagem: 'Quase lá, processando resultados...' },
] as const;
