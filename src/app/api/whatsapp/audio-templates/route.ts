/**
 * @file route.ts
 * @description API para gerenciar templates de áudio WhatsApp
 * @module api/whatsapp/audio-templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AudioTemplate, CreateAudioTemplateDTO } from '@/types/whatsapp';

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
// GET - Listar templates de áudio
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('whatsapp_audio_templates')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('order_index', { ascending: true })
      .order('usage_count', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Audio Templates] Erro ao buscar:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data as AudioTemplate[] });
  } catch (error) {
    console.error('[Audio Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Criar template de áudio
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { userId, ...templateData } = body as { userId: string } & CreateAudioTemplateDTO;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    if (!templateData.name || !templateData.audio_url || !templateData.audio_path) {
      return NextResponse.json(
        { error: 'name, audio_url e audio_path são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('whatsapp_audio_templates')
      .insert({
        user_id: userId,
        name: templateData.name,
        description: templateData.description || null,
        category: templateData.category || 'custom',
        audio_url: templateData.audio_url,
        audio_path: templateData.audio_path,
        duration_seconds: templateData.duration_seconds || null,
        file_size_bytes: templateData.file_size_bytes || null,
        mime_type: templateData.mime_type || 'audio/webm',
        transcription: templateData.transcription || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Audio Templates] Erro ao criar:', error);
      return NextResponse.json(
        { error: 'Erro ao criar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data as AudioTemplate }, { status: 201 });
  } catch (error) {
    console.error('[Audio Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT - Atualizar template de áudio
// ═══════════════════════════════════════════════════════════════

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { id, userId, ...updates } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('whatsapp_audio_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Audio Templates] Erro ao atualizar:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data as AudioTemplate });
  } catch (error) {
    console.error('[Audio Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Remover template de áudio
// ═══════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar template para deletar o arquivo do storage
    const { data: template } = await supabase
      .from('whatsapp_audio_templates')
      .select('audio_path')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (template?.audio_path) {
      // Deletar arquivo do storage
      await supabase.storage
        .from('whatsapp-audio')
        .remove([template.audio_path]);
    }

    // Deletar registro
    const { error } = await supabase
      .from('whatsapp_audio_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Audio Templates] Erro ao deletar:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Audio Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
