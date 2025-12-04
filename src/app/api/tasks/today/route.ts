/**
 * @file route.ts
 * @description API Route para tarefas de hoje
 * @module api/tasks/today
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/tasks/today
 * Retorna todas as tarefas com vencimento hoje
 * Inclui tarefas atrasadas (due_date < hoje e status != done)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Buscar tarefas de hoje
    const { data: todayTasks, error: todayError } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(id, name),
        assignee:team_members!tasks_assigned_to_fkey(id, name, email, avatar_url, color, role)
      `)
      .eq('user_id', user.id)
      .eq('due_date', today)
      .neq('status', 'cancelled')
      .order('due_time', { ascending: true, nullsFirst: false });

    if (todayError) {
      console.error('[API] GET /api/tasks/today error (today):', todayError);
      return NextResponse.json({ error: 'Erro ao buscar tarefas de hoje' }, { status: 500 });
    }

    // Buscar tarefas atrasadas (antes de hoje e não concluídas)
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(id, name),
        assignee:team_members!tasks_assigned_to_fkey(id, name, email, avatar_url, color, role)
      `)
      .eq('user_id', user.id)
      .lt('due_date', today)
      .in('status', ['todo', 'doing'])
      .order('due_date', { ascending: true });

    if (overdueError) {
      console.error('[API] GET /api/tasks/today error (overdue):', overdueError);
      return NextResponse.json({ error: 'Erro ao buscar tarefas atrasadas' }, { status: 500 });
    }

    return NextResponse.json({
      today: todayTasks || [],
      overdue: overdueTasks || [],
      total: (todayTasks?.length || 0) + (overdueTasks?.length || 0),
    });
  } catch (err) {
    console.error('[API] GET /api/tasks/today unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
