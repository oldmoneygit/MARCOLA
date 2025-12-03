/**
 * @file GenerateIntelligenceButton.tsx
 * @description Botão para gerar/regenerar inteligência do cliente
 * @module components/intelligence
 */

'use client';

import { Button, Icon } from '@/components/ui';

interface GenerateIntelligenceButtonProps {
  /** Se já existe inteligência (para mostrar "Regenerar") */
  hasExisting?: boolean;
  /** Se está gerando */
  generating?: boolean;
  /** Se a inteligência está desatualizada */
  isStale?: boolean;
  /** Callback de clique */
  onClick: () => void;
  /** Variante do botão */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Tamanho do botão */
  size?: 'sm' | 'md' | 'lg';
  /** Classes adicionais */
  className?: string;
}

/**
 * Botão para gerar ou regenerar inteligência do cliente
 */
export function GenerateIntelligenceButton({
  hasExisting = false,
  generating = false,
  isStale = false,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
}: GenerateIntelligenceButtonProps) {
  const getLabel = () => {
    if (generating) {
      return 'Gerando...';
    }
    if (hasExisting) {
      return isStale ? 'Atualizar Inteligência' : 'Regenerar Inteligência';
    }
    return 'Gerar Inteligência';
  };

  const getIcon = () => {
    if (generating) {
      return (
        <svg
          className="w-4 h-4 animate-spin"
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
      );
    }
    if (hasExisting) {
      return <Icon name="refresh-cw" size="sm" />;
    }
    return <Icon name="sparkles" size="sm" />;
  };

  return (
    <Button
      onClick={onClick}
      disabled={generating}
      variant={variant}
      size={size}
      className={className}
    >
      {getIcon()}
      <span className="ml-2">{getLabel()}</span>
    </Button>
  );
}
