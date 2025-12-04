/**
 * @file TeamMemberModal.tsx
 * @description Modal para criar/editar membro da equipe
 * @module components/team
 */

'use client';

import { Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { TeamMemberAvatar } from './TeamMemberAvatar';

import type { CreateTeamMemberDTO, TeamMember, TeamRole, UpdateTeamMemberDTO } from '@/types';
import { TEAM_MEMBER_COLORS, TEAM_ROLE_CONFIG, TEAM_SPECIALTIES } from '@/types';

interface TeamMemberModalProps {
  /** Se o modal está aberto */
  isOpen: boolean;
  /** Callback para fechar o modal */
  onClose: () => void;
  /** Callback ao submeter o formulário */
  onSubmit: (data: CreateTeamMemberDTO | UpdateTeamMemberDTO) => Promise<void>;
  /** Membro existente para edição */
  member?: TeamMember | null;
  /** Se está carregando */
  loading?: boolean;
}

const ROLES: TeamRole[] = ['admin', 'manager', 'member', 'viewer'];

/**
 * Modal para criar/editar membro da equipe
 */
export function TeamMemberModal({
  isOpen,
  onClose,
  onSubmit,
  member,
  loading = false,
}: TeamMemberModalProps) {
  const [formData, setFormData] = useState<CreateTeamMemberDTO>({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    specialties: [],
    color: TEAM_MEMBER_COLORS[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!member;

  // Reset form quando modal abre/fecha ou membro muda
  useEffect(() => {
    if (isOpen) {
      if (member) {
        setFormData({
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          role: member.role,
          specialties: member.specialties || [],
          color: member.color || TEAM_MEMBER_COLORS[0],
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'member',
          specialties: [],
          color: TEAM_MEMBER_COLORS[Math.floor(Math.random() * TEAM_MEMBER_COLORS.length)],
        });
      }
      setErrors({});
    }
  }, [isOpen, member]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // Erro tratado no parent
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties?.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...(prev.specialties || []), specialty],
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Editar Membro' : 'Novo Membro da Equipe'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview do avatar */}
          <div className="flex justify-center">
            <TeamMemberAvatar
              name={formData.name || 'Nome'}
              color={formData.color}
              size="xl"
            />
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg bg-white/5 border text-white placeholder:text-zinc-500',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                errors.name ? 'border-red-500' : 'border-white/10'
              )}
              placeholder="Nome completo"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg bg-white/5 border text-white placeholder:text-zinc-500',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
                errors.email ? 'border-red-500' : 'border-white/10'
              )}
              placeholder="email@exemplo.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Função */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Função
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => {
                const config = TEAM_ROLE_CONFIG[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role })}
                    className={cn(
                      'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                      formData.role === role
                        ? cn(config.bgColor, config.textColor, config.borderColor)
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    )}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {TEAM_ROLE_CONFIG[formData.role || 'member'].description}
            </p>
          </div>

          {/* Cor do avatar */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Cor do Avatar
            </label>
            <div className="flex flex-wrap gap-2">
              {TEAM_MEMBER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={cn(
                    'w-8 h-8 rounded-full transition-transform',
                    formData.color === color && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Especialidades
            </label>
            <div className="flex flex-wrap gap-2">
              {TEAM_SPECIALTIES.map((specialty) => (
                <button
                  key={specialty.value}
                  type="button"
                  onClick={() => toggleSpecialty(specialty.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    formData.specialties?.includes(specialty.value)
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  )}
                >
                  {specialty.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-zinc-300 font-medium hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
