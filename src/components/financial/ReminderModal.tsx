/**
 * @file ReminderModal.tsx
 * @description Modal para envio de lembretes via WhatsApp
 * @module components/financial
 */

'use client';

import { useCallback, useState } from 'react';

import { Button, Modal } from '@/components/ui';

import type { PaymentWithClient } from '@/types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentWithClient | null;
  onGenerateMessage: (paymentId: string, templateType: 'pre_due' | 'overdue' | 'reminder') => string;
}

/**
 * Templates disponíveis
 */
const TEMPLATE_OPTIONS = [
  { value: 'pre_due', label: 'Lembrete Pré-Vencimento', icon: '📅' },
  { value: 'overdue', label: 'Cobrança Atrasada', icon: '⚠️' },
  { value: 'reminder', label: 'Lembrete Amigável', icon: '💬' },
] as const;

/**
 * Modal de envio de lembrete
 */
export function ReminderModal({
  isOpen,
  onClose,
  payment,
  onGenerateMessage,
}: ReminderModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<'pre_due' | 'overdue' | 'reminder'>('reminder');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  /**
   * Gera a mensagem baseada no template
   */
  const handleGenerateMessage = useCallback(() => {
    if (!payment) {
      return;
    }
    const generatedMessage = onGenerateMessage(payment.id, selectedTemplate);
    setMessage(generatedMessage);
  }, [payment, selectedTemplate, onGenerateMessage]);

  /**
   * Copia mensagem para clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [message]);

  /**
   * Abre WhatsApp com a mensagem
   */
  const handleSendWhatsApp = useCallback(() => {
    if (!payment?.client?.contact_phone) {
      alert('Cliente não possui telefone cadastrado');
      return;
    }

    // Remove caracteres não numéricos do telefone
    const phone = payment.client.contact_phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  }, [payment, message, onClose]);

  /**
   * Reseta estado ao fechar
   */
  const handleClose = useCallback(() => {
    setMessage('');
    setCopied(false);
    onClose();
  }, [onClose]);

  if (!payment) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enviar Lembrete"
      size="lg"
    >
      <div className="space-y-6">
        {/* Info do Cliente */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{payment.client?.name}</p>
              <p className="text-xs text-zinc-500">{payment.client?.contact_phone || 'Sem telefone'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
              </p>
              <p className="text-xs text-zinc-500">
                Vence: {new Date(payment.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Seleção de Template */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Template de Mensagem
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TEMPLATE_OPTIONS.map((template) => (
              <button
                key={template.value}
                type="button"
                onClick={() => setSelectedTemplate(template.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTemplate === template.value
                    ? 'bg-violet-500/10 border-violet-500/50 text-violet-300'
                    : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:bg-white/[0.05]'
                }`}
              >
                <span className="text-lg mb-1 block">{template.icon}</span>
                <span className="text-xs font-medium">{template.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botão de Gerar */}
        <Button variant="secondary" onClick={handleGenerateMessage} className="w-full">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Gerar Mensagem
        </Button>

        {/* Mensagem Gerada */}
        {message && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Mensagem
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl text-sm text-white placeholder-zinc-500 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none"
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSendWhatsApp}
            disabled={!message || !payment.client?.contact_phone}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Enviar WhatsApp
          </Button>
        </div>
      </div>
    </Modal>
  );
}
