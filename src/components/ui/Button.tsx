/**
 * @file Button.tsx
 * @description Componente de botão com múltiplas variantes
 * @module components/ui
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Salvar
 * </Button>
 *
 * @example
 * <Button variant="ghost" size="sm" leftIcon={<PlusIcon />}>
 *   Adicionar
 * </Button>
 */

'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual do botão */
  variant?: ButtonVariant;
  /** Tamanho do botão */
  size?: ButtonSize;
  /** Se o botão está em estado de loading */
  loading?: boolean;
  /** Ícone à esquerda do texto */
  leftIcon?: React.ReactNode;
  /** Ícone à direita do texto */
  rightIcon?: React.ReactNode;
  /** Se o botão ocupa 100% da largura */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-gradient-to-r from-violet-600 to-indigo-600',
    'hover:from-violet-500 hover:to-indigo-500',
    'text-white shadow-lg shadow-violet-500/25',
    'border-transparent'
  ),
  secondary: cn(
    'bg-white/[0.05] hover:bg-white/[0.10]',
    'text-white border-white/[0.10]',
    'hover:border-white/[0.20]'
  ),
  ghost: cn(
    'bg-transparent hover:bg-white/[0.05]',
    'text-zinc-400 hover:text-white',
    'border-transparent'
  ),
  danger: cn(
    'bg-red-500/10 hover:bg-red-500/20',
    'text-red-400 hover:text-red-300',
    'border-red-500/20 hover:border-red-500/30'
  ),
  success: cn(
    'bg-emerald-500/10 hover:bg-emerald-500/20',
    'text-emerald-400 hover:text-emerald-300',
    'border-emerald-500/20 hover:border-emerald-500/30'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

/**
 * Componente de botão reutilizável com suporte a variantes,
 * tamanhos, ícones e estado de loading
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'font-medium rounded-xl border',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]',
          // Variante
          variantStyles[variant],
          // Tamanho
          sizeStyles[size],
          // Full width
          fullWidth && 'w-full',
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Left icon */}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}

        {/* Children */}
        {children}

        {/* Right icon */}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonSize, ButtonVariant };
