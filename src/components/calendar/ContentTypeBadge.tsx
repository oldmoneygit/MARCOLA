/**
 * @file ContentTypeBadge.tsx
 * @description Componente de badge para tipo de conteúdo
 * @module components/calendar
 *
 * @example
 * <ContentTypeBadge type="post" />
 */

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
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

/**
 * Badge para exibição de tipo de conteúdo
 */
function ContentTypeBadge({
  type,
  size = 'md',
  showIcon = true,
  className,
}: ContentTypeBadgeProps) {
  const config = CONTENT_TYPE_CONFIG[type];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.className,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && <span aria-hidden="true">{config.icon}</span>}
      {config.label}
    </span>
  );
}

export { ContentTypeBadge };
export type { ContentTypeBadgeProps };
