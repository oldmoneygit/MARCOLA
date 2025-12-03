/**
 * @file ContentTypeBadge.tsx
 * @description Componente de badge para tipo de conteúdo com visual glassmorphism
 * @module components/calendar
 *
 * @example
 * <ContentTypeBadge type="post" />
 */

import { Icon } from '@/components/ui';

import { cn } from '@/lib/utils';

import { CONTENT_TYPE_CONFIG, type ContentType } from '@/types';

interface ContentTypeBadgeProps {
  /** Tipo de conteúdo */
  type: ContentType;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra o ícone */
  showIcon?: boolean;
  /** Classes adicionais */
  className?: string;
}

const sizeStyles = {
  sm: {
    badge: 'px-2.5 py-1 text-[11px] gap-1.5',
    icon: 'xs' as const,
  },
  md: {
    badge: 'px-3 py-1.5 text-xs gap-2',
    icon: 'sm' as const,
  },
  lg: {
    badge: 'px-4 py-2 text-sm gap-2.5',
    icon: 'md' as const,
  },
};

/**
 * Badge para exibição de tipo de conteúdo
 * Design glassmorphism com ícones
 */
function ContentTypeBadge({
  type,
  size = 'md',
  showIcon = true,
  className,
}: ContentTypeBadgeProps) {
  const config = CONTENT_TYPE_CONFIG[type];
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
      {showIcon && (
        <Icon
          name={config.icon}
          size={sizeStyle.icon}
          className={config.iconColor}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}

export { ContentTypeBadge };
export type { ContentTypeBadgeProps };
