/**
 * @file route.ts
 * @description API para gerenciar templates de texto WhatsApp
 * @module api/whatsapp/text-templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { TextTemplate, CreateTextTemplateDTO } from '@/types/whatsapp';

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

/**
 * Extrai variáveis de um template (formato {variavel})
 */
function extractVariables(template: string): string[] {
  const matches = template.match(/\{(\w+)\}/g) || [];
  const variableSet = new Set(matches.map(m => m.slice(1, -1)));
  return Array.from(variableSet);
}

// ═══════════════════════════════════════════════════════════════
// GET - Listar templates de texto
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
      .from('whatsapp_text_templates')
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
      console.error('[Text Templates] Erro ao buscar:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data as TextTemplate[] });
  } catch (error) {
    console.error('[Text Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Criar template de texto
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const { userId, ...templateData } = body as { userId: string } & CreateTextTemplateDTO;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    if (!templateData.name || !templateData.template) {
      return NextResponse.json(
        { error: 'name e template são obrigatórios' },
        { status: 400 }
      );
    }

    // Extrair variáveis automaticamente se não fornecidas
    const variables = templateData.variables || extractVariables(templateData.template);

    const { data, error } = await supabase
      .from('whatsapp_text_templates')
      .insert({
        user_id: userId,
        name: templateData.name,
        description: templateData.description || null,
        category: templateData.category || 'custom',
        template: templateData.template,
        variables,
        is_ai_generated: templateData.is_ai_generated || false,
        ai_prompt: templateData.ai_prompt || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Text Templates] Erro ao criar:', error);
      return NextResponse.json(
        { error: 'Erro ao criar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data as TextTemplate }, { status: 201 });
  } catch (error) {
    console.error('[Text Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PUT - Atualizar template de texto
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

    // Se atualizou o template, recalcular variáveis
    if (updates.template) {
      updates.variables = extractVariables(updates.template);
    }

    const { data, error } = await supabase
      .from('whatsapp_text_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Text Templates] Erro ao atualizar:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: data as TextTemplate });
  } catch (error) {
    console.error('[Text Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Remover template de texto
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

    const { error } = await supabase
      .from('whatsapp_text_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Text Templates] Erro ao deletar:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Text Templates] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
