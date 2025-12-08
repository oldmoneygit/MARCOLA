/**
 * @file ModalEnviarWhatsApp.tsx
 * @description Modal para enviar mensagem personalizada via WhatsApp
 * @module components/whatsapp-evolution
 */

'use client';

import { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Send,
} from 'lucide-react';

import type { LeadProspectado } from '@/types/lead-sniper';

interface ModalEnviarWhatsAppProps {
  lead: LeadProspectado;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

export function ModalEnviarWhatsApp({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: ModalEnviarWhatsAppProps) {
  const [mensagem, setMensagem] = useState('');
  const [status, setStatus] = useState<SendStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Inicializa mensagem com a sugerida pela IA (se existir)
  useEffect(() => {
    if (isOpen && lead.mensagemWhatsappSugerida) {
      setMensagem(lead.mensagemWhatsappSugerida);
    } else if (isOpen) {
      // Mensagem padrão se não houver sugestão da IA
      setMensagem(
        `Olá! Vi que você é da ${lead.nome}. Gostaria de conversar sobre como podemos ajudar a aumentar sua presença digital e atrair mais clientes. Podemos marcar uma conversa?`
      );
    }
  }, [isOpen, lead]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const handleUsarSugestaoIA = () => {
    if (lead.mensagemWhatsappSugerida) {
      setMensagem(lead.mensagemWhatsappSugerida);
    }
  };

  const handleEnviar = async () => {
    if (!lead.whatsapp && !lead.telefone) {
      setErrorMessage('Lead não possui telefone cadastrado');
      setStatus('error');
      return;
    }

    try {
      setStatus('sending');
      setErrorMessage(null);

      const response = await fetch('/api/whatsapp-evolution/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: lead.whatsapp || lead.telefone,
          mensagem,
          leadId: lead.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      setStatus('sent');
      onSuccess?.();

      // Fecha o modal após 2 segundos
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erro de conexão');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg backdrop-blur-xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Enviar WhatsApp</h2>
              <p className="text-sm text-zinc-400">{lead.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info do Lead */}
          <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Telefone:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-mono">
                  {lead.whatsapp || lead.telefone || 'Não informado'}
                </span>
                {(lead.whatsapp || lead.telefone) && (
                  <button
                    onClick={() =>
                      handleCopy(lead.whatsapp || lead.telefone || '', 'telefone')
                    }
                    className="p-1 hover:bg-white/[0.05] rounded transition-colors"
                  >
                    {copiedField === 'telefone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Botão usar sugestão IA */}
          {lead.mensagemWhatsappSugerida &&
            mensagem !== lead.mensagemWhatsappSugerida && (
              <button
                onClick={handleUsarSugestaoIA}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 rounded-xl text-violet-300 text-sm hover:from-violet-500/30 hover:to-pink-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Usar mensagem sugerida pela IA
              </button>
            )}

          {/* Área de texto da mensagem */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Mensagem:</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={6}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-zinc-500">
                {mensagem.length} caracteres
              </span>
              <button
                onClick={() => handleCopy(mensagem, 'mensagem')}
                className="text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1"
              >
                {copiedField === 'mensagem' ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status de erro */}
          {status === 'error' && errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{errorMessage}</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] rounded-xl text-zinc-300 font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleEnviar}
              disabled={
                status === 'sending' ||
                status === 'sent' ||
                !mensagem ||
                (!lead.whatsapp && !lead.telefone)
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : status === 'sent' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Enviado!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
