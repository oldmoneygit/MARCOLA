/**
 * @file route.ts
 * @description API Route para pesquisa de mercado (Lead Sniper)
 * @module api/pesquisa-mercado
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  executarPesquisaWebhook,
  mapWebhookLeadToDb,
  mapDbPesquisaToTs,
} from '@/lib/lead-sniper';
import type { CreatePesquisaDTO } from '@/types/lead-sniper';

/**
 * GET /api/pesquisa-mercado
 * Lista todas as pesquisas de mercado do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipoNegocio = searchParams.get('tipo');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('pesquisas_mercado')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tipoNegocio) {
      query = query.eq('tipo_negocio', tipoNegocio);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: pesquisas, error } = await query;

    if (error) {
      console.error('[pesquisa-mercado] Erro ao listar:', error);
      return NextResponse.json({ error: 'Erro ao listar pesquisas' }, { status: 500 });
    }

    return NextResponse.json({
      pesquisas: (pesquisas || []).map(mapDbPesquisaToTs),
      total: pesquisas?.length || 0,
    });
  } catch (error) {
    console.error('[pesquisa-mercado] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/pesquisa-mercado
 * Executa uma nova pesquisa de mercado
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

    const body: CreatePesquisaDTO = await request.json();

    // Validar campos obrigatórios
    if (!body.tipo || !body.cidades || body.cidades.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de negócio e pelo menos uma cidade são obrigatórios' },
        { status: 400 }
      );
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // 1. Criar registro da pesquisa com status 'processing'
    const { data: pesquisa, error: createError } = await supabase
      .from('pesquisas_mercado')
      .insert({
        user_id: user.id,
        cliente_id: body.clienteId || null,
        request_id: requestId,
        tipo_negocio: body.tipo,
        cidades_buscadas: body.cidades,
        score_minimo: body.scoreMinimo || 40,
        max_por_cidade: body.maxPorCidade || 20,
        status: 'processing',
      })
      .select()
      .single();

    if (createError || !pesquisa) {
      console.error('[pesquisa-mercado] Erro ao criar:', createError);
      return NextResponse.json({ error: 'Erro ao criar pesquisa' }, { status: 500 });
    }

    try {
      // 2. Chamar webhook do n8n
      const webhookResponse = await executarPesquisaWebhook({
        tipo: body.tipo,
        cidades: body.cidades,
        scoreMinimo: body.scoreMinimo,
        maxPorCidade: body.maxPorCidade,
        clienteId: body.clienteId,
      });

      // 3. Atualizar pesquisa com estatísticas
      await supabase
        .from('pesquisas_mercado')
        .update({
          status: 'completed',
          total_leads: webhookResponse.estatisticas.total,
          leads_hot: webhookResponse.estatisticas.hot,
          leads_warm: webhookResponse.estatisticas.warm,
          leads_cool: webhookResponse.estatisticas.cool,
          leads_cold: webhookResponse.estatisticas.cold,
          com_whatsapp: webhookResponse.estatisticas.comWhatsapp,
          sem_site: webhookResponse.estatisticas.semSite,
          executado_em: webhookResponse.meta.executadoEm,
        })
        .eq('id', pesquisa.id);

      // 4. Salvar leads (evitando duplicatas)
      let leadsNovos = 0;
      let leadsDuplicados = 0;
      const leadsSalvosPorCidade: Record<string, number> = {};

      console.log('[pesquisa-mercado] Salvando', webhookResponse.leads.length, 'leads...');

      for (const lead of webhookResponse.leads) {
        const leadData = mapWebhookLeadToDb(lead, user.id, pesquisa.id);

        const { error: insertError } = await supabase
          .from('leads_prospectados')
          .upsert(leadData, {
            onConflict: 'user_id,google_place_id',
            ignoreDuplicates: true,
          });

        if (insertError) {
          // Provavelmente duplicata
          leadsDuplicados++;
        } else {
          leadsNovos++;
          const cidade = lead.cidade || 'Desconhecida';
          leadsSalvosPorCidade[cidade] = (leadsSalvosPorCidade[cidade] || 0) + 1;
        }
      }

      console.log('[pesquisa-mercado] Leads salvos por cidade:', leadsSalvosPorCidade);
      console.log('[pesquisa-mercado] Novos:', leadsNovos, '| Duplicados:', leadsDuplicados);

      return NextResponse.json({
        success: true,
        pesquisa: mapDbPesquisaToTs(pesquisa),
        estatisticas: webhookResponse.estatisticas,
        leadsNovos,
        leadsDuplicados,
      });
    } catch (webhookError) {
      // Atualizar pesquisa com erro
      await supabase
        .from('pesquisas_mercado')
        .update({
          status: 'failed',
          error_message: webhookError instanceof Error ? webhookError.message : 'Erro desconhecido',
        })
        .eq('id', pesquisa.id);

      console.error('[pesquisa-mercado] Erro no webhook:', webhookError);
      return NextResponse.json(
        { error: 'Erro ao executar pesquisa de mercado' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[pesquisa-mercado] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
