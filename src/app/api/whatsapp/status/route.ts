/**
 * @file route.ts
 * @description API Route para verificar status da conexão WhatsApp
 * @module api/whatsapp/status
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { getZAPIService } from '@/lib/whatsapp/zapi-service';

/**
 * GET /api/whatsapp/status
 * Verifica status da conexão WhatsApp do usuário
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

    // Buscar configurações do usuário
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError) {
      console.error('[WhatsApp Status] Erro ao buscar configurações:', settingsError);
    }

    // Se não tem configurações ou credenciais, retorna desconectado
    if (!settings?.zapi_instance_id || !settings?.zapi_token) {
      return NextResponse.json({
        connected: false,
        configured: false,
        message: 'WhatsApp não configurado',
        settings: null,
      });
    }

    // Verificar status real na Z-API
    const zapiService = await getZAPIService(user.id);

    if (!zapiService) {
      return NextResponse.json({
        connected: false,
        configured: true,
        message: 'Erro ao conectar com Z-API',
        settings: {
          auto_payment_reminder: settings.auto_payment_reminder,
          reminder_days_before: settings.reminder_days_before,
          auto_overdue_notification: settings.auto_overdue_notification,
          auto_task_notification: settings.auto_task_notification,
          send_start_hour: settings.send_start_hour,
          send_end_hour: settings.send_end_hour,
        },
      });
    }

    const status = await zapiService.getStatus();

    // Atualizar status no banco se mudou
    if (settings.is_connected !== status.connected) {
      await supabase
        .from('whatsapp_settings')
        .update({
          is_connected: status.connected,
          connected_at: status.connected ? new Date().toISOString() : null,
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      connected: status.connected,
      smartphoneConnected: status.smartphoneConnected,
      configured: true,
      error: status.error,
      settings: {
        auto_payment_reminder: settings.auto_payment_reminder,
        reminder_days_before: settings.reminder_days_before,
        auto_overdue_notification: settings.auto_overdue_notification,
        auto_task_notification: settings.auto_task_notification,
        send_start_hour: settings.send_start_hour,
        send_end_hour: settings.send_end_hour,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar status';
    console.error('[WhatsApp Status] Erro:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
