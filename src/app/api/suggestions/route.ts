/**
 * @file route.ts
 * @description API routes para gerenciamento de sugestões
 * @module api/suggestions
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

/**
 * GET /api/suggestions
 * Lista sugestões do usuário logado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const severity = searchParams.get('severity');

    let query = supabase
      .from('suggestions')
      .select(`
        *,
        client:clients(id, name, segment)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: suggestions, error } = await query;

    if (error) {
      console.error('[API] GET /api/suggestions error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar sugestões' },
        { status: 500 }
      );
    }

    return NextResponse.json(suggestions || []);
  } catch (error) {
    console.error('[API] GET /api/suggestions unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/suggestions
 * Cria uma nova sugestão
 */
export async function POST(request: NextRequest) {
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
    const { client_id, type, severity, title, description, actions } = body;

    if (!client_id || !type || !severity || !title || !description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .insert({
        user_id: user.id,
        client_id,
        type,
        severity,
        title,
        description,
        actions: actions || [],
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/suggestions error:', error);
      return NextResponse.json(
        { error: 'Erro ao criar sugestão' },
        { status: 500 }
      );
    }

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/suggestions unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
