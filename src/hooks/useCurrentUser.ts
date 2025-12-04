/**
 * @file useCurrentUser.ts
 * @description Hook para identificar o tipo de usuário atual (owner ou team member)
 * @module hooks
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

import type { TeamMember, TeamPermissions } from '@/types';

/** Tipo de usuário no sistema */
export type UserType = 'owner' | 'team_member' | 'unknown';

/** Dados do usuário atual */
export interface CurrentUserData {
  /** ID do usuário autenticado */
  userId: string;
  /** Email do usuário */
  email: string;
  /** Nome do usuário */
  name: string;
  /** Tipo do usuário */
  userType: UserType;
  /** Se é dono da conta (owner) */
  isOwner: boolean;
  /** Se é membro de equipe */
  isTeamMember: boolean;
  /** ID do owner (se for team member) */
  ownerId: string | null;
  /** Dados do team member (se for team member) */
  teamMember: TeamMember | null;
  /** Permissões do usuário */
  permissions: TeamPermissions;
}

interface UseCurrentUserState {
  data: CurrentUserData | null;
  loading: boolean;
  error: string | null;
}

/** Permissões completas (para owners) */
const FULL_PERMISSIONS: TeamPermissions = {
  can_view_clients: true,
  can_edit_clients: true,
  can_view_reports: true,
  can_edit_reports: true,
  can_view_financial: true,
  can_manage_tasks: true,
  can_assign_tasks: true,
};

/**
 * Hook para identificar e carregar dados do usuário atual
 * Diferencia entre owner (dono da conta) e team member (membro convidado)
 */
export function useCurrentUser() {
  const [state, setState] = useState<UseCurrentUserState>({
    data: null,
    loading: true,
    error: null,
  });

  const loadCurrentUser = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) {
        setState({ data: null, loading: false, error: 'Cliente Supabase não disponível' });
        return;
      }

      // Buscar usuário autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setState({ data: null, loading: false, error: null });
        return;
      }

      // Verificar se é um team member (alguém que aceitou um convite)
      // Nota: maybeSingle() retorna null se não encontrar, sem erro
      const { data: teamMemberData, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teamError) {
        console.error('[useCurrentUser] Error checking team member:', teamError);
      }

      if (teamMemberData) {
        // Usuário é um team member
        const teamMember = teamMemberData as TeamMember;
        const currentUser: CurrentUserData = {
          userId: user.id,
          email: user.email || '',
          name: teamMember.name,
          userType: 'team_member',
          isOwner: false,
          isTeamMember: true,
          ownerId: teamMember.owner_id,
          teamMember: teamMember,
          permissions: teamMember.permissions as TeamPermissions,
        };

        setState({ data: currentUser, loading: false, error: null });
      } else {
        // Usuário é owner (não é team member de ninguém)
        const userName = user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] ||
                        'Usuário';

        const currentUser: CurrentUserData = {
          userId: user.id,
          email: user.email || '',
          name: userName,
          userType: 'owner',
          isOwner: true,
          isTeamMember: false,
          ownerId: null,
          teamMember: null,
          permissions: FULL_PERMISSIONS,
        };

        setState({ data: currentUser, loading: false, error: null });
      }
    } catch (err) {
      console.error('[useCurrentUser] Unexpected error:', err);
      setState({ data: null, loading: false, error: 'Erro ao carregar dados do usuário' });
    }
  }, []);

  // Carregar ao montar e escutar mudanças de auth
  useEffect(() => {
    loadCurrentUser();

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCurrentUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCurrentUser]);

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = useCallback((permission: keyof TeamPermissions): boolean => {
    if (!state.data) {
      return false;
    }
    return state.data.permissions[permission] === true;
  }, [state.data]);

  /**
   * Verifica se o usuário pode acessar uma rota específica
   */
  const canAccessRoute = useCallback((routeId: string): boolean => {
    if (!state.data) {
      return false;
    }

    // Owners podem acessar tudo
    if (state.data.isOwner) {
      return true;
    }

    // Team members têm acesso baseado em permissões
    const permissions = state.data.permissions;

    switch (routeId) {
      case 'dashboard':
        // Dashboard é sempre acessível
        return true;
      case 'clients':
        return permissions.can_view_clients;
      case 'tasks':
        return permissions.can_manage_tasks;
      case 'calendar':
        return permissions.can_manage_tasks;
      case 'reports':
        return permissions.can_view_reports;
      case 'analysis':
        return permissions.can_view_reports;
      case 'templates':
        return permissions.can_manage_tasks;
      case 'team':
        // Apenas owners podem gerenciar equipe
        return false;
      case 'financial':
        return permissions.can_view_financial;
      default:
        return true;
    }
  }, [state.data]);

  return {
    ...state,
    hasPermission,
    canAccessRoute,
    refresh: loadCurrentUser,
  };
}
