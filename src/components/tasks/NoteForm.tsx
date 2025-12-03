/**
 * @file NoteForm.tsx
 * @description Formulário para criação/edição de notas
 * @module components/tasks
 *
 * @example
 * <NoteForm onSubmit={handleSubmit} onCancel={handleCancel} />
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/Button';

import type { ClientNote } from '@/types';

interface NoteFormProps {
  /** Nota existente para edição */
  note?: ClientNote;
  /** Callback ao submeter */
  onSubmit: (content: string, isPinned: boolean) => Promise<void>;
  /** Callback ao cancelar */
  onCancel?: () => void;
  /** Se está carregando */
  loading?: boolean;
  /** Placeholder do textarea */
  placeholder?: string;
  /** Modo inline (menos bordas) */
  inline?: boolean;
  /** Auto-foca ao montar */
  autoFocus?: boolean;
  /** Classes adicionais */
  className?: string;
}

/**
 * Formulário para criação/edição de notas
 */
function NoteForm({
  note,
  onSubmit,
  onCancel,
  loading = false,
  placeholder = 'Escreva uma nota sobre o cliente...',
  inline = false,
  autoFocus = false,
  className,
}: NoteFormProps) {
  const [content, setContent] = useState(note?.content || '');
  const [isPinned, setIsPinned] = useState(note?.is_pinned || false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return;
      }

      await onSubmit(trimmedContent, isPinned);

      if (!note) {
        // Limpar após criar nova nota
        setContent('');
        setIsPinned(false);
      }
    },
    [content, isPinned, note, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl/Cmd + Enter para submeter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
      // Escape para cancelar
      if (e.key === 'Escape' && onCancel) {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  const showActions = isFocused || content.trim().length > 0 || note;

  if (inline) {
    return (
      <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className={cn(
            'w-full px-3 py-2 rounded-lg bg-white/[0.03] border text-white placeholder-zinc-500',
            'focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50',
            'transition-colors resize-none',
            isFocused ? 'border-violet-500/50' : 'border-white/[0.08]'
          )}
          disabled={loading}
        />

        {showActions && (
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-amber-500 focus:ring-amber-500/50"
                disabled={loading}
              />
              <span className="text-xs text-zinc-400">Fixar nota</span>
            </label>

            <div className="flex items-center gap-2">
              {onCancel && (
                <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                loading={loading}
                disabled={!content.trim()}
              >
                {note ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Conteúdo da Nota
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
          disabled={loading}
          required
        />
        <p className="mt-1 text-xs text-zinc-500">
          Dica: Ctrl+Enter para salvar, Esc para cancelar
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-amber-500 focus:ring-amber-500/50"
          disabled={loading}
        />
        <span className="text-sm text-zinc-300">Fixar nota no topo</span>
      </label>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading} disabled={!content.trim()}>
          {note ? 'Salvar Alterações' : 'Adicionar Nota'}
        </Button>
      </div>
    </form>
  );
}

export { NoteForm };
export type { NoteFormProps };
