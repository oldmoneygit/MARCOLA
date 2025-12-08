/**
 * @file route.ts
 * @description API Route para operações em um lead específico
 * @module api/leads/[id]
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { mapDbLeadToTs } from '@/lib/lead-sniper';
import type { UpdateLeadDTO } from '@/types/lead-sniper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]
 * Retorna detalhes de um lead específico
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

    const { data: lead, error } = await supabase
      .from('leads_prospectados')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Buscar interações do lead
    const { data: interacoes } = await supabase
      .from('lead_interacoes')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      lead: mapDbLeadToTs(lead),
      interacoes: interacoes || [],
    });
  } catch (error) {
    console.error('[leads/id] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/leads/[id]
 * Atualiza um lead (status, notas)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body: UpdateLeadDTO = await request.json();

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      updateData.status = body.status;

      // Atualizar datas baseado no status
      if (body.status === 'CONTATADO') {
        updateData.data_contato = new Date().toISOString();
      } else if (body.status === 'RESPONDEU') {
        updateData.data_resposta = new Date().toISOString();
      }
    }

    if (body.notas !== undefined) {
      updateData.notas = body.notas;
    }

    const { data: lead, error } = await supabase
      .from('leads_prospectados')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[leads/id] Erro ao atualizar:', error);
      return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 });
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      lead: mapDbLeadToTs(lead),
    });
  } catch (error) {
    console.error('[leads/id] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * DELETE /api/leads/[id]
 * Remove um lead
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

    const { error } = await supabase
      .from('leads_prospectados')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[leads/id] Erro ao deletar:', error);
      return NextResponse.json({ error: 'Erro ao deletar lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[leads/id] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
