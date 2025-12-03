/**
 * @file route.ts
 * @description API Route para operações em template específico
 * @module api/templates/[id]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { UpdateTaskTemplateDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/templates/[id]
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
      .from('task_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (err) {
    console.error('[API] GET /api/templates/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/templates/[id]
 * Atualiza um template
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

    const body: UpdateTaskTemplateDTO = await request.json();

    // Verificar se o template pertence ao usuário
    const { data: existingTemplate, error: existingError } = await supabase
      .from('task_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Mapear campos DTO -> DB
    const fieldMapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      segment: 'segment',
      default_priority: 'priority',
      recurrence: 'recurrence',
      send_whatsapp: 'notify_client',
      whatsapp_template: 'notify_message',
      is_active: 'is_active',
      order_index: 'order_index',
    };

    for (const [dtoField, dbField] of Object.entries(fieldMapping)) {
      if (body[dtoField as keyof UpdateTaskTemplateDTO] !== undefined) {
        updateData[dbField] = body[dtoField as keyof UpdateTaskTemplateDTO];
      }
    }

    // Handle is_recurring -> recurrence
    if (body.is_recurring !== undefined) {
      updateData.recurrence = body.is_recurring ? (body.recurrence || 'weekly') : null;
    }

    const { data: template, error } = await supabase
      .from('task_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] PUT /api/templates/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 });
    }

    return NextResponse.json(template);
  } catch (err) {
    console.error('[API] PUT /api/templates/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/templates/[id]
 * Remove um template
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
      .from('task_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    const { error } = await supabase.from('task_templates').delete().eq('id', id);

    if (error) {
      console.error('[API] DELETE /api/templates/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao deletar template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/templates/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
