/**
 * @file route.ts
 * @description API Route para listagem de relatórios
 * @module api/reports
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

/**
 * GET /api/reports
 * Lista todos os relatórios do usuário
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

    // Pega query params
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    let query = supabase
      .from('reports')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('[API] GET /api/reports error:', error);
      return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 });
    }

    return NextResponse.json(reports);
  } catch (err) {
    console.error('[API] GET /api/reports unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
