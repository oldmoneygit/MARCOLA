/**
 * @file ModalDiagnostico.tsx
 * @description Modal para exibição e execução de diagnóstico profundo de leads
 * @module components/lead-sniper
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Stethoscope,
  RefreshCw,
} from 'lucide-react';

import { DiagnosticoCard } from './DiagnosticoCard';
import type { DiagnosticoCompleto, DiagnosticoMensagem } from '@/types/diagnostico';

interface ModalDiagnosticoProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadNome: string;
  onDiagnosticoComplete?: (diagnostico: DiagnosticoCompleto) => void;
}

type ModalState = 'idle' | 'loading' | 'success' | 'error';

export function ModalDiagnostico({
  isOpen,
  onClose,
  leadId,
  leadNome,
  onDiagnosticoComplete,
}: ModalDiagnosticoProps) {
  const [state, setState] = useState<ModalState>('idle');
  const [diagnostico, setDiagnostico] = useState<DiagnosticoCompleto | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Buscar diagnóstico existente ao abrir
  const fetchExistingDiagnostico = useCallback(async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/diagnostico`);

      if (response.ok) {
        const data = await response.json();
        if (data.diagnostico) {
          setDiagnostico(data.diagnostico);
          setState('success');
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[ModalDiagnostico] Erro ao buscar:', err);
      return false;
    }
  }, [leadId]);

  // Executar novo diagnóstico
  const executarDiagnostico = useCallback(async () => {
    setState('loading');
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/diagnostico`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar diagnóstico');
      }

      if (data.diagnostico) {
        setDiagnostico(data.diagnostico);
        setState('success');
        onDiagnosticoComplete?.(data.diagnostico);
      } else {
        throw new Error('Diagnóstico não retornado');
      }
    } catch (err) {
      console.error('[ModalDiagnostico] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setState('error');
    }
  }, [leadId, onDiagnosticoComplete]);

  // Buscar diagnóstico existente ao abrir modal
  useEffect(() => {
    if (isOpen && leadId) {
      setState('loading');
      fetchExistingDiagnostico().then((found) => {
        if (!found) {
          setState('idle');
        }
      });
    }
  }, [isOpen, leadId, fetchExistingDiagnostico]);

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setDiagnostico(null);
      setError(null);
      setState('idle');
    }
  }, [isOpen]);

  const handleRefresh = async () => {
    await executarDiagnostico();
  };

  const handleSendMessage = (mensagem: DiagnosticoMensagem) => {
    // Copiar mensagem para clipboard e abrir WhatsApp se for WhatsApp
    navigator.clipboard.writeText(mensagem.conteudo);

    // TODO: Integrar com envio real via WhatsApp Evolution
    console.log('[ModalDiagnostico] Mensagem copiada:', mensagem);
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
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-zinc-900/95 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Stethoscope className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Diagnóstico Profundo</h2>
              <p className="text-sm text-zinc-400">{leadNome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Estado: Carregando */}
          {state === 'loading' && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Analisando Lead...
              </h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                Estamos coletando dados e gerando um diagnóstico completo.
                Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {/* Estado: Idle - Sem diagnóstico */}
          {state === 'idle' && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-4">
                <Sparkles className="w-12 h-12 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Diagnóstico Profundo com IA
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Analise este lead em profundidade para obter insights sobre o negócio,
                pontos fracos, oportunidades e uma estratégia personalizada de abordagem.
              </p>
              <button
                onClick={executarDiagnostico}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all"
              >
                <Stethoscope className="w-5 h-5" />
                Iniciar Diagnóstico
              </button>
            </div>
          )}

          {/* Estado: Erro */}
          {state === 'error' && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Erro no Diagnóstico
              </h3>
              <p className="text-zinc-400 mb-2 max-w-md mx-auto">
                {error || 'Ocorreu um erro ao processar o diagnóstico.'}
              </p>
              <p className="text-zinc-500 text-sm mb-6">
                Verifique se o webhook está configurado corretamente.
              </p>
              <button
                onClick={executarDiagnostico}
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-medium transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Estado: Sucesso - Mostrar diagnóstico */}
          {state === 'success' && diagnostico && (
            <DiagnosticoCard
              diagnostico={diagnostico}
              onRefresh={handleRefresh}
              onSendMessage={handleSendMessage}
              loading={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
