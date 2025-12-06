/**
 * @file claude-client.ts
 * @description Cliente para API do Claude (Anthropic) com suporte a Function Calling
 * @module lib/assistant
 */

import Anthropic from '@anthropic-ai/sdk';

import type { UserContext, ClaudeResponse, ToolCall, ChatMessage } from './types';
import { getToolsForClaude } from './tools';
import { buildSystemPrompt, formatChatHistory } from './prompt-builder';

// Modelo principal: Claude Sonnet 4 (bom custo/benefício)
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;

// Cliente Anthropic (singleton)
let anthropicClient: Anthropic | null = null;

/**
 * Obtém o cliente Anthropic (lazy initialization)
 * @returns Cliente Anthropic configurado
 */
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Extrai tool calls da resposta do Claude
 * @param content - Conteúdo da resposta
 * @returns Array de ToolCall
 */
function extractToolCalls(content: Anthropic.ContentBlock[]): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  for (const block of content) {
    if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        parameters: block.input as Record<string, unknown>
      });
    }
  }

  return toolCalls;
}

/**
 * Extrai texto da resposta do Claude
 * @param content - Conteúdo da resposta
 * @returns Texto concatenado
 */
function extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

/**
 * Processa uma mensagem com o Claude
 * @param message - Mensagem do usuário
 * @param context - Contexto do usuário
 * @param history - Histórico de mensagens (opcional)
 * @returns Resposta do Claude com possíveis tool calls
 *
 * @example
 * const response = await processMessage("Marca reunião com João dia 18", context, history);
 * if (response.toolCalls.length > 0) {
 *   // Processar tool calls
 * }
 */
export async function processMessage(
  message: string,
  context: UserContext,
  history: ChatMessage[] = []
): Promise<ClaudeResponse> {
  const client = getAnthropicClient();
  const systemPrompt = buildSystemPrompt(context);
  const tools = getToolsForClaude();

  // Formatar histórico (últimas 10 mensagens para economizar tokens)
  const formattedHistory = formatChatHistory(
    history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content
    }))
  );

  // Adicionar mensagem atual
  const messages: Anthropic.MessageParam[] = [
    ...formattedHistory,
    { role: 'user', content: message }
  ];

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: tools as Anthropic.Tool[],
      messages
    });

    const toolCalls = extractToolCalls(response.content);
    const textContent = extractTextContent(response.content);

    return {
      message: textContent,
      toolCalls,
      stopReason: response.stop_reason || 'end_turn'
    };
  } catch (error) {
    console.error('[claude-client] Erro ao processar mensagem:', error);
    throw error;
  }
}

/**
 * Continua uma conversa após resultado de tool
 * @param toolResults - Resultados dos tools executados
 * @param context - Contexto do usuário
 * @param previousMessages - Mensagens anteriores
 * @returns Resposta do Claude
 */
export async function continueWithToolResults(
  toolResults: Array<{ toolId: string; result: string }>,
  context: UserContext,
  previousMessages: Anthropic.MessageParam[]
): Promise<ClaudeResponse> {
  const client = getAnthropicClient();
  const systemPrompt = buildSystemPrompt(context);
  const tools = getToolsForClaude();

  // Adicionar resultados dos tools
  const toolResultContent: Anthropic.ToolResultBlockParam[] = toolResults.map((tr) => ({
    type: 'tool_result' as const,
    tool_use_id: tr.toolId,
    content: tr.result
  }));

  const messages: Anthropic.MessageParam[] = [
    ...previousMessages,
    { role: 'user', content: toolResultContent }
  ];

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: tools as Anthropic.Tool[],
      messages
    });

    const toolCalls = extractToolCalls(response.content);
    const textContent = extractTextContent(response.content);

    return {
      message: textContent,
      toolCalls,
      stopReason: response.stop_reason || 'end_turn'
    };
  } catch (error) {
    console.error('[claude-client] Erro ao continuar conversa:', error);
    throw error;
  }
}

/**
 * Gera uma resposta simples sem tools (para mensagens rápidas)
 * @param message - Mensagem do usuário
 * @param context - Contexto simplificado
 * @returns Texto da resposta
 */
export async function generateSimpleResponse(
  message: string,
  context: string
): Promise<string> {
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: context,
      messages: [{ role: 'user', content: message }]
    });

    return extractTextContent(response.content);
  } catch (error) {
    console.error('[claude-client] Erro ao gerar resposta simples:', error);
    throw error;
  }
}

/**
 * Verifica se a API key está configurada e válida
 * @returns true se a configuração está OK
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    const client = getAnthropicClient();
    // Fazer uma chamada mínima para validar
    await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }]
    });
    return true;
  } catch (error) {
    console.error('[claude-client] API key inválida:', error);
    return false;
  }
}
