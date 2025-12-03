/**
 * @file route.ts
 * @description API route para dados do dashboard
 * @module api/dashboard
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

/**
 * Interface para overview do dashboard
 */
interface DashboardOverview {
  totalInvestment: number;
  investmentChange: number;
  activeClients: number;
  clientsChange: number;
  averageCPA: number;
  cpaChange: number;
  pendingAlerts: number;
  alertsChange: number;
  recentSuggestions: Array<{
    id: string;
    type: string;
    severity: 'urgent' | 'warning' | 'info';
    title: string;
    description: string;
    clientName: string;
  }>;
  clientsNeedingAttention: Array<{
    id: string;
    name: string;
    issue: string;
    severity: 'danger' | 'warning';
  }>;
}

/**
 * GET /api/dashboard
 * Retorna dados consolidados do dashboard
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, status')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (clientsError) {
      console.error('[API] GET /api/dashboard clients error:', clientsError);
    }

    // Buscar relatórios do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('total_spend, total_conversions')
      .eq('user_id', user.id)
      .gte('period_start', startOfMonth)
      .lte('period_end', endOfMonth);

    if (reportsError) {
      console.error('[API] GET /api/dashboard reports error:', reportsError);
    }

    // Calcular totais do mês atual
    const totalInvestment = (reports || []).reduce((sum, r) => sum + (r.total_spend || 0), 0);
    const totalConversions = (reports || []).reduce((sum, r) => sum + (r.total_conversions || 0), 0);
    const averageCPA = totalConversions > 0 ? totalInvestment / totalConversions : 0;

    // Buscar relatórios do mês anterior para comparação
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const { data: lastMonthReports } = await supabase
      .from('reports')
      .select('total_spend, total_conversions')
      .eq('user_id', user.id)
      .gte('period_start', startOfLastMonth)
      .lte('period_end', endOfLastMonth);

    const lastMonthInvestment = (lastMonthReports || []).reduce((sum, r) => sum + (r.total_spend || 0), 0);
    const lastMonthConversions = (lastMonthReports || []).reduce((sum, r) => sum + (r.total_conversions || 0), 0);
    const lastMonthCPA = lastMonthConversions > 0 ? lastMonthInvestment / lastMonthConversions : 0;

    // Calcular variações
    const investmentChange = lastMonthInvestment > 0
      ? ((totalInvestment - lastMonthInvestment) / lastMonthInvestment) * 100
      : 0;

    const cpaChange = lastMonthCPA > 0
      ? ((averageCPA - lastMonthCPA) / lastMonthCPA) * 100
      : 0;

    // Buscar sugestões pendentes (últimas 5)
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('suggestions')
      .select(`
        id,
        type,
        severity,
        title,
        description,
        client:clients(name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (suggestionsError) {
      console.error('[API] GET /api/dashboard suggestions error:', suggestionsError);
    }

    // Contar total de alertas pendentes
    const { count: pendingAlertsCount } = await supabase
      .from('suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // Formatar sugestões para o dashboard
    const recentSuggestions = (suggestions || []).map((s) => {
      // Supabase retorna um objeto ou array dependendo da relação
      const clientData = s.client as { name: string } | { name: string }[] | null;
      const clientName = Array.isArray(clientData)
        ? (clientData[0]?.name || 'Cliente desconhecido')
        : (clientData?.name || 'Cliente desconhecido');

      return {
        id: s.id,
        type: s.type,
        severity: s.severity as 'urgent' | 'warning' | 'info',
        title: s.title,
        description: s.description,
        clientName,
      };
    });

    // Identificar clientes que precisam de atenção
    // (clientes com sugestões urgentes ou warnings)
    const { data: clientsWithIssues } = await supabase
      .from('suggestions')
      .select(`
        client_id,
        type,
        severity,
        client:clients(id, name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .in('severity', ['urgent', 'warning'])
      .order('severity', { ascending: true })
      .limit(5);

    const clientsNeedingAttention = (clientsWithIssues || [])
      .filter((s) => s.client)
      .reduce((acc, s) => {
        const clientId = s.client_id;
        const existing = acc.find((c) => c.id === clientId);
        if (!existing) {
          // Supabase retorna um objeto ou array dependendo da relação
          const clientData = s.client as { id: string; name: string } | { id: string; name: string }[] | null;
          const clientName = Array.isArray(clientData)
            ? (clientData[0]?.name || 'Cliente')
            : (clientData?.name || 'Cliente');

          acc.push({
            id: clientId,
            name: clientName,
            issue: getIssueLabel(s.type),
            severity: s.severity === 'urgent' ? 'danger' : 'warning' as const,
          });
        }
        return acc;
      }, [] as DashboardOverview['clientsNeedingAttention']);

    const overview: DashboardOverview = {
      totalInvestment,
      investmentChange,
      activeClients: (clients || []).length,
      clientsChange: 0, // Simplificado para MVP
      averageCPA,
      cpaChange,
      pendingAlerts: pendingAlertsCount || 0,
      alertsChange: 0, // Simplificado para MVP
      recentSuggestions,
      clientsNeedingAttention,
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('[API] GET /api/dashboard unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Retorna label legível para tipo de issue
 */
function getIssueLabel(type: string): string {
  const labels: Record<string, string> = {
    creative_fatigue: 'Fadiga de criativo',
    low_diversity: 'Baixa diversidade',
    high_cpa: 'CPA alto',
    low_ctr: 'CTR baixo',
    scale_opportunity: 'Oportunidade de escala',
  };
  return labels[type] || type;
}
