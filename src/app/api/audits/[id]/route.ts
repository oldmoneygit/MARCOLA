/**
 * @file route.ts
 * @description API Route para operações em uma auditoria específica
 * @module api/audits/[id]
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { UpdateAuditDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/audits/[id]
 * Retorna uma auditoria específica
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

    const { data: audit, error } = await supabase
      .from('audits')
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Auditoria não encontrada' }, { status: 404 });
      }
      console.error('[API] GET /api/audits/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao buscar auditoria' }, { status: 500 });
    }

    return NextResponse.json(audit);
  } catch (err) {
    console.error('[API] GET /api/audits/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/audits/[id]
 * Atualiza uma auditoria
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body: UpdateAuditDTO = await request.json();

    // Verificar se a auditoria existe e pertence ao usuário
    const { data: existingAudit, error: findError } = await supabase
      .from('audits')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !existingAudit) {
      return NextResponse.json({ error: 'Auditoria não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.data !== undefined) {
      updateData.data = body.data;
    }
    if (body.overall_score !== undefined) {
      updateData.overall_score = body.overall_score;
    }
    if (body.critical_issues !== undefined) {
      updateData.critical_issues = body.critical_issues;
    }
    if (body.quick_wins !== undefined) {
      updateData.quick_wins = body.quick_wins;
    }
    if (body.recommendations !== undefined) {
      updateData.recommendations = body.recommendations;
    }
    if (body.attachments !== undefined) {
      updateData.attachments = body.attachments;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.shared_with_client !== undefined) {
      updateData.shared_with_client = body.shared_with_client;
      if (body.shared_with_client) {
        updateData.shared_at = new Date().toISOString();
      }
    }

    // Atualizar
    const { data: audit, error: updateError } = await supabase
      .from('audits')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name)
      `)
      .single();

    if (updateError) {
      console.error('[API] PUT /api/audits/[id] error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar auditoria' }, { status: 500 });
    }

    return NextResponse.json(audit);
  } catch (err) {
    console.error('[API] PUT /api/audits/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/audits/[id]
 * Remove uma auditoria
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

    // Verificar se a auditoria existe e pertence ao usuário
    const { data: existingAudit, error: findError } = await supabase
      .from('audits')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !existingAudit) {
      return NextResponse.json({ error: 'Auditoria não encontrada' }, { status: 404 });
    }

    // Deletar
    const { error: deleteError } = await supabase
      .from('audits')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[API] DELETE /api/audits/[id] error:', deleteError);
      return NextResponse.json({ error: 'Erro ao deletar auditoria' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/audits/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
