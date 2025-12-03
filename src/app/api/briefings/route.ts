/**
 * @file route.ts
 * @description API Route para templates de briefing
 * @module api/briefings
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { CreateBriefingTemplateDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/briefings
 * Lista todos os templates de briefing do usuário
 *
 * Query params:
 * - segment: Filtrar por segmento
 * - is_active: Filtrar por status ativo
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

    // Busca templates do usuário + templates do sistema (user_id = null)
    let query = supabase
      .from('briefing_templates')
      .select(`
        *,
        questions:briefing_questions(*)
      `)
      .or(`user_id.eq.${user.id},user_id.is.null`);

    if (segment) {
      query = query.eq('segment', segment);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[API] GET /api/briefings error:', error);
      return NextResponse.json({ error: 'Erro ao buscar briefings' }, { status: 500 });
    }

    // Ordenar as perguntas de cada template
    const templatesWithOrderedQuestions = templates?.map((t) => ({
      ...t,
      questions: t.questions?.sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      ),
    }));

    return NextResponse.json(templatesWithOrderedQuestions);
  } catch (err) {
    console.error('[API] GET /api/briefings unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/briefings
 * Cria um novo template de briefing com suas perguntas
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

    const body: CreateBriefingTemplateDTO = await request.json();

    // Validação
    if (!body.name || !body.segment) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, segment' },
        { status: 400 }
      );
    }

    // Criar template
    const { data: template, error: templateError } = await supabase
      .from('briefing_templates')
      .insert({
        user_id: user.id,
        segment: body.segment,
        name: body.name,
        description: body.description || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (templateError) {
      console.error('[API] POST /api/briefings template error:', templateError);
      return NextResponse.json({ error: 'Erro ao criar briefing' }, { status: 500 });
    }

    // Criar perguntas se fornecidas
    if (body.questions && body.questions.length > 0) {
      const questionsToInsert = body.questions.map((q, index) => ({
        template_id: template.id,
        question: q.question,
        field_type: q.field_type || 'text',
        options: q.options || null,
        placeholder: q.placeholder || null,
        is_required: q.is_required ?? false,
        order_index: q.order_index ?? index,
      }));

      const { error: questionsError } = await supabase
        .from('briefing_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        // Rollback: deletar template
        await supabase.from('briefing_templates').delete().eq('id', template.id);
        console.error('[API] POST /api/briefings questions error:', questionsError);
        return NextResponse.json({ error: 'Erro ao criar perguntas' }, { status: 500 });
      }
    }

    // Buscar template completo com perguntas
    const { data: fullTemplate, error: fetchError } = await supabase
      .from('briefing_templates')
      .select(`
        *,
        questions:briefing_questions(*)
      `)
      .eq('id', template.id)
      .single();

    if (fetchError) {
      return NextResponse.json(template, { status: 201 });
    }

    // Ordenar perguntas
    const result = {
      ...fullTemplate,
      questions: fullTemplate.questions?.sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      ),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/briefings unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
