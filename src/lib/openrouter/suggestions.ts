/**
 * @file suggestions.ts
 * @description Serviço de geração de sugestões inteligentes usando IA
 * @module lib/openrouter
 *
 * @example
 * import { generateAdSuggestions } from '@/lib/openrouter';
 *
 * const suggestions = await generateAdSuggestions(reportData);
 */

import type { Ad, Report } from '@/types';
import type { AISuggestion, AIAnalysisResult, AdPerformanceContext, AISuggestionType } from '@/types/ai';
import type { SuggestionSeverity } from '@/types/analysis';

import {
  getOpenRouterClient,
  DEFAULT_MODEL,
  DEFAULT_CONFIG,
  OPENROUTER_MODELS,
} from './client';

/**
 * Prompt do sistema para análise de performance de anúncios
 */
const SYSTEM_PROMPT = `Você é um especialista em tráfego pago e marketing digital.
Sua função é analisar dados de campanhas de anúncios e fornecer sugestões práticas e acionáveis.

Diretrizes:
- Seja direto e objetivo nas sugestões
- Priorize ações que podem ser implementadas imediatamente
- Considere o contexto brasileiro de marketing digital
- Use métricas como CTR, CPC, CPA e ROAS para basear suas análises
- Classifique a severidade das sugestões (urgent, warning, info)

Formato de resposta: JSON válido seguindo o schema fornecido.`;

/**
 * Gera sugestões de otimização para anúncios com base nos dados de performance
 *
 * @param ads - Lista de anúncios para análise
 * @param report - Relatório com dados agregados
 * @returns Lista de sugestões geradas pela IA
 */
