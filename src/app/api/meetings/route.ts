/**
 * @file route.ts
 * @description API Route para gerenciamento de Reuniões
 * @module api/meetings
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { CreateMeetingDTO, MeetingFilters } from '@/types/meetings';

/**
 * GET /api/meetings
 * Lista reuniões com filtros opcionais
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

    // Extrair filtros da URL
    const { searchParams } = new URL(request.url);
    const filters: MeetingFilters = {
      client_id: searchParams.get('client_id') || undefined,
      status: searchParams.get('status') as MeetingFilters['status'] || undefined,
      type: searchParams.get('type') as MeetingFilters['type'] || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      upcoming_only: searchParams.get('upcoming_only') === 'true',
      search: searchParams.get('search') || undefined,
    };

    // Query base
    let query = supabase
      .from('meetings')
      .select(`
        *,
        client:clients(id, name, contact_name, avatar_url)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    // Aplicar filtros
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.start_date) {
      query = query.gte('date', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('date', filters.end_date);
    }

    if (filters.upcoming_only) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('date', today);
      query = query.not('status', 'in', '("cancelled","completed")');
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('[meetings] Erro ao buscar:', error);
      return NextResponse.json({ error: 'Erro ao buscar reuniões' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meetings: meetings || [],
      total: meetings?.length || 0,
    });
  } catch (error) {
    console.error('[meetings] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meetings
 * Cria uma nova reunião
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

    const body: CreateMeetingDTO = await request.json();

    // Validações básicas
    if (!body.title || !body.date || !body.time) {
      return NextResponse.json(
        { error: 'Título, data e horário são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar reunião
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        user_id: user.id,
        client_id: body.client_id || null,
        title: body.title,
        description: body.description || null,
        date: body.date,
        time: body.time,
        duration_minutes: body.duration_minutes || 60,
        type: body.type || 'online',
        priority: body.priority || 'medium',
        location: body.location || null,
        meeting_link: body.meeting_link || null,
        notes: body.notes || null,
        status: 'scheduled',
      })
      .select(`
        *,
        client:clients(id, name, contact_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[meetings] Erro ao criar:', error);
      return NextResponse.json({ error: 'Erro ao criar reunião' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      meeting,
      message: 'Reunião criada com sucesso',
    });
  } catch (error) {
    console.error('[meetings] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
