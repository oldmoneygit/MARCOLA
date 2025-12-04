/**
 * @file TeamMemberCard.tsx
 * @description Card para exibição de informações do membro da equipe
 * @module components/team
 */

'use client';

import {
  Check,
  Clock,
  Copy,
  Edit2,
  Mail,
  MoreVertical,
  Phone,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

import { TeamMemberAvatar } from './TeamMemberAvatar';

import type { TeamMember } from '@/types';
import { TEAM_ROLE_CONFIG } from '@/types';

interface TeamMemberCardProps {
  /** Dados do membro */
  member: TeamMember;
  /** Callback ao clicar em editar */
  onEdit?: (member: TeamMember) => void;
  /** Callback ao clicar em remover */
  onDelete?: (member: TeamMember) => void;
  /** Callback ao alternar status ativo */
  onToggleActive?: (member: TeamMember) => void;
  /** Callback ao enviar convite */
  onSendInvite?: (member: TeamMember) => Promise<{ invite_link: string } | null>;
  /** Callback ao reenviar convite */
  onResendInvite?: (member: TeamMember) => Promise<{ invite_link: string } | null>;
  /** Se está em modo compacto */
  compact?: boolean;
}

/**
 * Card de membro da equipe
 */
export function TeamMemberCard({
  member,
  onEdit,
  onDelete,
  onToggleActive,
  onSendInvite,
  onResendInvite,
  compact = false,
}: TeamMemberCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const roleConfig = TEAM_ROLE_CONFIG[member.role];

  const handleSendInvite = useCallback(async () => {
    if (!onSendInvite || isSendingInvite) {
      return;
    }

    setIsSendingInvite(true);
    try {
      const result = await onSendInvite(member);
      if (result?.invite_link) {
        setInviteLink(result.invite_link);
      }
    } finally {
      setIsSendingInvite(false);
      setShowMenu(false);
    }
  }, [member, onSendInvite, isSendingInvite]);

  const handleResendInvite = useCallback(async () => {
    if (!onResendInvite || isSendingInvite) {
      return;
    }

    setIsSendingInvite(true);
    try {
      const result = await onResendInvite(member);
      if (result?.invite_link) {
        setInviteLink(result.invite_link);
      }
    } finally {
      setIsSendingInvite(false);
      setShowMenu(false);
    }
  }, [member, onResendInvite, isSendingInvite]);

  const copyInviteLink = useCallback(async () => {
    if (!inviteLink) {
      return;
    }
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteLink]);

  const canSendInvite = member.invite_status === 'not_invited' && !member.user_id;
  const canResendInvite = (member.invite_status === 'pending' || member.invite_status === 'expired') && !member.user_id;
  const hasActiveAccount = member.invite_status === 'accepted' || member.user_id;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
        <TeamMemberAvatar
          name={member.name}
          avatarUrl={member.avatar_url}
          color={member.color}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{member.name}</p>
          <p className="text-xs text-zinc-500 truncate">{member.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Invite status indicator */}
          {hasActiveAccount ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
              <Check className="w-3 h-3" />
              Ativo
            </span>
          ) : member.invite_status === 'pending' ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
              <Clock className="w-3 h-3" />
              Pendente
            </span>
          ) : null}
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              roleConfig.bgColor,
              roleConfig.textColor
            )}
          >
            {roleConfig.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <GlassCard hover className="relative">
      {/* Menu de ações */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              {/* Menu */}
              <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 rounded-lg bg-zinc-900 border border-white/10 shadow-xl">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(member);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                )}

                {/* Send invite */}
                {canSendInvite && onSendInvite && (
                  <button
                    type="button"
                    onClick={handleSendInvite}
                    disabled={isSendingInvite}
                    className="w-full px-3 py-2 text-left text-sm text-violet-400 hover:bg-white/5 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSendingInvite ? 'Enviando...' : 'Enviar Convite'}
                  </button>
                )}

                {/* Resend invite */}
                {canResendInvite && onResendInvite && (
                  <button
                    type="button"
                    onClick={handleResendInvite}
                    disabled={isSendingInvite}
                    className="w-full px-3 py-2 text-left text-sm text-amber-400 hover:bg-white/5 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSendingInvite ? 'Reenviando...' : 'Reenviar Convite'}
                  </button>
                )}

                {onToggleActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onToggleActive(member);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    {member.is_active ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Ativar
                      </>
                    )}
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(member);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Indicador de inativo */}
      {!member.is_active && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-0">
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-sm font-medium">
            Inativo
          </span>
        </div>
      )}

      {/* Conteúdo */}
      <div className={cn('flex flex-col items-center text-center', !member.is_active && 'opacity-50')}>
        <TeamMemberAvatar
          name={member.name}
          avatarUrl={member.avatar_url}
          color={member.color}
          size="xl"
        />

        <h3 className="mt-4 text-lg font-semibold text-white">{member.name}</h3>

        {/* Role badge */}
        <span
          className={cn(
            'mt-2 px-3 py-1 rounded-full text-xs font-medium',
            roleConfig.bgColor,
            roleConfig.textColor
          )}
        >
          {roleConfig.label}
        </span>

        {/* Invite status badge */}
        <div className="mt-2">
          {hasActiveAccount ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              Conta ativa
            </span>
          ) : member.invite_status === 'pending' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              Convite pendente
            </span>
          ) : member.invite_status === 'expired' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
              <XCircle className="w-3.5 h-3.5" />
              Convite expirado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-500/20 text-zinc-400 text-xs font-medium">
              Sem acesso
            </span>
          )}
        </div>

        {/* Invite link (if just sent) */}
        {inviteLink && (
          <div className="mt-3 w-full p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
            <p className="text-xs text-violet-300 mb-2">Link do convite gerado:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-2 py-1 text-xs rounded bg-black/30 border border-white/10 text-zinc-300 truncate"
              />
              <button
                type="button"
                onClick={copyInviteLink}
                className="p-1.5 rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors"
                title="Copiar link"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Envie este link para {member.name}
            </p>
          </div>
        )}

        {/* Contato */}
        <div className="mt-4 space-y-2 w-full">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
            <Mail className="w-4 h-4" />
            <span className="truncate">{member.email}</span>
          </div>
          {member.phone && (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <Phone className="w-4 h-4" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>

        {/* Especialidades */}
        {member.specialties && member.specialties.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1">
            {member.specialties.slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-zinc-400"
              >
                {specialty}
              </span>
            ))}
            {member.specialties.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-zinc-500">
                +{member.specialties.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
