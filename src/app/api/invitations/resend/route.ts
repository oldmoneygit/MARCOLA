/**
 * @file route.ts
 * @description API Route para reenviar convite
 * @module api/invitations/resend
 */

import { NextResponse } from 'next/server';

import { sendInviteEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

/**
 * POST /api/invitations/resend
 * Reenvia um convite (cria novo token se expirou)
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

    const body = await request.json();
    const { team_member_id } = body;

    if (!team_member_id) {
      return NextResponse.json(
        { error: 'team_member_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o membro existe e pertence ao usuário
    const { data: member, error: memberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', team_member_id)
      .eq('owner_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar se o membro já tem uma conta vinculada
    if (member.user_id) {
      return NextResponse.json(
        { error: 'Este membro já possui uma conta ativa' },
        { status: 400 }
      );
    }

    // Cancelar convites anteriores
    await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('team_member_id', team_member_id)
      .in('status', ['pending', 'expired']);

    // Gerar novo token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invitation_token');

    if (tokenError) {
      console.error('[API] Error generating token:', tokenError);
      return NextResponse.json({ error: 'Erro ao gerar token' }, { status: 500 });
    }

    const token = tokenData;

    // Criar novo convite
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        owner_id: user.id,
        team_member_id: team_member_id,
        email: member.email,
        token: token,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      console.error('[API] POST /api/invitations/resend error:', inviteError);
      return NextResponse.json({ error: 'Erro ao criar convite' }, { status: 500 });
    }

    // Atualizar status do membro
    await supabase
      .from('team_members')
      .update({ invite_status: 'pending' })
      .eq('id', team_member_id);

    // Gerar link do convite
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/invite/${token}`;

    // Buscar nome do owner para incluir no email
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Enviar email de convite
    const emailResult = await sendInviteEmail({
      to: member.email,
      memberName: member.name,
      ownerName: ownerProfile?.full_name || undefined,
      role: member.role,
      inviteLink,
    });

    return NextResponse.json({
      invitation,
      invite_link: inviteLink,
      email_sent: emailResult.success,
      email_error: emailResult.error,
      message: emailResult.success
        ? 'Convite reenviado com sucesso!'
        : 'Convite criado. O email não foi enviado - compartilhe o link manualmente.',
    }, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/invitations/resend unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
