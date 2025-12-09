/**
 * @file route.ts
 * @description API Route para estatísticas de reuniões
 * @module api/meetings/stats
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/meetings/stats
 * Retorna estatísticas das reuniões do usuário
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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0] ?? '';

    // Início da semana (domingo)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0] ?? '';

    // Fim da semana (sábado)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0] ?? '';

    // Início do mês
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0] ?? '';

    // Fim do mês
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endOfMonthStr = endOfMonth.toISOString().split('T')[0] ?? '';

    // Buscar todas as reuniões do usuário
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('id, date, status')
      .eq('user_id', user.id);

    if (error) {
      console.error('[meetings/stats] Erro:', error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    const allMeetings = meetings || [];

    // Calcular estatísticas
    const stats = {
      total: allMeetings.length,
      scheduled: allMeetings.filter(m => m.status === 'scheduled').length,
      confirmed: allMeetings.filter(m => m.status === 'confirmed').length,
      completed: allMeetings.filter(m => m.status === 'completed').length,
      cancelled: allMeetings.filter(m => m.status === 'cancelled').length,
      thisWeek: allMeetings.filter(m =>
        m.date >= startOfWeekStr &&
        m.date <= endOfWeekStr &&
        m.status !== 'cancelled'
      ).length,
      thisMonth: allMeetings.filter(m =>
        m.date >= startOfMonthStr &&
        m.date <= endOfMonthStr &&
        m.status !== 'cancelled'
      ).length,
      upcomingToday: allMeetings.filter(m =>
        m.date === todayStr &&
        (m.status === 'scheduled' || m.status === 'confirmed')
      ).length,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[meetings/stats] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
