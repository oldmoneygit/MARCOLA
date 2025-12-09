/**
 * @file route.ts
 * @description API Route para listar e criar execuções
 * @module api/executions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  TaskExecution,
  CreateExecutionDTO,
} from '@/types/execution-history';

/**
 * GET /api/executions
 * Lista execuções com filtros
 */
export async function GET(request: NextRequest) {
  console.log('[executions/GET] Iniciando requisição');
  try {
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[executions/GET] Auth check:', { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      console.log('[executions/GET] Usuário não autorizado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse dos parâmetros de query
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';
    const clientId = searchParams.get('clientId');
    const actionType = searchParams.get('actionType');
    const result = searchParams.get('result');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Calcula data inicial baseada no período
    let startDate: string | null = null;
    if (period !== 'all') {
      const now = new Date();
      switch (period) {
        case 'week':
          now.setDate(now.getDate() - 7);
          break;
        case 'month':
          now.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          now.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          now.setFullYear(now.getFullYear() - 1);
          break;
      }
      startDate = now.toISOString();
    }

    // Build query
    let query = supabase
      .from('task_executions')
      .select(
        `
        *,
        client:clients(id, name),
        task:tasks(id, title),
        executor:team_members(id, name)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false });

    // Aplica filtros
    if (startDate) {
      query = query.gte('executed_at', startDate);
    }

    if (clientId && clientId !== 'all') {
      query = query.eq('client_id', clientId);
    }

    if (actionType && actionType !== 'all') {
      query = query.eq('action_type', actionType);
    }

    if (result && result !== 'all') {
      query = query.eq('result', result);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Paginação
    query = query.range(offset, offset + limit - 1);

    console.log('[executions/GET] Executando query com filtros:', { period, clientId, actionType, result, search, limit, offset, startDate });

    const { data, error, count } = await query;

    console.log('[executions/GET] Resultado query:', { count, error: error?.message, dataLength: data?.length });

    if (error) {
      console.error('[executions/GET] Erro ao buscar:', error);
      return NextResponse.json({ error: 'Erro ao buscar execuções' }, { status: 500 });
    }

    // Formata dados
    const executions: TaskExecution[] = (data || []).map((item) => {
      const client = item.client as { id: string; name: string } | null;
      const task = item.task as { id: string; title: string } | null;
      const executor = item.executor as { id: string; name: string } | null;

      return {
        id: item.id,
        userId: item.user_id,
        taskId: item.task_id,
        clientId: item.client_id,
        clientName: client?.name || undefined,
        taskTitle: task?.title || undefined,
        actionType: item.action_type,
        title: item.title,
        description: item.description,
        optimizationType: item.optimization_type,
        optimizationDetails: item.optimization_details,
        result: item.result,
        resultMetrics: item.result_metrics,
        executedBy: item.executed_by,
        executedByName: executor?.name || undefined,
        executedAt: item.executed_at,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });

    return NextResponse.json({
      executions,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[executions] Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/executions
 * Cria uma nova execução
 */
export async function POST(request: NextRequest) {
  console.log('[executions/POST] Iniciando criação de execução');
  try {
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[executions/POST] Auth check:', { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
      console.log('[executions/POST] Usuário não autorizado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: CreateExecutionDTO = await request.json();
    console.log('[executions/POST] Body recebido:', { actionType: body.actionType, title: body.title, clientId: body.clientId });

    // Validação básica
    if (!body.actionType || !body.title) {
      console.log('[executions/POST] Validação falhou - campos obrigatórios ausentes');
      return NextResponse.json(
        { error: 'actionType e title são obrigatórios' },
        { status: 400 }
      );
    }

    // Prepara dados para inserção
    const insertData = {
      user_id: user.id,
      task_id: body.taskId || null,
      client_id: body.clientId || null,
      action_type: body.actionType,
      title: body.title,
      description: body.description || null,
      optimization_type: body.optimizationType || null,
      optimization_details: body.optimizationDetails || null,
      result: body.result || null,
      result_metrics: body.resultMetrics || null,
      executed_by: body.executedBy || null,
      executed_at: body.executedAt || new Date().toISOString(),
      notes: body.notes || null,
    };

    console.log('[executions/POST] Inserindo dados:', insertData);

    const { data, error } = await supabase
      .from('task_executions')
      .insert(insertData)
      .select(
        `
        *,
        client:clients(id, name),
        task:tasks(id, title),
        executor:team_members(id, name)
      `
      )
      .single();

    console.log('[executions/POST] Resultado insert:', { id: data?.id, error: error?.message });

    if (error) {
      console.error('[executions/POST] Erro ao criar:', error);
      return NextResponse.json({ error: 'Erro ao criar execução' }, { status: 500 });
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

    return NextResponse.json(execution, { status: 201 });
  } catch (error) {
    console.error('[executions] Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
