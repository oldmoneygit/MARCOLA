/**
 * @file TeamMemberAvatar.tsx
 * @description Avatar do membro da equipe com fallback para iniciais
 * @module components/team
 */

'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

interface TeamMemberAvatarProps {
  /** Nome do membro */
  name: string;
  /** URL da imagem do avatar */
  avatarUrl?: string | null;
  /** Cor de fundo (quando sem imagem) */
  color?: string;
  /** Tamanho do avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Classes adicionais */
  className?: string;
  /** Mostrar indicador de status online */
  showStatus?: boolean;
  /** Se está online */
  isOnline?: boolean;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusSizeStyles = {
  xs: 'w-2 h-2 right-0 bottom-0',
  sm: 'w-2.5 h-2.5 right-0 bottom-0',
  md: 'w-3 h-3 right-0 bottom-0',
  lg: 'w-3.5 h-3.5 right-0.5 bottom-0.5',
  xl: 'w-4 h-4 right-1 bottom-1',
};

/**
 * Extrai as iniciais do nome
 */
function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  const firstPart = parts[0];
  if (parts.length === 1 || !firstPart) {
    return firstPart ? firstPart.charAt(0).toUpperCase() : '?';
  }
  const lastPart = parts[parts.length - 1];
  return (firstPart.charAt(0) + (lastPart ? lastPart.charAt(0) : '')).toUpperCase();
}

/**
 * Avatar do membro da equipe
 */
export function TeamMemberAvatar({
  name,
  avatarUrl,
  color = '#8b5cf6',
  size = 'md',
  className,
  showStatus = false,
  isOnline = false,
}: TeamMemberAvatarProps) {
  const initials = getInitials(name);

  return (
    <div className={cn('relative inline-flex', className)}>
      {avatarUrl ? (
        <div
          className={cn(
            'relative rounded-full overflow-hidden ring-2 ring-white/10',
            sizeStyles[size]
          )}
        >
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white/10',
            sizeStyles[size]
          )}
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}

      {/* Status indicator */}
      {showStatus && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-[#0a0a0f]',
            statusSizeStyles[size],
            isOnline ? 'bg-emerald-400' : 'bg-zinc-500'
          )}
        />
      )}
    </div>
  );
}
