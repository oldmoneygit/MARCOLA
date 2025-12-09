/**
 * @file ExecutionHistoryPageContent.tsx
 * @description Conteúdo principal da página de Histórico de Execuções
 * @module components/execution-history
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useExecutionHistory } from '@/hooks/useExecutionHistory';
import { ExecutionStatsCards } from './ExecutionStats';
import { ExecutionFilters } from './ExecutionFilters';
import { ExecutionTable } from './ExecutionTable';
import { ExecutionModal } from './ExecutionModal';
import type { TaskExecution, CreateExecutionDTO } from '@/types/execution-history';

interface Client {
  id: string;
  name: string;
}

export function ExecutionHistoryPageContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<TaskExecution | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TaskExecution | null>(null);

  const {
    executions,
    stats,
    loading,
    statsLoading,
    total,
    filters,
    setFilters,
    createExecution,
    updateExecution,
    deleteExecution,
    refresh,
  } = useExecutionHistory();

  // Busca lista de clientes para o filtro
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients?limit=100');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    }
    fetchClients();
  }, []);

  const handleCreateExecution = async (data: CreateExecutionDTO) => {
    await createExecution(data);
  };

  const handleEditExecution = async (data: CreateExecutionDTO) => {
    if (selectedExecution) {
      await updateExecution(selectedExecution.id, data);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteExecution(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const openCreateModal = () => {
    setSelectedExecution(null);
    setIsModalOpen(true);
  };

  const openEditModal = (execution: TaskExecution) => {
    setSelectedExecution(execution);
    setIsModalOpen(true);
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={refresh}
        disabled={loading}
        className="p-2.5 rounded-lg border border-white/[0.1] text-zinc-400 hover:bg-white/[0.05] hover:text-white transition-colors disabled:opacity-50"
        title="Atualizar"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
      <button
        onClick={openCreateModal}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nova Execução
      </button>
    </div>
  );

  return (
    <DashboardLayout
      title="Histórico de Execuções"
      subtitle="Acompanhe todas as ações e otimizações realizadas"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Stats */}
      <ExecutionStatsCards stats={stats} loading={statsLoading} />

      {/* Filters */}
      <ExecutionFilters
        filters={filters}
        onFiltersChange={setFilters}
        clients={clients}
      />

      {/* Result Count */}
      <div className="text-sm text-zinc-400">
        {total} execuç{total !== 1 ? 'ões' : 'ão'} encontrada{total !== 1 ? 's' : ''}
        {stats?.periodLabel && (
          <span className="text-zinc-500"> · {stats.periodLabel}</span>
        )}
      </div>

      {/* Table */}
      <ExecutionTable
        executions={executions}
        loading={loading}
        onEdit={openEditModal}
        onDelete={setDeleteConfirm}
      />

      {/* Create/Edit Modal */}
      <ExecutionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExecution(null);
        }}
        onSave={selectedExecution ? handleEditExecution : handleCreateExecution}
        execution={selectedExecution}
        clients={clients}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/[0.1] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Excluir Execução
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Tem certeza que deseja excluir &quot;{deleteConfirm.title}&quot;? Esta ação
              não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.1] text-zinc-300 hover:bg-white/[0.05] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
