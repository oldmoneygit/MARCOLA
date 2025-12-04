/**
 * @file ChecklistView.tsx
 * @description Componente para visualização e interação com checklist de tarefas
 * @module components/tasks
 *
 * @example
 * <ChecklistView
 *   items={task.checklist}
 *   onToggleItem={(id) => handleToggle(id)}
 * />
 */

'use client';

import { useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';

import type { ChecklistItem } from '@/types';

interface ChecklistViewProps {
  /** Itens do checklist */
  items: ChecklistItem[];
  /** Callback ao clicar em um item */
  onToggleItem?: (itemId: string) => void;
  /** Se o checklist é editável */
  editable?: boolean;
  /** Tamanho do componente */
  size?: 'sm' | 'md' | 'lg';
  /** Mostra a barra de progresso */
  showProgress?: boolean;
  /** Classes adicionais */
  className?: string;
}

const sizeStyles = {
  sm: {
    container: 'gap-1.5',
    item: 'py-1 px-2 text-xs gap-2',
    checkbox: 'w-4 h-4',
    icon: 'xs' as const,
    progressHeight: 'h-1',
  },
  md: {
    container: 'gap-2',
    item: 'py-1.5 px-3 text-sm gap-2.5',
    checkbox: 'w-5 h-5',
    icon: 'sm' as const,
    progressHeight: 'h-1.5',
  },
  lg: {
    container: 'gap-2.5',
    item: 'py-2 px-4 text-base gap-3',
    checkbox: 'w-6 h-6',
    icon: 'md' as const,
    progressHeight: 'h-2',
  },
};

/**
 * Componente para visualização e interação com checklist de tarefas
 * Design glassmorphism com checkboxes animados
 */
function ChecklistView({
  items,
  onToggleItem,
  editable = false,
  size = 'md',
  showProgress = true,
  className,
}: ChecklistViewProps) {
  const sizeStyle = sizeStyles[size];

  // Calcula progresso
  const { completedCount, totalCount, progressPercentage } = useMemo(() => {
    const total = items.length;
    const completed = items.filter((item) => item.done).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      completedCount: completed,
      totalCount: total,
      progressPercentage: percentage,
    };
  }, [items]);

  const handleClick = useCallback(
    (itemId: string) => {
      if (editable && onToggleItem) {
        onToggleItem(itemId);
      }
    },
    [editable, onToggleItem]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Progress bar */}
      {showProgress && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-400">
              Progresso
            </span>
            <span className="text-xs font-medium text-zinc-300">
              {completedCount}/{totalCount} ({progressPercentage}%)
            </span>
          </div>
          <div
            className={cn(
              'w-full bg-zinc-800 rounded-full overflow-hidden',
              sizeStyle.progressHeight
            )}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                progressPercentage === 100
                  ? 'bg-emerald-500'
                  : progressPercentage >= 50
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className={cn('flex flex-col', sizeStyle.container)}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              // Base
              'flex items-center rounded-lg',
              'border border-white/[0.06]',
              'transition-all duration-200',
              // Background
              item.done
                ? 'bg-emerald-500/10'
                : 'bg-white/[0.02]',
              // Editable styles
              editable && 'cursor-pointer hover:bg-white/[0.05]',
              // Size
              sizeStyle.item
            )}
            role={editable ? 'checkbox' : undefined}
            aria-checked={editable ? item.done : undefined}
          >
            {/* Checkbox */}
            <div
              className={cn(
                'flex items-center justify-center flex-shrink-0',
                'rounded-md border transition-all duration-200',
                item.done
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-transparent border-zinc-600',
                sizeStyle.checkbox
              )}
            >
              {item.done && (
                <Icon
                  name="check"
                  size={sizeStyle.icon}
                  className="text-white"
                />
              )}
            </div>

            {/* Text */}
            <span
              className={cn(
                'flex-1 transition-all duration-200',
                item.done
                  ? 'text-zinc-400 line-through'
                  : 'text-zinc-200'
              )}
            >
              {item.text}
            </span>

            {/* Category badge (if exists) */}
            {item.category && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
                {item.category}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { ChecklistView };
export type { ChecklistViewProps };
