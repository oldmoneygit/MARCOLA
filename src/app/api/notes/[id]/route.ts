/**
 * @file route.ts
 * @description API Route para operações em nota específica
 * @module api/notes/[id]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { UpdateClientNoteDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/notes/[id]
 * Retorna uma nota específica
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: note, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !note) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (err) {
    console.error('[API] GET /api/notes/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/notes/[id]
 * Atualiza uma nota
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: UpdateClientNoteDTO = await request.json();

    // Verificar se a nota pertence ao usuário
    const { data: existingNote, error: existingError } = await supabase
      .from('client_notes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingNote) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.content !== undefined) {
      updateData.content = body.content;
    }
    if (body.is_pinned !== undefined) {
      updateData.is_pinned = body.is_pinned;
    }

    const { data: note, error } = await supabase
      .from('client_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] PUT /api/notes/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar nota' }, { status: 500 });
    }

    return NextResponse.json(note);
  } catch (err) {
    console.error('[API] PUT /api/notes/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/[id]
 * Remove uma nota
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se a nota pertence ao usuário
    const { data: note, error: fetchError } = await supabase
      .from('client_notes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !note) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
    }

    const { error } = await supabase.from('client_notes').delete().eq('id', id);

    if (error) {
      console.error('[API] DELETE /api/notes/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao deletar nota' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/notes/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
