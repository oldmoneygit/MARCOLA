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
 * Lista eventos do calendário do usuário (inclui content_calendar e meetings)
 *
 * Query params:
 * - client_id: Filtrar por cliente
 * - start_date: Data inicial (YYYY-MM-DD)
 * - end_date: Data final (YYYY-MM-DD)
 * - status: Filtrar por status
 * - type: Filtrar por tipo de conteúdo (inclui 'meeting' para reuniões)
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

    // Buscar eventos de conteúdo (se não estiver filtrando apenas por meeting)
    let contentQuery = supabase
      .from('content_calendar')
      .select(`
        *,
        client:clients(id, name)
      `)
      .eq('user_id', user.id);

    // Aplicar filtros para conteúdo
    if (clientId) {
      contentQuery = contentQuery.eq('client_id', clientId);
    }
    if (startDate) {
      contentQuery = contentQuery.gte('scheduled_date', startDate);
    }
    if (endDate) {
      contentQuery = contentQuery.lte('scheduled_date', endDate);
    }
    if (status) {
      contentQuery = contentQuery.eq('status', status);
    }
    if (type && type !== 'meeting') {
      contentQuery = contentQuery.eq('type', type);
    }

    // Buscar reuniões (colunas que existem na tabela meetings)
    let meetingsQuery = supabase
      .from('meetings')
      .select(`
        id,
        client_id,
        date,
        time,
        type,
        notes,
        status,
        created_at,
        updated_at,
        client:clients(id, name, contact_name)
      `)
      .eq('user_id', user.id);

    // Aplicar filtros para reuniões
    if (clientId) {
      meetingsQuery = meetingsQuery.eq('client_id', clientId);
    }
    if (startDate) {
      meetingsQuery = meetingsQuery.gte('date', startDate);
    }
    if (endDate) {
      meetingsQuery = meetingsQuery.lte('date', endDate);
    }

    // Se estiver filtrando por tipo específico de conteúdo (não meeting), não buscar reuniões
    const shouldFetchMeetings = !type || type === 'meeting' || type === 'all';
    const shouldFetchContent = !type || type !== 'meeting';

    const [contentResult, meetingsResult] = await Promise.all([
      shouldFetchContent ? contentQuery.order('scheduled_date', { ascending: true }) : Promise.resolve({ data: [], error: null }),
      shouldFetchMeetings ? meetingsQuery.order('date', { ascending: true }) : Promise.resolve({ data: [], error: null })
    ]);

    if (contentResult.error) {
      console.error('[API] GET /api/calendar content error:', contentResult.error);
      return NextResponse.json({ error: 'Erro ao buscar eventos de conteúdo' }, { status: 500 });
    }

    if (meetingsResult.error) {
      console.error('[API] GET /api/calendar meetings error:', meetingsResult.error);
      return NextResponse.json({ error: 'Erro ao buscar reuniões' }, { status: 500 });
    }

    // Combinar e formatar os resultados
    const contentEvents = (contentResult.data || []).map(event => ({
      ...event,
      is_meeting: false
    }));

    interface MeetingData {
      id: string;
      client_id: string;
      date: string;
      time: string;
      type: string;
      notes: string | null;
      status: string;
      created_at: string;
      updated_at: string;
      client: { id: string; name: string; contact_name?: string }[] | { id: string; name: string; contact_name?: string } | null;
    }

    const meetings = (meetingsResult.data || []).map((meeting: MeetingData) => {
      // Supabase pode retornar client como array ou objeto
      const clientData = Array.isArray(meeting.client) ? meeting.client[0] : meeting.client;
      return {
        id: meeting.id,
        user_id: user.id,
        client_id: meeting.client_id,
        title: `Reunião: ${clientData?.name || 'Cliente'}`,
        description: meeting.notes,
        type: 'meeting' as const,
        scheduled_date: meeting.date,
        scheduled_time: meeting.time,
        status: meeting.status === 'scheduled' ? 'planned' :
                meeting.status === 'confirmed' ? 'approved' :
                meeting.status === 'completed' ? 'published' :
                meeting.status === 'cancelled' ? 'cancelled' : 'planned',
        platform: [],
        color: '#22d3ee', // Cor cyan para reuniões
        notes: meeting.notes,
        attachments: [],
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
        client: clientData,
        meeting_type: meeting.type, // online ou presencial
        is_meeting: true
      };
    });

    // Combinar e ordenar por data
    const allEvents = [...contentEvents, ...meetings].sort((a, b) => {
      const dateA = new Date(a.scheduled_date + 'T' + (a.scheduled_time || '00:00'));
      const dateB = new Date(b.scheduled_date + 'T' + (b.scheduled_time || '00:00'));
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json(allEvents);
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
