/**
 * @file Select.tsx
 * @description Componente de select com estilo glassmorphism
 * @module components/ui
 *
 * @example
 * <Select
 *   label="Status"
 *   options={[
 *     { value: 'active', label: 'Ativo' },
 *     { value: 'paused', label: 'Pausado' },
 *   ]}
 * />
 */

'use client';

import { forwardRef, useId } from 'react';

import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** Label do select */
  label?: string;
  /** Opções do select */
  options: readonly SelectOption[] | SelectOption[];
  /** Placeholder quando nenhuma opção está selecionada */
  placeholder?: string;
  /** Mensagem de erro */
  error?: string;
  /** Texto de ajuda */
  helperText?: string;
  /** Se o campo é obrigatório */
  required?: boolean;
}

/**
 * Componente de select estilizado com suporte a label,
 * opções, erro e texto de ajuda
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      placeholder,
      error,
      helperText,
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

        {/* Select container */}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm',
              'text-white',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]',
              // Padding
              'py-2.5 pl-4 pr-10',
              // Appearance
              'appearance-none cursor-pointer',
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
          >
            {placeholder && (
              <option value="" disabled className="bg-[#0a0a0f] text-zinc-500">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-[#0a0a0f] text-white"
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';

export { Select };
export type { SelectOption, SelectProps };
