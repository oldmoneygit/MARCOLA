/**
 * @file ai-client.ts
 * @description Cliente de IA multi-provedor com fallback automático
 * @module lib/assistant
 *
 * Ordem de fallback:
 * 1. OpenAI (GPT-4o-mini) - primário (mais barato)
 * 2. Anthropic (Claude) - fallback 1
 * 3. Google (Gemini) - fallback 2
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI, SchemaType, type Tool as GeminiTool } from '@google/generative-ai';

import type { UserContext, ClaudeResponse, ToolCall, ChatMessage, ToolDefinition } from './types';
import { getToolsForClaude, ASSISTANT_TOOLS } from './tools';
import { buildSystemPrompt, formatChatHistory } from './prompt-builder';

// ==================== CONFIGURAÇÃO ====================

type AIProvider = 'anthropic' | 'openai' | 'google';

interface ProviderConfig {
  name: AIProvider;
  model: string;
  available: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  { name: 'openai', model: 'gpt-4o-mini', available: !!process.env.OPENAI_API_KEY },
  { name: 'anthropic', model: 'claude-sonnet-4-20250514', available: !!process.env.ANTHROPIC_API_KEY },
  { name: 'google', model: 'gemini-1.5-flash', available: !!process.env.GOOGLE_API_KEY }
];

const MAX_TOKENS = 2048;

// ==================== CLIENTES (SINGLETONS) ====================

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let googleClient: GoogleGenerativeAI | null = null;

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

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getGoogleClient(): GoogleGenerativeAI {
  if (!googleClient) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY não configurada');
    }
    googleClient = new GoogleGenerativeAI(apiKey);
  }
  return googleClient;
}

// ==================== CONVERSÃO DE TOOLS ====================

/**
 * Converte tools para formato OpenAI
 */
function getToolsForOpenAI(): OpenAI.Chat.ChatCompletionTool[] {
  return ASSISTANT_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

/**
 * Converte tipo de parâmetro para schema do Gemini
 */
function convertTypeToGemini(type: string): SchemaType {
  switch (type) {
    case 'string':
      return SchemaType.STRING;
    case 'number':
    case 'integer':
      return SchemaType.NUMBER;
    case 'boolean':
      return SchemaType.BOOLEAN;
    case 'array':
      return SchemaType.ARRAY;
    case 'object':
      return SchemaType.OBJECT;
    default:
      return SchemaType.STRING;
  }
}

/**
 * Converte tools para formato Google Gemini
 */
function getToolsForGemini(): GeminiTool {
  return {
    functionDeclarations: ASSISTANT_TOOLS.map((tool: ToolDefinition) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: Object.fromEntries(
          Object.entries(tool.parameters.properties).map(([key, value]) => [
            key,
            {
              type: convertTypeToGemini(value.type),
              description: value.description || ''
            }
          ])
        ),
        required: tool.parameters.required
      }
    }))
  } as GeminiTool;
}

// ==================== PROCESSAMENTO POR PROVEDOR ====================

/**
 * Processa mensagem com Anthropic (Claude)
 */
async function processWithAnthropic(
  message: string,
  systemPrompt: string,
  formattedHistory: Anthropic.MessageParam[]
): Promise<ClaudeResponse> {
  const client = getAnthropicClient();
  const tools = getToolsForClaude();

  const messages: Anthropic.MessageParam[] = [
    ...formattedHistory,
    { role: 'user', content: message }
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    tools: tools as Anthropic.Tool[],
    messages
  });

  const toolCalls: ToolCall[] = [];
  let textContent = '';

  for (const block of response.content) {
    if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        parameters: block.input as Record<string, unknown>
      });
    } else if (block.type === 'text') {
      textContent += block.text;
    }
  }

  return {
    message: textContent.trim(),
    toolCalls,
    stopReason: response.stop_reason || 'end_turn'
  };
}

/**
 * Processa mensagem com OpenAI (GPT-4o-mini)
 */
async function processWithOpenAI(
  message: string,
  systemPrompt: string,
  formattedHistory: Array<{ role: string; content: string }>
): Promise<ClaudeResponse> {
  const client = getOpenAIClient();
  const tools = getToolsForOpenAI();

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    { role: 'user', content: message }
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: MAX_TOKENS,
    messages,
    tools,
    tool_choice: 'auto'
  });

  const choice = response.choices[0];
  const toolCalls: ToolCall[] = [];

  // Verificar se choice existe
  if (!choice) {
    return {
      message: '',
      toolCalls: [],
      stopReason: 'error'
    };
  }

  if (choice.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      if (tc.type === 'function') {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          parameters: JSON.parse(tc.function.arguments || '{}')
        });
      }
    }
  }

  return {
    message: choice.message.content || '',
    toolCalls,
    stopReason: choice.finish_reason || 'stop'
  };
}

/**
 * Processa mensagem com Google Gemini
 */
