/**
 * @file route.ts
 * @description API Route para upload e gerenciamento de avatar do cliente
 * @module api/clients/[id]/avatar
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';

import type { BrandColors } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clients/[id]/avatar
 * Faz upload do avatar do cliente e salva as cores extraídas
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, avatar_url')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Obter FormData com a imagem e cores
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const colorsJson = formData.get('colors') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido. Use JPEG, PNG, WebP ou GIF.' },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    // Deletar avatar anterior se existir
    if (client.avatar_url) {
      const oldPath = client.avatar_url.split('/').pop();
      if (oldPath) {
        await supabase.storage.from('client-avatars').remove([`${clientId}/${oldPath}`]);
      }
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;

    // Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from('client-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[API] Upload error:', uploadError);
      return NextResponse.json({ error: 'Erro ao fazer upload da imagem' }, { status: 500 });
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('client-avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Parsear cores (se fornecidas)
    let brandColors: BrandColors | null = null;
    if (colorsJson) {
      try {
        brandColors = JSON.parse(colorsJson);
      } catch {
        // Ignorar se não conseguir parsear
      }
    }

    // Atualizar cliente com novo avatar e cores
    const updateData: Record<string, unknown> = {
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    if (brandColors) {
      updateData.brand_colors = brandColors;
    }

    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Update error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      brand_colors: brandColors,
      client: updatedClient,
    });
  } catch (err) {
    console.error('[API] POST /api/clients/[id]/avatar error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]/avatar
 * Remove o avatar do cliente
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o cliente pertence ao usuário
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, avatar_url')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Deletar do Storage se existir
    if (client.avatar_url) {
      // Extrair path do arquivo da URL
      const urlParts = client.avatar_url.split('/client-avatars/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('client-avatars').remove([filePath]);
      }
    }

    // Limpar campos no banco
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        avatar_url: null,
        brand_colors: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('[API] Update error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/clients/[id]/avatar error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
