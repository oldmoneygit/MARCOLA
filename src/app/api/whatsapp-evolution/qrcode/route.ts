/**
 * @file route.ts
 * @description API Route para obter QR Code do WhatsApp Evolution
 * @module api/whatsapp-evolution/qrcode
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { obterQRCode } from '@/lib/whatsapp-evolution';

/**
 * GET /api/whatsapp-evolution/qrcode
 * Obtém o QR Code para conexão do WhatsApp
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
      .select('instance_name')
      .eq('gestor_id', user.id)
      .single();

    if (dbError || !instancia) {
      return NextResponse.json(
        { error: 'Instância não encontrada. Crie uma instância primeiro.' },
        { status: 404 }
      );
    }

    // Obter QR Code da Evolution API
    const qrResponse = await obterQRCode(instancia.instance_name);

    return NextResponse.json({
      success: true,
      qrcode: qrResponse.qrcode,
      pairingCode: qrResponse.pairingCode,
      message: qrResponse.message,
    });
  } catch (error) {
    console.error('[whatsapp-evolution/qrcode] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
