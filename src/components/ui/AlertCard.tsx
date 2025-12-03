/**
 * @file AlertCard.tsx
 * @description Componente de alerta/notificação com diferentes variantes
 * @module components/ui
 *
 * @example
 * <AlertCard
 *   variant="warning"
 *   title="Atenção"
 *   message="O orçamento está próximo do limite."
 * />
 *
 * @example
 * <AlertCard
 *   variant="success"
 *   title="Sucesso!"
 *   message="Relatório gerado com sucesso."
 *   onDismiss={handleDismiss}
 * />
 */

import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertCardProps {
  /** Variante visual do alerta */
  variant?: AlertVariant;
  /** Título do alerta */
  title?: string;
  /** Mensagem do alerta */
  message: string;
  /** Callback para fechar o alerta */
  onDismiss?: () => void;
  /** Ícone customizado */
  icon?: React.ReactNode;
  /** Ações adicionais (botões) */
  actions?: React.ReactNode;
  /** Classes adicionais */
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  { bg: string; border: string; icon: string; title: string }
> = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    title: 'text-blue-300',
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    title: 'text-amber-300',
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    title: 'text-red-300',
  },
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  danger: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

/**
 * Componente de alerta para exibição de mensagens
 * de feedback, avisos e notificações
 */
function AlertCard({
  variant = 'info',
  title,
  message,
  onDismiss,
  icon,
  actions,
  className,
}: AlertCardProps) {
  const styles = variantStyles[variant];
  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative rounded-xl border p-4',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex gap-3">
        {/* Ícone */}
        <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
          {displayIcon}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('text-sm font-medium mb-1', styles.title)}>
              {title}
            </h4>
          )}
          <p className="text-sm text-zinc-300">{message}</p>

          {/* Ações */}
          {actions && <div className="mt-3 flex gap-2">{actions}</div>}
        </div>

        {/* Botão de fechar */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1 -m-1',
              'text-zinc-400 hover:text-white',
              'rounded-lg hover:bg-white/[0.05]',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-violet-500/50'
            )}
            aria-label="Fechar alerta"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export { AlertCard };
export type { AlertCardProps, AlertVariant };
