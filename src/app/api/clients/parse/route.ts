/**
 * @file route.ts
 * @description API route para parsing de dados de cliente via IA
 * @module api/clients/parse
 */

import { NextRequest, NextResponse } from 'next/server';

import { parseClientFromText, isOpenRouterAvailable } from '@/lib/openrouter';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/clients/parse
 * Extrai dados estruturados de cliente a partir de texto livre
 *
 * @body { text: string } - Texto livre descrevendo o cliente
 * @returns ParsedClientData - Dados extraídos pela IA
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se OpenRouter está configurado
    if (!isOpenRouterAvailable()) {
      return NextResponse.json(
        { error: 'Serviço de IA não configurado. Contate o administrador.' },
        { status: 503 }
      );
    }

    // Obter texto do body
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Texto é obrigatório' },
        { status: 400 }
      );
    }

    if (text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Texto muito curto. Forneça mais informações sobre o cliente.' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Texto muito longo. Máximo de 5000 caracteres.' },
        { status: 400 }
      );
    }

    // Processar com IA
    const parsedData = await parseClientFromText(text);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('[API] POST /api/clients/parse error:', error);

    if (error instanceof Error) {
      // Erros conhecidos
      if (error.message.includes('OpenRouter')) {
        return NextResponse.json(
          { error: 'Serviço de IA indisponível. Tente novamente.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
