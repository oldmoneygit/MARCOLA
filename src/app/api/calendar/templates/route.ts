/**
 * @file route.ts
 * @description API Route para templates de calendário de conteúdo
 * @module api/calendar/templates
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { CreateCalendarTemplateDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/calendar/templates
 * Lista todos os templates de calendário do usuário
 *
 * Query params:
 * - is_active: Filtrar por status ativo (true/false)
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
    const isActive = searchParams.get('is_active');
    const type = searchParams.get('type');

    let query = supabase.from('calendar_templates').select('*').eq('user_id', user.id);

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[API] GET /api/calendar/templates error:', error);
      return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
    }

    return NextResponse.json(templates);
  } catch (err) {
    console.error('[API] GET /api/calendar/templates unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/calendar/templates
 * Cria um novo template de calendário
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

    const body: CreateCalendarTemplateDTO = await request.json();

    // Validação básica
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, type' },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from('calendar_templates')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description || null,
        type: body.type,
        platform: body.platform || [],
        color: body.color || null,
        recurrence: body.recurrence || null,
        day_of_week: body.day_of_week ?? null,
        day_of_month: body.day_of_month ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/calendar/templates error:', error);
      return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 });
    }

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/calendar/templates unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
