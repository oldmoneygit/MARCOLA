/**
 * @file route.ts
 * @description API para processar callbacks de ações sugeridas do MARCOLA Assistant
 * @module app/api/assistant/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getZAPIService } from '@/lib/whatsapp';

interface CallbackResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * POST /api/assistant/callback
 * Processa callbacks de ações sugeridas
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<CallbackResponse>(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { callbackId, context } = body as {
      callbackId: string;
      context?: Record<string, unknown>;
    };

    if (!callbackId) {
      return NextResponse.json<CallbackResponse>(
        { success: false, error: 'callbackId é obrigatório' },
        { status: 400 }
      );
    }

    // Processar diferentes tipos de callback
    if (callbackId.startsWith('notify-meeting-')) {
      return await handleNotifyMeeting(supabase, callbackId, user.id);
    }

    if (callbackId.startsWith('payment-reminder-')) {
      return await handlePaymentReminder(supabase, callbackId, user.id);
    }

    if (callbackId.startsWith('send-generated-')) {
      return await handleSendGenerated(supabase, callbackId, context, user.id);
    }

    if (callbackId === 'copy-to-clipboard') {
      // Este é tratado no cliente
      return NextResponse.json<CallbackResponse>({
        success: true,
        message: 'Texto copiado!'
      });
    }

    return NextResponse.json<CallbackResponse>(
      { success: false, error: `Callback não reconhecido: ${callbackId}` },
      { status: 400 }
    );

  } catch (error) {
    console.error('[/api/assistant/callback] Erro:', error);
    return NextResponse.json<CallbackResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * Processa callback de notificação de reunião
 */
async function handleNotifyMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  callbackId: string,
  userId: string
): Promise<NextResponse<CallbackResponse>> {
  const meetingId = callbackId.replace('notify-meeting-', '');

  if (!meetingId) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'ID da reunião não fornecido' },
      { status: 400 }
    );
  }

  // Buscar dados da reunião
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select(`
      *,
      client:clients!client_id(id, name, contact_phone)
    `)
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single();

  if (meetingError || !meeting) {
    console.error('[handleNotifyMeeting] Erro ao buscar reunião:', meetingError);
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'Reunião não encontrada' },
      { status: 404 }
    );
  }

  const client = meeting.client as { id: string; name: string; contact_phone?: string } | null;

  if (!client) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'Cliente não encontrado para esta reunião' },
      { status: 404 }
    );
  }

  const phone = client.contact_phone;

  if (!phone) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: `Cliente ${client.name} não possui telefone cadastrado` },
      { status: 400 }
    );
  }

  // Formatar data e hora da reunião
  const meetingDate = new Date(meeting.date);
  const formattedDate = meetingDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const formattedTime = meeting.time?.substring(0, 5) || '(horário a definir)';

  // Gerar mensagem de notificação
  const meetingType = meeting.type === 'presencial' ? 'presencial' : 'online';
  const message = `Olá ${client.name}! 👋

Gostaria de confirmar nossa reunião *${meetingType}* agendada para *${formattedDate}* às *${formattedTime}*.

${meeting.notes ? `*Observações:* ${meeting.notes}\n` : ''}Podemos confirmar? Aguardo seu retorno! 😊`;

  // Tentar enviar via Z-API
  try {
    const zapiService = await getZAPIService(userId);
    if (zapiService) {
      const result = await zapiService.sendText({ phone, message });
      if (result.messageId) {
        return NextResponse.json<CallbackResponse>({
          success: true,
          message: `Mensagem enviada para ${client.name} via WhatsApp!`,
          data: { messageId: result.messageId }
        });
      }
    }
  } catch (error) {
    console.error('[handleNotifyMeeting] Erro Z-API:', error);
    // Continuar para fallback com link
  }

  // Fallback: gerar link do WhatsApp
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  return NextResponse.json<CallbackResponse>({
    success: true,
    message: `Clique para enviar mensagem para ${client.name}`,
    data: {
      whatsappUrl,
      clientName: client.name,
      generatedMessage: message
    }
  });
}

