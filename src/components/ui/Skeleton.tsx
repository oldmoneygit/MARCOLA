/**
 * @file Skeleton.tsx
 * @description Componente de skeleton para estados de loading
 * @module components/ui
 *
 * @example
 * <Skeleton className="h-4 w-32" />
 *
 * @example
 * <Skeleton variant="circular" className="w-10 h-10" />
 *
 * @example
 * <Skeleton.Card />
 * <Skeleton.Text lines={3} />
 */

import { cn } from '@/lib/utils';

type SkeletonVariant = 'rectangular' | 'circular' | 'text';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante do skeleton */
  variant?: SkeletonVariant;
  /** Se deve animar */
  animate?: boolean;
}

const variantStyles: Record<SkeletonVariant, string> = {
  rectangular: 'rounded-lg',
  circular: 'rounded-full',
  text: 'rounded h-4',
};

/**
 * Componente base de skeleton para estados de loading
 */
function Skeleton({
  className,
  variant = 'rectangular',
  animate = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white/[0.05]',
        animate && 'animate-pulse',
        variantStyles[variant],
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton de texto com múltiplas linhas
 */
interface SkeletonTextProps {
  /** Número de linhas */
  lines?: number;
  /** Classes adicionais */
  className?: string;
}

function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={cn(
            'h-4',
            // Última linha é mais curta
            index === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton de card completo
 */
interface SkeletonCardProps {
  /** Se mostra header */
  showHeader?: boolean;
  /** Se mostra avatar */
  showAvatar?: boolean;
  /** Número de linhas de conteúdo */
  contentLines?: number;
  /** Classes adicionais */
  className?: string;
}

function SkeletonCard({
  showHeader = true,
  showAvatar = false,
  contentLines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]',
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          {showAvatar && <Skeleton variant="circular" className="w-10 h-10" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <SkeletonText lines={contentLines} />
    </div>
  );
}

/**
 * Skeleton de tabela
 */
interface SkeletonTableProps {
  /** Número de linhas */
  rows?: number;
  /** Número de colunas */
  columns?: number;
  /** Classes adicionais */
  className?: string;
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-white/[0.08]">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'w-1/4 flex-none'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton de metric card
 */
function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <Skeleton className="h-9 w-32 mb-3" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

// Attach sub-components
Skeleton.Text = SkeletonText;
Skeleton.Card = SkeletonCard;
Skeleton.Table = SkeletonTable;
Skeleton.Metric = SkeletonMetric;

export { Skeleton, SkeletonCard, SkeletonMetric, SkeletonTable, SkeletonText };
export type { SkeletonCardProps, SkeletonProps, SkeletonTableProps, SkeletonTextProps, SkeletonVariant };
