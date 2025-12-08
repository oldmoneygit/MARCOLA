/**
 * @file Sidebar.tsx
 * @description Componente de sidebar/navegação lateral do dashboard com estilo Aceternity UI
 * @module components/layout
 *
 * @example
 * <Sidebar />
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  IconTarget,
} from '@tabler/icons-react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { APP_NAME, NAV_ITEMS, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Classes adicionais */
  className?: string;
}

/**
 * Mapeia IDs para ícones do Tabler
 */
const iconMap: Record<string, React.ReactNode> = {
  dashboard: <IconLayoutDashboard className="h-5 w-5 shrink-0" />,
  clients: <IconUsers className="h-5 w-5 shrink-0" />,
  leads: <IconTarget className="h-5 w-5 shrink-0" />,
  tasks: <IconChecklist className="h-5 w-5 shrink-0" />,
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
 * Logo expandido com animação
 */
function Logo() {
  return (
    <Link
      href={ROUTES.DASHBOARD}
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD]" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold whitespace-pre text-white"
      >
        {APP_NAME}
      </motion.span>
    </Link>
  );
}

/**
 * Logo colapsado (apenas ícone)
 */
function LogoIcon() {
  return (
    <Link
      href={ROUTES.DASHBOARD}
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal"
    >
      <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD]" />
    </Link>
  );
}

/**
 * Sidebar com navegação principal do dashboard
 * Expande ao passar o mouse e colapsa ao sair
 */
function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { canAccessRoute, data: currentUser } = useCurrentUser();
  const [open, setOpen] = useState(false);

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
    <motion.aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-[#0a0a0f]/95 backdrop-blur-xl',
        'border-r border-white/[0.08]',
        'hidden md:flex md:flex-col',
        'px-4 py-4',
        className
      )}
      animate={{
        width: open ? '280px' : '70px',
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Header com Logo */}
      <div className="flex flex-col overflow-x-hidden overflow-y-auto flex-1">
        {open ? <Logo /> : <LogoIcon />}

        {/* Navigation */}
        <nav className="mt-8 flex flex-col gap-1">
          {filteredNavItems.map((item) => {
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center justify-start gap-2 group/sidebar py-2.5 px-2 rounded-xl',
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
                  isActive ? 'text-[#BDCDCF]' : 'text-[#6B8A8D] group-hover/sidebar:text-[#BDCDCF]'
                )}>
                  {getNavIcon(item.id)}
                </span>

                {/* Label */}
                <motion.span
                  animate={{
                    display: open ? 'inline-block' : 'none',
                    opacity: open ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeInOut',
                  }}
                  className="text-sm font-medium group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block"
                >
                  {item.label}
                </motion.span>
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
              className={cn(
                'flex items-center justify-start gap-2 group/sidebar py-2.5 px-2 rounded-xl',
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
                isActive ? 'text-[#BDCDCF]' : 'text-[#6B8A8D] group-hover/sidebar:text-[#BDCDCF]'
              )}>
                {item.icon}
              </span>

              {/* Label */}
              <motion.span
                animate={{
                  display: open ? 'inline-block' : 'none',
                  opacity: open ? 1 : 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: 'easeInOut',
                }}
                className="text-sm font-medium group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block"
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}

        {/* User Avatar */}
        <Link
          href={ROUTES.PROFILE}
          className={cn(
            'flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-xl mt-2',
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
          <motion.span
            animate={{
              display: open ? 'inline-block' : 'none',
              opacity: open ? 1 : 0,
            }}
            transition={{
              duration: 0.2,
              ease: 'easeInOut',
            }}
            className="text-sm font-medium text-[#BDCDCF] group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block"
          >
            {currentUser?.name || 'Usuário'}
          </motion.span>
        </Link>
      </div>
    </motion.aside>
  );
}

export { Sidebar };
export type { SidebarProps };
