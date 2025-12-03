/**
 * @file route.ts
 * @description API Route para buscar templates de briefing por segmento
 * @module api/briefings/by-segment/[segment]
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ segment: string }>;
}

/**
 * GET /api/briefings/by-segment/[segment]
 * Retorna templates de briefing ativos para um segmento específico
 * Prioriza templates do usuário sobre templates do sistema
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { segment } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decodedSegment = decodeURIComponent(segment);

    // Buscar templates do usuário E do sistema para o segmento
    const { data: templates, error } = await supabase
      .from('briefing_templates')
      .select(`
        *,
        questions:briefing_questions(*)
      `)
      .eq('segment', decodedSegment)
      .eq('is_active', true)
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] GET /api/briefings/by-segment error:', error);
      return NextResponse.json({ error: 'Erro ao buscar briefings' }, { status: 500 });
    }

    // Se não há templates, retornar array vazio
    if (!templates || templates.length === 0) {
      return NextResponse.json([]);
    }

    // Priorizar template do usuário se existir, senão usar do sistema
    const userTemplate = templates.find((t) => t.user_id === user.id);
    const selectedTemplate = userTemplate || templates[0];

    // Ordenar perguntas
    const result = {
      ...selectedTemplate,
      questions: selectedTemplate.questions?.sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      ),
    };

    // Retornar como array para manter consistência
    return NextResponse.json([result]);
  } catch (err) {
    console.error('[API] GET /api/briefings/by-segment unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
