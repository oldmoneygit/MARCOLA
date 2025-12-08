/**
 * @file route.ts
 * @description API Route para Diagnóstico Profundo de Leads
 * @module api/leads/[id]/diagnostico
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { executarDiagnostico } from '@/lib/diagnostico';
import type { DiagnosticoRequest, DiagnosticoCompleto } from '@/types/diagnostico';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/leads/[id]/diagnostico
 * Busca diagnóstico existente de um lead
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

    // Buscar lead com diagnóstico
    const { data: lead, error: leadError } = await supabase
      .from('leads_prospectados')
      .select('id, diagnostico_profundo')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    if (!lead.diagnostico_profundo) {
      return NextResponse.json({ error: 'Diagnóstico não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      diagnostico: lead.diagnostico_profundo as DiagnosticoCompleto,
    });
  } catch (error) {
    console.error('[leads/diagnostico] GET Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads/[id]/diagnostico
 * Executa diagnóstico profundo para um lead
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

    // Buscar lead para verificar se existe e obter dados
    const { data: lead, error: leadError } = await supabase
      .from('leads_prospectados')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Montar request para diagnóstico
    const diagnosticoRequest: DiagnosticoRequest = {
      leadId: id,
      nome: lead.nome || 'Sem nome',
      telefone: lead.telefone || undefined,
      email: lead.email || undefined,
      empresa: lead.empresa || lead.nome || undefined,
      site: lead.website || undefined,
      instagram: lead.instagram || undefined,
      observacoes: lead.observacoes || undefined,
      fonte: lead.fonte || 'lead_sniper',
    };

    // Executar diagnóstico via n8n
    const resultado = await executarDiagnostico(diagnosticoRequest);

    if (!resultado.success || !resultado.data) {
      return NextResponse.json(
        { error: resultado.error || 'Falha no diagnóstico' },
        { status: 500 }
      );
    }

    // Salvar diagnóstico no lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads_prospectados')
      .update({
        diagnostico_profundo: resultado.data,
        temperatura_lead: resultado.data.classificacao?.temperatura || null,
        score_lead: resultado.data.classificacao?.score || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[leads/diagnostico] Erro ao salvar:', updateError);
      return NextResponse.json(
        { error: 'Erro ao salvar diagnóstico' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      diagnostico: resultado.data,
      lead: updatedLead,
    });
  } catch (error) {
    console.error('[leads/diagnostico] POST Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leads/[id]/diagnostico
 * Atualiza diagnóstico existente (salva manualmente)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    if (!body.diagnostico) {
      return NextResponse.json({ error: 'Diagnóstico não fornecido' }, { status: 400 });
    }

    // Atualizar diagnóstico no lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads_prospectados')
      .update({
        diagnostico_profundo: body.diagnostico,
        temperatura_lead: body.diagnostico.classificacao?.temperatura || null,
        score_lead: body.diagnostico.classificacao?.score || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('[leads/diagnostico] PUT Erro ao atualizar:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar diagnóstico' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      diagnostico: body.diagnostico,
      lead: updatedLead,
    });
  } catch (error) {
    console.error('[leads/diagnostico] PUT Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads/[id]/diagnostico
 * Remove diagnóstico de um lead
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

    // Remover diagnóstico do lead
    const { error: updateError } = await supabase
      .from('leads_prospectados')
      .update({
        diagnostico_profundo: null,
        temperatura_lead: null,
        score_lead: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[leads/diagnostico] DELETE Erro:', updateError);
      return NextResponse.json(
        { error: 'Erro ao remover diagnóstico' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico removido com sucesso',
    });
  } catch (error) {
    console.error('[leads/diagnostico] DELETE Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
