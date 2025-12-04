/**
 * @file route.ts
 * @description API Route para obter convite pelo token
 * @module api/invitations/[token]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/invitations/[token]
 * Retorna informações de um convite pelo token
 * Rota pública para que o convidado possa ver o convite
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();

    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        owner_id,
        team_member_id,
        email,
        token,
        status,
        expires_at,
        created_at,
        team_member:team_members(id, name, role)
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    // Verificar se expirou
    if (new Date(invitation.expires_at) < new Date()) {
      // Atualizar status para expirado se ainda não foi
      if (invitation.status === 'pending') {
        await supabase
          .from('team_invitations')
          .update({ status: 'expired' })
          .eq('token', token);
      }

      return NextResponse.json({
        ...invitation,
        status: 'expired',
        is_valid: false,
        message: 'Este convite expirou',
      });
    }

    // Verificar se já foi aceito ou cancelado
    if (invitation.status !== 'pending') {
      return NextResponse.json({
        ...invitation,
        is_valid: false,
        message: invitation.status === 'accepted'
          ? 'Este convite já foi utilizado'
          : 'Este convite não está mais disponível',
      });
    }

    return NextResponse.json({
      ...invitation,
      is_valid: true,
    });
  } catch (err) {
    console.error('[API] GET /api/invitations/[token] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/invitations/[token]
 * Cancela um convite (apenas o owner pode cancelar)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar convite
    const { data: invitation, error: fetchError } = await supabase
      .from('team_invitations')
      .select('id, team_member_id, owner_id')
      .eq('token', token)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário é o owner
    if (invitation.owner_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Atualizar status para cancelado
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('token', token);

    if (updateError) {
      console.error('[API] DELETE /api/invitations/[token] error:', updateError);
      return NextResponse.json({ error: 'Erro ao cancelar convite' }, { status: 500 });
    }

    // Atualizar status do membro
    await supabase
      .from('team_members')
      .update({ invite_status: 'not_invited' })
      .eq('id', invitation.team_member_id);

    return NextResponse.json({ success: true, message: 'Convite cancelado' });
  } catch (err) {
    console.error('[API] DELETE /api/invitations/[token] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
