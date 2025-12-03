/**
 * @file Header.tsx
 * @description Componente de header do dashboard
 * @module components/layout
 *
 * @example
 * <Header
 *   title="Dashboard"
 *   subtitle="Visão geral do desempenho"
 * />
 */

'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

interface HeaderProps {
  /** Título da página */
  title: React.ReactNode;
  /** Subtítulo/descrição */
  subtitle?: string;
  /** Ações à direita do header */
  actions?: React.ReactNode;
  /** Se mostra o menu mobile */
  showMobileMenu?: boolean;
  /** Callback para abrir menu mobile */
  onMenuClick?: () => void;
  /** Classes adicionais */
  className?: string;
}

interface UserMenuProps {
  /** Nome do usuário */
  name?: string;
  /** Email do usuário */
  email?: string;
  /** URL do avatar */
  avatarUrl?: string;
}

/**
 * Menu de usuário com dropdown
 */
function UserMenu({ name = 'Usuário', email = 'usuario@email.com', avatarUrl }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 p-2 rounded-xl',
          'hover:bg-white/[0.05] transition-colors duration-200'
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-9 h-9 rounded-xl',
            'bg-gradient-to-br from-violet-600 to-indigo-600',
            'flex items-center justify-center',
            'text-white text-sm font-medium'
          )}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* User info */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-white">{name}</div>
          <div className="text-xs text-zinc-400">{email}</div>
        </div>

        {/* Chevron */}
        <svg
          className={cn(
            'w-4 h-4 text-zinc-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className={cn(
              'absolute right-0 mt-2 w-56 z-20',
              'bg-[#0a0a0f]/95 backdrop-blur-xl',
              'border border-white/[0.08] rounded-xl',
              'shadow-2xl shadow-black/50',
              'py-2'
            )}
          >
            <div className="px-4 py-2 border-b border-white/[0.08]">
              <div className="text-sm font-medium text-white">{name}</div>
              <div className="text-xs text-zinc-400">{email}</div>
            </div>

            <div className="py-1">
              <button
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2',
                  'text-sm text-zinc-300 hover:text-white',
                  'hover:bg-white/[0.05] transition-colors'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Meu Perfil
              </button>

              <button
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2',
                  'text-sm text-zinc-300 hover:text-white',
                  'hover:bg-white/[0.05] transition-colors'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configurações
              </button>
            </div>

            <div className="border-t border-white/[0.08] py-1">
              <button
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2',
                  'text-sm text-red-400 hover:text-red-300',
                  'hover:bg-red-500/10 transition-colors'
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Header do dashboard com título, ações e menu de usuário
 */
function Header({
  title,
  subtitle,
  actions,
  showMobileMenu = true,
  onMenuClick,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30',
        'bg-[#0a0a0f]/80 backdrop-blur-xl',
        'border-b border-white/[0.08]',
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          {showMobileMenu && (
            <button
              onClick={onMenuClick}
              className={cn(
                'lg:hidden p-2 rounded-lg',
                'text-zinc-400 hover:text-white',
                'hover:bg-white/[0.05]',
                'transition-colors duration-200'
              )}
              aria-label="Abrir menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Title section */}
          <div>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-zinc-400">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Custom actions */}
          {actions}

          {/* Notifications */}
          <button
            className={cn(
              'relative p-2 rounded-lg',
              'text-zinc-400 hover:text-white',
              'hover:bg-white/[0.05]',
              'transition-colors duration-200'
            )}
            aria-label="Notificações"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Notification badge */}
            <span
              className={cn(
                'absolute top-1.5 right-1.5',
                'w-2 h-2 rounded-full',
                'bg-violet-500'
              )}
            />
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-white/[0.08]" />

          {/* User menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export { Header, UserMenu };
export type { HeaderProps, UserMenuProps };
