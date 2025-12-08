/**
 * @file route.ts
 * @description API Route para estatísticas de leads
 * @module api/leads/stats
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { calculateLeadStats } from '@/lib/lead-sniper';

/**
 * GET /api/leads/stats
 * Retorna estatísticas agregadas dos leads
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

    // Buscar todos os leads do usuário
    const { data: leads, error } = await supabase
      .from('leads_prospectados')
      .select('classificacao, status, cidade, tem_whatsapp, tem_site, score, nivel_marketing_digital, faz_google_ads, faz_facebook_ads')
      .eq('user_id', user.id);

    if (error) {
      console.error('[leads/stats] Erro ao buscar leads:', error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    const stats = calculateLeadStats(leads || []);

    // Buscar contagem de pesquisas
    const { count: totalPesquisas } = await supabase
      .from('pesquisas_mercado')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Buscar última pesquisa
    const { data: ultimaPesquisa } = await supabase
      .from('pesquisas_mercado')
      .select('id, tipo_negocio, created_at, total_leads')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      ...stats,
      totalPesquisas: totalPesquisas || 0,
      ultimaPesquisa: ultimaPesquisa
        ? {
            id: ultimaPesquisa.id,
            tipoNegocio: ultimaPesquisa.tipo_negocio,
            createdAt: ultimaPesquisa.created_at,
            totalLeads: ultimaPesquisa.total_leads,
          }
        : null,
    });
  } catch (error) {
    console.error('[leads/stats] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
