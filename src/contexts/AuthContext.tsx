/**
 * @file AuthContext.tsx
 * @description Contexto de autenticação com Supabase
 * @module contexts
 *
 * @example
 * // No layout root
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 *
 * // Em um componente
 * const { user, signIn, signOut } = useAuth();
 */

'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

import type { Database } from '@/types/database';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Estado de autenticação
 */
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
}

/**
 * Dados para login
 */
interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Dados para registro
 */
interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

/**
 * Contexto de autenticação
 */
interface AuthContextType extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Traduz mensagens de erro do Supabase para português
 */
function translateAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'User not found': 'Usuário não encontrado',
    'Invalid email': 'Email inválido',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'User already registered': 'Este email já está cadastrado',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
    'Signup is disabled': 'Cadastro desabilitado temporariamente',
  };

  return errorMap[message] || message;
}

/**
 * Provider de autenticação
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isConfigured: false,
  });

  // Inicializa o cliente Supabase no lado do cliente
  useEffect(() => {
    if (!isInitialized) {
      supabaseRef.current = createClient();
      setIsInitialized(true);

      if (!supabaseRef.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          isConfigured: false,
          error: 'Supabase não configurado',
        }));
      } else {
        setState((prev) => ({ ...prev, isConfigured: true }));
      }
    }
  }, [isInitialized]);

  /**
   * Inicializa e monitora estado de autenticação
   */
  useEffect(() => {
    const supabase = supabaseRef.current;

    if (!supabase) {
      return;
    }

    // Busca sessão inicial
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthContext] Error getting session:', error);
          setState((prev) => ({ ...prev, loading: false, error: error.message }));
          return;
        }

        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        }));
      } catch (err) {
        console.error('[AuthContext] Unexpected error:', err);
        setState((prev) => ({ ...prev, loading: false, error: 'Erro ao inicializar autenticação' }));
      }
    };

    initAuth();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          session,
          error: null,
        }));

        // Redireciona após login/logout
        if (event === 'SIGNED_IN') {
          router.refresh();
        }

        if (event === 'SIGNED_OUT') {
          router.push(ROUTES.LOGIN);
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isInitialized, router]);

  /**
   * Login com email e senha
   */
  const signIn = useCallback(
    async ({ email, password }: SignInCredentials) => {
      const supabase = supabaseRef.current;

      if (!supabase) {
        throw new Error('Supabase não configurado');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const translatedError = translateAuthError(error.message);
          setState((prev) => ({ ...prev, loading: false, error: translatedError }));
          throw new Error(translatedError);
        }

        router.push(ROUTES.DASHBOARD);
      } catch (err) {
        const message = err instanceof Error ? translateAuthError(err.message) : 'Erro ao fazer login';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    [router]
  );

  /**
   * Registro com email e senha
   */
  const signUp = useCallback(
    async ({ email, password, name }: SignUpCredentials) => {
      const supabase = supabaseRef.current;

      if (!supabase) {
        throw new Error('Supabase não configurado');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name ?? email.split('@')[0],
            },
          },
        });

        if (error) {
          const translatedError = translateAuthError(error.message);
          setState((prev) => ({ ...prev, loading: false, error: translatedError }));
          throw new Error(translatedError);
        }

        // Nota: dependendo da configuração do Supabase, o usuário pode precisar confirmar email
        setState((prev) => ({ ...prev, loading: false }));
      } catch (err) {
        const message = err instanceof Error ? translateAuthError(err.message) : 'Erro ao criar conta';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  /**
   * Logout
   */
  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current;

    if (!supabase) {
      throw new Error('Supabase não configurado');
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setState((prev) => ({ ...prev, loading: false, error: error.message }));
        throw error;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sair';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  /**
   * Reset de senha
   */
  const resetPassword = useCallback(
    async (email: string) => {
      const supabase = supabaseRef.current;

      if (!supabase) {
        throw new Error('Supabase não configurado');
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

        if (error) {
          setState((prev) => ({ ...prev, loading: false, error: error.message }));
          throw error;
        }

        setState((prev) => ({ ...prev, loading: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar email de reset';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [state, signIn, signUp, signOut, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acessar o contexto de autenticação
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export type { AuthContextType, AuthState, SignInCredentials, SignUpCredentials };
