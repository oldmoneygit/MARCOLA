/**
 * @file route.ts
 * @description API Route para operações em leads individuais (v3)
 * @module api/lead-sniper/v3/leads/[id]
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { mapDbLeadToV3 } from '@/lib/lead-sniper';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/lead-sniper/v3/leads/[id]
 * Busca um lead específico
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

    return NextResponse.json({
      lead: mapDbLeadToV3(lead),
    });

  } catch (error) {
    console.error('[lead-sniper/v3/leads] GET Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/lead-sniper/v3/leads/[id]
 * Atualiza status ou notas de um lead
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Campos permitidos para atualização
    const allowedFields = ['status', 'notas', 'data_contato', 'data_resposta'];
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Atualizar data_contato automaticamente ao marcar como CONTATADO
    if (body.status === 'CONTATADO' && !body.data_contato) {
      updateData.data_contato = new Date().toISOString();
    }

    // Atualizar data_resposta automaticamente ao marcar como RESPONDEU
    if (body.status === 'RESPONDEU' && !body.data_resposta) {
      updateData.data_resposta = new Date().toISOString();
    }

    const { data: lead, error } = await supabase
      .from('leads_prospectados')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !lead) {
      console.error('[lead-sniper/v3/leads] PATCH Erro:', error);
      return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lead: mapDbLeadToV3(lead),
    });

  } catch (error) {
    console.error('[lead-sniper/v3/leads] PATCH Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lead-sniper/v3/leads/[id]
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
      console.error('[lead-sniper/v3/leads] DELETE Erro:', error);
      return NextResponse.json({ error: 'Erro ao deletar lead' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead removido com sucesso',
    });

  } catch (error) {
    console.error('[lead-sniper/v3/leads] DELETE Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
