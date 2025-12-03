/**
 * @file Providers.tsx
 * @description Componente wrapper para todos os providers da aplicação
 * @module components
 *
 * @example
 * // No layout root
 * <Providers>{children}</Providers>
 */

'use client';

import { ToastProvider } from '@/components/ui';
import { AuthProvider } from '@/contexts';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper que encapsula todos os providers da aplicação
 * Deve ser usado no layout root para garantir que todos os
 * contextos estejam disponíveis em toda a árvore de componentes
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
