/**
 * @file useAuth.ts
 * @description Hook para gerenciamento de autenticação
 * @module hooks
 *
 * @example
 * const { user, loading, signOut } = useAuth();
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants';

import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface UseAuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthReturn extends UseAuthState {
  /** Faz logout do usuário */
  signOut: () => Promise<void>;
  /** Atualiza os dados do usuário */
  refreshUser: () => Promise<void>;
  /** Atualiza o perfil do usuário */
  updateProfile: (data: Partial<Pick<UserProfile, 'name' | 'avatarUrl'>>) => Promise<void>;
}

/**
 * Extrai o nome do usuário do email ou metadata
 */
function extractUserName(user: User): string {
  // Tentar pegar do metadata
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  if (user.user_metadata?.name) {
    return user.user_metadata.name;
  }
  // Usar a parte antes do @ do email
  if (user.email) {
    const namePart = user.email.split('@')[0];
    if (namePart) {
      // Capitalizar e substituir pontos/underscores por espaços
      return namePart
        .replace(/[._]/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }
  return 'Usuário';
}

/**
 * Hook para gerenciamento de autenticação
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<UseAuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  /**
   * Busca dados do usuário atual
   */
  const refreshUser = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Cliente Supabase não disponível',
        }));
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      if (user) {
        const profile: UserProfile = {
          id: user.id,
          email: user.email || '',
          name: extractUserName(user),
          avatarUrl: user.user_metadata?.avatar_url || null,
          createdAt: user.created_at,
        };

        setState({
          user,
          profile,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      console.error('[useAuth] refreshUser error:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar usuário',
      }));
    }
  }, []);

  /**
   * Faz logout do usuário
   */
  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) {
        setState((prev) => ({
          ...prev,
          error: 'Cliente Supabase não disponível',
        }));
        return;
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setState({
        user: null,
        profile: null,
        loading: false,
        error: null,
      });

      router.push(ROUTES.LOGIN);
    } catch (err) {
      console.error('[useAuth] signOut error:', err);
      setState((prev) => ({
        ...prev,
        error: 'Erro ao fazer logout',
      }));
    }
  }, [router]);

  /**
   * Atualiza o perfil do usuário
   */
  const updateProfile = useCallback(
    async (data: Partial<Pick<UserProfile, 'name' | 'avatarUrl'>>) => {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Cliente Supabase não disponível');
      }

      try {
        const updates: Record<string, unknown> = {};
        if (data.name) {
          updates.full_name = data.name;
        }
        if (data.avatarUrl !== undefined) {
          updates.avatar_url = data.avatarUrl;
        }

        const { error } = await supabase.auth.updateUser({
          data: updates,
        });

        if (error) {
          throw error;
        }

        await refreshUser();
      } catch (err) {
        console.error('[useAuth] updateProfile error:', err);
        throw new Error('Erro ao atualizar perfil');
      }
    },
    [refreshUser]
  );

  // Buscar usuário ao montar e escutar mudanças de auth
  useEffect(() => {
    refreshUser();

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          name: extractUserName(session.user),
          avatarUrl: session.user.user_metadata?.avatar_url || null,
          createdAt: session.user.created_at,
        };

        setState({
          user: session.user,
          profile,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  return {
    ...state,
    signOut,
    refreshUser,
    updateProfile,
  };
}
