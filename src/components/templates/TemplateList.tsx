/**
 * @file TemplateList.tsx
 * @description Lista de templates agrupados por recorrência
 * @module components/templates
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Clock, Calendar, CalendarDays, CalendarRange, CalendarCheck, Settings, Tag, Star } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { PriorityBadge, CategoryBadge, RecurrenceBadge } from '@/components/tasks';

import type { TaskTemplate, TaskCategory } from '@/types';

interface TemplateListProps {
  templates: TaskTemplate[];
  onSelectTemplate?: (template: TaskTemplate) => void;
  showCategoryFilter?: boolean;
}

/** Configuração visual das recorrências */
const RECURRENCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; order: number }> = {
  daily: {
    label: 'Diárias',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-red-400',
    order: 1,
  },
  every_3_days: {
    label: 'A cada 3 dias',
    icon: <CalendarDays className="w-4 h-4" />,
    color: 'text-orange-400',
    order: 2,
  },
  weekly: {
    label: 'Semanais',
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-yellow-400',
    order: 3,
  },
  biweekly: {
    label: 'Quinzenais',
    icon: <CalendarRange className="w-4 h-4" />,
    color: 'text-green-400',
    order: 4,
  },
  monthly: {
    label: 'Mensais',
    icon: <CalendarCheck className="w-4 h-4" />,
    color: 'text-blue-400',
    order: 5,
  },
  none: {
    label: 'Sem recorrência',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-zinc-400',
    order: 99,
  },
};

/** Configuração visual das categorias */
const CATEGORY_ICONS: Record<TaskCategory, React.ReactNode> = {
  operational: <Settings className="w-4 h-4 text-emerald-400" />,
  niche: <Tag className="w-4 h-4 text-blue-400" />,
  custom: <Star className="w-4 h-4 text-amber-400" />,
};

/**
 * Lista de templates agrupados por recorrência
 */
export function TemplateList({ templates, onSelectTemplate, showCategoryFilter = true }: TemplateListProps) {
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [expandedRecurrence, setExpandedRecurrence] = useState<string | null>('daily');

  // Separar templates por categoria
  const operationalTemplates = useMemo(
    () => templates.filter(t => t.category === 'operational'),
    [templates]
  );
  const nicheTemplates = useMemo(
    () => templates.filter(t => t.category === 'niche'),
    [templates]
  );
  const customTemplates = useMemo(
    () => templates.filter(t => t.category === 'custom' || !t.category),
    [templates]
  );

  // Filtrar baseado na seleção
  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'all') {
      return templates;
    }
    if (categoryFilter === 'operational') {
      return operationalTemplates;
    }
    if (categoryFilter === 'niche') {
      return nicheTemplates;
    }
    return customTemplates;
  }, [templates, categoryFilter, operationalTemplates, nicheTemplates, customTemplates]);

  // Agrupar por recorrência
  const groupedByRecurrence = useMemo(() => {
    const groups: Record<string, TaskTemplate[]> = {};

    filteredTemplates.forEach(template => {
      const key = template.recurrence || 'none';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(template);
    });

    // Ordenar templates dentro de cada grupo por order_index
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.order_index - b.order_index);
    });

    return groups;
  }, [filteredTemplates]);

  // Ordenar recorrências
  const sortedRecurrences = useMemo(() => {
    return Object.keys(groupedByRecurrence).sort((a, b) => {
      const orderA = RECURRENCE_CONFIG[a]?.order || 99;
      const orderB = RECURRENCE_CONFIG[b]?.order || 99;
      return orderA - orderB;
    });
  }, [groupedByRecurrence]);

  const toggleRecurrence = (recurrence: string) => {
    setExpandedRecurrence(prev => prev === recurrence ? null : recurrence);
  };

  return (
    <div className="space-y-4">
      {/* Filtro de Categoria */}
      {showCategoryFilter && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            Todos ({templates.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('operational')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              categoryFilter === 'operational'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            Operacionais ({operationalTemplates.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('niche')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              categoryFilter === 'niche'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Tag className="w-4 h-4" />
            Por Nicho ({nicheTemplates.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('custom')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              categoryFilter === 'custom'
                ? 'bg-amber-500 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Star className="w-4 h-4" />
            Personalizados ({customTemplates.length})
          </button>
        </div>
      )}

      {/* Lista agrupada por recorrência */}
      <div className="space-y-3">
        {sortedRecurrences.map(recurrence => {
          const templatesInGroup = groupedByRecurrence[recurrence];
          if (!templatesInGroup || templatesInGroup.length === 0) {
            return null;
          }

          const configEntry = RECURRENCE_CONFIG[recurrence];
          const config = configEntry ?? RECURRENCE_CONFIG.none;
          const isExpanded = expandedRecurrence === recurrence;

          if (!config) {
            return null;
          }

          return (
            <GlassCard key={recurrence} className="overflow-hidden">
              {/* Header do grupo */}
              <button
                type="button"
                onClick={() => toggleRecurrence(recurrence)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={config.color}>
                    {config.icon}
                  </span>
                  <span className="font-medium text-white">
                    {config.label}
                  </span>
                  <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {templatesInGroup.length} templates
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {/* Lista de templates */}
              {isExpanded && (
                <div className="border-t border-white/5">
                  {templatesInGroup.map(template => (
                    <div
                      key={template.id}
                      onClick={() => onSelectTemplate?.(template)}
                      className={`px-4 py-3 border-b border-white/5 last:border-b-0 transition-colors ${
                        onSelectTemplate ? 'hover:bg-white/5 cursor-pointer' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {CATEGORY_ICONS[template.category || 'custom']}
                            <span className="font-medium text-white truncate">
                              {template.title}
                            </span>
                            {template.is_system && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-violet-500/20 text-violet-400 font-medium">
                                SISTEMA
                              </span>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                          {/* Tags */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <PriorityBadge priority={template.default_priority} size="sm" />
                            {template.category && (
                              <CategoryBadge category={template.category} size="sm" />
                            )}
                            {template.recurrence && (
                              <RecurrenceBadge recurrence={template.recurrence} size="sm" />
                            )}
                            {template.segment && template.category !== 'operational' && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-500/20 text-zinc-400">
                                {template.segment}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p className="text-zinc-400">Nenhum template encontrado para esta categoria.</p>
        </GlassCard>
      )}
    </div>
  );
}
