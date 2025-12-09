/**
 * @file MobileSidebar.tsx
 * @description Sidebar mobile com animação de slide
 * @module components/layout
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  IconLayoutDashboard,
  IconUsers,
  IconChecklist,
  IconCalendar,
  IconChartBar,
  IconBulb,
  IconTemplate,
  IconUsersGroup,
  IconBrandWhatsapp,
  IconWallet,
  IconSettings,
  IconArrowLeft,
  IconX,
  IconTarget,
  IconHistory,
  IconVideo,
} from '@tabler/icons-react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { APP_NAME, NAV_ITEMS, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mapeia IDs para ícones do Tabler
 */
const iconMap: Record<string, React.ReactNode> = {
  dashboard: <IconLayoutDashboard className="h-5 w-5 shrink-0" />,
  clients: <IconUsers className="h-5 w-5 shrink-0" />,
  leads: <IconTarget className="h-5 w-5 shrink-0" />,
  tasks: <IconChecklist className="h-5 w-5 shrink-0" />,
  meetings: <IconVideo className="h-5 w-5 shrink-0" />,
  historico: <IconHistory className="h-5 w-5 shrink-0" />,
  calendar: <IconCalendar className="h-5 w-5 shrink-0" />,
  reports: <IconChartBar className="h-5 w-5 shrink-0" />,
  analysis: <IconBulb className="h-5 w-5 shrink-0" />,
  templates: <IconTemplate className="h-5 w-5 shrink-0" />,
  team: <IconUsersGroup className="h-5 w-5 shrink-0" />,
  whatsapp: <IconBrandWhatsapp className="h-5 w-5 shrink-0" />,
  financial: <IconWallet className="h-5 w-5 shrink-0" />,
};

/**
 * Obtém o ícone correto para um item de navegação
 */
function getNavIcon(id: string): React.ReactNode {
  return iconMap[id] ?? <IconLayoutDashboard className="h-5 w-5 shrink-0" />;
}

/**
 * Sidebar mobile com animação de slide
 */
function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { canAccessRoute, data: currentUser } = useCurrentUser();

  /**
   * Filtra os itens de navegação baseado nas permissões do usuário
   */
  const filteredNavItems = useMemo(() => {
    if (!currentUser) {
      return NAV_ITEMS;
    }

    if (currentUser.isOwner) {
      return NAV_ITEMS;
    }

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

  // Links fixos no footer
  const footerLinks = [
    {
      id: 'settings',
      label: 'Configurações',
      href: ROUTES.SETTINGS,
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
    },
    {
      id: 'logout',
      label: 'Sair',
      href: '/login',
      icon: <IconArrowLeft className="h-5 w-5 shrink-0" />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
          className={cn(
            'fixed h-full w-[280px] inset-y-0 left-0',
            'bg-[#0a0a0f] border-r border-white/[0.08]',
            'p-6 z-[100] flex flex-col justify-between',
            'md:hidden'
          )}
        >
          {/* Close button */}
          <button
            className="absolute right-4 top-4 z-50 text-[#8FAAAD] hover:text-white transition-colors p-2"
            onClick={onClose}
          >
            <IconX className="h-5 w-5" />
          </button>

          {/* Header com Logo */}
          <div className="flex flex-col flex-1 overflow-y-auto">
            <Link
              href={ROUTES.DASHBOARD}
              className="flex items-center space-x-2 py-1 mb-8"
              onClick={onClose}
            >
              <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD]" />
              <span className="font-bold text-white">{APP_NAME}</span>
            </Link>

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
              {filteredNavItems.map((item) => {
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 py-2.5 px-3 rounded-xl',
                      'transition-all duration-200 relative',
                      isActive
                        ? 'bg-[#BDCDCF]/10 text-white'
                        : 'text-[#8FAAAD] hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#BDCDCF] rounded-r-full" />
                    )}

                    {/* Icon */}
                    <span className={cn(
                      'flex-shrink-0',
                      isActive ? 'text-[#BDCDCF]' : 'text-[#6B8A8D]'
                    )}>
                      {getNavIcon(item.id)}
                    </span>

                    {/* Label */}
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer Links */}
          <div className="flex flex-col gap-1 border-t border-white/[0.08] pt-4">
            {footerLinks.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 py-2.5 px-3 rounded-xl',
                    'transition-all duration-200 relative',
                    isActive
                      ? 'bg-[#BDCDCF]/10 text-white'
                      : 'text-[#8FAAAD] hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#BDCDCF] rounded-r-full" />
                  )}

                  {/* Icon */}
                  <span className={cn(
                    'flex-shrink-0',
                    isActive ? 'text-[#BDCDCF]' : 'text-[#6B8A8D]'
                  )}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* User Avatar */}
            <Link
              href={ROUTES.PROFILE}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 py-2 px-3 rounded-xl mt-2',
                'transition-all duration-200',
                pathname === ROUTES.PROFILE
                  ? 'bg-[#BDCDCF]/10'
                  : 'hover:bg-white/[0.05]'
              )}
            >
              {/* Avatar */}
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD] flex items-center justify-center text-[#003332] text-xs font-medium">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              {/* Name */}
              <span className="text-sm font-medium text-[#BDCDCF]">
                {currentUser?.name || 'Usuário'}
              </span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { MobileSidebar };
export type { MobileSidebarProps };
