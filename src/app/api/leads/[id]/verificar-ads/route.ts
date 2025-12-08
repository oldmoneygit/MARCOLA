/**
 * @file route.ts
 * @description API Route para verificação de ads de um lead
 * @module api/leads/[id]/verificar-ads
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { verificarAdsWebhook, mapAdsResultToDb, mapDbLeadToTs } from '@/lib/lead-sniper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/leads/[id]/verificar-ads
 * Executa verificação de ads para um lead específico
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar lead para verificar se existe e obter o site
    const { data: lead, error: leadError } = await supabase
      .from('leads_prospectados')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Verificar se o lead tem site
    if (!lead.site) {
      return NextResponse.json(
        { error: 'Lead não possui site para verificação' },
        { status: 400 }
      );
    }

    // Executar verificação via webhook
    const webhookResponse = await verificarAdsWebhook(lead.site, id);

    if (!webhookResponse.success) {
      return NextResponse.json(
        { error: webhookResponse.error || 'Falha na verificação de ads' },
        { status: 500 }
      );
    }

    // Mapear resultado para formato do banco
    const updateData = mapAdsResultToDb({
      fazGoogleAds: webhookResponse.fazGoogleAds,
      fazFacebookAds: webhookResponse.fazFacebookAds,
      usaGoogleAnalytics: webhookResponse.usaGoogleAnalytics,
      usaGoogleTagManager: webhookResponse.usaGoogleTagManager,
      usaHotjar: webhookResponse.usaHotjar,
      usaRdStation: webhookResponse.usaRDStation,
      usaTiktokAds: webhookResponse.usaTikTokAds,
      usaLinkedinAds: webhookResponse.usaLinkedInAds,
      adsDetalhes: webhookResponse.adsDetalhes,
      nivelMarketingDigital: webhookResponse.nivelMarketingDigital,
      scoreBonus: webhookResponse.scoreBonus,
      oportunidade: webhookResponse.oportunidade,
    });

    // Atualizar lead com os dados de verificação
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads_prospectados')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[leads/verificar-ads] Erro ao atualizar:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar resultado da verificação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: mapDbLeadToTs(updatedLead),
      verificacao: {
        fazGoogleAds: webhookResponse.fazGoogleAds,
        fazFacebookAds: webhookResponse.fazFacebookAds,
        usaGoogleAnalytics: webhookResponse.usaGoogleAnalytics,
        usaGoogleTagManager: webhookResponse.usaGoogleTagManager,
        nivelMarketingDigital: webhookResponse.nivelMarketingDigital,
      },
    });
  } catch (error) {
    console.error('[leads/verificar-ads] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
