/**
 * @file route.ts
 * @description API Route para listagem e criação de clientes
 * @module api/clients
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { CreateClientDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * GET /api/clients
 * Lista todos os clientes do usuário autenticado
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] GET /api/clients error:', error);
      return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }

    return NextResponse.json(clients);
  } catch (err) {
    console.error('[API] GET /api/clients unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/clients
 * Cria um novo cliente
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

    const body: CreateClientDTO = await request.json();

    // Validação básica
    if (!body.name || !body.segment || !body.monthly_value || !body.due_day) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, segment, monthly_value, due_day' },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: body.name,
        segment: body.segment,
        status: 'active',
        // Financeiro
        monthly_value: body.monthly_value,
        due_day: body.due_day,
        average_ticket: body.average_ticket || null,
        // Localização
        city: body.city || null,
        // Contato
        contact_name: body.contact_name || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        // Redes sociais
        instagram_url: body.instagram_url || null,
        facebook_page_id: body.facebook_page_id || null,
        // Links e recursos
        ads_account_url: body.ads_account_url || null,
        website_url: body.website_url || null,
        drive_url: body.drive_url || null,
        menu_url: body.menu_url || null,
        assets_links: body.assets_links || null,
        // Estratégia
        peak_hours: body.peak_hours || null,
        differentials: body.differentials || null,
        ideal_customer: body.ideal_customer || null,
        goals_short_term: body.goals_short_term || null,
        goals_long_term: body.goals_long_term || null,
        // Gestão e produção
        meeting_frequency: body.meeting_frequency || null,
        image_authorization: body.image_authorization ?? null,
        content_request: body.content_request || null,
        // Observações
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/clients error:', error);
      return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
    }

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/clients unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
