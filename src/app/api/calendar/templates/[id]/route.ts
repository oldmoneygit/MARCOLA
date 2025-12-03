/**
 * @file route.ts
 * @description API Route para operações em template de calendário específico
 * @module api/calendar/templates/[id]
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { UpdateCalendarTemplateDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/calendar/templates/[id]
 * Retorna um template específico
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

    const { data: template, error } = await supabase
      .from('calendar_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (err) {
    console.error('[API] GET /api/calendar/templates/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/calendar/templates/[id]
 * Atualiza um template de calendário
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

    const body: UpdateCalendarTemplateDTO = await request.json();

    // Verificar se o template pertence ao usuário
    const { data: existingTemplate, error: existingError } = await supabase
      .from('calendar_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {};

    // Mapear campos permitidos
    const allowedFields = [
      'name',
      'description',
      'type',
      'platform',
      'color',
      'recurrence',
      'day_of_week',
      'day_of_month',
      'is_active',
    ];

    for (const field of allowedFields) {
      if (body[field as keyof UpdateCalendarTemplateDTO] !== undefined) {
        updateData[field] = body[field as keyof UpdateCalendarTemplateDTO];
      }
    }

    const { data: template, error } = await supabase
      .from('calendar_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] PUT /api/calendar/templates/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 });
    }

    return NextResponse.json(template);
  } catch (err) {
    console.error('[API] PUT /api/calendar/templates/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/calendar/templates/[id]
 * Remove um template de calendário
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

    // Verificar se o template pertence ao usuário
    const { data: template, error: fetchError } = await supabase
      .from('calendar_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    const { error } = await supabase.from('calendar_templates').delete().eq('id', id);

    if (error) {
      console.error('[API] DELETE /api/calendar/templates/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao deletar template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/calendar/templates/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
