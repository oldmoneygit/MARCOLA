/**
 * @file route.ts
 * @description API routes para gerenciamento de pagamento individual
 * @module api/payments/[id]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/payments/[id]
 * Busca um pagamento específico
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:clients(id, name, segment, contact_phone)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[API] GET /api/payments/[id] unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/[id]
 * Atualiza um pagamento
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verifica se o pagamento existe e pertence ao usuário
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('id, status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { amount, due_date, notes, status, paid_date } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (amount !== undefined) {
      updateData.amount = amount;
    }
    if (due_date !== undefined) {
      updateData.due_date = due_date;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (paid_date !== undefined) {
      updateData.paid_date = paid_date;
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('[API] PUT /api/payments/[id] error:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar pagamento' },
        { status: 500 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[API] PUT /api/payments/[id] unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payments/[id]
 * Marca pagamento como pago
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verifica se o pagamento existe e pertence ao usuário
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingPayment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { paid_date, notes } = body;

    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_date: paid_date || new Date().toISOString().split('T')[0],
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('[API] PATCH /api/payments/[id] error:', error);
      return NextResponse.json(
        { error: 'Erro ao marcar pagamento como pago' },
        { status: 500 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('[API] PATCH /api/payments/[id] unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments/[id]
 * Remove um pagamento
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[API] DELETE /api/payments/[id] error:', error);
      return NextResponse.json(
        { error: 'Erro ao remover pagamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/payments/[id] unexpected error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
