/**
 * @file Sidebar.tsx
 * @description Componente de sidebar/navegação lateral do dashboard
 * @module components/layout
 *
 * @example
 * <Sidebar isCollapsed={false} onToggle={handleToggle} />
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { APP_NAME, NAV_ITEMS, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Se a sidebar está colapsada */
  isCollapsed?: boolean;
  /** Callback para toggle do estado colapsado */
  onToggle?: () => void;
  /** Classes adicionais */
  className?: string;
}

/**
 * Ícones SVG para navegação
 */
const NavIcons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  ),
  clients: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  tasks: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  analysis: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  templates: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  ),
  financial: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  team: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
};

/**
 * Mapeia IDs de navegação para ícones
 */
function getNavIcon(id: string): React.ReactNode {
  return NavIcons[id as keyof typeof NavIcons] ?? NavIcons.dashboard;
}

/**
 * Sidebar com navegação principal do dashboard
 */
function Sidebar({ isCollapsed = false, onToggle, className }: SidebarProps) {
  const pathname = usePathname();
  const { canAccessRoute, data: currentUser } = useCurrentUser();

  /**
   * Filtra os itens de navegação baseado nas permissões do usuário
   */
  const filteredNavItems = useMemo(() => {
    // Se ainda carregando ou sem usuário, mostrar todos (será redirecionado se não autenticado)
    if (!currentUser) {
      return NAV_ITEMS;
    }

    // Owners veem tudo
    if (currentUser.isOwner) {
      return NAV_ITEMS;
    }

    // Team members veem apenas o que têm permissão
    return NAV_ITEMS.filter(item => canAccessRoute(item.id));
  }, [currentUser, canAccessRoute]);

  /**
   * Verifica se a rota está ativa
   */
  const isActiveRoute = (href: string): boolean => {
    if (href === ROUTES.DASHBOARD) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-[#0a0a0f]/80 backdrop-blur-xl',
        'border-r border-white/[0.08]',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/[0.08]">
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center gap-3 group"
          >
            {/* Logo icon */}
            <div
              className={cn(
                'flex items-center justify-center',
                'w-10 h-10 rounded-xl',
                'bg-gradient-to-br from-violet-600 to-indigo-600',
                'shadow-lg shadow-violet-500/25',
                'group-hover:shadow-violet-500/40',
                'transition-shadow duration-300'
              )}
            >
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

            {/* Logo text */}
            {!isCollapsed && (
              <span className="text-lg font-bold text-white tracking-tight">
                {APP_NAME}
              </span>
            )}
          </Link>

          {/* Toggle button */}
          {onToggle && (
            <button
              onClick={onToggle}
              className={cn(
                'ml-auto p-2 rounded-lg',
                'text-zinc-400 hover:text-white',
                'hover:bg-white/[0.05]',
                'transition-colors duration-200',
                isCollapsed && 'ml-0'
              )}
              aria-label={isCollapsed ? 'Expandir menu' : 'Colapsar menu'}
            >
              <svg
                className={cn(
                  'w-5 h-5 transition-transform duration-300',
                  isCollapsed && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'transition-all duration-200',
                  'group relative',
                  isActive
                    ? 'bg-violet-500/10 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-r-full" />
                )}

                {/* Icon */}
                <span
                  className={cn(
                    'flex-shrink-0',
                    isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  )}
                >
                  {getNavIcon(item.id)}
                </span>

                {/* Label */}
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div
                    className={cn(
                      'absolute left-full ml-2 px-2 py-1',
                      'bg-zinc-800 text-white text-sm rounded-lg',
                      'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                      'transition-all duration-200',
                      'whitespace-nowrap z-50'
                    )}
                  >
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08]">
          <Link
            href={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl',
              'text-zinc-400 hover:text-white hover:bg-white/[0.05]',
              'transition-colors duration-200',
              'group relative',
              pathname === ROUTES.SETTINGS && 'bg-violet-500/10 text-white'
            )}
          >
            {/* Active indicator */}
            {pathname === ROUTES.SETTINGS && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-r-full" />
            )}
            <svg
              className={cn(
                'w-5 h-5 flex-shrink-0',
                pathname === ROUTES.SETTINGS ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {!isCollapsed && <span className="font-medium text-sm">Configurações</span>}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div
                className={cn(
                  'absolute left-full ml-2 px-2 py-1',
                  'bg-zinc-800 text-white text-sm rounded-lg',
                  'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                  'transition-all duration-200',
                  'whitespace-nowrap z-50'
                )}
              >
                Configurações
              </div>
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export { Sidebar };
export type { SidebarProps };
