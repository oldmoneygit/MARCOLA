/**
 * @file route.ts
 * @description API Route para regenerar inteligência de cliente
 * @module api/intelligence/[clientId]/regenerate
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { generateFullIntelligence } from '@/lib/intelligence';

import type { NextRequest } from 'next/server';
import type { Client } from '@/types';

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

/**
 * POST /api/intelligence/[clientId]/regenerate
 * Regenera a inteligência de um cliente (força nova geração)
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar dados do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar inteligência existente para incrementar contador
    const { data: existingIntelligence } = await supabase
      .from('client_intelligence')
      .select('id, generation_count')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .maybeSingle();

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
        console.error('[API] POST /api/intelligence/[clientId]/regenerate update error:', error);
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
          client_id: clientId,
          user_id: user.id,
          ...intelligenceData,
        })
        .select()
        .single();

      if (error) {
        console.error('[API] POST /api/intelligence/[clientId]/regenerate insert error:', error);
        return NextResponse.json(
          { error: 'Erro ao salvar inteligência' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[API] POST /api/intelligence/[clientId]/regenerate unexpected error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
