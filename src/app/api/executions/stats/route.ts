/**
 * @file route.ts
 * @description API Route para estatísticas de execuções
 * @module api/executions/stats
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import type {
  ExecutionStats,
  ExecutionActionType,
  ExecutionResult,
} from '@/types/execution-history';

/**
 * GET /api/executions/stats
 * Retorna estatísticas agregadas de execuções
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verifica autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse dos parâmetros
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';
    const clientId = searchParams.get('clientId');

    // Calcula data inicial
    let startDate: string | null = null;
    let periodLabel = 'Todo o Período';

    if (period !== 'all') {
      const now = new Date();
      switch (period) {
        case 'week':
          now.setDate(now.getDate() - 7);
          periodLabel = 'Última Semana';
          break;
        case 'month':
          now.setMonth(now.getMonth() - 1);
          periodLabel = 'Último Mês';
          break;
        case 'quarter':
          now.setMonth(now.getMonth() - 3);
          periodLabel = 'Último Trimestre';
          break;
        case 'year':
          now.setFullYear(now.getFullYear() - 1);
          periodLabel = 'Último Ano';
          break;
      }
      startDate = now.toISOString();
    }

    // Build query base
    let query = supabase
      .from('task_executions')
      .select('action_type, result', { count: 'exact' })
      .eq('user_id', user.id);

    if (startDate) {
      query = query.gte('executed_at', startDate);
    }

    if (clientId && clientId !== 'all') {
      query = query.eq('client_id', clientId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[executions/stats] Erro ao buscar:', error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    // Calcula estatísticas
    const executions = data || [];
    const total = count || 0;

    // Contagem por tipo de ação
    const byActionType: Record<ExecutionActionType, number> = {
      task_created: 0,
      task_started: 0,
      task_completed: 0,
      task_cancelled: 0,
      optimization_applied: 0,
      manual_action: 0,
    };

    // Contagem por resultado
    const byResult: Record<ExecutionResult, number> = {
      success: 0,
      partial: 0,
      failed: 0,
      pending: 0,
    };

    let optimizationsCount = 0;
    let successCount = 0;
    let withResult = 0;

    executions.forEach((exec) => {
      // Por tipo
      if (exec.action_type && exec.action_type in byActionType) {
        byActionType[exec.action_type as ExecutionActionType]++;
      }

      // Por resultado
      if (exec.result) {
        withResult++;
        if (exec.result in byResult) {
          byResult[exec.result as ExecutionResult]++;
        }
        if (exec.result === 'success') {
          successCount++;
        }
      }

      // Otimizações
      if (exec.action_type === 'optimization_applied') {
        optimizationsCount++;
      }
    });

    // Taxa de sucesso
    const successRate = withResult > 0 ? Math.round((successCount / withResult) * 100) : 0;

    const stats: ExecutionStats = {
      total,
      byActionType,
      byResult,
      optimizationsCount,
      successRate,
      periodLabel,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[executions/stats] Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
