/**
 * @file route.ts
 * @description API Route para cálculo e consulta do Health Score do cliente
 * @module api/clients/[id]/health-score
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { calculateHealthScore, calculateSimplifiedHealthScore } from '@/lib/health-score';

import type { NextRequest } from 'next/server';

// Force dynamic rendering for auth
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/[id]/health-score
 * Busca o Health Score atual do cliente
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, health_score, health_score_updated_at, monthly_value, average_ticket, monthly_ad_budget')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Busca o último histórico de health score
    const { data: lastHistory } = await supabase
      .from('client_health_score_history')
      .select('*')
      .eq('client_id', clientId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    // Se tem score recente (menos de 24h), retorna o cached
    if (client.health_score && client.health_score_updated_at) {
      const lastUpdate = new Date(client.health_score_updated_at);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < 24 && lastHistory) {
        return NextResponse.json({
          score: client.health_score,
          history: lastHistory,
          cached: true,
          last_updated: client.health_score_updated_at,
        });
      }
    }

    // Retorna score atual ou null se não calculado
    return NextResponse.json({
      score: client.health_score,
      history: lastHistory || null,
      cached: false,
      last_updated: client.health_score_updated_at,
    });
  } catch (err) {
    console.error('[API] GET /api/clients/[id]/health-score error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/clients/[id]/health-score
 * Calcula/recalcula o Health Score do cliente
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca dados do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, monthly_value, average_ticket, monthly_ad_budget, health_score')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Busca relatórios do cliente (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: reports } = await supabase
      .from('reports')
      .select('id, total_spend, total_impressions, total_clicks, total_conversions, period_start, period_end')
      .eq('client_id', clientId)
      .gte('period_end', thirtyDaysAgo.toISOString().split('T')[0]);

    // Busca dados de anúncios dos relatórios
    let ads: { ctr: number; cpc: number; cpa: number; roas: number | null; conversions: number }[] = [];
    if (reports && reports.length > 0) {
      const reportIds = reports.map((r) => r.id);
      const { data: adsData } = await supabase
        .from('ads')
        .select('ctr, cpc, cpa, roas, conversions')
        .in('report_id', reportIds);

      if (adsData) {
        ads = adsData.map((ad) => ({
          ctr: Number(ad.ctr) || 0,
          cpc: Number(ad.cpc) || 0,
          cpa: Number(ad.cpa) || 0,
          roas: ad.roas !== null ? Number(ad.roas) : null,
          conversions: Number(ad.conversions) || 0,
        }));
      }
    }

    // Busca tarefas do cliente (últimos 30 dias)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, due_date')
      .eq('client_id', clientId)
      .gte('due_date', thirtyDaysAgo.toISOString().split('T')[0]);

    const taskData = {
      total: tasks?.length || 0,
      completed: tasks?.filter((t) => t.status === 'done').length || 0,
      overdue: tasks?.filter((t) => {
        const dueDate = new Date(t.due_date);
        return t.status !== 'done' && t.status !== 'cancelled' && dueDate < new Date();
      }).length || 0,
    };

    // Busca pagamentos do cliente (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: payments } = await supabase
      .from('payments')
      .select('id, status, due_date, paid_date')
      .eq('client_id', clientId)
      .gte('due_date', sixMonthsAgo.toISOString().split('T')[0]);

    const paymentData = {
      total: payments?.length || 0,
      paid: payments?.filter((p) => p.status === 'paid').length || 0,
      overdue: payments?.filter((p) => p.status === 'overdue').length || 0,
      on_time: payments?.filter((p) => {
        if (p.status !== 'paid' || !p.paid_date) {
          return false;
        }
        return new Date(p.paid_date) <= new Date(p.due_date);
      }).length || 0,
    };

    // Busca conteúdo do calendário (últimos 30 dias)
    const { data: content } = await supabase
      .from('content_calendar')
      .select('id, status, scheduled_date')
      .eq('client_id', clientId)
      .gte('scheduled_date', thirtyDaysAgo.toISOString().split('T')[0]);

    const contentData = {
      total: content?.length || 0,
      approved: content?.filter((c) => c.status === 'approved' || c.status === 'published').length || 0,
      published: content?.filter((c) => c.status === 'published').length || 0,
      on_schedule: content?.filter((c) => {
        // Considera em dia se foi aprovado/publicado antes ou na data agendada
        if (c.status !== 'approved' && c.status !== 'published') {
          return false;
        }
        return true; // Simplificado - assumimos que se foi aprovado, foi em dia
      }).length || 0,
    };

    // Busca score anterior
    const { data: lastHistory } = await supabase
      .from('client_health_score_history')
      .select('overall_score')
      .eq('client_id', clientId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    const previousScore = lastHistory?.overall_score ? Number(lastHistory.overall_score) : null;

    // Calcula o Health Score
    let healthScore;
    const hasReports = !!(reports && reports.length > 0);
    const hasTasks = !!(tasks && tasks.length > 0);
    const hasPayments = !!(payments && payments.length > 0);

    if (!hasReports && !hasTasks && !hasPayments) {
      // Dados insuficientes - usa cálculo simplificado
      healthScore = calculateSimplifiedHealthScore(
        clientId,
        hasReports,
        hasTasks,
        hasPayments,
        previousScore
      );
    } else {
      // Cálculo completo
      healthScore = calculateHealthScore({
        clientId,
        clientData: {
          monthly_value: Number(client.monthly_value) || 0,
          average_ticket: client.average_ticket ? Number(client.average_ticket) : null,
          monthly_ad_budget: client.monthly_ad_budget ? Number(client.monthly_ad_budget) : null,
        },
        reports: (reports || []).map((r) => ({
          total_spend: Number(r.total_spend) || 0,
          total_impressions: Number(r.total_impressions) || 0,
          total_clicks: Number(r.total_clicks) || 0,
          total_conversions: Number(r.total_conversions) || 0,
          period_start: r.period_start,
          period_end: r.period_end,
        })),
        ads,
        tasks: taskData,
        payments: paymentData,
        content: contentData,
        previousScore,
      });
    }

    // Salva no histórico
    const { error: historyError } = await supabase.from('client_health_score_history').insert({
      client_id: clientId,
      performance_score: healthScore.components.performance_score,
      engagement_score: healthScore.components.engagement_score,
      financial_score: healthScore.components.financial_score,
      compliance_score: healthScore.components.compliance_score,
      overall_score: healthScore.overall_score,
      details: healthScore.details,
      calculated_at: healthScore.calculated_at,
    });

    if (historyError) {
      console.error('[API] Error saving health score history:', historyError);
    }

    // Atualiza o score no cliente
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        health_score: healthScore.overall_score,
        health_score_updated_at: healthScore.calculated_at,
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('[API] Error updating client health score:', updateError);
    }

    return NextResponse.json({
      success: true,
      healthScore,
    });
  } catch (err) {
    console.error('[API] POST /api/clients/[id]/health-score error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
