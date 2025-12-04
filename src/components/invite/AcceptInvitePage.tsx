/**
 * @file AcceptInvitePage.tsx
 * @description Página para aceitar convite de equipe
 * @module components/invite
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Eye, EyeOff, Loader2, Mail, Shield, User } from 'lucide-react';

import { APP_NAME, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface AcceptInvitePageProps {
  token: string;
}

interface InvitationData {
  id: string;
  owner_id: string;
  team_member_id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  is_valid: boolean;
  message?: string;
  team_member?: {
    id: string;
    name: string;
    role: string;
  };
}

/**
 * Página de aceite de convite
 */
export function AcceptInvitePage({ token }: AcceptInvitePageProps) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch invitation details
  useEffect(() => {
    async function fetchInvitation() {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Convite não encontrado');
          return;
        }

        setInvitation(data);
        if (data.team_member?.name) {
          setName(data.team_member.name);
        }
      } catch (err) {
        console.error('[AcceptInvitePage] Fetch error:', err);
        setError('Erro ao carregar convite');
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      // Validações
      if (!name.trim()) {
        setFormError('Nome é obrigatório');
        return;
      }

      if (password.length < 6) {
        setFormError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (password !== confirmPassword) {
        setFormError('As senhas não coincidem');
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            password,
            name: name.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.requires_login) {
            setFormError('Já existe uma conta com este email. Faça login normalmente.');
            return;
          }
          setFormError(data.error || 'Erro ao aceitar convite');
          return;
        }

        setSuccess(true);

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          router.push(ROUTES.LOGIN);
        }, 3000);
      } catch (err) {
        console.error('[AcceptInvitePage] Submit error:', err);
        setFormError('Erro ao processar. Tente novamente.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, name, password, confirmPassword, router]
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  // Error state (invalid token)
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Convite Inválido</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              {error || 'Este convite não é válido ou já expirou.'}
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="block w-full text-center px-4 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Invalid/expired invitation
  if (!invitation.is_valid) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.03] border border-amber-500/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">
                {invitation.status === 'expired' ? 'Convite Expirado' : 'Convite Indisponível'}
              </h2>
            </div>
            <p className="text-zinc-400 mb-6">
              {invitation.message || 'Este convite não está mais disponível.'}
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              Entre em contato com quem te enviou o convite para solicitar um novo.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="block w-full text-center px-4 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Conta Criada!</h1>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.03] border border-emerald-500/30 rounded-2xl p-8 text-center">
            <p className="text-zinc-300 mb-4">
              Sua conta foi criada com sucesso. Você será redirecionado para a página de login.
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              Use seu email <strong className="text-white">{invitation.email}</strong> e a senha que você definiu.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-block px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Accept invitation form
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          <p className="text-zinc-400 mt-2">Você foi convidado para fazer parte da equipe</p>
        </div>

        {/* Form */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Bem-vindo, {invitation.team_member?.name}!</h2>
            <p className="text-sm text-zinc-400">
              Crie sua senha para acessar a plataforma como <strong className="text-violet-400">{invitation.team_member?.role}</strong>.
            </p>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={invitation.email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-zinc-400 cursor-not-allowed"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white placeholder-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                  'transition-colors'
                )}
                placeholder="Seu nome"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
                <Shield className="w-4 h-4 inline mr-2" />
                Criar senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 pr-12 rounded-xl',
                    'bg-white/5 border border-white/10',
                    'text-white placeholder-zinc-500',
                    'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                    'transition-colors'
                  )}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-400 mb-2">
                <Shield className="w-4 h-4 inline mr-2" />
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-white/5 border border-white/10',
                  'text-white placeholder-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                  'transition-colors'
                )}
                placeholder="Repita a senha"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full px-4 py-3 rounded-xl font-medium',
                'bg-gradient-to-r from-violet-600 to-violet-500 text-white',
                'hover:from-violet-500 hover:to-violet-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all flex items-center justify-center gap-2'
              )}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Criando conta...' : 'Criar conta e acessar'}
            </button>
          </form>

          <p className="text-xs text-zinc-500 mt-4 text-center">
            Já tem uma conta?{' '}
            <Link href={ROUTES.LOGIN} className="text-violet-400 hover:text-violet-300">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
