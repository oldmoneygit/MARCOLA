/**
 * @file NoteCard.tsx
 * @description Componente de card para exibição de notas de cliente
 * @module components/tasks
 *
 * @example
 * <NoteCard note={note} onTogglePin={handleTogglePin} />
 */

'use client';

import { useCallback, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';

import type { ClientNote } from '@/types';

interface NoteCardProps {
  /** Dados da nota */
  note: ClientNote;
  /** Callback ao fixar/desfixar */
  onTogglePin?: (noteId: string, isPinned: boolean) => Promise<void>;
  /** Callback ao editar */
  onEdit?: (note: ClientNote) => void;
  /** Callback ao deletar */
  onDelete?: (noteId: string) => Promise<void>;
  /** Classes adicionais */
  className?: string;
}

/**
 * Card para exibição de uma nota de cliente
 */
function NoteCard({ note, onTogglePin, onEdit, onDelete, className }: NoteCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTogglePin = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onTogglePin || isUpdating) {
        return;
      }

      setIsUpdating(true);
      try {
        await onTogglePin(note.id, !note.is_pinned);
      } finally {
        setIsUpdating(false);
      }
    },
    [note.id, note.is_pinned, onTogglePin, isUpdating]
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onEdit) {
        onEdit(note);
      }
    },
    [note, onEdit]
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onDelete || isUpdating) {
        return;
      }

      if (!window.confirm('Tem certeza que deseja excluir esta nota?')) {
        return;
      }

      setIsUpdating(true);
      try {
        await onDelete(note.id);
      } finally {
        setIsUpdating(false);
      }
    },
    [note.id, onDelete, isUpdating]
  );

  const timeAgo = formatDistanceToNow(new Date(note.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        'p-4 rounded-xl',
        'bg-white/[0.03] hover:bg-white/[0.06]',
        'border hover:border-white/[0.15]',
        'transition-all duration-200',
        note.is_pinned
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-white/[0.08]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {note.is_pinned && (
            <span className="text-amber-400 text-xs" title="Nota fixada">
              📌
            </span>
          )}
          <span className="text-xs text-zinc-500">{timeAgo}</span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          {onTogglePin && (
            <button
              type="button"
              onClick={handleTogglePin}
              disabled={isUpdating}
              className={cn(
                'p-1.5 rounded transition-colors',
                note.is_pinned
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.05]'
              )}
              aria-label={note.is_pinned ? 'Desfixar nota' : 'Fixar nota'}
              title={note.is_pinned ? 'Desfixar nota' : 'Fixar nota'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={handleEdit}
              disabled={isUpdating}
              className="p-1.5 text-zinc-500 hover:text-zinc-400 hover:bg-white/[0.05] rounded transition-colors"
              aria-label="Editar nota"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUpdating}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              aria-label="Excluir nota"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{note.content}</p>
    </div>
  );
}

export { NoteCard };
export type { NoteCardProps };
