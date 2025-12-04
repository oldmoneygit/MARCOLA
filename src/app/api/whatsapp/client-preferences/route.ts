/**
 * @file route.ts
 * @description API para gerenciar preferências de WhatsApp por cliente
 * @module api/whatsapp/client-preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase não configurado');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// ═══════════════════════════════════════════════════════════════
// GET - Buscar preferências de um cliente
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get('clientId');
    const userId = searchParams.get('userId');

    if (!clientId || !userId) {
      return NextResponse.json(
        { error: 'clientId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('client_whatsapp_preferences')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (não é erro)
      console.error('[Preferences] Erro ao buscar:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar preferências' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      preferences: data || null,
    });
  } catch (error) {
    console.error('[Preferences] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Criar ou atualizar preferências
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { clientId, userId, defaultTextTemplate, defaultAudioTemplateId } = body;

    if (!clientId || !userId) {
      return NextResponse.json(
        { error: 'clientId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Upsert - inserir ou atualizar
    const { data, error } = await supabase
      .from('client_whatsapp_preferences')
      .upsert(
        {
          client_id: clientId,
          user_id: userId,
          default_text_template: defaultTextTemplate || null,
          default_audio_template_id: defaultAudioTemplateId || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'client_id,user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Preferences] Erro ao salvar:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar preferências' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: data,
    });
  } catch (error) {
    console.error('[Preferences] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Remover preferências
// ═══════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get('clientId');
    const userId = searchParams.get('userId');

    if (!clientId || !userId) {
      return NextResponse.json(
        { error: 'clientId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('client_whatsapp_preferences')
      .delete()
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Preferences] Erro ao deletar:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar preferências' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Preferences] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
