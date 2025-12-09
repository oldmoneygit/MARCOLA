/**
 * @file route.ts
 * @description API Route para listagem e criação de tarefas
 * @module api/tasks
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { CreateTaskDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/tasks
 * Lista tarefas do usuário autenticado
 *
 * Query params:
 * - client_id: Filtrar por cliente
 * - status: Filtrar por status (todo, doing, done, cancelled)
 * - priority: Filtrar por prioridade
 * - assigned_to: Filtrar por assignee
 * - from_date: Data inicial
 * - to_date: Data final
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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    let query = supabase
      .from('tasks')
      .select(`
        *,
        client:clients(id, name),
        template:task_templates(id, title),
        assignee:team_members!tasks_assigned_to_fkey(id, name, email, avatar_url, color, role)
      `)
      .eq('user_id', user.id);

    // Aplicar filtros
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', assignedTo);
      }
    }
    if (fromDate) {
      query = query.gte('due_date', fromDate);
    }
    if (toDate) {
      query = query.lte('due_date', toDate);
    }

    const { data: tasks, error } = await query.order('due_date', { ascending: true });

    if (error) {
      console.error('[API] GET /api/tasks error:', error);
      return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 });
    }

    return NextResponse.json(tasks);
  } catch (err) {
    console.error('[API] GET /api/tasks unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Cria uma nova tarefa
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

    const body: CreateTaskDTO = await request.json();

    // Validação básica
    if (!body.client_id || !body.title || !body.due_date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: client_id, title, due_date' },
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

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        client_id: body.client_id,
        template_id: body.template_id || null,
        assigned_to: body.assigned_to || null,
        title: body.title,
        description: body.description || null,
        due_date: body.due_date,
        due_time: body.due_time || null,
        priority: body.priority || 'medium',
        status: 'todo',
        is_recurring: body.is_recurring || false,
        recurrence: body.recurrence || null,
        notify_client: body.send_whatsapp || false,
        notify_message: body.whatsapp_message || null,
      })
      .select(`
        *,
        client:clients(id, name),
        template:task_templates(id, title),
        assignee:team_members!tasks_assigned_to_fkey(id, name, email, avatar_url, color, role)
      `)
      .single();

    if (error) {
      console.error('[API] POST /api/tasks error:', error);
      return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 });
    }

    // Auto-log: Registrar criação da tarefa
    console.log('[tasks/POST] Criando auto-log para tarefa:', { taskId: task.id, taskTitle: task.title });
    try {
      const taskClient = task.client as { id: string; name: string } | null;
      const insertData = {
        user_id: user.id,
        task_id: task.id,
        client_id: taskClient?.id || null,
        action_type: 'task_created',
        title: `Tarefa criada: ${task.title}`,
        description: task.description || null,
        executed_by: task.assigned_to || null,
        executed_at: new Date().toISOString(),
      };
      console.log('[tasks/POST] Auto-log inserindo:', insertData);

      const { error: insertError } = await supabase.from('task_executions').insert(insertData);

      if (insertError) {
        console.error('[tasks/POST] Auto-log insert error:', insertError);
      } else {
        console.log('[tasks/POST] Auto-log criado com sucesso');
      }
    } catch (logError) {
      // Não falhar a requisição por erro no auto-log
      console.error('[tasks/POST] Auto-log exception:', logError);
    }

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/tasks unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
