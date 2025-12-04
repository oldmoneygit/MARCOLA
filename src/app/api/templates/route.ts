/**
 * @file route.ts
 * @description API Route para listagem e criação de templates de tarefas
 * @module api/templates
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { CreateTaskTemplateDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/templates
 * Lista todos os templates de tarefas do usuário
 *
 * Query params:
 * - segment: Filtrar por segmento
 * - is_active: Filtrar por status ativo (true/false)
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
    const segment = searchParams.get('segment');
    const isActive = searchParams.get('is_active');

    // Busca templates do usuário E templates do sistema (user_id = null)
    let query = supabase
      .from('task_templates')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`);

    if (segment && segment !== 'all') {
      // Filtra por segmento específico OU templates 'all' (operacionais)
      query = query.in('segment', [segment, 'all']);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: templates, error } = await query.order('order_index', { ascending: true });

    if (error) {
      console.error('[API] GET /api/templates error:', error);
      return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
    }

    return NextResponse.json(templates);
  } catch (err) {
    console.error('[API] GET /api/templates unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/templates
 * Cria um novo template de tarefa
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

    const body: CreateTaskTemplateDTO = await request.json();

    // Validação básica
    if (!body.title || !body.segment) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, segment' },
        { status: 400 }
      );
    }

    // Obter próximo order_index para o segmento
    const { data: lastTemplate } = await supabase
      .from('task_templates')
      .select('order_index')
      .eq('user_id', user.id)
      .eq('segment', body.segment)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (lastTemplate?.order_index || 0) + 1;

    const { data: template, error } = await supabase
      .from('task_templates')
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description || null,
        segment: body.segment,
        priority: body.default_priority || 'medium',
        recurrence: body.is_recurring ? (body.recurrence || 'weekly') : null,
        notify_client: body.send_whatsapp || false,
        notify_message: body.whatsapp_template || null,
        is_active: true,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/templates error:', error);
      return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 });
    }

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/templates unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
