/**
 * @file route.ts
 * @description API Route para listagem e criação de eventos do calendário
 * @module api/calendar
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { CreateCalendarEventDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/calendar
 * Lista eventos do calendário do usuário
 *
 * Query params:
 * - client_id: Filtrar por cliente
 * - start_date: Data inicial (YYYY-MM-DD)
 * - end_date: Data final (YYYY-MM-DD)
 * - status: Filtrar por status
 * - type: Filtrar por tipo de conteúdo
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = supabase
      .from('content_calendar')
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq('user_id', user.id);

    // Aplicar filtros
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (startDate) {
      query = query.gte('scheduled_date', startDate);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: events, error } = await query.order('scheduled_date', { ascending: true });

    if (error) {
      console.error('[API] GET /api/calendar error:', error);
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }

    return NextResponse.json(events);
  } catch (err) {
    console.error('[API] GET /api/calendar unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/calendar
 * Cria um novo evento no calendário
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

    const body: CreateCalendarEventDTO = await request.json();

    // Validação básica
    if (!body.client_id || !body.title || !body.type || !body.scheduled_date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: client_id, title, type, scheduled_date' },
        { status: 400 }
      );
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

    const { data: event, error } = await supabase
      .from('content_calendar')
      .insert({
        user_id: user.id,
        client_id: body.client_id,
        title: body.title,
        description: body.description || null,
        type: body.type,
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time || null,
        status: 'planned',
        platform: body.platform || [],
        color: body.color || null,
        notes: body.notes || null,
        attachments: [],
      })
      .select(`
        *,
        client:clients(id, name)
      `)
      .single();

    if (error) {
      console.error('[API] POST /api/calendar error:', error);
      return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/calendar unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
