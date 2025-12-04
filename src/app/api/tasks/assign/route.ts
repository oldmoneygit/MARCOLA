/**
 * @file route.ts
 * @description API Route para atribuição de tarefas a membros da equipe
 * @module api/tasks/assign
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { AssignTaskDTO, BulkAssignTasksDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * POST /api/tasks/assign
 * Atribui uma tarefa a um membro da equipe
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

    const body: AssignTaskDTO = await request.json();

    // Validação básica
    if (!body.task_id) {
      return NextResponse.json(
        { error: 'Campo obrigatório: task_id' },
        { status: 400 }
      );
    }

    // Verificar se a tarefa pertence ao usuário
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, user_id, assigned_to')
      .eq('id', body.task_id)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Se assigned_to não for null, verificar se o membro existe e pertence ao usuário
    if (body.assigned_to) {
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('id', body.assigned_to)
        .eq('owner_id', user.id)
        .single();

      if (memberError || !member) {
        return NextResponse.json(
          { error: 'Membro da equipe não encontrado' },
          { status: 404 }
        );
      }
    }

    // Atualizar a tarefa
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ assigned_to: body.assigned_to })
      .eq('id', body.task_id)
      .eq('user_id', user.id)
      .select(`
        *,
        assignee:team_members(id, name, email, avatar_url, color, role)
      `)
      .single();

    if (updateError) {
      console.error('[API] POST /api/tasks/assign error:', updateError);
      return NextResponse.json({ error: 'Erro ao atribuir tarefa' }, { status: 500 });
    }

    return NextResponse.json(updatedTask);
  } catch (err) {
    console.error('[API] POST /api/tasks/assign unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/assign
 * Atribui múltiplas tarefas a um membro (bulk)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: BulkAssignTasksDTO = await request.json();

    // Validação básica
    if (!body.task_ids || body.task_ids.length === 0) {
      return NextResponse.json(
        { error: 'Campo obrigatório: task_ids (array não vazio)' },
        { status: 400 }
      );
    }

    // Se assigned_to não for null, verificar se o membro existe e pertence ao usuário
    if (body.assigned_to) {
      const { data: member, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('id', body.assigned_to)
        .eq('owner_id', user.id)
        .single();

      if (memberError || !member) {
        return NextResponse.json(
          { error: 'Membro da equipe não encontrado' },
          { status: 404 }
        );
      }
    }

    // Atualizar todas as tarefas
    const { data: updatedTasks, error: updateError } = await supabase
      .from('tasks')
      .update({ assigned_to: body.assigned_to })
      .in('id', body.task_ids)
      .eq('user_id', user.id)
      .select(`
        *,
        assignee:team_members(id, name, email, avatar_url, color, role)
      `);

    if (updateError) {
      console.error('[API] PUT /api/tasks/assign error:', updateError);
      return NextResponse.json({ error: 'Erro ao atribuir tarefas' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated_count: updatedTasks?.length || 0,
      tasks: updatedTasks,
    });
  } catch (err) {
    console.error('[API] PUT /api/tasks/assign unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