/**
 * Processa callback de lembrete de pagamento
 */
async function handlePaymentReminder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  callbackId: string,
  userId: string
): Promise<NextResponse<CallbackResponse>> {
  const paymentId = callbackId.replace('payment-reminder-', '');

  if (!paymentId) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'ID do pagamento não fornecido' },
      { status: 400 }
    );
  }

  // Buscar dados do pagamento
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select(`
      *,
      client:clients(id, name, contact_phone)
    `)
    .eq('id', paymentId)
    .eq('user_id', userId)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'Pagamento não encontrado' },
      { status: 404 }
    );
  }

  const client = payment.client as { id: string; name: string; contact_phone?: string } | null;

  if (!client) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'Cliente não encontrado para este pagamento' },
      { status: 404 }
    );
  }

  const phone = client.contact_phone;

  if (!phone) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: `Cliente ${client.name} não possui telefone cadastrado` },
      { status: 400 }
    );
  }

  // Formatar valor e data
  const amount = Number(payment.amount).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  const dueDate = payment.due_date
    ? new Date(payment.due_date).toLocaleDateString('pt-BR')
    : 'em aberto';

  // Gerar mensagem de lembrete
  const message = `Olá ${client.name}! 👋

Este é um lembrete amigável sobre o pagamento de *${amount}* com vencimento em *${dueDate}*.

${payment.description ? `*Referente a:* ${payment.description}\n` : ''}
Qualquer dúvida, estou à disposição! 😊`;

  // Tentar enviar via Z-API
  try {
    const zapiService = await getZAPIService(userId);
    if (zapiService) {
      const result = await zapiService.sendText({ phone, message });
      if (result.messageId) {
        return NextResponse.json<CallbackResponse>({
          success: true,
          message: `Lembrete enviado para ${client.name} via WhatsApp!`,
          data: { messageId: result.messageId }
        });
      }
    }
  } catch (error) {
    console.error('[handlePaymentReminder] Erro Z-API:', error);
  }

  // Fallback: gerar link do WhatsApp
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  return NextResponse.json<CallbackResponse>({
    success: true,
    message: `Clique para enviar lembrete para ${client.name}`,
    data: {
      whatsappUrl,
      clientName: client.name,
      generatedMessage: message
    }
  });
}

/**
 * Processa callback de envio de mensagem gerada
 */
async function handleSendGenerated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  callbackId: string,
  context: Record<string, unknown> | undefined,
  userId: string
): Promise<NextResponse<CallbackResponse>> {
  const clientId = callbackId.replace('send-generated-', '');

  if (!clientId || !context?.message) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'Dados insuficientes para enviar mensagem' },
      { status: 400 }
    );
  }

  // Buscar dados do cliente
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, contact_phone')
    .eq('id', clientId)
    .eq('user_id', userId)
    .single();

  if (clientError || !client) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: 'Cliente não encontrado' },
      { status: 404 }
    );
  }

  const phone = client.contact_phone;

  if (!phone) {
    return NextResponse.json<CallbackResponse>(
      { success: false, error: `Cliente ${client.name} não possui telefone cadastrado` },
      { status: 400 }
    );
  }

  const message = String(context.message);

  // Tentar enviar via Z-API
  try {
    const zapiService = await getZAPIService(userId);
    if (zapiService) {
      const result = await zapiService.sendText({ phone, message });
      if (result.messageId) {
        return NextResponse.json<CallbackResponse>({
          success: true,
          message: `Mensagem enviada para ${client.name} via WhatsApp!`,
          data: { messageId: result.messageId }
        });
      }
    }
  } catch (error) {
    console.error('[handleSendGenerated] Erro Z-API:', error);
  }

  // Fallback: gerar link do WhatsApp
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  return NextResponse.json<CallbackResponse>({
    success: true,
    message: `Clique para enviar mensagem para ${client.name}`,
    data: {
      whatsappUrl,
      clientName: client.name
    }
  });
}
