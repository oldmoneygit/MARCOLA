/**
 * @file route.ts
 * @description API Route para gerenciamento de credenciais do cliente
 * @module api/clients/[id]/credentials
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { CreateCredentialDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/[id]/credentials
 * Lista todas as credenciais de um cliente
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Busca as credenciais
    const { data: credentials, error: credentialsError } = await supabase
      .from('client_credentials')
      .select('*')
      .eq('client_id', clientId)
      .order('platform', { ascending: true });

    if (credentialsError) {
      console.error('[API] GET /api/clients/[id]/credentials error:', credentialsError);
      return NextResponse.json({ error: 'Erro ao buscar credenciais' }, { status: 500 });
    }

    return NextResponse.json(credentials || []);
  } catch (err) {
    console.error('[API] GET /api/clients/[id]/credentials unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/clients/[id]/credentials
 * Cria uma nova credencial para o cliente
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const body: CreateCredentialDTO = await request.json();

    // Validações
    if (!body.platform?.trim()) {
      return NextResponse.json({ error: 'Plataforma é obrigatória' }, { status: 400 });
    }

    if (!body.login?.trim()) {
      return NextResponse.json({ error: 'Login é obrigatório' }, { status: 400 });
    }

    if (!body.password?.trim()) {
      return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 });
    }

    // Cria a credencial
    const { data: credential, error: insertError } = await supabase
      .from('client_credentials')
      .insert({
        client_id: clientId,
        platform: body.platform.trim(),
        login: body.login.trim(),
        password: body.password,
        url: body.url?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API] POST /api/clients/[id]/credentials error:', insertError);
      return NextResponse.json({ error: 'Erro ao criar credencial' }, { status: 500 });
    }

    return NextResponse.json(credential, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/clients/[id]/credentials unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
