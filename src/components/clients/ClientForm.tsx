/**
 * @file ClientForm.tsx
 * @description Formulário para criação/edição de clientes
 * @module components/clients
 *
 * @example
 * <ClientForm onSubmit={handleSubmit} />
 * <ClientForm client={existingClient} onSubmit={handleSubmit} />
 */

'use client';

import { useCallback, useState } from 'react';

import { Button, Input, Modal, Select } from '@/components/ui';
import { SEGMENTS } from '@/lib/constants';

import type { Client, CreateClientDTO } from '@/types';

interface ClientFormProps {
  /** Cliente existente para edição */
  client?: Client | null;
  /** Se está aberto (quando usado em modal) */
  isOpen?: boolean;
  /** Callback para fechar */
  onClose?: () => void;
  /** Callback de submit */
  onSubmit: (data: CreateClientDTO) => Promise<void>;
  /** Se está carregando */
  loading?: boolean;
}

/**
 * Formulário completo para criação/edição de cliente
 */
export function ClientForm({
  client,
  isOpen = true,
  onClose,
  onSubmit,
  loading = false,
}: ClientFormProps) {
  const isEditing = Boolean(client);

  const [formData, setFormData] = useState<CreateClientDTO>({
    name: client?.name || '',
    segment: client?.segment || '',
    monthly_value: client?.monthly_value || 0,
    due_day: client?.due_day || 10,
    contact_name: client?.contact_name || '',
    contact_phone: client?.contact_phone || '',
    contact_email: client?.contact_email || '',
    ads_account_url: client?.ads_account_url || '',
    website_url: client?.website_url || '',
    drive_url: client?.drive_url || '',
    notes: client?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
      // Limpa erro do campo
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.segment) {
      newErrors.segment = 'Selecione um segmento';
    }

    if (!formData.monthly_value || formData.monthly_value <= 0) {
      newErrors.monthly_value = 'Valor deve ser maior que zero';
    }

    if (!formData.due_day || formData.due_day < 1 || formData.due_day > 31) {
      newErrors.due_day = 'Dia deve estar entre 1 e 31';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      try {
        await onSubmit(formData);
        onClose?.();
      } catch {
        // Error handled by parent
      }
    },
    [formData, validate, onSubmit, onClose]
  );

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações básicas */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome do Cliente"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Ex: Academia XYZ"
            required
          />

          <Select
            label="Segmento"
            name="segment"
            value={formData.segment}
            onChange={handleChange}
            error={errors.segment}
            options={SEGMENTS}
            placeholder="Selecione um segmento"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Valor Mensal (R$)"
            name="monthly_value"
            type="number"
            value={formData.monthly_value || ''}
            onChange={handleChange}
            error={errors.monthly_value}
            placeholder="0,00"
            required
          />

          <Input
            label="Dia de Vencimento"
            name="due_day"
            type="number"
            min={1}
            max={31}
            value={formData.due_day || ''}
            onChange={handleChange}
            error={errors.due_day}
            placeholder="10"
            required
          />
        </div>
      </div>

      {/* Contato */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Contato</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Nome do Contato"
            name="contact_name"
            value={formData.contact_name || ''}
            onChange={handleChange}
            placeholder="João Silva"
          />

          <Input
            label="Telefone"
            name="contact_phone"
            value={formData.contact_phone || ''}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
          />

          <Input
            label="Email"
            name="contact_email"
            type="email"
            value={formData.contact_email || ''}
            onChange={handleChange}
            error={errors.contact_email}
            placeholder="contato@empresa.com"
          />
        </div>
      </div>

      {/* Links */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Conta de Anúncios"
            name="ads_account_url"
            value={formData.ads_account_url || ''}
            onChange={handleChange}
            placeholder="https://ads.google.com/..."
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
          />

          <Input
            label="Website"
            name="website_url"
            value={formData.website_url || ''}
            onChange={handleChange}
            placeholder="https://www.site.com"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            }
          />

          <Input
            label="Google Drive"
            name="drive_url"
            value={formData.drive_url || ''}
            onChange={handleChange}
            placeholder="https://drive.google.com/..."
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Observações</h3>

        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows={3}
          placeholder="Anotações sobre o cliente..."
          className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-2.5 px-4"
        />
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
        {onClose && (
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
        </Button>
      </div>
    </form>
  );

  // Se tem onClose, renderiza como modal
  if (onClose) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        {content}
      </Modal>
    );
  }

  // Senão, renderiza diretamente
  return content;
}