async function processWithGemini(
  message: string,
  systemPrompt: string,
  formattedHistory: Array<{ role: string; content: string }>
): Promise<ClaudeResponse> {
  const client = getGoogleClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
    tools: [getToolsForGemini()]
  });

  // Converter histórico para formato Gemini
  const history = formattedHistory.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(message);
  const response = result.response;

  const toolCalls: ToolCall[] = [];
  let textContent = '';

  // Processar partes da resposta
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if ('functionCall' in part && part.functionCall) {
        toolCalls.push({
          id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: part.functionCall.name,
          parameters: (part.functionCall.args as Record<string, unknown>) || {}
        });
      } else if ('text' in part && part.text) {
        textContent += part.text;
      }
    }
  }

  return {
    message: textContent.trim(),
    toolCalls,
    stopReason: response.candidates?.[0]?.finishReason || 'STOP'
  };
}

// ==================== FUNÇÃO PRINCIPAL COM FALLBACK ====================

/**
 * Processa uma mensagem com fallback automático entre provedores
 * @param message - Mensagem do usuário
 * @param context - Contexto do usuário
 * @param history - Histórico de mensagens (opcional)
 * @returns Resposta com possíveis tool calls
 */
export async function processMessage(
  message: string,
  context: UserContext,
  history: ChatMessage[] = []
): Promise<ClaudeResponse & { provider: AIProvider }> {
  const systemPrompt = buildSystemPrompt(context);

  // Formatar histórico (últimas 10 mensagens)
  const formattedHistory = formatChatHistory(
    history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content
    }))
  );

  // Histórico simplificado para OpenAI e Gemini
  const simpleHistory = history.slice(-10).map((m) => ({
    role: m.role as string,
    content: m.content
  }));

  // Tentar cada provedor na ordem de fallback (OpenAI primeiro - mais barato)
  const errors: Array<{ provider: string; error: string }> = [];

  // 1. Tentar OpenAI (GPT-4o-mini) - mais barato
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('[ai-client] Tentando OpenAI (GPT-4o-mini)...');
      const response = await processWithOpenAI(message, systemPrompt, simpleHistory);
      console.log('[ai-client] Sucesso com OpenAI');
      return { ...response, provider: 'openai' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[ai-client] Erro com OpenAI:', errorMsg);
      errors.push({ provider: 'openai', error: errorMsg });
    }
  }

  // 2. Tentar Anthropic (Claude) - fallback
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('[ai-client] Tentando Anthropic (Claude)...');
      const response = await processWithAnthropic(message, systemPrompt, formattedHistory);
      console.log('[ai-client] Sucesso com Anthropic');
      return { ...response, provider: 'anthropic' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[ai-client] Erro com Anthropic:', errorMsg);
      errors.push({ provider: 'anthropic', error: errorMsg });
    }
  }

  // 3. Tentar Google Gemini - último fallback
  if (process.env.GOOGLE_API_KEY) {
    try {
      console.log('[ai-client] Tentando Google Gemini...');
      const response = await processWithGemini(message, systemPrompt, simpleHistory);
      console.log('[ai-client] Sucesso com Google Gemini');
      return { ...response, provider: 'google' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[ai-client] Erro com Google Gemini:', errorMsg);
      errors.push({ provider: 'google', error: errorMsg });
    }
  }

  // Se nenhum provedor funcionou, lançar erro com detalhes
  const errorDetails = errors.map((e) => `${e.provider}: ${e.error}`).join('; ');
  throw new Error(`Todos os provedores de IA falharam. Detalhes: ${errorDetails || 'Nenhuma API key configurada'}`);
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
  // Tentar OpenAI primeiro (mais barato para respostas simples)
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 512,
        messages: [
          { role: 'system', content: context },
          { role: 'user', content: message }
        ]
      });
      const choice = response.choices[0];
      if (choice) {
        return choice.message.content || '';
      }
    } catch (error) {
      console.error('[ai-client] Erro OpenAI (simple):', error);
    }
  }

  // Fallback para Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: context,
        messages: [{ role: 'user', content: message }]
      });

      return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();
    } catch (error) {
      console.error('[ai-client] Erro Anthropic (simple):', error);
    }
  }

  // Fallback para Gemini
  if (process.env.GOOGLE_API_KEY) {
    try {
      const client = getGoogleClient();
      const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: context
      });
      const result = await model.generateContent(message);
      return result.response.text();
    } catch (error) {
      console.error('[ai-client] Erro Gemini (simple):', error);
    }
  }

  throw new Error('Nenhum provedor de IA disponível');
}

/**
 * Lista provedores disponíveis
 * @returns Lista de provedores configurados
 */
export function getAvailableProviders(): ProviderConfig[] {
  return PROVIDERS.map((p) => ({
    ...p,
    available: p.name === 'anthropic' ? !!process.env.ANTHROPIC_API_KEY :
               p.name === 'openai' ? !!process.env.OPENAI_API_KEY :
               p.name === 'google' ? !!process.env.GOOGLE_API_KEY : false
  }));
}

/**
 * Verifica se pelo menos um provedor está disponível
 * @returns true se algum provedor está configurado
 */
export function hasAvailableProvider(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY);
}
