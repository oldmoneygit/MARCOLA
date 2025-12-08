/**
 * @file route.ts
 * @description API Route para Lead Sniper v3 AI
 * @module api/lead-sniper/v3
 *
 * Endpoints:
 * - POST: Executa pesquisa de leads com icebreakers gerados por IA
 * - GET: Lista pesquisas recentes do usuário
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  executarPesquisaV3,
  mapLeadV3ToDb,
  LEAD_SNIPER_V3_LIMITS,
} from '@/lib/lead-sniper';
import type { LeadSniperV3Request } from '@/types/lead-sniper-v3';

/**
 * POST /api/lead-sniper/v3
 * Executa pesquisa de leads com Lead Sniper v3 AI
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parse do body
    const body: LeadSniperV3Request = await request.json();

    // Validar campos obrigatórios
    if (!body.tipo_negocio || body.tipo_negocio.trim() === '') {
      return NextResponse.json(
        { error: 'Tipo de negócio é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.cidade || body.cidade.trim() === '') {
      return NextResponse.json(
        { error: 'Cidade é obrigatória' },
        { status: 400 }
      );
    }

    // Aplicar defaults
    const params: LeadSniperV3Request = {
      tipo_negocio: body.tipo_negocio.trim(),
      cidade: body.cidade.trim(),
      estado: body.estado ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_ESTADO,
      quantidade: Math.min(
        body.quantidade ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_QUANTIDADE,
        LEAD_SNIPER_V3_LIMITS.MAX_QUANTIDADE
      ),
      nome_agencia: body.nome_agencia?.trim() || undefined,
      especialidade: body.especialidade?.trim() || undefined,
      proposta: body.proposta?.trim() || undefined,
      tom_voz: body.tom_voz ?? LEAD_SNIPER_V3_LIMITS.DEFAULT_TOM_VOZ,
    };

    console.log('[lead-sniper/v3] Iniciando pesquisa:', {
      tipo: params.tipo_negocio,
      cidade: params.cidade,
      estado: params.estado,
      quantidade: params.quantidade,
    });

    // Criar registro da pesquisa
    const { data: pesquisa, error: createError } = await supabase
      .from('pesquisas_mercado')
      .insert({
        user_id: user.id,
        request_id: `v3_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        tipo_negocio: params.tipo_negocio,
        cidade: params.cidade,
        estado: params.estado,
        quantidade: params.quantidade,
        nome_agencia: params.nome_agencia || null,
        especialidade: params.especialidade || null,
        tom_voz: params.tom_voz || null,
        status: 'processing',
        versao: 'v3-ai',
      })
      .select()
      .single();

    if (createError || !pesquisa) {
      console.error('[lead-sniper/v3] Erro ao criar pesquisa:', createError);
      return NextResponse.json({ error: 'Erro ao criar pesquisa' }, { status: 500 });
    }

    try {
      // Executar pesquisa via webhook v3
      const response = await executarPesquisaV3(params);

      if (!response.success) {
        throw new Error(response.error || 'Falha na pesquisa');
      }

      // Salvar leads no banco
      let leadsSalvos = 0;
      let leadsDuplicados = 0;
      const leadsIds: string[] = [];

      for (const lead of response.leads) {
        const leadData = mapLeadV3ToDb(lead, user.id, pesquisa.id, params.estado || 'SP');

        const { data: savedLead, error: insertError } = await supabase
          .from('leads_prospectados')
          .upsert(leadData, {
            onConflict: 'user_id,place_id',
            ignoreDuplicates: false,
          })
          .select('id')
          .single();

        if (insertError) {
          // Tentar com google_place_id para compatibilidade
          const { data: savedLead2, error: insertError2 } = await supabase
            .from('leads_prospectados')
            .upsert(
              { ...leadData, google_place_id: lead.placeId },
              {
                onConflict: 'user_id,google_place_id',
                ignoreDuplicates: false,
              }
            )
            .select('id')
            .single();

          if (insertError2) {
            console.warn('[lead-sniper/v3] Lead duplicado:', lead.nome);
            leadsDuplicados++;
          } else if (savedLead2) {
            leadsSalvos++;
            leadsIds.push(savedLead2.id);
          }
        } else if (savedLead) {
          leadsSalvos++;
          leadsIds.push(savedLead.id);
        }
      }

      // Atualizar pesquisa com estatísticas
      await supabase
        .from('pesquisas_mercado')
        .update({
          status: 'completed',
          total_leads: response.estatisticas.total,
          leads_hot: response.estatisticas.hot,
          leads_warm: response.estatisticas.warm,
          leads_cool: response.estatisticas.cool,
          com_whatsapp: response.estatisticas.comWhatsapp,
          com_site: response.estatisticas.comSite,
          sem_site: response.estatisticas.semSite,
          sites_scraped: response.estatisticas.sitesScraped,
          icebreakers_por_ia: response.estatisticas.icebreakersPorIA,
          executado_em: response.meta.executadoEm,
        })
        .eq('id', pesquisa.id);

      // Buscar leads salvos para retornar
      const { data: leadsSalvosDb } = await supabase
        .from('leads_prospectados')
        .select('*')
        .in('id', leadsIds)
        .order('score', { ascending: false });

      console.log('[lead-sniper/v3] Pesquisa concluída:', {
        total: response.estatisticas.total,
        salvos: leadsSalvos,
        duplicados: leadsDuplicados,
      });

      return NextResponse.json({
        success: true,
        pesquisaId: pesquisa.id,
        versao: response.versao,
        meta: response.meta,
        estatisticas: {
          ...response.estatisticas,
          salvos: leadsSalvos,
          duplicados: leadsDuplicados,
        },
        leads: response.leads,
        leadsDb: leadsSalvosDb || [],
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

      console.error('[lead-sniper/v3] Erro no webhook:', webhookError);
      return NextResponse.json(
        {
          error: webhookError instanceof Error ? webhookError.message : 'Erro na pesquisa',
          pesquisaId: pesquisa.id,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[lead-sniper/v3] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lead-sniper/v3
 * Lista pesquisas recentes do usuário (v3)
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    // Buscar pesquisas v3
    let query = supabase
      .from('pesquisas_mercado')
      .select('*')
      .eq('user_id', user.id)
      .eq('versao', 'v3-ai')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: pesquisas, error } = await query;

    if (error) {
      console.error('[lead-sniper/v3] Erro ao listar:', error);
      return NextResponse.json({ error: 'Erro ao listar pesquisas' }, { status: 500 });
    }

    return NextResponse.json({
      pesquisas: pesquisas || [],
      total: pesquisas?.length || 0,
    });

  } catch (error) {
    console.error('[lead-sniper/v3] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
