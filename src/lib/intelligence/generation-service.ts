/**
 * @file generation-service.ts
 * @description Serviço de geração de inteligência usando IA
 * @module lib/intelligence
 */

import { getOpenRouterClient, OPENROUTER_MODELS } from '@/lib/openrouter';
import {
  buildKnowledgeBasePrompt,
  buildExecutiveSummaryPrompt,
  buildContentSuggestionsPrompt,
  buildSeasonalOffersPrompt,
} from './prompt-builder';

import type { Client, BriefingData } from '@/types';
import type {
  ClientKnowledgeBase,
  ContentSuggestion,
  SeasonalOffer,
  ClientIntelligence,
} from '@/types/intelligence';

/**
 * Configuração do serviço de geração
 */
const GENERATION_CONFIG = {
  model: OPENROUTER_MODELS.balanced.gpt4oMini,
  temperature: 0.7,
  maxTokens: 4096,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

/**
 * Resultado da geração com metadados
 */
interface GenerationResult<T> {
  data: T;
  tokensUsed: number;
  model: string;
}

/**
 * Aguarda um tempo antes de retry
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extrai JSON de uma resposta que pode conter markdown
 */
function extractJson(text: string): string {
  // Remove blocos de código markdown se presentes
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch?.[1]) {
    return jsonMatch[1].trim();
  }
  // Se não tem markdown, retorna o texto limpo
  return text.trim();
}

/**
 * Chama a API de IA com retry automático
 */
