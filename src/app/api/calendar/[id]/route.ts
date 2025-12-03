/**
 * @file route.ts
 * @description API Route para operações em evento específico do calendário
 * @module api/calendar/[id]
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { UpdateCalendarEventDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/calendar/[id]
 * Retorna um evento específico
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

    const { data: event, error } = await supabase
      .from('content_calendar')
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (err) {
    console.error('[API] GET /api/calendar/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/calendar/[id]
 * Atualiza um evento do calendário
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

    const body: UpdateCalendarEventDTO = await request.json();

    // Verificar se o evento pertence ao usuário
    const { data: existingEvent, error: existingError } = await supabase
      .from('content_calendar')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingEvent) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Mapear campos permitidos
    const allowedFields = [
      'title',
      'description',
      'type',
      'scheduled_date',
      'scheduled_time',
      'status',
      'platform',
      'color',
      'notes',
      'attachments',
    ];

    for (const field of allowedFields) {
      if (body[field as keyof UpdateCalendarEventDTO] !== undefined) {
        updateData[field] = body[field as keyof UpdateCalendarEventDTO];
      }
    }

    const { data: event, error } = await supabase
      .from('content_calendar')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name)
      `)
      .single();

    if (error) {
      console.error('[API] PUT /api/calendar/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 });
    }

    return NextResponse.json(event);
  } catch (err) {
    console.error('[API] PUT /api/calendar/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/calendar/[id]
 * Remove um evento do calendário
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

    // Verificar se o evento pertence ao usuário
    const { data: event, error: fetchError } = await supabase
      .from('content_calendar')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const { error } = await supabase.from('content_calendar').delete().eq('id', id);

    if (error) {
      console.error('[API] DELETE /api/calendar/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao deletar evento' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/calendar/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
