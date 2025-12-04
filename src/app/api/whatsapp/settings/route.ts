/**
 * @file route.ts
 * @description API Route para gerenciar configurações de WhatsApp (Multi-tenant)
 * @module api/whatsapp/settings
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { ZAPIService } from '@/lib/whatsapp/zapi-service';

/**
 * GET /api/whatsapp/settings
 * Busca configurações de WhatsApp do usuário
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[WhatsApp Settings] Erro ao buscar:', error);
      throw error;
    }

    // Não retornar tokens completos por segurança
    if (data) {
      return NextResponse.json({
        ...data,
        zapi_token: data.zapi_token ? '••••••' + data.zapi_token.slice(-4) : null,
        zapi_client_token: data.zapi_client_token ? '••••••' : null,
      });
    }

    return NextResponse.json(null);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar configurações';
    console.error('[WhatsApp Settings] Erro:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * POST /api/whatsapp/settings
 * Salva credenciais Z-API do usuário
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

    const body = await request.json();
    const { instanceId, token, clientToken } = body;

    if (!instanceId || !token) {
      return NextResponse.json(
        { error: 'Instance ID e Token são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar credenciais fazendo uma chamada de teste
    const testService = new ZAPIService({
      instanceId,
      token,
      clientToken,
    });

    const status = await testService.getStatus();

    // Se não conectou e tem erro, retorna o erro
    if (!status.connected && status.error) {
      return NextResponse.json(
        {
          error: 'Credenciais inválidas ou WhatsApp desconectado',
          details: status.error,
        },
        { status: 400 }
      );
    }

    // Salvar/Atualizar credenciais
    const { data, error } = await supabase
      .from('whatsapp_settings')
      .upsert(
        {
          user_id: user.id,
          zapi_instance_id: instanceId,
          zapi_token: token,
          zapi_client_token: clientToken || null,
          is_connected: status.connected,
          credentials_validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[WhatsApp Settings] Erro ao salvar:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      connected: status.connected,
      smartphoneConnected: status.smartphoneConnected,
      settingsId: data?.id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar credenciais';
    console.error('[WhatsApp Settings] Erro:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH /api/whatsapp/settings
 * Atualiza configurações de notificação (sem alterar credenciais)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      auto_payment_reminder,
      reminder_days_before,
      auto_overdue_notification,
      auto_task_notification,
      send_start_hour,
      send_end_hour,
    } = body;

    // Montar objeto de atualização apenas com campos fornecidos
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof auto_payment_reminder === 'boolean') {
      updateData.auto_payment_reminder = auto_payment_reminder;
    }
    if (typeof reminder_days_before === 'number') {
      updateData.reminder_days_before = reminder_days_before;
    }
    if (typeof auto_overdue_notification === 'boolean') {
      updateData.auto_overdue_notification = auto_overdue_notification;
    }
    if (typeof auto_task_notification === 'boolean') {
      updateData.auto_task_notification = auto_task_notification;
    }
    if (typeof send_start_hour === 'number') {
      updateData.send_start_hour = send_start_hour;
    }
    if (typeof send_end_hour === 'number') {
      updateData.send_end_hour = send_end_hour;
    }

    const { data, error } = await supabase
      .from('whatsapp_settings')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[WhatsApp Settings] Erro ao atualizar:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar configurações';
    console.error('[WhatsApp Settings] Erro:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/whatsapp/settings
 * Remove credenciais Z-API do usuário
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('whatsapp_settings')
      .update({
        zapi_instance_id: null,
        zapi_token: null,
        zapi_client_token: null,
        is_connected: false,
        connected_at: null,
        credentials_validated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('[WhatsApp Settings] Erro ao remover:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao remover credenciais';
    console.error('[WhatsApp Settings] Erro:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
