/**
 * @file Input.tsx
 * @description Componente de input com estilo glassmorphism
 * @module components/ui
 *
 * @example
 * <Input
 *   label="Email"
 *   placeholder="seu@email.com"
 *   type="email"
 * />
 *
 * @example
 * <Input
 *   label="Buscar"
 *   leftIcon={<SearchIcon />}
 *   error="Campo obrigatório"
 * />
 */

'use client';

import { forwardRef, useId } from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label do input */
  label?: string;
  /** Mensagem de erro */
  error?: string;
  /** Texto de ajuda */
  helperText?: string;
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
  /** Se o campo é obrigatório */
  required?: boolean;
}

/**
 * Componente de input estilizado com suporte a label,
 * ícones, erro e texto de ajuda
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium mb-2',
              hasError ? 'text-red-400' : 'text-zinc-300'
            )}
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            type={type}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm',
              'text-white placeholder:text-zinc-500',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]',
              // Padding
              'py-2.5',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-10' : 'pr-4',
              // Border & focus states
              hasError
                ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500'
                : 'border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50',
              // Hover
              !disabled && 'hover:border-white/[0.15] hover:bg-white/[0.05]',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p id={`${id}-error`} className="mt-1.5 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p id={`${id}-helper`} className="mt-1.5 text-sm text-zinc-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
