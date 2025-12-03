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
 * Hook para gerenciar responsividade da sidebar
 */
function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fecha sidebar mobile ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fecha sidebar mobile ao navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
  };
}

/**
 * Layout principal do dashboard que combina Sidebar e Header
 */
function DashboardLayout({
  title,
  subtitle,
  headerActions,
  children,
  className,
}: DashboardLayoutProps) {
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    toggleMobile,
    closeMobile,
  } = useSidebarState();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 lg:hidden',
          'transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar isCollapsed={false} />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
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

export { DashboardLayout, useSidebarState };
export type { DashboardLayoutProps };
