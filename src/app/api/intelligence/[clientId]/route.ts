/**
 * @file route.ts
 * @description API Routes para inteligência de cliente específico
 * @module api/intelligence/[clientId]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/**
 * GET /api/intelligence/[clientId]
 * Busca a inteligência de um cliente específico
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar inteligência
    const { data: intelligence, error } = await supabase
      .from('client_intelligence')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[API] GET /api/intelligence/[clientId] error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar inteligência' },
        { status: 500 }
      );
    }

    if (!intelligence) {
      return NextResponse.json(
        { error: 'Inteligência não encontrada. Gere primeiro.' },
        { status: 404 }
      );
    }

    return NextResponse.json(intelligence);
  } catch (err) {
    console.error('[API] GET /api/intelligence/[clientId] unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/intelligence/[clientId]
 * Remove a inteligência de um cliente
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Deletar inteligência
    const { error } = await supabase
      .from('client_intelligence')
      .delete()
      .eq('client_id', clientId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[API] DELETE /api/intelligence/[clientId] error:', error);
      return NextResponse.json(
        { error: 'Erro ao remover inteligência' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/intelligence/[clientId] unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