export async function generateAdSuggestions(
  ads: Ad[],
  report: Report
): Promise<AISuggestion[]> {
  const client = getOpenRouterClient();

  if (!client) {
    console.warn('[OpenRouter] Client not available, returning empty suggestions');
    return [];
  }

  const context = buildPerformanceContext(ads, report);
  const prompt = buildSuggestionsPrompt(context);

  try {
    const completion = await client.chat.send({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: DEFAULT_CONFIG.temperature,
      maxTokens: DEFAULT_CONFIG.maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return [];
    }

    return parseSuggestionsResponse(content);
  } catch (error) {
    console.error('[OpenRouter] Error generating suggestions:', error);
    return [];
  }
}

/**
 * Analisa a performance geral de uma campanha
 *
 * @param report - Relatório da campanha
 * @param ads - Anúncios da campanha
 * @returns Análise detalhada da performance
 */
export async function analyzePerformance(
  report: Report,
  ads: Ad[]
): Promise<AIAnalysisResult | null> {
  const client = getOpenRouterClient();

  if (!client) {
    return null;
  }

  const context = buildPerformanceContext(ads, report);

  const prompt = `Analise a performance desta campanha de anúncios:

${JSON.stringify(context, null, 2)}

Forneça uma análise estruturada em JSON com:
{
  "summary": "Resumo executivo da performance",
  "score": 0-100,
  "strengths": ["pontos fortes"],
  "weaknesses": ["pontos fracos"],
  "opportunities": ["oportunidades de melhoria"],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "ação recomendada",
      "expectedImpact": "impacto esperado"
    }
  ]
}`;

  try {
    const completion = await client.chat.send({
      model: OPENROUTER_MODELS.balanced.gpt4oMini,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 2048,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return null;
    }

    return parseAnalysisResponse(content);
  } catch (error) {
    console.error('[OpenRouter] Error analyzing performance:', error);
    return null;
  }
}

/**
 * Gera um relatório resumido em linguagem natural
 *
 * @param report - Relatório para resumir
 * @param ads - Anúncios do relatório
 * @returns Texto resumido do relatório
 */
export async function generateReportSummary(
  report: Report,
  ads: Ad[]
): Promise<string | null> {
  const client = getOpenRouterClient();

  if (!client) {
    return null;
  }

  const context = buildPerformanceContext(ads, report);

  const prompt = `Gere um resumo executivo em português brasileiro para este relatório de campanha:

${JSON.stringify(context, null, 2)}

O resumo deve:
- Ter no máximo 3 parágrafos
- Destacar os principais resultados
- Mencionar os melhores e piores anúncios
- Sugerir próximos passos

Responda apenas com o texto do resumo, sem formatação JSON.`;

  try {
    const completion = await client.chat.send({
      model: OPENROUTER_MODELS.economic.geminiFlash,
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 1024,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return null;
    }

    return content;
  } catch (error) {
    console.error('[OpenRouter] Error generating summary:', error);
    return null;
  }
}

/**
 * Constrói o contexto de performance para análise
 */
function buildPerformanceContext(ads: Ad[], report: Report): AdPerformanceContext {
  const totalSpend = ads.reduce((sum, ad) => sum + Number(ad.spend || 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalConversions = ads.reduce((sum, ad) => sum + (ad.conversions || 0), 0);

  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

  return {
    period: {
      start: report.period_start,
      end: report.period_end,
    },
    totals: {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
    },
    averages: {
      ctr: Number(avgCTR.toFixed(2)),
      cpc: Number(avgCPC.toFixed(2)),
      cpa: Number(avgCPA.toFixed(2)),
    },
    ads: ads.map((ad) => ({
      id: ad.id,
      name: ad.ad_name || 'Sem nome',
      spend: Number(ad.spend || 0),
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      conversions: ad.conversions || 0,
      ctr: Number(ad.ctr || 0),
      cpc: Number(ad.cpc || 0),
      cpa: Number(ad.cpa || 0),
      status: ad.status || 'active',
    })),
  };
}

/**
 * Constrói o prompt para geração de sugestões
 */
function buildSuggestionsPrompt(context: AdPerformanceContext): string {
  return `Analise os dados de performance abaixo e gere sugestões de otimização:

Período: ${context.period.start} a ${context.period.end}

Métricas Totais:
- Investimento: R$ ${context.totals.spend.toFixed(2)}
- Impressões: ${context.totals.impressions.toLocaleString('pt-BR')}
- Cliques: ${context.totals.clicks.toLocaleString('pt-BR')}
- Conversões: ${context.totals.conversions}

Médias:
- CTR: ${context.averages.ctr}%
- CPC: R$ ${context.averages.cpc}
- CPA: R$ ${context.averages.cpa}

Anúncios (${context.ads.length} total):
${context.ads.map((ad) => `
- ${ad.name}
  Status: ${ad.status}
  Gasto: R$ ${ad.spend.toFixed(2)}
  CTR: ${ad.ctr}% | CPC: R$ ${ad.cpc} | CPA: R$ ${ad.cpa}
  Conversões: ${ad.conversions}
`).join('')}

Responda em JSON com array de sugestões:
[
  {
    "type": "optimization|budget|creative|audience|pause",
    "severity": "urgent|warning|info",
    "title": "Título curto da sugestão",
    "description": "Descrição detalhada",
    "affectedAds": ["id1", "id2"],
    "actions": [
      {
        "label": "Texto do botão",
        "action": "tipo_da_acao"
      }
    ]
  }
]`;
}

/**
 * Parseia a resposta de sugestões da IA
 */
function parseSuggestionsResponse(content: string): AISuggestion[] {
  try {
    // Remove possíveis marcadores de código
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonContent);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((item: Record<string, unknown>) => ({
      type: (item.type as AISuggestionType) || 'optimization',
      severity: (item.severity as SuggestionSeverity) || 'info',
      title: (item.title as string) || '',
      description: (item.description as string) || '',
      affectedAds: (item.affectedAds as string[]) || [],
      actions: (item.actions as AISuggestion['actions']) || [],
    }));
  } catch (error) {
    console.error('[OpenRouter] Error parsing suggestions:', error);
    return [];
  }
}

/**
 * Parseia a resposta de análise da IA
 */
function parseAnalysisResponse(content: string): AIAnalysisResult | null {
  try {
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonContent);

    return {
      summary: parsed.summary || '',
      score: parsed.score || 0,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      opportunities: parsed.opportunities || [],
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error('[OpenRouter] Error parsing analysis:', error);
    return null;
  }
}
