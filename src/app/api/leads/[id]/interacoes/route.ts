/**
 * @file route.ts
 * @description API Route para interações de um lead
 * @module api/leads/[id]/interacoes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { CreateInteracaoDTO } from '@/types/lead-sniper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]/interacoes
 * Lista interações de um lead
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

    // Verificar se o lead pertence ao usuário
    const { data: lead } = await supabase
      .from('leads_prospectados')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    const { data: interacoes, error } = await supabase
      .from('lead_interacoes')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[leads/interacoes] Erro ao listar:', error);
      return NextResponse.json({ error: 'Erro ao listar interações' }, { status: 500 });
    }

    return NextResponse.json({
      interacoes: interacoes || [],
      total: interacoes?.length || 0,
    });
  } catch (error) {
    console.error('[leads/interacoes] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/leads/[id]/interacoes
 * Registra uma nova interação com o lead
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body: CreateInteracaoDTO = await request.json();

    // Validar campos obrigatórios
    if (!body.tipo) {
      return NextResponse.json({ error: 'Tipo de interação é obrigatório' }, { status: 400 });
    }

    // Verificar se o lead pertence ao usuário
    const { data: lead } = await supabase
      .from('leads_prospectados')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Criar interação
    const { data: interacao, error } = await supabase
      .from('lead_interacoes')
      .insert({
        lead_id: id,
        user_id: user.id,
        tipo: body.tipo,
        direcao: body.direcao || null,
        conteudo: body.conteudo || null,
        resultado: body.resultado || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[leads/interacoes] Erro ao criar:', error);
      return NextResponse.json({ error: 'Erro ao criar interação' }, { status: 500 });
    }

    // Atualizar status do lead se necessário
    if (lead.status === 'NOVO' && body.direcao === 'ENVIADO') {
      await supabase
        .from('leads_prospectados')
        .update({
          status: 'CONTATADO',
          data_contato: new Date().toISOString(),
        })
        .eq('id', id);
    } else if (body.direcao === 'RECEBIDO' && lead.status === 'CONTATADO') {
      await supabase
        .from('leads_prospectados')
        .update({
          status: 'RESPONDEU',
          data_resposta: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      interacao,
    });
  } catch (error) {
    console.error('[leads/interacoes] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
