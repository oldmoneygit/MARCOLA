/**
 * @file ProfilePageContent.tsx
 * @description Conteúdo principal da página de perfil do usuário
 * @module components/profile
 */

'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, Camera, Check, Loader2, Mail, User } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

interface ProfileFormData {
  name: string;
}

/**
 * Conteúdo principal da página de perfil
 */
export function ProfilePageContent() {
  const { profile, loading, error, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: profile?.name || '',
  });

  const handleStartEdit = useCallback(() => {
    setFormData({ name: profile?.name || '' });
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  }, [profile?.name]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setFormData({ name: profile?.name || '' });
    setSaveError(null);
  }, [profile?.name]);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      setSaveError('O nome é obrigatório');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateProfile({ name: formData.name.trim() });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[ProfilePageContent] Save error:', err);
      setSaveError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [formData.name, updateProfile]);

  const initials = (profile?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <p className="text-zinc-400 mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Check className="w-5 h-5" />
          <p>Perfil atualizado com sucesso!</p>
        </div>
      )}

      {/* Avatar Section */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div
              className={cn(
                'w-24 h-24 rounded-2xl',
                'bg-gradient-to-br from-violet-600 to-indigo-600',
                'flex items-center justify-center',
                'text-white text-2xl font-bold'
              )}
            >
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              className={cn(
                'absolute -bottom-2 -right-2',
                'w-8 h-8 rounded-full',
                'bg-violet-600 hover:bg-violet-500',
                'flex items-center justify-center',
                'text-white transition-colors',
                'shadow-lg'
              )}
              title="Alterar foto (em breve)"
              disabled
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <div>
            <h2 className="text-xl font-semibold text-white">{profile?.name}</h2>
            <p className="text-zinc-400">{profile?.email}</p>
            <p className="text-xs text-zinc-500 mt-2">
              Membro desde {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Profile Form */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="px-4 py-2 rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
            >
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  'bg-violet-600 text-white hover:bg-violet-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center gap-2'
                )}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {saveError && (
          <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <p>{saveError}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Name field */}
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-zinc-400 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nome
            </label>
            {isEditing ? (
              <input
                id="profile-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white placeholder-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                  'transition-colors'
                )}
                placeholder="Seu nome"
              />
            ) : (
              <p className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white">
                {profile?.name || '-'}
              </p>
            )}
          </div>

          {/* Email field (read-only) */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <p className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-400">
              {profile?.email || '-'}
              <span className="ml-2 text-xs text-zinc-500">(não editável)</span>
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Security Section */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Segurança</h3>
        <div className="space-y-3">
          <button
            type="button"
            disabled
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl',
              'bg-white/[0.02] border border-white/[0.06]',
              'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.04]',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span>Alterar Senha</span>
            <span className="text-xs text-zinc-500">Em breve</span>
          </button>
          <button
            type="button"
            disabled
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl',
              'bg-white/[0.02] border border-white/[0.06]',
              'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.04]',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span>Autenticação de Dois Fatores</span>
            <span className="text-xs text-zinc-500">Em breve</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
