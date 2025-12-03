/**
 * @file ClientList.tsx
 * @description Grid de cards de clientes com filtros
 * @module components/clients
 *
 * @example
 * <ClientList clients={clients} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
 */

'use client';

import { useMemo, useState } from 'react';

import { EmptyState, Skeleton } from '@/components/ui';

import { ClientCard } from './ClientCard';
import { ClientFilters, type ClientFiltersState, useClientFilters } from './ClientFilters';

import type { Client, Task } from '@/types';

interface ClientListProps {
  clients: Client[];
  tasks?: Task[];
  loading?: boolean;
  onView?: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onCompleteTask?: (taskId: string) => Promise<void>;
  onStartTask?: (taskId: string) => Promise<void>;
}

/** Ordem de prioridade (menor = mais urgente) */
const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Lista de clientes em grid com filtros
 */
export function ClientList({
  clients,
  tasks = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onCompleteTask,
  onStartTask,
}: ClientListProps) {
  const [filters, setFilters] = useState<ClientFiltersState>(useClientFilters());

  // Cria mapa de tarefas pendentes por cliente
  const tasksByClient = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.status === 'todo' || task.status === 'doing') {
        const clientTasks = map[task.client_id] ?? [];
        clientTasks.push(task);
        map[task.client_id] = clientTasks;
      }
    });
    return map;
  }, [tasks]);

  // Calcula a maior prioridade de cada cliente
  const highestPriorityByClient = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(tasksByClient).forEach(([clientId, clientTasks]) => {
      let highest = 'low';
      let highestOrder: number = PRIORITY_ORDER.low ?? 3;
      clientTasks.forEach((task) => {
        const order = PRIORITY_ORDER[task.priority] ?? 4;
        if (order < highestOrder) {
          highestOrder = order;
          highest = task.priority;
        }
      });
      map[clientId] = highest;
    });
    return map;
  }, [tasksByClient]);

  // Aplica filtros e ordena por prioridade de tarefas pendentes
  const filteredClients = useMemo(() => {
    const filtered = clients.filter((client) => {
      // Filtro de busca
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(searchLower);
        const matchesContact = client.contact_name?.toLowerCase().includes(searchLower);
        const matchesEmail = client.contact_email?.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesContact && !matchesEmail) {
          return false;
        }
      }

      // Filtro de status
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }

      // Filtro de segmento
      if (filters.segment && client.segment !== filters.segment) {
        return false;
      }

      return true;
    });

    // Ordena por prioridade de tarefas pendentes (mais urgentes primeiro)
    return filtered.sort((a, b) => {
      const tasksA = tasksByClient[a.id];
      const tasksB = tasksByClient[b.id];
      const hasTasks_A = tasksA && tasksA.length > 0;
      const hasTasks_B = tasksB && tasksB.length > 0;

      // Se ambos têm tarefas pendentes, ordena por prioridade
      if (hasTasks_A && hasTasks_B) {
        const priorityA = PRIORITY_ORDER[highestPriorityByClient[a.id] ?? 'low'] ?? 4;
        const priorityB = PRIORITY_ORDER[highestPriorityByClient[b.id] ?? 'low'] ?? 4;
        return priorityA - priorityB;
      }
      // Se só A tem tarefas, A vem primeiro
      if (hasTasks_A) {
        return -1;
      }
      // Se só B tem tarefas, B vem primeiro
      if (hasTasks_B) {
        return 1;
      }
      // Se nenhum tem tarefas, mantém ordem original (por nome)
      return a.name.localeCompare(b.name);
    });
  }, [clients, filters, tasksByClient, highestPriorityByClient]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Filtros skeleton */}
        <div className="h-14 rounded-xl bg-white/[0.02] animate-pulse" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton.Card key={i} showAvatar />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <EmptyState
        title="Nenhum cliente cadastrado"
        description="Comece adicionando seu primeiro cliente para gerenciar suas campanhas."
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <ClientFilters filters={filters} onFiltersChange={setFilters} />

      {/* Resultados */}
      {filteredClients.length === 0 ? (
        <EmptyState.Search />
      ) : (
        <>
          {/* Contador */}
          <div className="text-sm text-zinc-400">
            {filteredClients.length === clients.length
              ? `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`
              : `${filteredClients.length} de ${clients.length} cliente${clients.length !== 1 ? 's' : ''}`}
          </div>

          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                pendingTasks={tasksByClient[client.id] || []}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onCompleteTask={onCompleteTask}
                onStartTask={onStartTask}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
