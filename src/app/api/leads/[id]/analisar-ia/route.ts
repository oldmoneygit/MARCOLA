/**
 * @file route.ts
 * @description API Route para análise IA de um lead
 * @module api/leads/[id]/analisar-ia
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { analisarLeadIAWebhook, mapAnaliseIAToDb, mapDbLeadToTs } from '@/lib/lead-sniper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/leads/[id]/analisar-ia
 * Executa análise IA para um lead específico
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

    // Buscar lead para verificar se existe e obter o googlePlaceId
    const { data: lead, error: leadError } = await supabase
      .from('leads_prospectados')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Verificar se o lead tem googlePlaceId
    if (!lead.google_place_id) {
      return NextResponse.json(
        { error: 'Lead não possui Google Place ID para análise' },
        { status: 400 }
      );
    }

    // Executar análise IA via webhook
    const webhookResponse = await analisarLeadIAWebhook(lead.google_place_id, id);

    if (!webhookResponse.success) {
      return NextResponse.json(
        { error: webhookResponse.error || 'Falha na análise IA do lead' },
        { status: 500 }
      );
    }

    // Mapear resultado para formato do banco
    const updateData = mapAnaliseIAToDb(webhookResponse);

    // Atualizar lead com os dados da análise IA
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
      console.error('[leads/analisar-ia] Erro ao atualizar:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar resultado da análise IA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: mapDbLeadToTs(updatedLead),
      analiseIA: {
        scoreBase: webhookResponse.analiseIA.scoreBase,
        bonusMarketing: webhookResponse.analiseIA.bonusMarketing,
        scoreFinal: webhookResponse.analiseIA.scoreFinal,
        classificacao: webhookResponse.analiseIA.classificacao,
        resumo: webhookResponse.analiseIA.resumo,
        pontosFortes: webhookResponse.analiseIA.pontosFortes,
        pontosFracos: webhookResponse.analiseIA.pontosFracos,
        oportunidadesMarketing: webhookResponse.analiseIA.oportunidadesMarketing,
        argumentosVenda: webhookResponse.analiseIA.argumentosVenda,
        abordagemSugerida: webhookResponse.analiseIA.abordagemSugerida,
        mensagemWhatsApp: webhookResponse.analiseIA.mensagemWhatsApp,
      },
      marketingDigital: webhookResponse.marketingDigital,
      reviews: webhookResponse.reviews,
    });
  } catch (error) {
    console.error('[leads/analisar-ia] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
