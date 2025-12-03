/**
 * @file ContentStatusBadge.tsx
 * @description Componente de badge para status de conteúdo com visual glassmorphism
 * @module components/calendar
 *
 * @example
 * <ContentStatusBadge status="published" />
 */

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

import { CONTENT_STATUS_CONFIG, type ContentStatus } from '@/types';

interface ContentStatusBadgeProps {
  /** Status do conteúdo */
  status: ContentStatus;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra o indicador de ponto */
  showDot?: boolean;
  /** Classes adicionais */
  className?: string;
}

const sizeStyles = {
  sm: {
    badge: 'px-2.5 py-1 text-[11px] gap-1.5',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'px-3 py-1.5 text-xs gap-2',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'px-4 py-2 text-sm gap-2.5',
    dot: 'w-2.5 h-2.5',
  },
};

/**
 * Badge para exibição de status de conteúdo
 * Design glassmorphism moderno
 */
function ContentStatusBadge({
  status,
  size = 'md',
  showDot = true,
  className,
}: ContentStatusBadgeProps) {
  const config = CONTENT_STATUS_CONFIG[status];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center font-semibold rounded-lg',
        // Glass effect
        'backdrop-blur-sm border',
        // Shadow for depth
        'shadow-sm',
        // Transition
        'transition-all duration-200',
        // Config colors
        config.bgColor,
        config.textColor,
        config.borderColor,
        // Size
        sizeStyle.badge,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full',
            config.dotColor,
            sizeStyle.dot
          )}
          style={{
            boxShadow: `0 0 6px currentColor`,
          }}
          aria-hidden="true"
        />
      )}
      <Icon name={config.icon} size="xs" className={config.iconColor} />
      {config.label}
    </span>
  );
}

export { ContentStatusBadge };
export type { ContentStatusBadgeProps };
