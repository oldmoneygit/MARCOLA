/**
 * @file route.ts
 * @description API Route para importação de relatórios CSV
 * @module api/reports/import
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { CSVImportData } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * POST /api/reports/import
 * Importa um relatório a partir de dados CSV processados
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

    const body: CSVImportData = await request.json();

    // Validações
    if (!body.clientId) {
      return NextResponse.json({ error: 'Cliente não informado' }, { status: 400 });
    }

    if (!body.periodStart || !body.periodEnd) {
      return NextResponse.json({ error: 'Período não informado' }, { status: 400 });
    }

    if (!body.ads || body.ads.length === 0) {
      return NextResponse.json({ error: 'Nenhum anúncio para importar' }, { status: 400 });
    }

    // Verifica se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', body.clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Calcula totais
    const totals = body.ads.reduce(
      (acc, ad) => ({
        spend: acc.spend + (ad.spend || 0),
        impressions: acc.impressions + (ad.impressions || 0),
        clicks: acc.clicks + (ad.clicks || 0),
        conversions: acc.conversions + (ad.conversions || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    // Cria o relatório
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        client_id: body.clientId,
        user_id: user.id,
        period_start: body.periodStart,
        period_end: body.periodEnd,
        total_spend: totals.spend,
        total_impressions: totals.impressions,
        total_clicks: totals.clicks,
        total_conversions: totals.conversions,
      })
      .select()
      .single();

    if (reportError) {
      console.error('[API] POST /api/reports/import report error:', reportError);
      return NextResponse.json({ error: 'Erro ao criar relatório' }, { status: 500 });
    }

    // Prepara anúncios para inserção
    const adsToInsert = body.ads.map(ad => ({
      report_id: report.id,
      ad_name: ad.ad_name,
      ad_set_name: ad.ad_set_name || null,
      campaign_name: ad.campaign_name || null,
      spend: ad.spend || 0,
      impressions: ad.impressions || 0,
      clicks: ad.clicks || 0,
      conversions: ad.conversions || 0,
      ctr: ad.ctr || 0,
      cpc: ad.cpc || 0,
      cpa: ad.cpa || 0,
      cpm: ad.cpm || 0,
      // Campos expandidos do Meta Ads
      reach: ad.reach ?? null,
      frequency: ad.frequency ?? null,
      roas: ad.roas ?? null,
      purchase_value: ad.purchase_value ?? null,
      landing_page_views: ad.landing_page_views ?? null,
      add_to_cart: ad.add_to_cart ?? null,
      checkouts_initiated: ad.checkouts_initiated ?? null,
      status: ad.status || 'active',
    }));

    // Insere anúncios
    const { error: adsError } = await supabase.from('ads').insert(adsToInsert);

    if (adsError) {
      // Rollback: deleta o relatório criado
      await supabase.from('reports').delete().eq('id', report.id);
      console.error('[API] POST /api/reports/import ads error:', adsError);
      return NextResponse.json({ error: 'Erro ao importar anúncios' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      report,
      adsCount: body.ads.length,
    });
  } catch (err) {
    console.error('[API] POST /api/reports/import unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
