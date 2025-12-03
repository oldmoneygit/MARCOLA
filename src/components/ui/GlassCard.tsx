/**
 * @file GlassCard.tsx
 * @description Componente de card com efeito glassmorphism
 * @module components/ui
 *
 * @example
 * <GlassCard>
 *   <h2>Conteúdo</h2>
 * </GlassCard>
 *
 * @example
 * <GlassCard variant="elevated" hover>
 *   <p>Card com hover effect</p>
 * </GlassCard>
 */

import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

type GlassCardVariant = 'default' | 'elevated' | 'subtle';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visual do card */
  variant?: GlassCardVariant;
  /** Se o card tem efeito hover */
  hover?: boolean;
  /** Se o card tem padding interno */
  padding?: boolean;
  /** Tamanho do padding */
  size?: 'sm' | 'md' | 'lg';
  /** Se o card está em estado de loading */
  loading?: boolean;
}

const variantStyles: Record<GlassCardVariant, string> = {
  default: 'bg-white/[0.03] border-white/[0.08]',
  elevated: 'bg-white/[0.05] border-white/[0.10] shadow-xl shadow-black/20',
  subtle: 'bg-white/[0.02] border-white/[0.05]',
};

const sizeStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Card com efeito glassmorphism seguindo o design system do TrafficHub
 * Usa backdrop-blur e bordas semi-transparentes para criar efeito de vidro
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      hover = false,
      padding = true,
      size = 'md',
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'relative rounded-2xl border backdrop-blur-xl',
          // Variante
          variantStyles[variant],
          // Padding
          padding && sizeStyles[size],
          // Hover effect
          hover && 'transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15]',
          // Loading state
          loading && 'animate-pulse',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
export type { GlassCardProps, GlassCardVariant };
