/**
 * @file useTaskTemplates.ts
 * @description Hook para gerenciamento de templates de tarefas
 * @module hooks
 *
 * @example
 * const { templates, createTemplate } = useTaskTemplates({ segment: 'Restaurante' });
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CreateTaskTemplateDTO, TaskTemplate, UpdateTaskTemplateDTO } from '@/types';

interface UseTaskTemplatesOptions {
  /** Segmento para filtrar templates */
  segment?: string;
  /** Filtrar apenas ativos */
  activeOnly?: boolean;
  /** Busca automática ao montar */
  autoFetch?: boolean;
}

interface UseTaskTemplatesState {
  templates: TaskTemplate[];
  loading: boolean;
  error: string | null;
}

interface UseTaskTemplatesReturn extends UseTaskTemplatesState {
  /** Busca templates */
  fetchTemplates: () => Promise<void>;
  /** Busca templates por segmento */
  fetchBySegment: (segment: string) => Promise<TaskTemplate[]>;
  /** Busca um template específico */
  getTemplate: (id: string) => TaskTemplate | undefined;
  /** Cria um novo template */
  createTemplate: (data: CreateTaskTemplateDTO) => Promise<TaskTemplate>;
  /** Atualiza um template */
  updateTemplate: (id: string, data: UpdateTaskTemplateDTO) => Promise<TaskTemplate>;
  /** Deleta um template */
  deleteTemplate: (id: string) => Promise<void>;
  /** Ativa/desativa um template */
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  /** Templates ativos */
  activeTemplates: TaskTemplate[];
  /** Segmentos únicos dos templates */
  segments: string[];
  /** Total de templates */
  totalTemplates: number;
}

/**
 * Transforma dados do banco para o formato do TypeScript
 * DB → Frontend mapping
 */
function transformDbToFrontend(dbTemplate: Record<string, unknown>): TaskTemplate {
  return {
    id: dbTemplate.id as string,
    user_id: dbTemplate.user_id as string,
    segment: dbTemplate.segment as string,
    title: dbTemplate.title as string,
    description: (dbTemplate.description as string | null) || null,
    // DB 'priority' → Frontend 'default_priority'
    default_priority: (dbTemplate.priority as TaskTemplate['default_priority']) || 'medium',
    // DB não tem este campo, usar 0 como default
    default_days_offset: 0,
    // DB 'recurrence' (null/valor) → Frontend 'is_recurring' (boolean)
    is_recurring: dbTemplate.recurrence !== null,
    recurrence: (dbTemplate.recurrence as TaskTemplate['recurrence']) || null,
    // DB 'notify_client' → Frontend 'send_whatsapp'
    send_whatsapp: (dbTemplate.notify_client as boolean) || false,
    // DB 'notify_message' → Frontend 'whatsapp_template'
    whatsapp_template: (dbTemplate.notify_message as string | null) || null,
    order_index: (dbTemplate.order_index as number) || 0,
    is_active: (dbTemplate.is_active as boolean) ?? true,
    created_at: dbTemplate.created_at as string,
    updated_at: dbTemplate.updated_at as string,
  };
}

/**
 * Hook para gerenciamento de templates de tarefas
 */
export function useTaskTemplates(options: UseTaskTemplatesOptions = {}): UseTaskTemplatesReturn {
  const { segment, activeOnly = false, autoFetch = true } = options;

  const [state, setState] = useState<UseTaskTemplatesState>({
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

      const url = `/api/templates${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erro ao buscar templates');
      }

      const data = await response.json();
      // Transformar dados do banco para o formato do frontend
      const templates = (data as Record<string, unknown>[]).map(transformDbToFrontend);
      setState({ templates, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar templates';
      console.error('[useTaskTemplates] fetchTemplates error:', err);
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [segment, activeOnly]);

  /**
   * Busca templates por segmento específico
   */
  const fetchBySegment = useCallback(async (targetSegment: string): Promise<TaskTemplate[]> => {
    try {
      const response = await fetch(`/api/templates/by-segment/${encodeURIComponent(targetSegment)}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar templates do segmento');
      }

      const data = await response.json();
      // Transformar dados do banco para o formato do frontend
      return (data as Record<string, unknown>[]).map(transformDbToFrontend);
    } catch (err) {
      console.error('[useTaskTemplates] fetchBySegment error:', err);
      throw err;
    }
  }, []);

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
    async (data: CreateTaskTemplateDTO): Promise<TaskTemplate> => {
      try {
        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar template');
        }

        const dbTemplate = await response.json();
        // Transformar dados do banco para o formato do frontend
        const newTemplate = transformDbToFrontend(dbTemplate);

        setState((prev) => ({
          ...prev,
          templates: [...prev.templates, newTemplate],
        }));

        return newTemplate;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar template';
        console.error('[useTaskTemplates] createTemplate error:', err);
        throw new Error(message);
      }
    },
    []
  );

  /**
   * Atualiza um template
   */
  const updateTemplate = useCallback(
    async (id: string, data: UpdateTaskTemplateDTO): Promise<TaskTemplate> => {
      try {
        const response = await fetch(`/api/templates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar template');
        }

        const dbTemplate = await response.json();
        // Transformar dados do banco para o formato do frontend
        const updatedTemplate = transformDbToFrontend(dbTemplate);

        setState((prev) => ({
          ...prev,
          templates: prev.templates.map((t) => (t.id === id ? updatedTemplate : t)),
        }));

        return updatedTemplate;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar template';
        console.error('[useTaskTemplates] updateTemplate error:', err);
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
      const response = await fetch(`/api/templates/${id}`, {
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
      console.error('[useTaskTemplates] deleteTemplate error:', err);
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
    fetchBySegment,
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
