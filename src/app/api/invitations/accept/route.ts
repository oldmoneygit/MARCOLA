/**
 * @file route.ts
 * @description API Route para aceitar convite
 * @module api/invitations/accept
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { AcceptInvitationDTO } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * POST /api/invitations/accept
 * Aceita um convite criando uma conta ou vinculando uma existente
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: AcceptInvitationDTO = await request.json();

    const { token, password, name } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar convite
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team_member:team_members(*)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Convite inválido ou expirado' },
        { status: 404 }
      );
    }

    // Verificar se expirou
    if (new Date(invitation.expires_at) < new Date()) {
      // Atualizar status
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      await supabase
        .from('team_members')
        .update({ invite_status: 'expired' })
        .eq('id', invitation.team_member_id);

      return NextResponse.json(
        { error: 'Este convite expirou' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma conta com este email
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === invitation.email);

    let userId: string;

    if (userExists) {
      // Se já existe, o usuário precisa fazer login normal
      // e podemos vincular depois
      return NextResponse.json(
        {
          error: 'Já existe uma conta com este email. Faça login normalmente.',
          requires_login: true,
          email: invitation.email,
        },
        { status: 400 }
      );
    } else {
      // Criar novo usuário
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            full_name: name || invitation.team_member?.name || invitation.email.split('@')[0],
          },
        },
      });

      if (signUpError || !newUser.user) {
        console.error('[API] Error creating user:', signUpError);
        return NextResponse.json(
          { error: signUpError?.message || 'Erro ao criar conta' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
    }

    // Aceitar convite usando a função do banco
    const { data: result, error: acceptError } = await supabase
      .rpc('accept_team_invitation', {
        p_token: token,
        p_user_id: userId,
      });

    if (acceptError) {
      console.error('[API] Error accepting invitation:', acceptError);
      return NextResponse.json(
        { error: 'Erro ao aceitar convite' },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao aceitar convite' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Convite aceito! Sua conta foi criada com sucesso.',
      member: result.member,
      owner_id: result.owner_id,
    });
  } catch (err) {
    console.error('[API] POST /api/invitations/accept unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