async function callAI(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<{ content: string; tokensUsed: number }> {
  const client = getOpenRouterClient();

  if (!client) {
    throw new Error('OpenRouter não configurado. Verifique a variável OPENROUTER_API_KEY.');
  }

  const config = {
    temperature: options?.temperature ?? GENERATION_CONFIG.temperature,
    maxTokens: options?.maxTokens ?? GENERATION_CONFIG.maxTokens,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= GENERATION_CONFIG.retryAttempts; attempt++) {
    try {
      const response = await client.chat.send({
        model: GENERATION_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em marketing digital para pequenas e médias empresas brasileiras. Responda sempre em português do Brasil. Quando solicitado JSON, retorne APENAS o JSON válido, sem explicações.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new Error('Resposta vazia ou inválida da IA');
      }

      // Estimar tokens usados (aproximação: 4 caracteres = 1 token)
      const tokensUsed = Math.ceil((prompt.length + content.length) / 4);

      return { content, tokensUsed };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[IntelligenceService] Tentativa ${attempt}/${GENERATION_CONFIG.retryAttempts} falhou:`, lastError.message);

      if (attempt < GENERATION_CONFIG.retryAttempts) {
        await delay(GENERATION_CONFIG.retryDelayMs * attempt);
      }
    }
  }

  throw new Error(`Falha ao gerar inteligência após ${GENERATION_CONFIG.retryAttempts} tentativas: ${lastError?.message}`);
}

/**
 * Gera a Knowledge Base do cliente
 */
export async function generateKnowledgeBase(
  client: Client,
  briefing: BriefingData | null
): Promise<GenerationResult<ClientKnowledgeBase>> {
  const prompt = buildKnowledgeBasePrompt(client, briefing);
  const { content, tokensUsed } = await callAI(prompt);

  try {
    const jsonStr = extractJson(content);
    const data = JSON.parse(jsonStr) as ClientKnowledgeBase;

    return {
      data,
      tokensUsed,
      model: GENERATION_CONFIG.model,
    };
  } catch (error) {
    console.error('[IntelligenceService] Erro ao parsear Knowledge Base:', error);
    console.error('[IntelligenceService] Conteúdo recebido:', content);
    throw new Error('Falha ao processar Knowledge Base gerada pela IA');
  }
}

/**
 * Gera o Executive Summary do cliente
 */
export async function generateExecutiveSummary(
  client: Client,
  briefing: BriefingData | null
): Promise<GenerationResult<string>> {
  const prompt = buildExecutiveSummaryPrompt(client, briefing);
  const { content, tokensUsed } = await callAI(prompt, { temperature: 0.8 });

  return {
    data: content.trim(),
    tokensUsed,
    model: GENERATION_CONFIG.model,
  };
}

/**
 * Gera sugestões de conteúdo personalizadas
 */
export async function generateContentSuggestions(
  client: Client,
  briefing: BriefingData | null
): Promise<GenerationResult<ContentSuggestion[]>> {
  const prompt = buildContentSuggestionsPrompt(client, briefing);
  const { content, tokensUsed } = await callAI(prompt);

  try {
    const jsonStr = extractJson(content);
    const data = JSON.parse(jsonStr) as ContentSuggestion[];

    // Garantir que cada sugestão tem um ID
    const suggestionsWithIds = data.map((suggestion, index) => ({
      ...suggestion,
      id: suggestion.id || `suggestion-${Date.now()}-${index}`,
    }));

    return {
      data: suggestionsWithIds,
      tokensUsed,
      model: GENERATION_CONFIG.model,
    };
  } catch (error) {
    console.error('[IntelligenceService] Erro ao parsear Content Suggestions:', error);
    console.error('[IntelligenceService] Conteúdo recebido:', content);
    throw new Error('Falha ao processar sugestões de conteúdo geradas pela IA');
  }
}

/**
 * Gera ofertas sazonais com cálculos de margem
 */
export async function generateSeasonalOffers(
  client: Client,
  briefing: BriefingData | null
): Promise<GenerationResult<SeasonalOffer[]>> {
  const prompt = buildSeasonalOffersPrompt(client, briefing);
  const { content, tokensUsed } = await callAI(prompt, { maxTokens: 6000 });

  try {
    const jsonStr = extractJson(content);
    const data = JSON.parse(jsonStr) as SeasonalOffer[];

    // Garantir que cada oferta tem um ID
    const offersWithIds = data.map((offer, index) => ({
      ...offer,
      id: offer.id || `offer-${Date.now()}-${index}`,
    }));

    return {
      data: offersWithIds,
      tokensUsed,
      model: GENERATION_CONFIG.model,
    };
  } catch (error) {
    console.error('[IntelligenceService] Erro ao parsear Seasonal Offers:', error);
    console.error('[IntelligenceService] Conteúdo recebido:', content);
    throw new Error('Falha ao processar ofertas sazonais geradas pela IA');
  }
}

/**
 * Gera toda a inteligência do cliente de uma vez
 * Executa as gerações em paralelo para melhor performance
 */
export async function generateFullIntelligence(
  client: Client,
  briefing: BriefingData | null
): Promise<Omit<ClientIntelligence, 'id' | 'client_id' | 'user_id' | 'created_at' | 'updated_at'>> {
  // Executar gerações em paralelo
  const [knowledgeBaseResult, summaryResult, suggestionsResult, offersResult] = await Promise.all([
    generateKnowledgeBase(client, briefing),
    generateExecutiveSummary(client, briefing),
    generateContentSuggestions(client, briefing),
    generateSeasonalOffers(client, briefing),
  ]);

  const totalTokens =
    knowledgeBaseResult.tokensUsed +
    summaryResult.tokensUsed +
    suggestionsResult.tokensUsed +
    offersResult.tokensUsed;

  return {
    knowledge_base: knowledgeBaseResult.data,
    executive_summary: summaryResult.data,
    content_suggestions: suggestionsResult.data,
    seasonal_offers: offersResult.data,
    ai_model: GENERATION_CONFIG.model,
    tokens_used: totalTokens,
    last_generated_at: new Date().toISOString(),
    generation_count: 1,
  };
}

/**
 * Verifica se a inteligência está desatualizada
 * Considera desatualizada se tiver mais de 30 dias
 */
export function isIntelligenceStale(intelligence: ClientIntelligence, daysThreshold = 30): boolean {
  const generatedAt = new Date(intelligence.last_generated_at);
  const now = new Date();
  const diffTime = now.getTime() - generatedAt.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays > daysThreshold;
}

/**
 * Calcula o custo estimado da geração em USD
 * Baseado nos preços do OpenRouter para gpt-4o-mini
 */
export function estimateGenerationCost(tokensUsed: number): number {
  // Preços aproximados do gpt-4o-mini no OpenRouter (USD por 1M tokens)
  const pricePerMillion = 0.15; // input
  const outputPricePerMillion = 0.6; // output

  // Estimativa: 30% input, 70% output
  const inputTokens = tokensUsed * 0.3;
  const outputTokens = tokensUsed * 0.7;

  const cost =
    (inputTokens / 1_000_000) * pricePerMillion +
    (outputTokens / 1_000_000) * outputPricePerMillion;

  return Math.round(cost * 10000) / 10000; // 4 casas decimais
}
