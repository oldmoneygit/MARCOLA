/**
 * @file ContentStatusBadge.tsx
 * @description Componente de badge para status de conteúdo
 * @module components/calendar
 *
 * @example
 * <ContentStatusBadge status="published" />
 */

import { cn } from '@/lib/utils';

import { CONTENT_STATUS_CONFIG, type ContentStatus } from '@/types';

interface ContentStatusBadgeProps {
  /** Status do conteúdo */
  status: ContentStatus;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Classes adicionais */
  className?: string;
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

/**
 * Badge para exibição de status de conteúdo
 */
function ContentStatusBadge({ status, size = 'md', className }: ContentStatusBadgeProps) {
  const config = CONTENT_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        sizeStyles[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}

export { ContentStatusBadge };
export type { ContentStatusBadgeProps };
