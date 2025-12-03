/**
 * @file route.ts
 * @description API routes para gerenciamento de sugestão individual
 * @module api/suggestions/[id]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/suggestions/[id]
 * Atualiza status de uma sugestão
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'applied', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Verifica se a sugestão pertence ao usuário
    const { data: existingSuggestion, error: checkError } = await supabase
      .from('suggestions')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingSuggestion) {
      return NextResponse.json(
        { error: 'Sugestão não encontrada' },
        { status: 404 }
      );
    }

    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('[API] PATCH /api/suggestions/[id] error:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar sugestão' },
        { status: 500 }
      );
    }

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('[API] PATCH /api/suggestions/[id] unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/suggestions/[id]
 * Remove uma sugestão
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[API] DELETE /api/suggestions/[id] error:', error);
      return NextResponse.json(
        { error: 'Erro ao remover sugestão' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/suggestions/[id] unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
