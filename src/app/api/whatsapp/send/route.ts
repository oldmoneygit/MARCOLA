/**
 * @file route.ts
 * @description API Route para envio de mensagens WhatsApp via Z-API
 * @module api/whatsapp/send
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getZAPIService } from '@/lib/whatsapp/zapi-service';
import { processTemplate } from '@/lib/whatsapp/message-templates';

import type { MessageTemplateType, SendWhatsAppDTO } from '@/types/whatsapp';

/**
 * POST /api/whatsapp/send
 * Envia mensagem WhatsApp para um número
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: SendWhatsAppDTO = await request.json();
    const { phone, message, templateType, variables, clientId } = body;

    // Validação do telefone
    if (!phone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    // Processar mensagem (template ou custom)
    let finalMessage = message;
    if (templateType && templateType !== 'custom') {
      finalMessage = processTemplate(templateType as MessageTemplateType, variables || {});
    }

    if (!finalMessage || finalMessage.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Obter serviço Z-API (multi-tenant: primeiro tenta do usuário, depois fallback)
    const zapiService = await getZAPIService(user.id);

    if (!zapiService) {
      return NextResponse.json(
        { error: 'WhatsApp não configurado. Vá em Configurações > WhatsApp para conectar.' },
        { status: 400 }
      );
    }

    // Criar log da mensagem antes de enviar
    const { data: log, error: logError } = await supabase
      .from('message_logs')
      .insert({
        user_id: user.id,
        client_id: clientId || null,
        phone,
        message: finalMessage,
        template_type: templateType || null,
        type: 'sent',
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('[WhatsApp API] Erro ao criar log:', logError);
    }

    // Enviar via Z-API
    try {
      const result = await zapiService.sendText({
        phone,
        message: finalMessage,
        delayTyping: 2, // 2 segundos mostrando "digitando..."
      });

      // Atualizar log com sucesso
      if (log) {
        await supabase
          .from('message_logs')
          .update({
            status: 'sent',
            zapi_message_id: result.messageId,
            sent_at: new Date().toISOString(),
          })
          .eq('id', log.id);
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        logId: log?.id,
      });
    } catch (sendError: unknown) {
      const errorMessage = sendError instanceof Error ? sendError.message : 'Erro desconhecido';

      // Atualizar log com erro
      if (log) {
        await supabase
          .from('message_logs')
          .update({
            status: 'failed',
            error: errorMessage,
          })
          .eq('id', log.id);
      }

      console.error('[WhatsApp API] Erro ao enviar:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
    console.error('[WhatsApp API] Erro inesperado:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
