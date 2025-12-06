/**
 * @file DashboardLayout.tsx
 * @description Layout principal do dashboard com sidebar e header
 * @module components/layout
 *
 * @example
 * <DashboardLayout title="Dashboard">
 *   <DashboardContent />
 * </DashboardLayout>
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';

interface DashboardLayoutProps {
  /** Título da página atual */
  title: React.ReactNode;
  /** Subtítulo/descrição da página */
  subtitle?: string;
  /** Ações do header */
  headerActions?: React.ReactNode;
  /** Conteúdo da página */
  children: React.ReactNode;
  /** Classes adicionais para o container de conteúdo */
  className?: string;
}

/**
 * Hook para gerenciar responsividade da sidebar mobile
 */
function useMobileSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fecha sidebar mobile ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return {
    isMobileOpen,
    toggleMobile,
    closeMobile,
  };
}

/**
 * Layout principal do dashboard que combina Sidebar e Header
 * A sidebar desktop usa hover para expandir/colapsar automaticamente
 */
function DashboardLayout({
  title,
  subtitle,
  headerActions,
  children,
  className,
}: DashboardLayoutProps) {
  const {
    isMobileOpen,
    toggleMobile,
    closeMobile,
  } = useMobileSidebar();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop (hover to expand) */}
      <Sidebar />

      {/* Sidebar - Mobile */}
      <MobileSidebar isOpen={isMobileOpen} onClose={closeMobile} />

      {/* Main content area - ajustado para sidebar colapsada de 70px */}
      <div className="md:pl-[70px] transition-all duration-300 ease-in-out">
        {/* Header */}
        <Header
          title={title}
          subtitle={subtitle}
          actions={headerActions}
          onMenuClick={toggleMobile}
        />

        {/* Page content */}
        <main className={cn('p-6', className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout, useMobileSidebar };
export type { DashboardLayoutProps };
