/**
 * @file CategoryBadge.tsx
 * @description Componente de badge para categoria de tarefas (Operacional/Nicho/Personalizada)
 * @module components/tasks
 *
 * @example
 * <CategoryBadge category="operational" />
 */

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';

import type { TaskCategory } from '@/types';

interface CategoryBadgeProps {
  /** Categoria da tarefa */
  category: TaskCategory;
  /** Tamanho do badge */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra o ícone */
  showIcon?: boolean;
  /** Classes adicionais */
  className?: string;
}

/** Configuração de estilos por categoria */
const categoryStyles: Record<TaskCategory, {
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  label: string;
}> = {
  operational: {
    bgColor: 'bg-blue-500/15',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/40',
    icon: 'settings',
    label: 'Operacional',
  },
  niche: {
    bgColor: 'bg-violet-500/15',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/40',
    icon: 'tag',
    label: 'Nicho',
  },
  custom: {
    bgColor: 'bg-amber-500/15',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/40',
    icon: 'star',
    label: 'Personalizada',
  },
};

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
 * Badge para exibição de categoria de tarefas
 * Design glassmorphism com ícone
 */
function CategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  const styles = categoryStyles[category] || categoryStyles.niche;
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
        styles.bgColor,
        styles.textColor,
        styles.borderColor,
        // Size
        sizeStyle.badge,
        className
      )}
    >
      {showIcon && (
        <Icon
          name={styles.icon}
          size={sizeStyle.icon}
          className="opacity-80"
        />
      )}
      {styles.label}
    </span>
  );
}

export { CategoryBadge };
export type { CategoryBadgeProps };
