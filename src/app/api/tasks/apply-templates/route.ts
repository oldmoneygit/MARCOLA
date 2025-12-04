/**
 * @file route.ts
 * @description API Route para aplicar templates de tarefas a um cliente
 * @module api/tasks/apply-templates
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface ApplyTemplatesBody {
  client_id: string;
  template_ids?: string[];
  use_segment_templates?: boolean;
  apply_operational?: boolean;
}

/**
 * POST /api/tasks/apply-templates
 * Aplica templates de tarefas a um cliente
 *
 * Opções:
 * - template_ids: Lista específica de templates para aplicar
 * - use_segment_templates: Usar todos os templates do segmento do cliente
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

    const body: ApplyTemplatesBody = await request.json();

    if (!body.client_id) {
      return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }

    // Buscar cliente e verificar propriedade
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, segment')
      .eq('id', body.client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    let templates: Array<{
      id: string;
      category?: string;
      title: string;
      description?: string;
      default_days_offset?: number;
      priority?: string;
      is_recurring?: boolean;
      recurrence?: string;
      notify_client?: boolean;
      notify_message?: string;
      checklist?: unknown;
    }> = [];

    if (body.template_ids && body.template_ids.length > 0) {
      // Buscar templates específicos
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_system.eq.true`)
        .in('id', body.template_ids)
        .eq('is_active', true);

      if (error) {
        console.error('[API] POST /api/tasks/apply-templates error (fetch templates):', error);
        return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
      }

      templates = data || [];
    } else if (body.apply_operational) {
      // Buscar templates operacionais do sistema (is_system = true, category = 'operational')
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('is_system', true)
        .eq('category', 'operational')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[API] POST /api/tasks/apply-templates error (fetch operational templates):', error);
        return NextResponse.json({ error: 'Erro ao buscar templates operacionais' }, { status: 500 });
      }

      templates = data || [];
    } else if (body.use_segment_templates) {
      // Buscar templates do segmento do cliente
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_system.eq.true`)
        .eq('segment', client.segment)
        .eq('is_active', true);

      if (error) {
        console.error('[API] POST /api/tasks/apply-templates error (fetch segment templates):', error);
        return NextResponse.json({ error: 'Erro ao buscar templates do segmento' }, { status: 500 });
      }

      templates = data || [];
    } else {
      return NextResponse.json(
        { error: 'Informe template_ids, use_segment_templates ou apply_operational' },
        { status: 400 }
      );
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({ error: 'Nenhum template encontrado' }, { status: 404 });
    }

    // Calcular datas das tarefas baseadas nos templates
    const today = new Date();
    const tasksToCreate = templates.map((template) => {
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + (template.default_days_offset || 0));

      return {
        user_id: user.id,
        client_id: body.client_id,
        template_id: template.id,
        category: template.category || 'custom',
        title: template.title,
        description: template.description,
        checklist: template.checklist || [],
        due_date: dueDate.toISOString().split('T')[0],
        priority: template.priority || 'medium',
        status: 'todo',
        is_recurring: template.is_recurring || false,
        recurrence: template.recurrence || null,
        send_whatsapp: template.notify_client || false,
        whatsapp_message: template.notify_message || null,
      };
    });

    // Criar todas as tarefas
    const { data: createdTasks, error: createError } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select(`
        *,
        client:clients(id, name),
        template:task_templates(id, title)
      `);

    if (createError) {
      console.error('[API] POST /api/tasks/apply-templates error (create tasks):', createError);
      return NextResponse.json({ error: 'Erro ao criar tarefas' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tasks_created: createdTasks?.length || 0,
      tasks: createdTasks,
    }, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/tasks/apply-templates unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
