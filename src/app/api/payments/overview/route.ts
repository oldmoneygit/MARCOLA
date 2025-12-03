/**
 * @file route.ts
 * @description API route para overview financeiro
 * @module api/payments/overview
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { Payment } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/payments/overview
 * Retorna overview financeiro do mês
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
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Calcula range de datas do mês
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-31`;

    // Busca todos os pagamentos do mês usando due_date
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', startDate)
      .lte('due_date', endDate);

    if (error) {
      console.error('[API] GET /api/payments/overview error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar overview' },
        { status: 500 }
      );
    }

    const paymentsData = (payments || []) as Payment[];

    // Calcula totais
    const overview = {
      totalRevenue: paymentsData.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
      received: paymentsData
        .filter((p: Payment) => p.status === 'paid')
        .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
      pending: paymentsData
        .filter((p: Payment) => p.status === 'pending')
        .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
      overdue: paymentsData
        .filter((p: Payment) => p.status === 'overdue')
        .reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
      clientsPaid: paymentsData.filter((p: Payment) => p.status === 'paid').length,
      clientsPending: paymentsData.filter((p: Payment) => p.status === 'pending').length,
      clientsOverdue: paymentsData.filter((p: Payment) => p.status === 'overdue').length,
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('[API] GET /api/payments/overview unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
