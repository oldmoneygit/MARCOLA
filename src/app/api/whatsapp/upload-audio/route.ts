/**
 * @file route.ts
 * @description API para upload de áudio para WhatsApp (Supabase Storage)
 * @module api/whatsapp/upload-audio
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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
 * Normaliza o MIME type removendo parâmetros como codecs
 * Ex: "audio/webm;codecs=opus" -> "audio/webm"
 */
function normalizeMimeType(mimeType: string): string {
  // Remove tudo após o ponto-e-vírgula (parâmetros como codecs)
  const parts = mimeType.split(';');
  const baseMimeType = (parts[0] || 'audio/webm').trim().toLowerCase();

  // Mapeia MIME types conhecidos
  const mimeTypeMap: Record<string, string> = {
    'audio/webm': 'audio/webm',
    'audio/mp3': 'audio/mpeg',
    'audio/mpeg': 'audio/mpeg',
    'audio/ogg': 'audio/ogg',
    'audio/wav': 'audio/wav',
    'audio/wave': 'audio/wav',
    'audio/x-wav': 'audio/wav',
    'audio/m4a': 'audio/mp4',
    'audio/mp4': 'audio/mp4',
    'audio/aac': 'audio/aac',
  };

  return mimeTypeMap[baseMimeType] || 'audio/webm';
}

/**
 * Obtém extensão do arquivo baseado no MIME type
 */
function getExtension(mimeType: string): string {
  const normalizedMime = normalizeMimeType(mimeType);
  const extensions: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
  };
  return extensions[normalizedMime] || 'webm';
}

// ═══════════════════════════════════════════════════════════════
// POST - Upload de áudio
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const formData = await request.formData();

    const userId = formData.get('userId') as string;
    const clientId = formData.get('clientId') as string | null;
    const audioFile = formData.get('audio') as Blob | null;
    const audioBase64 = formData.get('audioBase64') as string | null;
    const mimeType = (formData.get('mimeType') as string) || 'audio/webm';
    const duration = formData.get('duration') as string | null;
    const saveAsTemplate = formData.get('saveAsTemplate') === 'true';
    const templateName = formData.get('templateName') as string | null;
    const templateCategory = (formData.get('templateCategory') as string) || 'custom';

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    if (!audioFile && !audioBase64) {
      return NextResponse.json(
        { error: 'audio ou audioBase64 é obrigatório' },
        { status: 400 }
      );
    }

    // Preparar buffer do áudio
    let audioBuffer: Buffer;
    let fileSize: number;

    if (audioFile) {
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
      fileSize = audioBuffer.length;
    } else if (audioBase64) {
      // Remover prefixo data URL se existir
      const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
      audioBuffer = Buffer.from(base64Data, 'base64');
      fileSize = audioBuffer.length;
    } else {
      return NextResponse.json(
        { error: 'Falha ao processar áudio' },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileId = randomUUID();
    const normalizedMime = normalizeMimeType(mimeType);
    const extension = getExtension(mimeType);
    const filePath = `${userId}/${fileId}.${extension}`;

    console.log(`🎙️ [Upload] Fazendo upload: ${filePath} (${fileSize} bytes, ${normalizedMime})`);

    // Upload para o Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('whatsapp-audio')
      .upload(filePath, audioBuffer, {
        contentType: normalizedMime,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload] Erro no upload:', uploadError);
      return NextResponse.json(
        { error: `Erro no upload: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('whatsapp-audio')
      .getPublicUrl(filePath);

    const audioUrl = urlData.publicUrl;
    const durationSeconds = duration ? parseInt(duration, 10) : null;

    console.log(`✅ [Upload] Áudio salvo: ${audioUrl}`);

    // Se for para salvar como template
    if (saveAsTemplate && templateName) {
      const { data: template, error: templateError } = await supabase
        .from('whatsapp_audio_templates')
        .insert({
          user_id: userId,
          name: templateName,
          category: templateCategory,
          audio_url: audioUrl,
          audio_path: filePath,
          duration_seconds: durationSeconds,
          file_size_bytes: fileSize,
          mime_type: normalizedMime,
          is_active: true,
        })
        .select()
        .single();

      if (templateError) {
        console.error('[Upload] Erro ao criar template:', templateError);
        // Não falha - áudio foi salvo, apenas o template não foi criado
      } else {
        console.log(`✅ [Upload] Template criado: ${template.id}`);
        return NextResponse.json({
          success: true,
          audioUrl,
          audioPath: filePath,
          fileSize,
          duration: durationSeconds,
          template,
        });
      }
    }

    // Criar registro de áudio temporário
    const { data: tempAudio, error: tempError } = await supabase
      .from('whatsapp_temp_audio')
      .insert({
        user_id: userId,
        client_id: clientId || null,
        audio_url: audioUrl,
        audio_path: filePath,
        duration_seconds: durationSeconds,
        file_size_bytes: fileSize,
        mime_type: normalizedMime,
        save_as_template: saveAsTemplate,
        template_name: templateName || null,
      })
      .select()
      .single();

    if (tempError) {
      console.error('[Upload] Erro ao criar registro temporário:', tempError);
      // Não falha - áudio foi salvo
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      audioPath: filePath,
      fileSize,
      duration: durationSeconds,
      tempAudioId: tempAudio?.id || null,
    });
  } catch (error) {
    console.error('[Upload] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Remover áudio temporário
// ═══════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const tempAudioId = searchParams.get('tempAudioId');
    const audioPath = searchParams.get('audioPath');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Se tem ID do temp audio, buscar o path
    let pathToDelete = audioPath;

    if (tempAudioId) {
      const { data: tempAudio } = await supabase
        .from('whatsapp_temp_audio')
        .select('audio_path')
        .eq('id', tempAudioId)
        .eq('user_id', userId)
        .single();

      if (tempAudio) {
        pathToDelete = tempAudio.audio_path;
      }

      // Atualizar status para deletado
      await supabase
        .from('whatsapp_temp_audio')
        .update({ status: 'deleted' })
        .eq('id', tempAudioId)
        .eq('user_id', userId);
    }

    // Deletar do storage se tiver o path
    if (pathToDelete) {
      const { error: deleteError } = await supabase.storage
        .from('whatsapp-audio')
        .remove([pathToDelete]);

      if (deleteError) {
        console.error('[Upload] Erro ao deletar do storage:', deleteError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Upload] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
