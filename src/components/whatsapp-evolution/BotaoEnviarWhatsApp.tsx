/**
 * @file BotaoEnviarWhatsApp.tsx
 * @description Botão para enviar mensagem via WhatsApp Evolution
 * @module components/whatsapp-evolution
 */

'use client';

import { useState } from 'react';
import { MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface BotaoEnviarWhatsAppProps {
  telefone: string;
  mensagem: string;
  leadId?: string;
  nomeContato?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

export function BotaoEnviarWhatsApp({
  telefone,
  mensagem,
  leadId,
  nomeContato,
  onSuccess,
  onError,
  disabled,
  className,
}: BotaoEnviarWhatsAppProps) {
  const [status, setStatus] = useState<SendStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEnviar = async () => {
    if (!telefone || !mensagem) {
      onError?.('Telefone e mensagem são obrigatórios');
      return;
    }

    try {
      setStatus('sending');
      setErrorMessage(null);

      const response = await fetch('/api/whatsapp-evolution/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: telefone,
          mensagem,
          leadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setStatus('sent');
      onSuccess?.();

      // Reset após 3 segundos
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro de conexão';
      setStatus('error');
      setErrorMessage(message);
      onError?.(message);

      // Reset após 3 segundos
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage(null);
      }, 3000);
    }
  };

  const baseClassName =
    'flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all';

  if (status === 'sent') {
    return (
      <button
        disabled
        className={`${baseClassName} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ${className}`}
      >
        <CheckCircle className="w-4 h-4" />
        Enviado!
      </button>
    );
  }

  if (status === 'error') {
    return (
      <button
        disabled
        className={`${baseClassName} bg-red-500/20 text-red-400 border border-red-500/30 ${className}`}
        title={errorMessage || 'Erro ao enviar'}
      >
        <AlertCircle className="w-4 h-4" />
        Erro
      </button>
    );
  }

  return (
    <button
      onClick={handleEnviar}
      disabled={disabled || status === 'sending' || !telefone}
      className={`${baseClassName} bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={nomeContato ? `Enviar para ${nomeContato}` : 'Enviar WhatsApp'}
    >
      {status === 'sending' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </>
      )}
    </button>
  );
}
