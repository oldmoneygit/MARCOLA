/**
 * @file useBriefingTemplates.ts
 * @description Hook para gerenciamento de templates de briefing
 * @module hooks
 *
 * @example
 * const { templates, createTemplate } = useBriefingTemplates({ segment: 'delivery' });
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  BriefingTemplateWithQuestions,
  CreateBriefingTemplateDTO,
  UpdateBriefingTemplateDTO,
} from '@/types';

interface UseBriefingTemplatesOptions {
  /** Segmento para filtrar templates */
  segment?: string;
  /** Filtrar apenas ativos */
  activeOnly?: boolean;
  /** Busca automática ao montar */
  autoFetch?: boolean;
}

interface UseBriefingTemplatesState {
  templates: BriefingTemplateWithQuestions[];
  loading: boolean;
  error: string | null;
}

interface UseBriefingTemplatesReturn extends UseBriefingTemplatesState {
  /** Busca templates */
  fetchTemplates: () => Promise<void>;
  /** Busca um template específico */
  getTemplate: (id: string) => BriefingTemplateWithQuestions | undefined;
  /** Cria um novo template */
  createTemplate: (data: CreateBriefingTemplateDTO) => Promise<BriefingTemplateWithQuestions>;
  /** Atualiza um template */
  updateTemplate: (id: string, data: UpdateBriefingTemplateDTO) => Promise<BriefingTemplateWithQuestions>;
  /** Deleta um template */
  deleteTemplate: (id: string) => Promise<void>;
  /** Ativa/desativa um template */
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  /** Templates ativos */
  activeTemplates: BriefingTemplateWithQuestions[];
  /** Segmentos únicos dos templates */
  segments: string[];
  /** Total de templates */
  totalTemplates: number;
}

/**
 * Hook para gerenciamento de templates de briefing
 */
export function useBriefingTemplates(options: UseBriefingTemplatesOptions = {}): UseBriefingTemplatesReturn {
  const { segment, activeOnly = false, autoFetch = true } = options;

  const [state, setState] = useState<UseBriefingTemplatesState>({
    templates: [],
    loading: true,
    error: null,
  });

  /**
   * Busca templates da API
   */
  const fetchTemplates = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (segment) {
        params.append('segment', segment);
      }
      if (activeOnly) {
        params.append('is_active', 'true');
      }

      const url = `/api/briefings${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar templates de briefing');
      }

      const data = await response.json();
      setState({ templates: data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar templates';
      console.error('[useBriefingTemplates] fetchTemplates error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [segment, activeOnly]);

  /**
   * Busca um template específico pelo ID
   */
  const getTemplate = useCallback(
    (id: string) => {
      return state.templates.find((template) => template.id === id);
    },
    [state.templates]
  );

  /**
   * Cria um novo template
   */
  const createTemplate = useCallback(
    async (data: CreateBriefingTemplateDTO): Promise<BriefingTemplateWithQuestions> => {
      try {
        const response = await fetch('/api/briefings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar template');
        }

        const newTemplate = await response.json();

        setState((prev) => ({
          ...prev,
          templates: [...prev.templates, newTemplate],
        }));

        return newTemplate;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar template';
        console.error('[useBriefingTemplates] createTemplate error:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Atualiza um template
   */
  const updateTemplate = useCallback(
    async (id: string, data: UpdateBriefingTemplateDTO): Promise<BriefingTemplateWithQuestions> => {
      try {
        const response = await fetch(`/api/briefings/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar template');
        }

        const updatedTemplate = await response.json();

        setState((prev) => ({
          ...prev,
          templates: prev.templates.map((t) => (t.id === id ? updatedTemplate : t)),
        }));

        return updatedTemplate;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar template';
        console.error('[useBriefingTemplates] updateTemplate error:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Deleta um template
   */
  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/briefings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar template');
      }

      setState((prev) => ({
        ...prev,
        templates: prev.templates.filter((t) => t.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar template';
      console.error('[useBriefingTemplates] deleteTemplate error:', err);
      throw new Error(message);
    }
  }, []);

  /**
   * Ativa/desativa um template
   */
  const toggleActive = useCallback(
    async (id: string, isActive: boolean): Promise<void> => {
      await updateTemplate(id, { is_active: isActive });
    },
    [updateTemplate]
  );

  // Computed values
  const activeTemplates = useMemo(
    () => state.templates.filter((t) => t.is_active),
    [state.templates]
  );

  const segments = useMemo(() => {
    const uniqueSegments = Array.from(new Set(state.templates.map((t) => t.segment)));
    return uniqueSegments.sort();
  }, [state.templates]);

  const totalTemplates = state.templates.length;

  // Fetch inicial
  useEffect(() => {
    if (autoFetch) {
      fetchTemplates();
    }
  }, [fetchTemplates, autoFetch]);

  return {
    ...state,
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleActive,
    activeTemplates,
    segments,
    totalTemplates,
  };
}
