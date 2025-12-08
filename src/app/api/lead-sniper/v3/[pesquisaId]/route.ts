/**
 * @file route.ts
 * @description API Route para buscar leads de uma pesquisa específica (v3)
 * @module api/lead-sniper/v3/[pesquisaId]
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { mapDbLeadToV3 } from '@/lib/lead-sniper';

interface RouteParams {
  params: Promise<{ pesquisaId: string }>;
}

/**
 * GET /api/lead-sniper/v3/[pesquisaId]
 * Busca leads de uma pesquisa específica
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { pesquisaId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar pesquisa
    const { data: pesquisa, error: pesquisaError } = await supabase
      .from('pesquisas_mercado')
      .select('*')
      .eq('id', pesquisaId)
      .eq('user_id', user.id)
      .single();

    if (pesquisaError || !pesquisa) {
      return NextResponse.json({ error: 'Pesquisa não encontrada' }, { status: 404 });
    }

    // Parâmetros de filtro
    const { searchParams } = new URL(request.url);
    const classificacao = searchParams.get('classificacao');
    const comWhatsapp = searchParams.get('comWhatsapp');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Buscar leads
    let query = supabase
      .from('leads_prospectados')
      .select('*')
      .eq('pesquisa_id', pesquisaId)
      .eq('user_id', user.id)
      .order('score', { ascending: false })
      .limit(limit);

    if (classificacao) {
      query = query.eq('classificacao', classificacao);
    }

    if (comWhatsapp === 'true') {
      query = query.not('link_whatsapp', 'is', null);
    }

    const { data: leads, error: leadsError } = await query;

    if (leadsError) {
      console.error('[lead-sniper/v3] Erro ao buscar leads:', leadsError);
      return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 });
    }

    // Mapear para formato v3 (mapDbLeadToV3 já inclui dbId e dbStatus)
    const leadsV3 = (leads || []).map((lead) => mapDbLeadToV3(lead));

    // Calcular estatísticas
    const estatisticas = {
      total: leadsV3.length,
      hot: leadsV3.filter((l) => l.classificacao === 'HOT').length,
      warm: leadsV3.filter((l) => l.classificacao === 'WARM').length,
      cool: leadsV3.filter((l) => l.classificacao === 'COOL').length,
      comWhatsapp: leadsV3.filter((l) => l.linkWhatsapp).length,
      comIcebreaker: leadsV3.filter((l) => l.icebreaker).length,
    };

    return NextResponse.json({
      pesquisa: {
        id: pesquisa.id,
        tipoNegocio: pesquisa.tipo_negocio,
        cidade: pesquisa.cidade,
        estado: pesquisa.estado,
        quantidade: pesquisa.quantidade,
        status: pesquisa.status,
        versao: pesquisa.versao,
        createdAt: pesquisa.created_at,
      },
      estatisticas,
      leads: leadsV3,
    });

  } catch (error) {
    console.error('[lead-sniper/v3] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lead-sniper/v3/[pesquisaId]
 * Remove uma pesquisa e seus leads
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { pesquisaId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se a pesquisa pertence ao usuário
    const { data: pesquisa } = await supabase
      .from('pesquisas_mercado')
      .select('id')
      .eq('id', pesquisaId)
      .eq('user_id', user.id)
      .single();

    if (!pesquisa) {
      return NextResponse.json({ error: 'Pesquisa não encontrada' }, { status: 404 });
    }

    // Deletar pesquisa (leads serão deletados por CASCADE)
    const { error: deleteError } = await supabase
      .from('pesquisas_mercado')
      .delete()
      .eq('id', pesquisaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[lead-sniper/v3] Erro ao deletar:', deleteError);
      return NextResponse.json({ error: 'Erro ao deletar pesquisa' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Pesquisa e leads removidos com sucesso',
    });

  } catch (error) {
    console.error('[lead-sniper/v3] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
