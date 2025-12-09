/**
 * @file route.ts
 * @description API Route para operações em execução individual
 * @module api/executions/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TaskExecution, UpdateExecutionDTO } from '@/types/execution-history';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/executions/[id]
 * Busca uma execução específica
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('task_executions')
      .select(
        `
        *,
        client:clients(id, name),
        task:tasks(id, title),
        executor:team_members(id, name)
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
      }
      console.error('[executions] Erro ao buscar:', error);
      return NextResponse.json({ error: 'Erro ao buscar execução' }, { status: 500 });
    }

    // Formata resposta
    const client = data.client as { id: string; name: string } | null;
    const task = data.task as { id: string; title: string } | null;
    const executor = data.executor as { id: string; name: string } | null;

    const execution: TaskExecution = {
      id: data.id,
      userId: data.user_id,
      taskId: data.task_id,
      clientId: data.client_id,
      clientName: client?.name || undefined,
      taskTitle: task?.title || undefined,
      actionType: data.action_type,
      title: data.title,
      description: data.description,
      optimizationType: data.optimization_type,
      optimizationDetails: data.optimization_details,
      result: data.result,
      resultMetrics: data.result_metrics,
      executedBy: data.executed_by,
      executedByName: executor?.name || undefined,
      executedAt: data.executed_at,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(execution);
  } catch (error) {
    console.error('[executions] Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/executions/[id]
 * Atualiza uma execução
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: UpdateExecutionDTO = await request.json();

    // Prepara dados para atualização
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.optimizationType !== undefined) {
      updateData.optimization_type = body.optimizationType;
    }
    if (body.optimizationDetails !== undefined) {
      updateData.optimization_details = body.optimizationDetails;
    }
    if (body.result !== undefined) {
      updateData.result = body.result;
    }
    if (body.resultMetrics !== undefined) {
      updateData.result_metrics = body.resultMetrics;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const { data, error } = await supabase
      .from('task_executions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(
        `
        *,
        client:clients(id, name),
        task:tasks(id, title),
        executor:team_members(id, name)
      `
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
      }
      console.error('[executions] Erro ao atualizar:', error);
      return NextResponse.json({ error: 'Erro ao atualizar execução' }, { status: 500 });
    }

    // Formata resposta
    const client = data.client as { id: string; name: string } | null;
    const task = data.task as { id: string; title: string } | null;
    const executor = data.executor as { id: string; name: string } | null;

    const execution: TaskExecution = {
      id: data.id,
      userId: data.user_id,
      taskId: data.task_id,
      clientId: data.client_id,
      clientName: client?.name || undefined,
      taskTitle: task?.title || undefined,
      actionType: data.action_type,
      title: data.title,
      description: data.description,
      optimizationType: data.optimization_type,
      optimizationDetails: data.optimization_details,
      result: data.result,
      resultMetrics: data.result_metrics,
      executedBy: data.executed_by,
      executedByName: executor?.name || undefined,
      executedAt: data.executed_at,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(execution);
  } catch (error) {
    console.error('[executions] Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/executions/[id]
 * Remove uma execução
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('task_executions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[executions] Erro ao deletar:', error);
      return NextResponse.json({ error: 'Erro ao deletar execução' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[executions] Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
