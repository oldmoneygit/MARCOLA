/**
 * @file route.ts
 * @description API de contexto do MARCOLA Assistant - retorna dados do usuário
 * @module app/api/assistant/context
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildUserContext } from '@/lib/assistant';
import type { ContextApiResponse } from '@/lib/assistant/types';

/**
 * GET /api/assistant/context
 * Retorna o contexto atual do usuário para o assistente
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ContextApiResponse>(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar contexto completo
    const context = await buildUserContext(user.id);

    return NextResponse.json<ContextApiResponse>({
      context
    });

  } catch (error) {
    console.error('[/api/assistant/context] Erro:', error);
    return NextResponse.json<ContextApiResponse>(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
