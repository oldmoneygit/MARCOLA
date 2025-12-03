/**
 * @file route.ts
 * @description API Route para listagem e criação de notas de cliente
 * @module api/notes
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { CreateClientNoteDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/notes
 * Lista notas do usuário autenticado
 *
 * Query params:
 * - client_id: Filtrar por cliente (obrigatório)
 * - pinned: Filtrar por fixadas (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const pinned = searchParams.get('pinned');

    if (!clientId) {
      return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }

    // Verificar se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    let query = supabase
      .from('client_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_id', clientId);

    if (pinned !== null) {
      query = query.eq('is_pinned', pinned === 'true');
    }

    // Ordenar: fixadas primeiro, depois por data de criação
    const { data: notes, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] GET /api/notes error:', error);
      return NextResponse.json({ error: 'Erro ao buscar notas' }, { status: 500 });
    }

    return NextResponse.json(notes);
  } catch (err) {
    console.error('[API] GET /api/notes unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/notes
 * Cria uma nova nota
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: CreateClientNoteDTO = await request.json();

    // Validação básica
    if (!body.client_id || !body.content) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: client_id, content' },
        { status: 400 }
      );
    }

    // Verificar se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', body.client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const { data: note, error } = await supabase
      .from('client_notes')
      .insert({
        user_id: user.id,
        client_id: body.client_id,
        content: body.content,
        is_pinned: body.is_pinned || false,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/notes error:', error);
      return NextResponse.json({ error: 'Erro ao criar nota' }, { status: 500 });
    }

    return NextResponse.json(note, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/notes unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
