/**
 * @file useClientNotes.ts
 * @description Hook para gerenciamento de notas de cliente
 * @module hooks
 *
 * @example
 * const { notes, createNote, pinNote } = useClientNotes({ clientId: '...' });
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ClientNote, CreateClientNoteDTO, UpdateClientNoteDTO } from '@/types';

interface UseClientNotesOptions {
  /** ID do cliente (obrigatório) */
  clientId: string;
  /** Busca automática ao montar */
  autoFetch?: boolean;
}

interface UseClientNotesState {
  notes: ClientNote[];
  loading: boolean;
  error: string | null;
}

interface UseClientNotesReturn extends UseClientNotesState {
  /** Busca notas do cliente */
  fetchNotes: () => Promise<void>;
  /** Busca uma nota específica */
  getNote: (id: string) => ClientNote | undefined;
  /** Cria uma nova nota */
  createNote: (content: string, isPinned?: boolean) => Promise<ClientNote>;
  /** Atualiza uma nota */
  updateNote: (id: string, data: UpdateClientNoteDTO) => Promise<ClientNote>;
  /** Deleta uma nota */
  deleteNote: (id: string) => Promise<void>;
  /** Fixa/desfixa uma nota */
  togglePin: (id: string, isPinned: boolean) => Promise<void>;
  /** Notas fixadas */
  pinnedNotes: ClientNote[];
  /** Notas não fixadas */
  unpinnedNotes: ClientNote[];
  /** Total de notas */
  totalNotes: number;
}

/**
 * Hook para gerenciamento de notas de cliente
 */
export function useClientNotes(options: UseClientNotesOptions): UseClientNotesReturn {
  const { clientId, autoFetch = true } = options;

  const [state, setState] = useState<UseClientNotesState>({
    notes: [],
    loading: true,
    error: null,
  });

  /**
   * Busca notas do cliente
   */
  const fetchNotes = useCallback(async () => {
    if (!clientId) {
      setState({ notes: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/notes?client_id=${clientId}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar notas');
      }

      const data = await response.json();
      setState({ notes: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar notas';
      console.error('[useClientNotes] fetchNotes error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [clientId]);

  /**
   * Busca uma nota específica pelo ID
   */
  const getNote = useCallback(
    (id: string) => {
      return state.notes.find((note) => note.id === id);
    },
    [state.notes]
  );

  /**
   * Cria uma nova nota
   */
  const createNote = useCallback(
    async (content: string, isPinned = false): Promise<ClientNote> => {
      try {
        const data: CreateClientNoteDTO = {
          client_id: clientId,
          content,
          is_pinned: isPinned,
        };

        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar nota');
        }

        const newNote = await response.json();

        setState((prev) => ({
          ...prev,
          // Inserir no início se fixada, senão após as fixadas
          notes: isPinned
            ? [newNote, ...prev.notes]
            : [
                ...prev.notes.filter((n) => n.is_pinned),
                newNote,
                ...prev.notes.filter((n) => !n.is_pinned),
              ],
        }));

        return newNote;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar nota';
        console.error('[useClientNotes] createNote error:', err);
        throw new Error(message);
      }
    },
    [clientId]
  );

  /**
   * Atualiza uma nota
   */
  const updateNote = useCallback(
    async (id: string, data: UpdateClientNoteDTO): Promise<ClientNote> => {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar nota');
        }

        const updatedNote = await response.json();

        setState((prev) => ({
          ...prev,
          notes: prev.notes.map((n) => (n.id === id ? updatedNote : n)),
        }));

        return updatedNote;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar nota';
        console.error('[useClientNotes] updateNote error:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Deleta uma nota
   */
  const deleteNote = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar nota');
      }

      setState((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar nota';
      console.error('[useClientNotes] deleteNote error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Fixa/desfixa uma nota
   */
  const togglePin = useCallback(
    async (id: string, isPinned: boolean): Promise<void> => {
      await updateNote(id, { is_pinned: isPinned });
      // Re-fetch para reordenar
      await fetchNotes();
    },
    [updateNote, fetchNotes]
  );

  // Computed values
  const pinnedNotes = useMemo(() => state.notes.filter((n) => n.is_pinned), [state.notes]);

  const unpinnedNotes = useMemo(() => state.notes.filter((n) => !n.is_pinned), [state.notes]);

  const totalNotes = state.notes.length;

  // Fetch inicial
  useEffect(() => {
    if (autoFetch && clientId) {
      fetchNotes();
    }
  }, [fetchNotes, autoFetch, clientId]);

  return {
    ...state,
    fetchNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    pinnedNotes,
    unpinnedNotes,
    totalNotes,
  };
}
