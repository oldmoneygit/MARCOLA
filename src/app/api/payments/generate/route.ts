/**
 * @file route.ts
 * @description API para gerar cobranças automáticas do mês
 * @module api/payments/generate
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST - Gera cobranças para todos os clientes ativos
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter parâmetros
    const body = await request.json();
    const { month } = body; // formato: YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Mês inválido. Use o formato YYYY-MM' },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split('-').map(Number);

    // Buscar todos os clientes ativos do usuário
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, monthly_value, due_day')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (clientsError) {
      console.error('[API] GET /api/payments/generate clients error:', clientsError);
      return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        message: 'Nenhum cliente ativo encontrado',
        created: 0,
        skipped: 0,
      });
    }

    // Verificar quais clientes já têm pagamento neste mês
    const startDate = `${month}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]; // último dia do mês

    const { data: existingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('client_id')
      .eq('user_id', user.id)
      .gte('due_date', startDate)
      .lte('due_date', endDate);

    if (paymentsError) {
      console.error('[API] GET /api/payments/generate existing error:', paymentsError);
      return NextResponse.json({ error: 'Erro ao verificar pagamentos existentes' }, { status: 500 });
    }

    const existingClientIds = new Set(existingPayments?.map((p) => p.client_id) || []);

    // Filtrar clientes que ainda não têm pagamento
    const clientsToCreate = clients.filter((c) => !existingClientIds.has(c.id));

    if (clientsToCreate.length === 0) {
      return NextResponse.json({
        message: 'Todos os clientes já têm cobranças geradas para este mês',
        created: 0,
        skipped: clients.length,
      });
    }

    // Determinar status baseado na data atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Criar pagamentos em batch
    const paymentsToInsert = clientsToCreate.map((client) => {
      // Calcular data de vencimento
      const dueDate = new Date(year, monthNum - 1, client.due_day);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Determinar status
      const status = dueDate < today ? 'overdue' : 'pending';

      // Obter nome do mês
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
      ];

      return {
        user_id: user.id,
        client_id: client.id,
        amount: client.monthly_value,
        due_date: dueDateStr,
        status,
        description: `Mensalidade ${monthNames[monthNum - 1]}/${year} - ${client.name}`,
      };
    });

    const { data: createdPayments, error: insertError } = await supabase
      .from('payments')
      .insert(paymentsToInsert)
      .select();

    if (insertError) {
      console.error('[API] POST /api/payments/generate insert error:', insertError);
      return NextResponse.json({ error: 'Erro ao criar pagamentos' }, { status: 500 });
    }

    return NextResponse.json({
      message: `${createdPayments?.length || 0} cobranças geradas com sucesso`,
      created: createdPayments?.length || 0,
      skipped: existingClientIds.size,
      payments: createdPayments,
    });
  } catch (err) {
    console.error('[API] POST /api/payments/generate unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
