/**
 * @file CredentialsList.tsx
 * @description Componente para exibir e gerenciar credenciais de login do cliente
 * @module components/clients
 */

'use client';

import { useCallback, useState } from 'react';

import { Button, GlassCard, Modal } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useCredentials } from '@/hooks/useCredentials';
import { COMMON_PLATFORMS } from '@/types';

import type { ClientCredential, CreateCredentialDTO } from '@/types';

interface CredentialsListProps {
  clientId: string;
}

/**
 * Lista de credenciais do cliente com funcionalidades de CRUD
 */
export function CredentialsList({ clientId }: CredentialsListProps) {
  const { credentials, loading, createCredential, updateCredential, deleteCredential } = useCredentials(clientId);
  const { addToast } = useToast();

  // Estados dos modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<ClientCredential | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<ClientCredential | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState<CreateCredentialDTO>({
    platform: '',
    login: '',
    password: '',
    url: '',
    notes: '',
  });

  // Estados de visibilidade de senha
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Estado para controlar se selecionou "Outro" no dropdown
  const [isCustomPlatform, setIsCustomPlatform] = useState(false);

  /**
   * Abre modal de adicionar
   */
  const handleOpenAdd = useCallback(() => {
    setFormData({ platform: '', login: '', password: '', url: '', notes: '' });
    setIsCustomPlatform(false);
    setIsAddModalOpen(true);
  }, []);

  /**
   * Abre modal de editar
   */
  const handleOpenEdit = useCallback((credential: ClientCredential) => {
    // Verifica se a plataforma é customizada (não está na lista padrão)
    const isCustom = !COMMON_PLATFORMS.includes(credential.platform as typeof COMMON_PLATFORMS[number]);
    setIsCustomPlatform(isCustom);
    setFormData({
      platform: credential.platform,
      login: credential.login,
      password: credential.password,
      url: credential.url || '',
      notes: credential.notes || '',
    });
    setEditingCredential(credential);
  }, []);

  /**
   * Fecha modais
   */
  const handleCloseModals = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingCredential(null);
    setDeletingCredential(null);
    setIsCustomPlatform(false);
    setFormData({ platform: '', login: '', password: '', url: '', notes: '' });
  }, []);

  /**
   * Submete formulário de adicionar
   */
  const handleAdd = useCallback(async () => {
    if (!formData.platform || !formData.login || !formData.password) {
      addToast({ type: 'error', title: 'Erro', message: 'Preencha os campos obrigatórios' });
      return;
    }

    setIsSubmitting(true);
    const result = await createCredential(formData);
    setIsSubmitting(false);

    if (result) {
      addToast({ type: 'success', title: 'Sucesso', message: 'Credencial adicionada!' });
      handleCloseModals();
    } else {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível adicionar a credencial' });
    }
  }, [formData, createCredential, addToast, handleCloseModals]);

  /**
   * Submete formulário de editar
   */
  const handleEdit = useCallback(async () => {
    if (!editingCredential || !formData.platform || !formData.login || !formData.password) {
      addToast({ type: 'error', title: 'Erro', message: 'Preencha os campos obrigatórios' });
      return;
    }

    setIsSubmitting(true);
    const result = await updateCredential(editingCredential.id, formData);
    setIsSubmitting(false);

    if (result) {
      addToast({ type: 'success', title: 'Sucesso', message: 'Credencial atualizada!' });
      handleCloseModals();
    } else {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar a credencial' });
    }
  }, [editingCredential, formData, updateCredential, addToast, handleCloseModals]);

  /**
   * Confirma exclusão
   */
  const handleDelete = useCallback(async () => {
    if (!deletingCredential) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteCredential(deletingCredential.id);
    setIsSubmitting(false);

    if (result) {
      addToast({ type: 'success', title: 'Sucesso', message: 'Credencial excluída!' });
      handleCloseModals();
    } else {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir a credencial' });
    }
  }, [deletingCredential, deleteCredential, addToast, handleCloseModals]);

  /**
   * Copia texto para clipboard
   */
  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ type: 'success', title: 'Copiado!', message: `${label} copiado para a área de transferência` });
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível copiar' });
    }
  }, [addToast]);

  /**
   * Toggle visibilidade da senha
   */
  const togglePasswordVisibility = useCallback((id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Handler para mudança no select de plataforma
   */
  const handlePlatformChange = useCallback((value: string) => {
    if (value === 'Outro') {
      setIsCustomPlatform(true);
      setFormData((prev) => ({ ...prev, platform: '' }));
    } else {
      setIsCustomPlatform(false);
      setFormData((prev) => ({ ...prev, platform: value }));
    }
  }, []);

  /**
   * Renderiza formulário de credencial
   */
  const renderForm = () => (
    <div className="space-y-4">
      {/* Plataforma */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Plataforma <span className="text-red-400">*</span>
        </label>
        {isCustomPlatform ? (
          <div className="space-y-2">
            <input
              type="text"
              value={formData.platform}
              onChange={(e) => setFormData((prev) => ({ ...prev, platform: e.target.value }))}
              placeholder="Digite o nome da plataforma"
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setIsCustomPlatform(false);
                setFormData((prev) => ({ ...prev, platform: '' }));
              }}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              Voltar para lista de plataformas
            </button>
          </div>
        ) : (
          <select
            value={formData.platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <option value="" className="bg-zinc-900">Selecione uma plataforma</option>
            {COMMON_PLATFORMS.map((platform) => (
              <option key={platform} value={platform} className="bg-zinc-900">
                {platform}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Login */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Login / Email <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.login}
          onChange={(e) => setFormData((prev) => ({ ...prev, login: e.target.value }))}
          placeholder="usuario@email.com"
          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
      </div>

      {/* Senha */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Senha <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="••••••••"
          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          URL de Login <span className="text-zinc-500">(opcional)</span>
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
          placeholder="https://..."
          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Observações <span className="text-zinc-500">(opcional)</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Informações adicionais..."
          rows={2}
          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/[0.05] rounded w-1/4"></div>
          <div className="h-20 bg-white/[0.05] rounded"></div>
          <div className="h-20 bg-white/[0.05] rounded"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Logins e Senhas</h3>
              <p className="text-sm text-zinc-400">{credentials.length} credencial{credentials.length !== 1 ? 'is' : ''}</p>
            </div>
          </div>
          <Button onClick={handleOpenAdd} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar
          </Button>
        </div>

        {/* Lista de credenciais */}
        {credentials.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-zinc-400 mb-2">Nenhuma credencial cadastrada</p>
            <p className="text-sm text-zinc-500">Adicione os logins das plataformas do cliente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => (
              <div
                key={credential.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Plataforma */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-violet-500/20 text-violet-300">
                        {credential.platform}
                      </span>
                      {credential.url && (
                        <a
                          href={credential.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          Abrir
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                    {/* Login */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">Login:</span>
                      <span className="text-sm text-white font-mono">{credential.login}</span>
                      <button
                        onClick={() => handleCopy(credential.login, 'Login')}
                        className="p-1 rounded hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-colors"
                        title="Copiar login"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>

                    {/* Senha */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Senha:</span>
                      <span className="text-sm text-white font-mono">
                        {visiblePasswords.has(credential.id)
                          ? credential.password
                          : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(credential.id)}
                        className="p-1 rounded hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-colors"
                        title={visiblePasswords.has(credential.id) ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {visiblePasswords.has(credential.id) ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy(credential.password, 'Senha')}
                        className="p-1 rounded hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-colors"
                        title="Copiar senha"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>

                    {/* Notas */}
                    {credential.notes && (
                      <p className="mt-2 text-xs text-zinc-500 italic">{credential.notes}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(credential)}
                      className="p-2 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingCredential(credential)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Modal de Adicionar */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        title="Adicionar Credencial"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModals}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} loading={isSubmitting}>
              Adicionar
            </Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      {/* Modal de Editar */}
      <Modal
        isOpen={Boolean(editingCredential)}
        onClose={handleCloseModals}
        title="Editar Credencial"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModals}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} loading={isSubmitting}>
              Salvar
            </Button>
          </>
        }
      >
        {renderForm()}
      </Modal>

      {/* Modal de Confirmar Exclusão */}
      <Modal
        isOpen={Boolean(deletingCredential)}
        onClose={handleCloseModals}
        title="Excluir Credencial"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModals}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isSubmitting}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-zinc-300">
          Tem certeza que deseja excluir a credencial de <strong>{deletingCredential?.platform}</strong>?
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </>
  );
}
