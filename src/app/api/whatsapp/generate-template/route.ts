/**
 * @file route.ts
 * @description API para gerar templates de mensagem WhatsApp com IA
 * @module api/whatsapp/generate-template
 */

import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface GenerateTemplateRequest {
  prompt: string;
  category: string;
  clientName?: string;
  clientSegment?: string;
  context?: string;
}

interface GenerateTemplateResponse {
  success: boolean;
  template?: string;
  name?: string;
  description?: string;
  variables?: string[];
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT PARA GERAÇÃO DE TEMPLATES
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Você é um especialista em comunicação via WhatsApp para agências de tráfego pago e marketing digital. Sua tarefa é gerar templates de mensagem profissionais, amigáveis e efetivos.

REGRAS:
1. Use linguagem natural e amigável, como se fosse uma conversa real
2. Use emojis com moderação para dar personalidade (2-4 por mensagem)
3. Mantenha as mensagens concisas (máx. 5-7 linhas)
4. Use variáveis no formato {nome_variavel} para dados dinâmicos
5. Termine sempre com uma chamada para ação ou pergunta
6. Use formatação WhatsApp: *negrito*, _itálico_

VARIÁVEIS COMUNS:
- {nome} - Nome do cliente
- {valor} - Valor monetário
- {data} - Data
- {prazo} - Prazo
- {servico} - Serviço contratado
- {periodo} - Período do relatório
- {resultado} - Resultado alcançado

CATEGORIAS:
- payment: Lembretes de pagamento, cobranças
- followup: Follow-up de vendas, relacionamento
- onboarding: Boas-vindas, início de serviço
- report: Relatórios, resultados
- custom: Mensagens personalizadas

Responda APENAS com um JSON válido no formato:
{
  "name": "Nome curto do template",
  "description": "Descrição do propósito",
  "template": "Texto da mensagem com {variaveis}",
  "variables": ["lista", "de", "variaveis"]
}`;

// ═══════════════════════════════════════════════════════════════
// POST - Gerar template com IA
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse<GenerateTemplateResponse>> {
  try {
    const body = await request.json() as GenerateTemplateRequest;
    const { prompt, category, clientName, clientSegment, context } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'prompt é obrigatório' },
        { status: 400 }
      );
    }

    // Montar prompt do usuário
    let userPrompt = `Gere um template de mensagem WhatsApp para a categoria "${category}".

Solicitação do usuário: ${prompt}`;

    if (clientName) {
      userPrompt += `\nNome do cliente: ${clientName}`;
    }

    if (clientSegment) {
      userPrompt += `\nSegmento do cliente: ${clientSegment}`;
    }

    if (context) {
      userPrompt += `\nContexto adicional: ${context}`;
    }

    userPrompt += '\n\nResponda APENAS com o JSON, sem explicações adicionais.';

    // Chamar OpenRouter API
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    let response;
    let aiProvider = 'openrouter';

    if (openRouterKey) {
      // Usar OpenRouter
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'MARCOLA WhatsApp Templates',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
    } else if (openAIKey) {
      // Fallback para OpenAI diretamente
      aiProvider = 'openai';
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Nenhuma API de IA configurada' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Generate Template] Erro ${aiProvider}:`, errorText);
      return NextResponse.json(
        { success: false, error: `Erro ao gerar template: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Resposta vazia da IA' },
        { status: 500 }
      );
    }

    // Tentar parsear o JSON da resposta
    let parsedTemplate;
    try {
      // Remover possíveis backticks de código
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      parsedTemplate = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[Generate Template] Erro ao parsear JSON:', content);

      // Tentar extrair o template mesmo assim
      const templateMatch = content.match(/"template"\s*:\s*"([^"]+)"/);
      if (templateMatch) {
        parsedTemplate = {
          name: 'Template Gerado',
          description: 'Template gerado por IA',
          template: templateMatch[1].replace(/\\n/g, '\n'),
          variables: [],
        };
      } else {
        return NextResponse.json(
          { success: false, error: 'Erro ao processar resposta da IA' },
          { status: 500 }
        );
      }
    }

    console.log(`✅ [Generate Template] Template gerado via ${aiProvider}`);

    return NextResponse.json({
      success: true,
      name: parsedTemplate.name || 'Template Gerado',
      description: parsedTemplate.description || '',
      template: parsedTemplate.template,
      variables: parsedTemplate.variables || [],
    });
  } catch (error) {
    console.error('[Generate Template] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
