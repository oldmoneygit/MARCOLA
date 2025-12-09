/**
 * @file ExecutionFilters.tsx
 * @description Barra de filtros para execuções
 * @module components/execution-history
 */

'use client';

import { Search } from 'lucide-react';
import type {
  ExecutionFilters as Filters,
} from '@/types/execution-history';
import {
  PERIOD_LABELS,
  ACTION_TYPE_LABELS,
  RESULT_LABELS,
} from '@/types/execution-history';

interface Client {
  id: string;
  name: string;
}

interface ExecutionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  clients?: Client[];
}

export function ExecutionFilters({
  filters,
  onFiltersChange,
  clients = [],
}: ExecutionFiltersProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  const selectClass =
    'w-full sm:w-auto px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white text-sm focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:outline-none';

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Período */}
        <select
          value={filters.period || 'month'}
          onChange={(e) => handleChange('period', e.target.value)}
          className={selectClass}
        >
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Cliente */}
        <select
          value={filters.clientId || 'all'}
          onChange={(e) => handleChange('clientId', e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos os Clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>

        {/* Tipo de Ação */}
        <select
          value={filters.actionType || 'all'}
          onChange={(e) => handleChange('actionType', e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos os Tipos</option>
          {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Resultado */}
        <select
          value={filters.result || 'all'}
          onChange={(e) => handleChange('result', e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos os Resultados</option>
          {Object.entries(RESULT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar execução..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white text-sm placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
