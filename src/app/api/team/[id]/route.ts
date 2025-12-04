/**
 * @file route.ts
 * @description API Route para operações em membro específico da equipe
 * @module api/team/[id]
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { UpdateTeamMemberDTO } from '@/types';
import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/team/[id]
 * Busca um membro específico da equipe
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: member, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (err) {
    console.error('[API] GET /api/team/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/team/[id]
 * Atualiza um membro da equipe
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: UpdateTeamMemberDTO = await request.json();

    // Verificar se o membro pertence ao usuário
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, permissions')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (!existingMember) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // Construir objeto de atualização
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }
    if (body.email !== undefined) {
      updateData.email = body.email;
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone;
    }
    if (body.avatar_url !== undefined) {
      updateData.avatar_url = body.avatar_url;
    }
    if (body.role !== undefined) {
      updateData.role = body.role;
    }
    if (body.specialties !== undefined) {
      updateData.specialties = body.specialties;
    }
    if (body.color !== undefined) {
      updateData.color = body.color;
    }
    if (body.permissions !== undefined) {
      // Merge permissões existentes com novas
      updateData.permissions = {
        ...existingMember.permissions,
        ...body.permissions,
      };
    }
    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    const { data: member, error } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[API] PATCH /api/team/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
    }

    return NextResponse.json(member);
  } catch (err) {
    console.error('[API] PATCH /api/team/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/team/[id]
 * Remove um membro da equipe
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o membro pertence ao usuário
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (!existingMember) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // Remover atribuições de tarefas deste membro (set null)
    await supabase
      .from('tasks')
      .update({ assigned_to: null })
      .eq('assigned_to', id);

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

    if (error) {
      console.error('[API] DELETE /api/team/[id] error:', error);
      return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] DELETE /api/team/[id] unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
