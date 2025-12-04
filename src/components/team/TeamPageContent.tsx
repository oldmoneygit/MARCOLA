/**
 * @file TeamPageContent.tsx
 * @description Conteúdo principal da página de gestão de equipe
 * @module components/team
 */

'use client';

import { AlertCircle, CheckCircle, Loader2, Plus, Users, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTeam } from '@/hooks';
import { cn } from '@/lib/utils';

import { TeamMemberCard } from './TeamMemberCard';
import { TeamMemberModal } from './TeamMemberModal';

import type { CreateTeamMemberDTO, TeamMember, TeamRole, UpdateTeamMemberDTO } from '@/types';
import { TEAM_ROLE_CONFIG } from '@/types';

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

type ViewMode = 'all' | TeamRole;

/**
 * Conteúdo principal da página de gestão de equipe
 */
export function TeamPageContent() {
  const {
    members,
    loading,
    error,
    createMember,
    updateMember,
    deleteMember,
    toggleMemberActive,
    fetchMembers,
    activeMembers,
    membersByRole,
    totalMembers,
  } = useTeam();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TeamMember | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /**
   * Exibe uma mensagem toast temporária
   */
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Filtrar membros pelo modo de visualização
  const filteredMembers =
    viewMode === 'all' ? members : membersByRole[viewMode as TeamRole];

  const handleOpenModal = useCallback((member?: TeamMember) => {
    setEditingMember(member || null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingMember(null);
  }, []);

  const handleSubmit = useCallback(
    async (data: CreateTeamMemberDTO | UpdateTeamMemberDTO) => {
      setIsSubmitting(true);
      try {
        if (editingMember) {
          await updateMember(editingMember.id, data);
        } else {
          await createMember(data as CreateTeamMemberDTO);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingMember, createMember, updateMember]
  );

  const handleDelete = useCallback(
    async (member: TeamMember) => {
      if (deleteConfirm?.id === member.id) {
        await deleteMember(member.id);
        setDeleteConfirm(null);
      } else {
        setDeleteConfirm(member);
        // Auto-clear after 3 seconds
        setTimeout(() => setDeleteConfirm(null), 3000);
      }
    },
    [deleteConfirm, deleteMember]
  );

  const handleToggleActive = useCallback(
    async (member: TeamMember) => {
      await toggleMemberActive(member.id);
    },
    [toggleMemberActive]
  );

  /**
   * Envia convite para um membro da equipe
   */
  const handleSendInvite = useCallback(
    async (member: TeamMember): Promise<{ invite_link: string } | null> => {
      try {
        const response = await fetch('/api/invitations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_member_id: member.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao enviar convite');
        }

        const data = await response.json();

        // Atualizar lista de membros para refletir novo status
        await fetchMembers();

        showToast('success', `Convite enviado para ${member.name}`);

        return { invite_link: data.invite_link };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar convite';
        console.error('[TeamPageContent] handleSendInvite error:', err);
        showToast('error', message);
        return null;
      }
    },
    [fetchMembers, showToast]
  );

  /**
   * Reenvia convite para um membro da equipe
   */
  const handleResendInvite = useCallback(
    async (member: TeamMember): Promise<{ invite_link: string } | null> => {
      try {
        const response = await fetch('/api/invitations/resend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_member_id: member.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao reenviar convite');
        }

        const data = await response.json();

        // Atualizar lista de membros para refletir novo status
        await fetchMembers();

        showToast('success', `Convite reenviado para ${member.name}`);

        return { invite_link: data.invite_link };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao reenviar convite';
        console.error('[TeamPageContent] handleResendInvite error:', err);
        showToast('error', message);
        return null;
      }
    },
    [fetchMembers, showToast]
  );

  // Header action button
  const headerActions = (
    <button
      type="button"
      onClick={() => handleOpenModal()}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-medium hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/20"
    >
      <Plus className="w-4 h-4" />
      Novo Membro
    </button>
  );

  if (loading) {
    return (
      <DashboardLayout
        title="Equipe"
        subtitle="Gerencie sua equipe e atribua tarefas"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Equipe"
        subtitle="Gerencie sua equipe e atribua tarefas"
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </GlassCard>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Equipe"
      subtitle={`${totalMembers} ${totalMembers === 1 ? 'membro' : 'membros'} • ${activeMembers.length} ${activeMembers.length === 1 ? 'ativo' : 'ativos'}`}
      headerActions={headerActions}
    >
      <div className="space-y-6">

      {/* Filtros por role */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setViewMode('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            viewMode === 'all'
              ? 'bg-violet-500 text-white'
              : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          )}
        >
          Todos ({members.length})
        </button>
        {(Object.keys(TEAM_ROLE_CONFIG) as TeamRole[]).map((role) => {
          const config = TEAM_ROLE_CONFIG[role];
          const count = membersByRole[role].length;
          return (
            <button
              key={role}
              type="button"
              onClick={() => setViewMode(role)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                viewMode === role
                  ? cn(config.bgColor, config.textColor)
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              )}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de membros */}
      {filteredMembers.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {viewMode === 'all' ? 'Nenhum membro ainda' : 'Nenhum membro nesta função'}
          </h3>
          <p className="text-zinc-400 mb-6">
            {viewMode === 'all'
              ? 'Adicione membros à sua equipe para atribuir tarefas'
              : 'Não há membros com esta função'}
          </p>
          {viewMode === 'all' && (
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Membro
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onSendInvite={handleSendInvite}
              onResendInvite={handleResendInvite}
            />
          ))}
        </div>
      )}

      {/* Confirmação de delete */}
      {deleteConfirm && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-zinc-900 border border-red-500/30 rounded-xl px-4 py-3 shadow-xl flex items-center gap-4">
            <p className="text-sm text-white">
              Clique novamente para confirmar a remoção de{' '}
              <strong>{deleteConfirm.name}</strong>
            </p>
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Toast de notificação */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div
            className={cn(
              'rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 min-w-[280px]',
              toast.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <p
              className={cn(
                'text-sm font-medium',
                toast.type === 'success' ? 'text-emerald-300' : 'text-red-300'
              )}
            >
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-auto text-zinc-500 hover:text-white"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <TeamMemberModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        member={editingMember}
        loading={isSubmitting}
      />
      </div>
    </DashboardLayout>
  );
}
