/**
 * @file client.ts
 * @description Cliente OpenRouter para acesso a múltiplos modelos de IA
 * @module lib/openrouter
 *
 * @example
 * import { createOpenRouterClient, getOpenRouterClient } from '@/lib/openrouter';
 *
 * const client = getOpenRouterClient();
 * if (client) {
 *   const response = await client.chat.send({ ... });
 * }
 */

import { OpenRouter } from '@openrouter/sdk';

/**
 * Cache singleton do cliente OpenRouter
 */
let openRouterClient: OpenRouter | null = null;

/**
 * Modelos disponíveis no OpenRouter para uso no TrafficHub
 * Organizados por categoria de uso
 */
export const OPENROUTER_MODELS = {
  /** Modelos de alta performance para análises complexas */
  premium: {
    claude4Opus: 'anthropic/claude-opus-4',
    claude4Sonnet: 'anthropic/claude-sonnet-4',
    gpt4o: 'openai/gpt-4o',
    gpt4Turbo: 'openai/gpt-4-turbo',
  },
  /** Modelos balanceados (custo x performance) */
  balanced: {
    claude35Sonnet: 'anthropic/claude-3.5-sonnet',
    gpt4oMini: 'openai/gpt-4o-mini',
    geminiPro: 'google/gemini-pro-1.5',
  },
  /** Modelos econômicos para tarefas simples */
  economic: {
    claudeHaiku: 'anthropic/claude-3-haiku',
    geminiFlash: 'google/gemini-flash-1.5',
    llama3: 'meta-llama/llama-3.1-70b-instruct',
  },
} as const;

/**
 * Modelo padrão para geração de sugestões
 */
export const DEFAULT_MODEL = OPENROUTER_MODELS.balanced.gpt4oMini;

/**
 * Configurações padrão para requisições
 */
export const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
} as const;

/**
 * Cria uma nova instância do cliente OpenRouter
 *
 * @returns Cliente OpenRouter configurado ou null se não configurado
 */
export function createOpenRouterClient(): OpenRouter | null {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('[OpenRouter] API key not configured');
    return null;
  }

  return new OpenRouter({
    apiKey,
  });
}

/**
 * Obtém o cliente OpenRouter (singleton)
 * Cria uma nova instância apenas se necessário
 *
 * @returns Cliente OpenRouter configurado ou null
 *
 * @example
 * const client = getOpenRouterClient();
 * if (client) {
 *   const completion = await client.chat.send({
 *     model: 'openai/gpt-4o-mini',
 *     messages: [{ role: 'user', content: 'Hello!' }],
 *   });
 * }
 */
export function getOpenRouterClient(): OpenRouter | null {
  if (!openRouterClient) {
    openRouterClient = createOpenRouterClient();
  }
  return openRouterClient;
}

/**
 * Verifica se o OpenRouter está configurado e disponível
 *
 * @returns true se o cliente está disponível
 */
export function isOpenRouterAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Reseta o cliente (útil para testes)
 */
export function resetOpenRouterClient(): void {
  openRouterClient = null;
}
