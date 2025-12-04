/**
 * @file route.ts
 * @description API Route para listagem e criação de membros da equipe
 * @module api/team
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { CreateTeamMemberDTO, TeamRole } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * Permissões padrão por role
 */
const ROLE_PERMISSIONS: Record<TeamRole, Record<string, boolean>> = {
  admin: {
    can_view_clients: true,
    can_edit_clients: true,
    can_view_reports: true,
    can_edit_reports: true,
    can_view_financial: true,
    can_manage_tasks: true,
    can_assign_tasks: true,
  },
  manager: {
    can_view_clients: true,
    can_edit_clients: true,
    can_view_reports: true,
    can_edit_reports: true,
    can_view_financial: true,
    can_manage_tasks: true,
    can_assign_tasks: true,
  },
  member: {
    can_view_clients: true,
    can_edit_clients: false,
    can_view_reports: true,
    can_edit_reports: false,
    can_view_financial: false,
    can_manage_tasks: true,
    can_assign_tasks: false,
  },
  viewer: {
    can_view_clients: true,
    can_edit_clients: false,
    can_view_reports: true,
    can_edit_reports: false,
    can_view_financial: false,
    can_manage_tasks: false,
    can_assign_tasks: false,
  },
};

/**
 * GET /api/team
 * Lista todos os membros da equipe do usuário autenticado
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

    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[API] GET /api/team error:', error);
      return NextResponse.json({ error: 'Erro ao buscar membros da equipe' }, { status: 500 });
    }

    return NextResponse.json(members);
  } catch (err) {
    console.error('[API] GET /api/team unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/team
 * Cria um novo membro da equipe
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

    const body: CreateTeamMemberDTO = await request.json();

    // Validação básica
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email' },
        { status: 400 }
      );
    }

    // Verificar se já existe membro com mesmo email
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('owner_id', user.id)
      .eq('email', body.email)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'Já existe um membro com este email' },
        { status: 400 }
      );
    }

    const role = body.role || 'member';
    const defaultPermissions = ROLE_PERMISSIONS[role];

    const { data: member, error } = await supabase
      .from('team_members')
      .insert({
        owner_id: user.id,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        avatar_url: body.avatar_url || null,
        role: role,
        specialties: body.specialties || [],
        color: body.color || '#8b5cf6',
        permissions: body.permissions
          ? { ...defaultPermissions, ...body.permissions }
          : defaultPermissions,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/team error:', error);
      return NextResponse.json({ error: 'Erro ao criar membro da equipe' }, { status: 500 });
    }

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/team unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
