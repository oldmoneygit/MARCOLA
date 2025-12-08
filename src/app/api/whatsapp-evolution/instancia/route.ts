/**
 * @file route.ts
 * @description API Route para gerenciamento de instância WhatsApp Evolution
 * @module api/whatsapp-evolution/instancia
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import {
  criarInstanciaWhatsApp,
  obterQRCode,
  verificarStatus,
  desconectarWhatsApp,
  gerarNomeInstancia,
  mapDbInstanciaToTs,
} from '@/lib/whatsapp-evolution';

/**
 * GET /api/whatsapp-evolution/instancia
 * Obtém a instância WhatsApp do usuário logado
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
      .select('*')
      .eq('gestor_id', user.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('[whatsapp-evolution/instancia] Erro:', dbError);
      return NextResponse.json({ error: 'Erro ao buscar instância' }, { status: 500 });
    }

    if (!instancia) {
      return NextResponse.json({
        success: true,
        instancia: null,
        message: 'Nenhuma instância encontrada',
      });
    }

    // Verificar status atual na Evolution API
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

      instancia.status = newStatus;
    }

    return NextResponse.json({
      success: true,
      instancia: mapDbInstanciaToTs(instancia),
      connected: statusResponse.connected,
    });
  } catch (error) {
    console.error('[whatsapp-evolution/instancia] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp-evolution/instancia
 * Cria uma nova instância WhatsApp para o usuário
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se já existe instância
    const { data: existingInstancia } = await supabase
      .from('whatsapp_instancias')
      .select('id, instance_name')
      .eq('gestor_id', user.id)
      .single();

    if (existingInstancia) {
      // Retornar instância existente com QR Code
      const qrResponse = await obterQRCode(existingInstancia.instance_name);

      return NextResponse.json({
        success: true,
        instanceName: existingInstancia.instance_name,
        qrcode: qrResponse.qrcode,
        pairingCode: qrResponse.pairingCode,
        message: 'Instância já existe',
      });
    }

    // Gerar nome único para instância
    const instanceName = gerarNomeInstancia(user.id);

    // Criar instância na Evolution API
    const evolutionResponse = await criarInstanciaWhatsApp(instanceName);

    if (!evolutionResponse.success) {
      return NextResponse.json(
        { error: evolutionResponse.message || 'Erro ao criar instância' },
        { status: 500 }
      );
    }

    // Salvar no banco de dados
    const { data: newInstancia, error: insertError } = await supabase
      .from('whatsapp_instancias')
      .insert({
        gestor_id: user.id,
        instance_name: instanceName,
        status: 'disconnected',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[whatsapp-evolution/instancia] Erro ao salvar:', insertError);
      return NextResponse.json({ error: 'Erro ao salvar instância' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      instancia: mapDbInstanciaToTs(newInstancia),
      instanceName,
      qrcode: evolutionResponse.qrcode,
      message: 'Instância criada com sucesso',
    });
  } catch (error) {
    console.error('[whatsapp-evolution/instancia] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/whatsapp-evolution/instancia
 * Desconecta e remove a instância WhatsApp do usuário
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

    // Buscar instância do usuário
    const { data: instancia, error: dbError } = await supabase
      .from('whatsapp_instancias')
      .select('id, instance_name')
      .eq('gestor_id', user.id)
      .single();

    if (dbError || !instancia) {
      return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
    }

    // Desconectar na Evolution API
    await desconectarWhatsApp(instancia.instance_name);

    // Atualizar status no banco
    await supabase
      .from('whatsapp_instancias')
      .update({
        status: 'disconnected',
        disconnected_at: new Date().toISOString(),
      })
      .eq('id', instancia.id);

    return NextResponse.json({
      success: true,
      message: 'Instância desconectada com sucesso',
    });
  } catch (error) {
    console.error('[whatsapp-evolution/instancia] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
