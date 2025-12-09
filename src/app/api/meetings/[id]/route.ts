/**
 * @file route.ts
 * @description API Route para operações em reunião individual
 * @module api/meetings/[id]
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { UpdateMeetingDTO } from '@/types/meetings';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/meetings/[id]
 * Obtém detalhes de uma reunião específica
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select(`
        *,
        client:clients(id, name, contact_name, avatar_url, email, phone)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
      }
      console.error('[meetings/[id]] Erro:', error);
      return NextResponse.json({ error: 'Erro ao buscar reunião' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meeting,
    });
  } catch (error) {
    console.error('[meetings/[id]] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meetings/[id]
 * Atualiza uma reunião
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: UpdateMeetingDTO = await request.json();

    // Verificar se reunião existe e pertence ao usuário
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 });
    }

    // Preparar dados para update
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) { updateData.title = body.title; }
    if (body.description !== undefined) { updateData.description = body.description; }
    if (body.date !== undefined) { updateData.date = body.date; }
    if (body.time !== undefined) { updateData.time = body.time; }
    if (body.duration_minutes !== undefined) { updateData.duration_minutes = body.duration_minutes; }
    if (body.type !== undefined) { updateData.type = body.type; }
    if (body.status !== undefined) { updateData.status = body.status; }
    if (body.priority !== undefined) { updateData.priority = body.priority; }
    if (body.location !== undefined) { updateData.location = body.location; }
    if (body.meeting_link !== undefined) { updateData.meeting_link = body.meeting_link; }
    if (body.notes !== undefined) { updateData.notes = body.notes; }
    if (body.client_id !== undefined) { updateData.client_id = body.client_id || null; }

    const { data: meeting, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, contact_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[meetings/[id]] Erro ao atualizar:', error);
      return NextResponse.json({ error: 'Erro ao atualizar reunião' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meeting,
      message: 'Reunião atualizada com sucesso',
    });
  } catch (error) {
    console.error('[meetings/[id]] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meetings/[id]
 * Remove uma reunião
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[meetings/[id]] Erro ao deletar:', error);
      return NextResponse.json({ error: 'Erro ao deletar reunião' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reunião deletada com sucesso',
    });
  } catch (error) {
    console.error('[meetings/[id]] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
