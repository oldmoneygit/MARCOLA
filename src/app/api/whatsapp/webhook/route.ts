/**
 * @file route.ts
 * @description API Route para receber webhooks da Z-API
 * @module api/whatsapp/webhook
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import type { WebhookEvent } from '@/types/whatsapp';

// Cliente Supabase com service role para webhooks (não requer autenticação)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

/**
 * POST /api/whatsapp/webhook
 * Recebe eventos da Z-API (delivery, receive, status, etc.)
 */
export async function POST(request: Request) {
  try {
    const event: WebhookEvent = await request.json();

    console.log('[Webhook Z-API] Evento recebido:', event.type, event);

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      console.error('[Webhook Z-API] Supabase não configurado');
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case 'Send':
        // Mensagem enviada com sucesso
        if (event.messageId) {
          await supabase
            .from('message_logs')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('zapi_message_id', event.messageId);

          console.log('[Webhook Z-API] Mensagem marcada como enviada:', event.messageId);
        }
        break;

      case 'DeliveryCallback':
        // Mensagem entregue
        if (event.messageId) {
          await supabase
            .from('message_logs')
            .update({
              status: 'delivered',
              delivered_at: new Date().toISOString(),
            })
            .eq('zapi_message_id', event.messageId);

          console.log('[Webhook Z-API] Mensagem marcada como entregue:', event.messageId);
        }
        break;

      case 'Receive':
        // Mensagem recebida (resposta do cliente)
        console.log('[Webhook Z-API] Mensagem recebida de:', event.phone);
        // TODO: Implementar lógica de respostas automáticas se necessário
        // Por enquanto, apenas logamos
        if (event.phone && event.text) {
          // Tentar encontrar o usuário que enviou mensagem para este número
          const { data: lastSentMessage } = await supabase
            .from('message_logs')
            .select('user_id, client_id')
            .eq('phone', event.phone)
            .eq('type', 'sent')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastSentMessage) {
            await supabase.from('message_logs').insert({
              user_id: lastSentMessage.user_id,
              client_id: lastSentMessage.client_id,
              phone: event.phone,
              message: event.text,
              type: 'received',
              status: 'delivered',
              delivered_at: new Date().toISOString(),
            });
          }
        }
        break;

      case 'Connect':
        // WhatsApp conectado
        console.log('[Webhook Z-API] WhatsApp conectado');
        // TODO: Atualizar status na tabela whatsapp_settings se tivermos instanceId
        break;

      case 'Disconnect':
        // WhatsApp desconectado
        console.log('[Webhook Z-API] WhatsApp desconectado');
        // TODO: Atualizar status e notificar usuário
        break;

      case 'Present':
        // Presença no chat (usuário online/offline)
        // Geralmente não precisamos fazer nada com isso
        break;

      default:
        console.log('[Webhook Z-API] Evento não tratado:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook Z-API] Erro ao processar:', error);
    // Retornamos 200 mesmo com erro para evitar que o webhook seja reenviado
    return NextResponse.json({ received: true, error: 'Erro interno' });
  }
}

/**
 * GET /api/whatsapp/webhook
 * Verificação do webhook (usado pelo Z-API para confirmar URL)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'z-api-webhook',
    timestamp: new Date().toISOString(),
  });
}
