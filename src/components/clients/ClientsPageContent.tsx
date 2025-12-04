/**
 * @file ClientsPageContent.tsx
 * @description Conteúdo interativo da página de clientes
 * @module components/clients
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Modal } from '@/components/ui';
import { useClients, useTasks } from '@/hooks';

import { ClientDetailModal } from './ClientDetailModal';
import { ClientFormStepper } from './ClientFormStepper';
import { ClientList } from './ClientList';
import { SmartClientCreator } from './SmartClientCreator';

import type { Client, CreateClientDTO } from '@/types';

type CreationMode = 'form' | 'smart';

/**
 * Conteúdo interativo da página de clientes
 * Gerencia estado de modais e ações
 */
export function ClientsPageContent() {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients();
  const { tasks, updateTask, completeTask } = useTasks();

  // Estado dos modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSmartOpen, setIsSmartOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [prefillData, setPrefillData] = useState<Partial<CreateClientDTO> | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handler para abrir modal de criação
  const handleNewClient = useCallback((mode: CreationMode) => {
    setShowDropdown(false);
    setEditingClient(null);
    setPrefillData(null);

    if (mode === 'smart') {
      setIsSmartOpen(true);
    } else {
      setIsFormOpen(true);
    }
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  // Fecha dropdown ao clicar fora
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowDropdown(false);
    }
  }, []);

  // Adiciona listener para fechar dropdown
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Abre modal de visualização
  const handleView = useCallback((client: Client) => {
    setViewingClient(client);
  }, []);

  // Fecha modal de visualização
  const handleCloseView = useCallback(() => {
    setViewingClient(null);
  }, []);

  // Abre modal de edição
  const handleEdit = useCallback((client: Client) => {
    setEditingClient(client);
    setPrefillData(null);
    setIsFormOpen(true);
  }, []);

  // Editar a partir do modal de detalhes
  const handleEditFromView = useCallback((client: Client) => {
    setViewingClient(null);
    setEditingClient(client);
    setPrefillData(null);
    setIsFormOpen(true);
  }, []);

  // Fecha modal de formulário
  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingClient(null);
    setPrefillData(null);
  }, []);

  // Fecha modal smart
  const handleCloseSmart = useCallback(() => {
    setIsSmartOpen(false);
    setPrefillData(null);
  }, []);

  // Mudar de smart para formulário tradicional
  const handleSwitchToForm = useCallback((data?: Partial<CreateClientDTO>) => {
    setIsSmartOpen(false);
    setPrefillData(data || null);
    setEditingClient(null);
    setIsFormOpen(true);
  }, []);

  // Submit do formulário
  const handleSubmit = useCallback(
    async (data: CreateClientDTO) => {
      setIsSubmitting(true);
      try {
        if (editingClient) {
          await updateClient(editingClient.id, data);
        } else {
          await createClient(data);
        }
        handleCloseForm();
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingClient, createClient, updateClient, handleCloseForm]
  );

  // Submit do smart creator
  const handleSmartSubmit = useCallback(
    async (data: CreateClientDTO) => {
      setIsSubmitting(true);
      try {
        await createClient(data);
        handleCloseSmart();
      } finally {
        setIsSubmitting(false);
      }
    },
    [createClient, handleCloseSmart]
  );

  // Abre modal de confirmação de delete
  const handleDeleteClick = useCallback((client: Client) => {
    setDeletingClient(client);
  }, []);

  // Confirma delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingClient) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteClient(deletingClient.id);
      setDeletingClient(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [deletingClient, deleteClient]);

  // Completa uma tarefa
  const handleCompleteTask = useCallback(async (taskId: string) => {
    await completeTask(taskId);
  }, [completeTask]);

  // Inicia uma tarefa (muda status para "doing")
  const handleStartTask = useCallback(async (taskId: string) => {
    await updateTask(taskId, { status: 'doing' });
  }, [updateTask]);

  // Cliente inicial para o formulário (prefill ou edição)
  const initialClient = editingClient || (prefillData ? {
    ...({} as Client),
    ...prefillData,
  } as Client : null);

  return (
    <DashboardLayout
      title="Clientes"
      subtitle="Gerencie seus clientes de tráfego pago"
      headerActions={
        <div className="relative" ref={dropdownRef}>
          {/* Botão principal unificado */}
          <button
            onClick={toggleDropdown}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Novo Cliente</span>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#12121a] border border-white/[0.08] shadow-2xl shadow-black/50 z-50 overflow-hidden animate-scale-in">
              <div className="p-1.5">
                <button
                  onClick={() => handleNewClient('form')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-white/[0.05] transition-all duration-200 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Formulário</p>
                    <p className="text-xs text-zinc-500">Preencha campo por campo</p>
                  </div>
                  <svg className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleNewClient('smart')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-indigo-500/10 transition-all duration-200 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 flex items-center justify-center transition-all">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">Modo IA</p>
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-md uppercase tracking-wide">
                        Beta
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">Digite ou fale - a IA organiza</p>
                  </div>
                  <svg className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      }
    >
      {/* Erro global */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Lista de clientes */}
      <ClientList
        clients={clients}
        tasks={tasks}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onCompleteTask={handleCompleteTask}
        onStartTask={handleStartTask}
      />

      {/* Modal de detalhes do cliente */}
      <ClientDetailModal
        client={viewingClient}
        isOpen={Boolean(viewingClient)}
        onClose={handleCloseView}
        onEdit={handleEditFromView}
      />

      {/* Modal de criação/edição tradicional */}
      <ClientFormStepper
        client={initialClient}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        loading={isSubmitting}
      />

      {/* Modal de criação inteligente */}
      <SmartClientCreator
        isOpen={isSmartOpen}
        onClose={handleCloseSmart}
        onSubmit={handleSmartSubmit}
        onSwitchToForm={handleSwitchToForm}
        loading={isSubmitting}
      />

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        title="Excluir Cliente"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingClient(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-zinc-300">
          Tem certeza que deseja excluir o cliente{' '}
          <span className="font-medium text-white">{deletingClient?.name}</span>?
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Esta ação não pode ser desfeita. Todos os relatórios e dados associados também serão
          excluídos.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
