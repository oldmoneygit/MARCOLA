/**
 * @file route.ts
 * @description API Route para listagem de leads prospectados
 * @module api/leads
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { mapDbLeadToTs } from '@/lib/lead-sniper';

/**
 * GET /api/leads
 * Lista todos os leads do usuário com filtros
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

    // Parâmetros de filtro
    const classificacao = searchParams.get('classificacao');
    const status = searchParams.get('status');
    const cidade = searchParams.get('cidade');
    const tipoNegocio = searchParams.get('tipoNegocio') || searchParams.get('tipo');
    const temWhatsapp = searchParams.get('temWhatsapp');
    const temSite = searchParams.get('temSite');
    const scoreMin = searchParams.get('scoreMin');
    const scoreMax = searchParams.get('scoreMax');
    const pesquisaId = searchParams.get('pesquisaId');
    const search = searchParams.get('search');
    const nivelMarketing = searchParams.get('nivelMarketing');

    // Parâmetros de paginação
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Parâmetros de ordenação
    const orderBy = searchParams.get('orderBy') || 'score';
    const orderDir = searchParams.get('orderDir') === 'asc' ? true : false;

    // Construir query
    let query = supabase
      .from('leads_prospectados')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Aplicar filtros
    if (classificacao) {
      query = query.eq('classificacao', classificacao);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (cidade) {
      query = query.ilike('cidade', `%${cidade}%`);
    }
    if (tipoNegocio) {
      query = query.eq('tipo_negocio', tipoNegocio);
    }
    if (temWhatsapp === 'true') {
      query = query.eq('tem_whatsapp', true);
    } else if (temWhatsapp === 'false') {
      query = query.eq('tem_whatsapp', false);
    }
    if (temSite === 'true') {
      query = query.eq('tem_site', true);
    } else if (temSite === 'false') {
      query = query.eq('tem_site', false);
    }
    if (scoreMin) {
      query = query.gte('score', parseInt(scoreMin));
    }
    if (scoreMax) {
      query = query.lte('score', parseInt(scoreMax));
    }
    if (pesquisaId) {
      query = query.eq('pesquisa_id', pesquisaId);
    }
    if (search) {
      query = query.or(`nome.ilike.%${search}%,endereco.ilike.%${search}%`);
    }
    if (nivelMarketing) {
      query = query.eq('nivel_marketing_digital', nivelMarketing);
    }

    // Ordenação
    query = query.order(orderBy, { ascending: orderDir });

    // Paginação
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('[leads] Erro ao listar:', error);
      return NextResponse.json({ error: 'Erro ao listar leads' }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      leads: (leads || []).map(mapDbLeadToTs),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[leads] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
