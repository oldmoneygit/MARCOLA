/**
 * @file ClientFilters.tsx
 * @description Componente de filtros para lista de clientes
 * @module components/clients
 *
 * @example
 * <ClientFilters
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   onSearch={handleSearch}
 * />
 */

'use client';

import { useCallback } from 'react';

import { Input, Select } from '@/components/ui';
import { SEGMENTS } from '@/lib/constants';

import type { ClientStatus } from '@/types';

export interface ClientFiltersState {
  search: string;
  status: ClientStatus | 'all';
  segment: string;
}

interface ClientFiltersProps {
  filters: ClientFiltersState;
  onFiltersChange: (filters: ClientFiltersState) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'active', label: 'Ativos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'inactive', label: 'Inativos' },
];

const SEGMENT_OPTIONS = [
  { value: '', label: 'Todos os segmentos' },
  ...SEGMENTS,
];

/**
 * Barra de filtros para lista de clientes
 */
export function ClientFilters({ filters, onFiltersChange }: ClientFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, search: e.target.value });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFiltersChange({ ...filters, status: e.target.value as ClientStatus | 'all' });
    },
    [filters, onFiltersChange]
  );

  const handleSegmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFiltersChange({ ...filters, segment: e.target.value });
    },
    [filters, onFiltersChange]
  );

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
      {/* Busca */}
      <div className="flex-1">
        <Input
          placeholder="Buscar cliente..."
          value={filters.search}
          onChange={handleSearchChange}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Status */}
      <div className="w-full sm:w-48">
        <Select options={STATUS_OPTIONS} value={filters.status} onChange={handleStatusChange} />
      </div>

      {/* Segmento */}
      <div className="w-full sm:w-48">
        <Select options={SEGMENT_OPTIONS} value={filters.segment} onChange={handleSegmentChange} />
      </div>
    </div>
  );
}

/**
 * Hook para usar com ClientFilters
 */
export function useClientFilters(initialFilters?: Partial<ClientFiltersState>) {
  const defaultFilters: ClientFiltersState = {
    search: '',
    status: 'all',
    segment: '',
    ...initialFilters,
  };

  return defaultFilters;
}
