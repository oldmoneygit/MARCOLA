/**
 * @file route.ts
 * @description API Route para histórico de mensagens WhatsApp
 * @module api/whatsapp/history
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/whatsapp/history
 * Retorna histórico de mensagens do usuário
 *
 * Query params:
 * - clientId: Filtrar por cliente específico
 * - limit: Quantidade máxima de registros (default: 50)
 * - offset: Paginação (default: 0)
 * - status: Filtrar por status (pending, sent, delivered, read, failed)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Query base
    let query = supabase
      .from('message_logs')
      .select(
        `
        *,
        client:clients(id, name, contact_name)
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros opcionais
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[WhatsApp History] Erro ao buscar histórico:', error);
      throw error;
    }

    return NextResponse.json({
      messages: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar histórico';
    console.error('[WhatsApp History] Erro:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
