/**
 * @file useTeam.ts
 * @description Hook para gerenciamento de equipe
 * @module hooks
 *
 * @example
 * const { members, loading, createMember, updateMember } = useTeam();
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CreateTeamMemberDTO, TeamMember, TeamRole, UpdateTeamMemberDTO } from '@/types';

interface UseTeamOptions {
  /** Busca automática ao montar */
  autoFetch?: boolean;
  /** Incluir membros inativos */
  includeInactive?: boolean;
}

interface UseTeamState {
  members: TeamMember[];
  loading: boolean;
  error: string | null;
}

interface UseTeamReturn extends UseTeamState {
  /** Busca membros da equipe */
  fetchMembers: () => Promise<void>;
  /** Busca um membro específico */
  getMember: (id: string) => TeamMember | undefined;
  /** Cria um novo membro */
  createMember: (data: CreateTeamMemberDTO) => Promise<TeamMember>;
  /** Atualiza um membro */
  updateMember: (id: string, data: UpdateTeamMemberDTO) => Promise<TeamMember>;
  /** Remove um membro */
  deleteMember: (id: string) => Promise<void>;
  /** Ativa/desativa um membro */
  toggleMemberActive: (id: string) => Promise<TeamMember>;
  /** Membros ativos */
  activeMembers: TeamMember[];
  /** Membros inativos */
  inactiveMembers: TeamMember[];
  /** Membros por role */
  membersByRole: Record<TeamRole, TeamMember[]>;
  /** Total de membros */
  totalMembers: number;
}

/**
 * Hook para gerenciamento de equipe
 */
export function useTeam(options: UseTeamOptions = {}): UseTeamReturn {
  const { autoFetch = true, includeInactive = true } = options;

  const [state, setState] = useState<UseTeamState>({
    members: [],
    loading: true,
    error: null,
  });

  /**
   * Busca membros da equipe
   */
  const fetchMembers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/team');

      if (!response.ok) {
        throw new Error('Erro ao buscar membros da equipe');
      }

      const data = await response.json();
      setState({ members: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar membros';
      console.error('[useTeam] fetchMembers error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  /**
   * Busca um membro específico pelo ID
   */
  const getMember = useCallback(
    (id: string) => {
      return state.members.find((member) => member.id === id);
    },
    [state.members]
  );

  /**
   * Cria um novo membro
   */
  const createMember = useCallback(async (data: CreateTeamMemberDTO): Promise<TeamMember> => {
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar membro');
      }

      const newMember = await response.json();

      setState((prev) => ({
        ...prev,
        members: [...prev.members, newMember],
      }));

      return newMember;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar membro';
      console.error('[useTeam] createMember error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Atualiza um membro
   */
  const updateMember = useCallback(
    async (id: string, data: UpdateTeamMemberDTO): Promise<TeamMember> => {
      try {
        const response = await fetch(`/api/team/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar membro');
        }

        const updatedMember = await response.json();

        setState((prev) => ({
          ...prev,
          members: prev.members.map((m) => (m.id === id ? updatedMember : m)),
        }));

        return updatedMember;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar membro';
        console.error('[useTeam] updateMember error:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Remove um membro
   */
  const deleteMember = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover membro');
      }

      setState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover membro';
      console.error('[useTeam] deleteMember error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Ativa/desativa um membro
   */
  const toggleMemberActive = useCallback(
    async (id: string): Promise<TeamMember> => {
      const member = state.members.find((m) => m.id === id);
      if (!member) {
        throw new Error('Membro não encontrado');
      }
      return updateMember(id, { is_active: !member.is_active });
    },
    [state.members, updateMember]
  );

  // Computed values
  const activeMembers = useMemo(
    () => state.members.filter((m) => m.is_active),
    [state.members]
  );

  const inactiveMembers = useMemo(
    () => state.members.filter((m) => !m.is_active),
    [state.members]
  );

  const membersByRole = useMemo(() => {
    const roles: Record<TeamRole, TeamMember[]> = {
      admin: [],
      manager: [],
      member: [],
      viewer: [],
    };

    const membersToGroup = includeInactive ? state.members : activeMembers;

    membersToGroup.forEach((member) => {
      roles[member.role].push(member);
    });

    return roles;
  }, [state.members, activeMembers, includeInactive]);

  const totalMembers = state.members.length;

  // Fetch inicial
  useEffect(() => {
    if (autoFetch) {
      fetchMembers();
    }
  }, [fetchMembers, autoFetch]);

  return {
    ...state,
    fetchMembers,
    getMember,
    createMember,
    updateMember,
    deleteMember,
    toggleMemberActive,
    activeMembers,
    inactiveMembers,
    membersByRole,
    totalMembers,
  };
}
