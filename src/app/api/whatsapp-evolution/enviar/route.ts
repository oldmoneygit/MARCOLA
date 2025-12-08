/**
 * @file route.ts
 * @description API Route para enviar mensagem via WhatsApp Evolution
 * @module api/whatsapp-evolution/enviar
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { enviarMensagemParaLead, verificarStatus } from '@/lib/whatsapp-evolution';

interface EnviarMensagemBody {
  numero: string;
  mensagem: string;
  leadId?: string;
}

/**
 * POST /api/whatsapp-evolution/enviar
 * Envia uma mensagem via WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: EnviarMensagemBody = await request.json();

    if (!body.numero || !body.mensagem) {
      return NextResponse.json(
        { error: 'Número e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar instância do usuário
    const { data: instancia, error: dbError } = await supabase
      .from('whatsapp_instancias')
      .select('id, instance_name, status')
      .eq('gestor_id', user.id)
      .single();

    if (dbError || !instancia) {
      return NextResponse.json(
        { error: 'WhatsApp não configurado. Configure sua conexão primeiro.' },
        { status: 404 }
      );
    }

    // Verificar se está conectado
    const statusResponse = await verificarStatus(instancia.instance_name);

    if (!statusResponse.connected) {
      return NextResponse.json(
        { error: 'WhatsApp desconectado. Reconecte para enviar mensagens.' },
        { status: 400 }
      );
    }

    // Enviar mensagem
    const sendResponse = await enviarMensagemParaLead(
      instancia.instance_name,
      body.numero,
      body.mensagem
    );

    // Registrar mensagem no banco
    const { error: insertError } = await supabase.from('whatsapp_mensagens').insert({
      instancia_id: instancia.id,
      lead_id: body.leadId || null,
      numero_destino: body.numero,
      mensagem: body.mensagem,
      message_id: sendResponse.messageId,
      status: sendResponse.success ? 'sent' : 'failed',
      erro: sendResponse.success ? null : sendResponse.message,
    });

    if (insertError) {
      console.error('[whatsapp-evolution/enviar] Erro ao registrar:', insertError);
    }

    if (!sendResponse.success) {
      return NextResponse.json(
        { error: sendResponse.message || 'Erro ao enviar mensagem' },
        { status: 500 }
      );
    }

    // Se tem leadId, atualizar status do lead para CONTATADO
    if (body.leadId) {
      await supabase
        .from('leads_prospectados')
        .update({
          status: 'CONTATADO',
          data_contato: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.leadId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      messageId: sendResponse.messageId,
      numero: body.numero,
      message: 'Mensagem enviada com sucesso',
    });
  } catch (error) {
    console.error('[whatsapp-evolution/enviar] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
