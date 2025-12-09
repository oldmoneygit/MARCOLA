/**
 * @file route.ts
 * @description API Route para operações em tarefa específica
 * @module api/tasks/[id]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { UpdateTaskDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/[id]
 * Retorna uma tarefa específica
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

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(id, name),
        template:task_templates(id, title),
        assignee:team_members!tasks_assigned_to_fkey(id, name, email, avatar_url, color, role)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (err) {
    console.error('[API] GET /api/tasks/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/[id]
 * Atualiza uma tarefa
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

    const body: UpdateTaskDTO = await request.json();

    // Verificar se a tarefa pertence ao usuário
    const { data: existingTask, error: existingError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Mapear campos permitidos (DTO -> DB)
    const fieldMapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      due_date: 'due_date',
      due_time: 'due_time',
      priority: 'priority',
      status: 'status',
      assigned_to: 'assigned_to',
      is_recurring: 'is_recurring',
      recurrence: 'recurrence',
      send_whatsapp: 'notify_client',
      whatsapp_message: 'notify_message',
    };

    for (const [dtoField, dbField] of Object.entries(fieldMapping)) {
      if (body[dtoField as keyof UpdateTaskDTO] !== undefined) {
        updateData[dbField] = body[dtoField as keyof UpdateTaskDTO];
      }
    }

    // Se marcando como concluída, registrar data de conclusão
    if (body.status === 'done' && existingTask.status !== 'done') {
      updateData.completed_at = new Date().toISOString();
    }

    // Detectar mudança de status para auto-log
    const previousStatus = existingTask.status;
    const newStatus = body.status;

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name),
        template:task_templates(id, title),
        assignee:team_members!tasks_assigned_to_fkey(id, name, email, avatar_url, color, role)
      `)
      .single();

    if (error) {
      console.error('[API] PUT /api/tasks/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
    }

    // Auto-log: Registrar execução quando status muda
    console.log('[tasks/PUT] Verificando auto-log:', { previousStatus, newStatus, taskId: task.id });
    if (newStatus && newStatus !== previousStatus) {
      console.log('[tasks/PUT] Status mudou - criando execução');
      try {
        const client = task.client as { id: string; name: string } | null;
        let actionType: string | null = null;
        let title = '';

        if (newStatus === 'done') {
          actionType = 'task_completed';
          title = `Tarefa concluída: ${task.title}`;
        } else if (newStatus === 'doing' && previousStatus === 'todo') {
          actionType = 'task_started';
          title = `Tarefa iniciada: ${task.title}`;
        } else if (newStatus === 'cancelled') {
          actionType = 'task_cancelled';
          title = `Tarefa cancelada: ${task.title}`;
        }

        console.log('[tasks/PUT] Action type determinado:', { actionType, title });

        if (actionType) {
          const insertData = {
            user_id: user.id,
            task_id: task.id,
            client_id: client?.id || null,
            action_type: actionType,
            title,
            description: task.description || null,
            executed_by: task.assigned_to || null,
            executed_at: new Date().toISOString(),
          };
          console.log('[tasks/PUT] Auto-log inserindo:', insertData);

          const { error: insertError } = await supabase.from('task_executions').insert(insertData);

          if (insertError) {
            console.error('[tasks/PUT] Auto-log insert error:', insertError);
          } else {
            console.log('[tasks/PUT] Auto-log criado com sucesso');
          }
        }
      } catch (logError) {
        // Não falhar a requisição por erro no auto-log
        console.error('[tasks/PUT] Auto-log exception:', logError);
      }
    }

    return NextResponse.json(task);
  } catch (err) {
    console.error('[API] PUT /api/tasks/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[id]
 * Remove uma tarefa
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

    // Verificar se a tarefa pertence ao usuário antes de deletar
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('[API] DELETE /api/tasks/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao deletar tarefa' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/tasks/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
