/**
 * @file route.ts
 * @description API Route para operações em relatório específico
 * @module api/reports/[id]
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reports/[id]
 * Busca um relatório específico com seus anúncios
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
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

    // Busca o relatório com cliente
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        clients (
          id,
          name,
          segment
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
      }
      console.error('[API] GET /api/reports/[id] report error:', reportError);
      return NextResponse.json({ error: 'Erro ao buscar relatório' }, { status: 500 });
    }

    // Busca os anúncios
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('report_id', id)
      .order('spend', { ascending: false });

    if (adsError) {
      console.error('[API] GET /api/reports/[id] ads error:', adsError);
      return NextResponse.json({ error: 'Erro ao buscar anúncios' }, { status: 500 });
    }

    return NextResponse.json({
      report,
      ads: ads || [],
    });
  } catch (err) {
    console.error('[API] GET /api/reports/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/reports/[id]
 * Deleta um relatório e seus anúncios
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

    // Verifica se o relatório pertence ao usuário
    const { data: report, error: checkError } = await supabase
      .from('reports')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !report) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }

    // Deleta os anúncios primeiro
    await supabase.from('ads').delete().eq('report_id', id);

    // Deleta o relatório
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[API] DELETE /api/reports/[id] error:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir relatório' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/reports/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
