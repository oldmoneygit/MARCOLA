/**
 * @file PaymentFormModal.tsx
 * @description Modal para criar/editar pagamentos
 * @module components/financial
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Input, Modal, Select } from '@/components/ui';

import type { PaymentWithClient } from '@/types';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  payment?: PaymentWithClient | null;
  clients: Array<{ id: string; name: string; monthly_value: number; due_day: number }>;
  loading?: boolean;
}

export interface PaymentFormData {
  client_id: string;
  amount: number;
  due_date: string;
  description?: string;
  payment_method?: string;
  notes?: string;
}

const PAYMENT_METHODS = [
  { value: '', label: 'Selecione...' },
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência Bancária' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'other', label: 'Outro' },
];

/**
 * Modal para criar/editar pagamentos
 */
export function PaymentFormModal({
  isOpen,
  onClose,
  onSubmit,
  payment,
  clients,
  loading = false,
}: PaymentFormModalProps) {
  const isEditing = !!payment;

  const [formData, setFormData] = useState<PaymentFormData>({
    client_id: '',
    amount: 0,
    due_date: '',
    description: '',
    payment_method: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preenche o formulário ao editar
  useEffect(() => {
    if (payment) {
      setFormData({
        client_id: payment.client_id,
        amount: payment.amount,
        due_date: payment.due_date,
        description: payment.description || '',
        payment_method: payment.payment_method || '',
        notes: payment.notes || '',
      });
    } else {
      // Reset para novo pagamento
      const today = new Date();
      const defaultDueDate = new Date(today.getFullYear(), today.getMonth(), 10)
        .toISOString()
        .slice(0, 10);

      setFormData({
        client_id: '',
        amount: 0,
        due_date: defaultDueDate,
        description: '',
        payment_method: '',
        notes: '',
      });
    }
    setErrors({});
  }, [payment, isOpen]);

  // Atualiza valor e data quando seleciona cliente
  const handleClientChange = useCallback((clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const today = new Date();
      const dueDate = new Date(today.getFullYear(), today.getMonth(), client.due_day);

      // Se a data de vencimento já passou neste mês, usa o próximo mês
      if (dueDate < today) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      setFormData((prev) => ({
        ...prev,
        client_id: clientId,
        amount: client.monthly_value,
        due_date: dueDate.toISOString().slice(0, 10),
        description: `Mensalidade - ${client.name}`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        client_id: clientId,
      }));
    }
  }, [clients]);

  // Validação
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Selecione um cliente';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Informe um valor válido';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Informe a data de vencimento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      return;
    }

    await onSubmit(formData);
  }, [formData, validate, onSubmit]);

  // Opções de clientes para o select
  const clientOptions = [
    { value: '', label: 'Selecione um cliente...' },
    ...clients.map((c) => ({
      value: c.id,
      label: `${c.name} (R$ ${c.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Pagamento' : 'Novo Pagamento'}
      size="md"
    >
      <div className="space-y-4">
        {/* Cliente */}
        <Select
          label="Cliente"
          value={formData.client_id}
          onChange={(e) => handleClientChange(e.target.value)}
          options={clientOptions}
          error={errors.client_id}
          disabled={isEditing}
          required
        />

        {/* Valor e Data de Vencimento */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valor (R$)"
            type="number"
            value={formData.amount || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                amount: parseFloat(e.target.value) || 0,
              }))
            }
            error={errors.amount}
            min={0}
            step={0.01}
            required
          />

          <Input
            label="Data de Vencimento"
            type="date"
            value={formData.due_date}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                due_date: e.target.value,
              }))
            }
            error={errors.due_date}
            required
          />
        </div>

        {/* Descrição */}
        <Input
          label="Descrição"
          value={formData.description || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Ex: Mensalidade - Janeiro/2025"
        />

        {/* Método de Pagamento */}
        <Select
          label="Método de Pagamento"
          value={formData.payment_method || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              payment_method: e.target.value,
            }))
          }
          options={PAYMENT_METHODS}
        />

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Observações
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            rows={3}
            placeholder="Notas adicionais..."
            className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 resize-none"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            {isEditing ? 'Salvar Alterações' : 'Criar Pagamento'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
