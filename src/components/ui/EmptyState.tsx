/**
 * @file EmptyState.tsx
 * @description Componente para exibir estados vazios
 * @module components/ui
 *
 * @example
 * <EmptyState
 *   title="Nenhum cliente encontrado"
 *   description="Adicione seu primeiro cliente para começar."
 *   action={{
 *     label: "Adicionar Cliente",
 *     onClick: handleAddClient
 *   }}
 * />
 */

'use client';

import { cn } from '@/lib/utils';

import { Button } from './Button';
import { GlassCard } from './GlassCard';

interface EmptyStateAction {
  /** Label do botão */
  label: string;
  /** Callback do botão */
  onClick: () => void;
  /** Ícone do botão */
  icon?: React.ReactNode;
}

interface EmptyStateProps {
  /** Título do estado vazio */
  title: string;
  /** Descrição adicional */
  description?: string;
  /** Ícone ou ilustração */
  icon?: React.ReactNode;
  /** Ação principal */
  action?: EmptyStateAction;
  /** Ação secundária */
  secondaryAction?: EmptyStateAction;
  /** Se deve usar o GlassCard como container */
  withCard?: boolean;
  /** Classes adicionais */
  className?: string;
}

/**
 * Ícone padrão de estado vazio
 */
const DefaultEmptyIcon = () => (
  <svg
    className="w-12 h-12"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

/**
 * Componente para exibir quando não há dados
 * ou quando uma lista está vazia
 */
function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  withCard = true,
  className,
}: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Ícone */}
      <div className="mb-4 text-zinc-500">
        {icon ?? <DefaultEmptyIcon />}
      </div>

      {/* Título */}
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>

      {/* Descrição */}
      {description && (
        <p className="text-sm text-zinc-400 max-w-sm mb-6">{description}</p>
      )}

      {/* Ações */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              variant="primary"
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (withCard) {
    return (
      <GlassCard padding={false} className={className}>
        {content}
      </GlassCard>
    );
  }

  return <div className={cn(className)}>{content}</div>;
}

/**
 * Variantes pré-definidas de EmptyState
 */

interface EmptyStatePresetProps {
  action?: EmptyStateAction;
  className?: string;
}

/**
 * Estado vazio para lista de clientes
 */
function EmptyClients({ action, className }: EmptyStatePresetProps) {
  return (
    <EmptyState
      title="Nenhum cliente cadastrado"
      description="Comece adicionando seu primeiro cliente para gerenciar suas campanhas."
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
      action={action}
      className={className}
    />
  );
}

/**
 * Estado vazio para lista de relatórios
 */
function EmptyReports({ action, className }: EmptyStatePresetProps) {
  return (
    <EmptyState
      title="Nenhum relatório encontrado"
      description="Importe um relatório CSV para visualizar os dados de performance."
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
      action={action}
      className={className}
    />
  );
}

/**
 * Estado vazio para busca sem resultados
 */
function EmptySearch({ className }: { className?: string }) {
  return (
    <EmptyState
      title="Nenhum resultado encontrado"
      description="Tente ajustar os filtros ou termo de busca."
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      className={className}
    />
  );
}

// Attach presets
EmptyState.Clients = EmptyClients;
EmptyState.Reports = EmptyReports;
EmptyState.Search = EmptySearch;

export { EmptyState };
export type { EmptyStateAction, EmptyStatePresetProps, EmptyStateProps };
