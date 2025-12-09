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
 * Cria uma nova instância WhatsApp para o usuário ou retorna QR Code da existente
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

    console.log('[whatsapp-evolution/instancia] POST - Usuário:', user.id);

    // Verificar se já existe instância
    const { data: existingInstancia } = await supabase
      .from('whatsapp_instancias')
      .select('id, instance_name, status')
      .eq('gestor_id', user.id)
      .single();

    if (existingInstancia) {
      console.log('[whatsapp-evolution/instancia] Instância existente:', existingInstancia.instance_name);

      // PRIMEIRO: Verificar se já está conectado
      try {
        const statusResponse = await verificarStatus(existingInstancia.instance_name);
        console.log('[whatsapp-evolution/instancia] Status atual:', statusResponse);

        if (statusResponse.connected) {
          // Já conectado - atualizar banco e retornar
          await supabase
            .from('whatsapp_instancias')
            .update({
              status: 'connected',
              connected_at: new Date().toISOString(),
            })
            .eq('id', existingInstancia.id);

          return NextResponse.json({
            success: true,
            instanceName: existingInstancia.instance_name,
            connected: true,
            message: 'WhatsApp já está conectado',
          });
        }
      } catch (statusErr) {
        console.warn('[whatsapp-evolution/instancia] Erro ao verificar status:', statusErr);
        // Continuar tentando obter QR Code mesmo se status falhar
      }

      // NÃO conectado - Tentar obter QR Code
      try {
        const qrResponse = await obterQRCode(existingInstancia.instance_name);
        console.log('[whatsapp-evolution/instancia] QR Code obtido para instância existente');

        return NextResponse.json({
          success: true,
          instanceName: existingInstancia.instance_name,
          qrcode: qrResponse.qrcode,
          pairingCode: qrResponse.pairingCode,
          message: 'QR Code gerado para instância existente',
        });
      } catch (qrErr) {
        console.error('[whatsapp-evolution/instancia] Erro ao obter QR Code:', qrErr);

        // QR Code falhou - tentar recriar a instância na Evolution API
        console.log('[whatsapp-evolution/instancia] Tentando recriar instância na Evolution API...');
        try {
          const evolutionResponse = await criarInstanciaWhatsApp(existingInstancia.instance_name);
          console.log('[whatsapp-evolution/instancia] Instância recriada:', {
            success: evolutionResponse.success,
            hasQrcode: !!evolutionResponse.qrcode,
          });

          if (evolutionResponse.qrcode) {
            return NextResponse.json({
              success: true,
              instanceName: existingInstancia.instance_name,
              qrcode: evolutionResponse.qrcode,
              pairingCode: evolutionResponse.pairingCode,
              message: 'Instância recriada com sucesso',
            });
          }
        } catch (recreateErr) {
          console.error('[whatsapp-evolution/instancia] Erro ao recriar:', recreateErr);
        }

        // Se tudo falhar, retornar erro
        return NextResponse.json(
          { error: 'Não foi possível obter QR Code. Tente novamente.' },
          { status: 500 }
        );
      }
    }

    // Não existe instância - criar nova
    console.log('[whatsapp-evolution/instancia] Criando nova instância...');
    const instanceName = gerarNomeInstancia(user.id);

    // Criar instância na Evolution API
    const evolutionResponse = await criarInstanciaWhatsApp(instanceName);
    console.log('[whatsapp-evolution/instancia] Resposta Evolution:', {
      success: evolutionResponse.success,
      hasQrcode: !!evolutionResponse.qrcode,
    });

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

    console.log('[whatsapp-evolution/instancia] Nova instância salva:', instanceName);

    return NextResponse.json({
      success: true,
      instancia: mapDbInstanciaToTs(newInstancia),
      instanceName,
      qrcode: evolutionResponse.qrcode,
      pairingCode: evolutionResponse.pairingCode,
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
