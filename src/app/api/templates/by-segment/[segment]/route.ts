/**
 * @file route.ts
 * @description API Route para buscar templates por segmento
 * @module api/templates/by-segment/[segment]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ segment: string }>;
}

/**
 * GET /api/templates/by-segment/[segment]
 * Retorna todos os templates ativos para um segmento específico
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

    // Decodificar o segmento (pode vir URL-encoded)
    const decodedSegment = decodeURIComponent(segment);

    const { data: templates, error } = await supabase
      .from('task_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('segment', decodedSegment)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('[API] GET /api/templates/by-segment/[segment] error:', error);
      return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
    }

    return NextResponse.json(templates);
  } catch (err) {
    console.error('[API] GET /api/templates/by-segment/[segment] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
