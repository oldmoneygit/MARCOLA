/**
 * @file route.ts
 * @description API Route para operações em template de briefing específico
 * @module api/briefings/[id]
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { UpdateBriefingTemplateDTO, CreateBriefingQuestionDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/briefings/[id]
 * Retorna um template de briefing específico com suas perguntas
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: template, error } = await supabase
      .from('briefing_templates')
      .select(`
        *,
        questions:briefing_questions(*)
      `)
      .eq('id', id)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Briefing não encontrado' }, { status: 404 });
    }

    // Ordenar perguntas
    const result = {
      ...template,
      questions: template.questions?.sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      ),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API] GET /api/briefings/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/briefings/[id]
 * Atualiza um template de briefing
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o template pertence ao usuário
    const { data: existingTemplate, error: existingError } = await supabase
      .from('briefing_templates')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (existingError || !existingTemplate) {
      return NextResponse.json({ error: 'Briefing não encontrado' }, { status: 404 });
    }

    if (existingTemplate.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Não é possível editar templates do sistema' },
        { status: 403 }
      );
    }

    const body: UpdateBriefingTemplateDTO & { questions?: CreateBriefingQuestionDTO[] } =
      await request.json();

    // Atualizar template
    const updateData: Record<string, unknown> = {};
    const allowedFields = ['segment', 'name', 'description', 'is_active'];

    for (const field of allowedFields) {
      if (body[field as keyof UpdateBriefingTemplateDTO] !== undefined) {
        updateData[field] = body[field as keyof UpdateBriefingTemplateDTO];
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('briefing_templates')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('[API] PUT /api/briefings/[id] update error:', updateError);
        return NextResponse.json({ error: 'Erro ao atualizar briefing' }, { status: 500 });
      }
    }

    // Se novas perguntas foram enviadas, substituir todas
    if (body.questions !== undefined) {
      // Deletar perguntas existentes
      await supabase.from('briefing_questions').delete().eq('template_id', id);

      // Inserir novas perguntas
      if (body.questions.length > 0) {
        const questionsToInsert = body.questions.map((q, index) => ({
          template_id: id,
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
          console.error('[API] PUT /api/briefings/[id] questions error:', questionsError);
          return NextResponse.json({ error: 'Erro ao atualizar perguntas' }, { status: 500 });
        }
      }
    }

    // Buscar template atualizado
    const { data: updatedTemplate, error: fetchError } = await supabase
      .from('briefing_templates')
      .select(`
        *,
        questions:briefing_questions(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Erro ao buscar briefing atualizado' }, { status: 500 });
    }

    // Ordenar perguntas
    const result = {
      ...updatedTemplate,
      questions: updatedTemplate.questions?.sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      ),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API] PUT /api/briefings/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/briefings/[id]
 * Remove um template de briefing
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o template pertence ao usuário
    const { data: template, error: fetchError } = await supabase
      .from('briefing_templates')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Briefing não encontrado' }, { status: 404 });
    }

    if (template.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Não é possível deletar templates do sistema' },
        { status: 403 }
      );
    }

    // Deletar (cascade deleta as perguntas)
    const { error } = await supabase.from('briefing_templates').delete().eq('id', id);

    if (error) {
      console.error('[API] DELETE /api/briefings/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao deletar briefing' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/briefings/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
