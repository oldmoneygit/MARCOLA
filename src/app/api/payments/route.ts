/**
 * @file route.ts
 * @description API routes para gerenciamento de pagamentos
 * @module api/payments
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

/**
 * GET /api/payments
 * Lista pagamentos do usuário logado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    let query = supabase
      .from('payments')
      .select(`
        *,
        client:clients(id, name, segment, contact_phone)
      `)
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    // Filtra por mês usando due_date (formato: YYYY-MM)
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = `${year}-${monthNum}-31`;
      query = query.gte('due_date', startDate).lte('due_date', endDate);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('[API] GET /api/payments error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar pagamentos' },
        { status: 500 }
      );
    }

    return NextResponse.json(payments || []);
  } catch (error) {
    console.error('[API] GET /api/payments unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * Cria um novo pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { client_id, amount, due_date, description, payment_method, notes } = body;

    if (!client_id || !amount || !due_date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    // Verifica se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Determina status baseado na data de vencimento
    const todayStr = new Date().toISOString().split('T')[0] || '';
    const status = due_date < todayStr ? 'overdue' : 'pending';

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        client_id,
        amount,
        due_date,
        status,
        description,
        payment_method,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/payments error:', error);
      return NextResponse.json(
        { error: 'Erro ao criar pagamento' },
        { status: 500 }
      );
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/payments unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
