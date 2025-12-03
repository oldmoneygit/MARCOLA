/**
 * @file route.ts
 * @description API Route para operações em credencial específica
 * @module api/clients/[id]/credentials/[credentialId]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { UpdateCredentialDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string; credentialId: string }>;
}

/**
 * GET /api/clients/[id]/credentials/[credentialId]
 * Busca uma credencial específica
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId, credentialId } = await params;
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

    // Busca a credencial
    const { data: credential, error: credentialError } = await supabase
      .from('client_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('client_id', clientId)
      .single();

    if (credentialError || !credential) {
      return NextResponse.json({ error: 'Credencial não encontrada' }, { status: 404 });
    }

    return NextResponse.json(credential);
  } catch (err) {
    console.error('[API] GET /api/clients/[id]/credentials/[credentialId] error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/clients/[id]/credentials/[credentialId]
 * Atualiza uma credencial específica
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId, credentialId } = await params;
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

    const body: UpdateCredentialDTO = await request.json();

    // Prepara dados para atualização
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.platform !== undefined) {
      updateData.platform = body.platform.trim();
    }

    if (body.login !== undefined) {
      updateData.login = body.login.trim();
    }

    if (body.password !== undefined) {
      updateData.password = body.password;
    }

    if (body.url !== undefined) {
      updateData.url = body.url?.trim() || null;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }

    // Atualiza a credencial
    const { data: credential, error: updateError } = await supabase
      .from('client_credentials')
      .update(updateData)
      .eq('id', credentialId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] PUT /api/clients/[id]/credentials/[credentialId] error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar credencial' }, { status: 500 });
    }

    if (!credential) {
      return NextResponse.json({ error: 'Credencial não encontrada' }, { status: 404 });
    }

    return NextResponse.json(credential);
  } catch (err) {
    console.error('[API] PUT /api/clients/[id]/credentials/[credentialId] error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]/credentials/[credentialId]
 * Remove uma credencial específica
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId, credentialId } = await params;
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

    // Remove a credencial
    const { error: deleteError } = await supabase
      .from('client_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('client_id', clientId);

    if (deleteError) {
      console.error('[API] DELETE /api/clients/[id]/credentials/[credentialId] error:', deleteError);
      return NextResponse.json({ error: 'Erro ao excluir credencial' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/clients/[id]/credentials/[credentialId] error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
