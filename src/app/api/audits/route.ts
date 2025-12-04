/**
 * @file route.ts
 * @description API Route para listagem e criação de auditorias
 * @module api/audits
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { CreateAuditDTO, AuditType, AuditStatus } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/audits
 * Lista auditorias do usuário autenticado
 *
 * Query params:
 * - client_id: Filtrar por cliente
 * - type: Filtrar por tipo (funnel, competitor, brand, mystery_shopper)
 * - status: Filtrar por status (draft, completed, shared)
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

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const type = searchParams.get('type') as AuditType | null;
    const status = searchParams.get('status') as AuditStatus | null;

    let query = supabase
      .from('audits')
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq('user_id', user.id);

    // Aplicar filtros
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: audits, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[API] GET /api/audits error:', error);
      return NextResponse.json({ error: 'Erro ao buscar auditorias' }, { status: 500 });
    }

    return NextResponse.json(audits);
  } catch (err) {
    console.error('[API] GET /api/audits unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/audits
 * Cria uma nova auditoria
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

    const body: CreateAuditDTO = await request.json();

    // Validações
    if (!body.client_id) {
      return NextResponse.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: 'type é obrigatório' }, { status: 400 });
    }
    if (!body.title) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    }

    // Verificar se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', body.client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Criar auditoria
    const { data: audit, error: createError } = await supabase
      .from('audits')
      .insert({
        user_id: user.id,
        client_id: body.client_id,
        type: body.type,
        title: body.title,
        description: body.description || null,
        data: body.data || {},
        status: 'draft',
        critical_issues: [],
        quick_wins: [],
        recommendations: [],
        attachments: [],
      })
      .select(`
        *,
        client:clients(id, name)
      `)
      .single();

    if (createError) {
      console.error('[API] POST /api/audits error:', createError);
      return NextResponse.json({ error: 'Erro ao criar auditoria' }, { status: 500 });
    }

    return NextResponse.json(audit, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/audits unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
