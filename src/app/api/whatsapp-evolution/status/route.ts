/**
 * @file route.ts
 * @description API Route para verificar status do WhatsApp Evolution
 * @module api/whatsapp-evolution/status
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { verificarStatus } from '@/lib/whatsapp-evolution';

/**
 * GET /api/whatsapp-evolution/status
 * Verifica o status de conexão do WhatsApp
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

    // Buscar instância do usuário
    const { data: instancia, error: dbError } = await supabase
      .from('whatsapp_instancias')
      .select('id, instance_name, status')
      .eq('gestor_id', user.id)
      .single();

    if (dbError || !instancia) {
      return NextResponse.json({
        success: true,
        hasInstance: false,
        connected: false,
        message: 'Nenhuma instância encontrada',
      });
    }

    // Verificar status na Evolution API
    const statusResponse = await verificarStatus(instancia.instance_name);

    // Atualizar status no banco se diferente
    const newStatus = statusResponse.connected ? 'connected' : 'disconnected';
    if (instancia.status !== newStatus) {
      await supabase
        .from('whatsapp_instancias')
        .update({
          status: newStatus,
          ...(statusResponse.connected
            ? { connected_at: new Date().toISOString() }
            : { disconnected_at: new Date().toISOString() }),
        })
        .eq('id', instancia.id);
    }

    return NextResponse.json({
      success: true,
      hasInstance: true,
      connected: statusResponse.connected,
      state: statusResponse.state,
      message: statusResponse.connected ? 'WhatsApp conectado' : 'WhatsApp desconectado',
    });
  } catch (error) {
    console.error('[whatsapp-evolution/status] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
