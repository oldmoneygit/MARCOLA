/**
 * @file page.tsx
 * @description Página de login
 * @module app/(auth)/login
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button, GlassCard, Input } from '@/components/ui';
import { useAuth } from '@/contexts';
import { APP_NAME, ROUTES } from '@/lib/constants';

export default function LoginPage() {
  const { signIn, loading, error } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validação básica
    if (!formData.email || !formData.password) {
      setFormError('Preencha todos os campos');
      return;
    }

    try {
      await signIn({
        email: formData.email,
        password: formData.password,
      });
    } catch {
      // Error já é tratado pelo contexto
    }
  };

  const displayError = formError ?? error;

  return (
    <>
      {/* Mobile logo */}
      <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className="text-xl font-bold text-white">{APP_NAME}</span>
      </div>

      <GlassCard variant="elevated" className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h2>
          <p className="text-zinc-400">Entre com sua conta para continuar</p>
        </div>

        {/* Error message */}
        {displayError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />

          <Input
            label="Senha"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          />

          {/* Forgot password */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            fullWidth
            loading={loading}
            className="mt-2"
          >
            Entrar
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#0a0a0f] text-zinc-500">ou</span>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-zinc-400">
          Não tem uma conta?{' '}
          <Link
            href={ROUTES.LOGIN.replace('login', 'register')}
            className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Criar conta
          </Link>
        </p>
      </GlassCard>
    </>
  );
}
