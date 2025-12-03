/**
 * @file route.ts
 * @description API Routes para Client Intelligence - geração e listagem
 * @module api/intelligence
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { generateFullIntelligence } from '@/lib/intelligence';

import type { NextRequest } from 'next/server';
import type { Client } from '@/types';

/**
 * GET /api/intelligence
 * Lista a inteligência de um cliente específico
 * Query params: ?client_id=UUID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar inteligência do cliente
    const { data: intelligence, error } = await supabase
      .from('client_intelligence')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[API] GET /api/intelligence error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar inteligência' },
        { status: 500 }
      );
    }

    return NextResponse.json(intelligence);
  } catch (err) {
    console.error('[API] GET /api/intelligence unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intelligence
 * Gera inteligência para um cliente
 * Body: { client_id: string, force?: boolean }
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

    const body = await request.json();
    const { client_id, force = false } = body;

    if (!client_id) {
      return NextResponse.json(
        { error: 'client_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe inteligência gerada
    const { data: existingIntelligence } = await supabase
      .from('client_intelligence')
      .select('id, last_generated_at, generation_count')
      .eq('client_id', client_id)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se já existe e não forçar, retornar a existente
    if (existingIntelligence && !force) {
      return NextResponse.json(
        {
          error: 'Inteligência já existe. Use force=true para regenerar.',
          existing: existingIntelligence,
        },
        { status: 409 }
      );
    }

    // Gerar nova inteligência
    const intelligenceData = await generateFullIntelligence(
      client as Client,
      client.briefing_data
    );

    let result;

    if (existingIntelligence) {
      // Atualizar existente
      const { data, error } = await supabase
        .from('client_intelligence')
        .update({
          ...intelligenceData,
          generation_count: (existingIntelligence.generation_count || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntelligence.id)
        .select()
        .single();

      if (error) {
        console.error('[API] POST /api/intelligence update error:', error);
        return NextResponse.json(
          { error: 'Erro ao atualizar inteligência' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Criar nova
      const { data, error } = await supabase
        .from('client_intelligence')
        .insert({
          client_id,
          user_id: user.id,
          ...intelligenceData,
        })
        .select()
        .single();

      if (error) {
        console.error('[API] POST /api/intelligence insert error:', error);
        return NextResponse.json(
          { error: 'Erro ao salvar inteligência' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(result, { status: existingIntelligence ? 200 : 201 });
  } catch (err) {
    console.error('[API] POST /api/intelligence unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
