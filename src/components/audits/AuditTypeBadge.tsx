/**
 * @file AuditTypeBadge.tsx
 * @description Badge para tipo de auditoria
 * @module components/audits
 */

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';

import type { AuditType } from '@/types';
import { AUDIT_TYPE_CONFIG } from '@/types';

interface AuditTypeBadgeProps {
  /** Tipo da auditoria */
  type: AuditType;
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
 * Badge para exibição de tipo de auditoria
 */
function AuditTypeBadge({
  type,
  size = 'md',
  showIcon = true,
  className,
}: AuditTypeBadgeProps) {
  const config = AUDIT_TYPE_CONFIG[type];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-lg',
        'backdrop-blur-sm border border-white/10',
        'shadow-sm transition-all duration-200',
        config.bgColor,
        config.textColor,
        sizeStyle.badge,
        className
      )}
    >
      {showIcon && (
        <Icon name={config.icon} size={sizeStyle.icon} className="opacity-80" />
      )}
      {config.label}
    </span>
  );
}

export { AuditTypeBadge };
export type { AuditTypeBadgeProps };
