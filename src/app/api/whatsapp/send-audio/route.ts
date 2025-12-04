/**
 * @file route.ts
 * @description API para enviar áudio via WhatsApp Z-API
 * @module api/whatsapp/send-audio
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getZAPIService } from '@/lib/whatsapp';
import type { SendWhatsAppAudioDTO, SendWhatsAppAudioResponse } from '@/types/whatsapp';

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
// POST - Enviar áudio via WhatsApp
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse<SendWhatsAppAudioResponse>> {
  try {
    const body = await request.json();
    const {
      phone,
      audioUrl,
      clientId,
      templateId,
      tempAudioId,
      userId
    } = body as SendWhatsAppAudioDTO & { userId?: string };

    // Validações
    if (!phone || !audioUrl) {
      return NextResponse.json(
        { success: false, error: 'phone e audioUrl são obrigatórios' },
        { status: 400 }
      );
    }

    // Obter serviço Z-API
    const zapiService = await getZAPIService(userId);

    if (!zapiService) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp não configurado' },
        { status: 400 }
      );
    }

    console.log(`🎙️ [Send Audio] Enviando para ${phone}`);
    console.log(`🎙️ [Send Audio] URL: ${audioUrl}`);

    // Enviar áudio via Z-API
    const result = await zapiService.sendAudio({
      phone,
      audio: audioUrl,
    });

    // Criar log da mensagem no banco
    const supabase = getSupabaseAdmin();

    const logData = {
      user_id: userId || null,
      client_id: clientId || null,
      phone,
      message: '[ÁUDIO]',
      message_type: 'audio',
      type: 'sent',
      status: 'sent',
      zapi_message_id: result.messageId,
      audio_url: audioUrl,
      audio_template_id: templateId || null,
      sent_at: new Date().toISOString(),
    };

    const { data: logEntry, error: logError } = await supabase
      .from('message_logs')
      .insert(logData)
      .select()
      .single();

    if (logError) {
      console.error('[Send Audio] Erro ao criar log:', logError);
      // Não falha - mensagem foi enviada
    }

    // Se usou template de áudio, incrementar contador
    if (templateId) {
      await supabase.rpc('increment_audio_template_usage', { template_id: templateId });
    }

    // Se usou áudio temporário, atualizar status
    if (tempAudioId) {
      await supabase
        .from('whatsapp_temp_audio')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          message_log_id: logEntry?.id || null,
        })
        .eq('id', tempAudioId);
    }

    console.log(`✅ [Send Audio] Áudio enviado: ${result.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      logId: logEntry?.id,
    });
  } catch (error) {
    console.error('[Send Audio] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar áudio';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
