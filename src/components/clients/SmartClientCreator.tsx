/**
 * @file SmartClientCreator.tsx
 * @description Modal inteligente para criação de cliente via texto/áudio com IA
 * @module components/clients
 *
 * @example
 * <SmartClientCreator
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSubmit={handleSubmit}
 *   onSwitchToForm={handleSwitchToForm}
 * />
 */

'use client';

import { useCallback, useState } from 'react';

import { Button, LiveAudioRecorder, Modal } from '@/components/ui';

import { ClientPreviewCard } from './ClientPreviewCard';
import { FieldsChecklist } from './FieldsChecklist';

import type { CreateClientDTO, ParsedClientData, TranscriptionStatus } from '@/types';

interface SmartClientCreatorProps {
  /** Se o modal está aberto */
  isOpen: boolean;
  /** Callback para fechar */
  onClose: () => void;
  /** Callback para criar cliente */
  onSubmit: (data: CreateClientDTO) => Promise<void>;
  /** Callback para mudar para formulário tradicional */
  onSwitchToForm: (data?: Partial<CreateClientDTO>) => void;
  /** Se está carregando */
  loading?: boolean;
}

type InputMode = 'text' | 'audio';
type Step = 'input' | 'preview';

/**
 * Modal inteligente para criação de cliente via texto/áudio
 */
export function SmartClientCreator({
  isOpen,
  onClose,
  onSubmit,
  onSwitchToForm,
  loading = false,
}: SmartClientCreatorProps) {
  // Estados
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [step, setStep] = useState<Step>('input');
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedClientData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<TranscriptionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Reset ao fechar
  const handleClose = useCallback(() => {
    setInputMode('text');
    setStep('input');
    setRawText('');
    setParsedData(null);
    setError(null);
    setIsProcessing(false);
    setTranscriptionStatus('idle');
    onClose();
  }, [onClose]);

  // Processar texto com IA
  const processText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('Digite ou fale as informações do cliente.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/clients/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar texto');
      }

      setParsedData(data);
      setStep('preview');
    } catch (err) {
      console.error('[SmartClientCreator] Error processing text:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar texto');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handler para processar texto digitado
  const handleProcessText = useCallback(() => {
    processText(rawText);
  }, [rawText, processText]);

  // Handler para áudio gravado
  const handleAudioComplete = useCallback(async (audioBlob: Blob) => {
    setTranscriptionStatus('transcribing');
    setError(null);

    try {
      // Enviar para transcrição
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao transcrever áudio');
      }

      setTranscriptionStatus('done');
      setRawText(data.text);

      // Processar texto transcrito automaticamente
      await processText(data.text);
    } catch (err) {
      console.error('[SmartClientCreator] Error transcribing audio:', err);
      setTranscriptionStatus('error');
      setError(err instanceof Error ? err.message : 'Erro ao transcrever áudio');
    }
  }, [processText]);

  // Handler para erro no gravador
  const handleAudioError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setTranscriptionStatus('error');
  }, []);

  // Handler para mudança nos dados do preview
  const handleDataChange = useCallback((changes: Partial<CreateClientDTO>) => {
    if (parsedData) {
      setParsedData({
        ...parsedData,
        extracted: {
          ...parsedData.extracted,
          ...changes,
        },
      });
    }
  }, [parsedData]);

  // Confirmar e criar cliente
  const handleConfirm = useCallback(async () => {
    if (!parsedData) {
      return;
    }

    const { extracted } = parsedData;

    // Validar campos obrigatórios
    if (!extracted.name || !extracted.segment || !extracted.monthly_value || !extracted.due_day) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await onSubmit({
        // Obrigatórios
        name: extracted.name,
        segment: extracted.segment,
        monthly_value: extracted.monthly_value,
        due_day: extracted.due_day,
        // Contato
        contact_name: extracted.contact_name,
        contact_phone: extracted.contact_phone,
        contact_email: extracted.contact_email,
        // Financeiro
        average_ticket: extracted.average_ticket,
        // Localização
        city: extracted.city,
        // Redes sociais
        instagram_url: extracted.instagram_url,
        facebook_page_id: extracted.facebook_page_id,
        // Links e recursos
        ads_account_url: extracted.ads_account_url,
        website_url: extracted.website_url,
        drive_url: extracted.drive_url,
        menu_url: extracted.menu_url,
        assets_links: extracted.assets_links,
        // Estratégia
        peak_hours: extracted.peak_hours,
        differentials: extracted.differentials,
        ideal_customer: extracted.ideal_customer,
        goals_short_term: extracted.goals_short_term,
        goals_long_term: extracted.goals_long_term,
        // Gestão e produção
        meeting_frequency: extracted.meeting_frequency,
        image_authorization: extracted.image_authorization,
        content_request: extracted.content_request,
        // Observações
        notes: extracted.notes,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente');
    }
  }, [parsedData, onSubmit, handleClose]);

  // Mudar para formulário tradicional com dados
  const handleSwitchToForm = useCallback(() => {
    if (parsedData?.extracted) {
      onSwitchToForm(parsedData.extracted);
    } else {
      onSwitchToForm();
    }
    handleClose();
  }, [parsedData, onSwitchToForm, handleClose]);

  // Voltar para input
  const handleBack = useCallback(() => {
    setStep('input');
    setError(null);
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'input' ? 'Criar Cliente com IA' : 'Revisar Dados'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Step: Input */}
        {step === 'input' && (
          <>
            {/* Tabs de modo */}
            <div className="flex items-center bg-white/[0.03] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'text'
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Digitar Texto
              </button>
              <button
                type="button"
                onClick={() => setInputMode('audio')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'audio'
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Gravar Áudio
              </button>
            </div>

            {/* Conteúdo do modo */}
            {inputMode === 'text' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Descreva o cliente
                  </label>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={5}
                    placeholder={`Exemplo:\nAcademia Power Gym\nSegmento fitness\nContato: João, (11) 99999-9999, joao@powergym.com\nValor mensal: R$ 2.500\nVencimento dia 10\nSite: www.powergym.com.br`}
                    className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 resize-none"
                  />
                </div>

                {/* Checklist de campos detectados no texto */}
                {rawText.trim() && (
                  <FieldsChecklist text={rawText} compact />
                )}

                <Button
                  onClick={handleProcessText}
                  disabled={!rawText.trim() || isProcessing}
                  loading={isProcessing}
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Processar com IA
                </Button>
              </div>
            ) : (
              <LiveAudioRecorder
                onRecordingComplete={handleAudioComplete}
                onError={handleAudioError}
                transcriptionStatus={transcriptionStatus}
                maxDuration={120}
                disabled={isProcessing}
                showFieldsChecklist
              />
            )}

            {/* Erro */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Link para formulário tradicional */}
            <div className="pt-4 border-t border-white/[0.08] text-center">
              <button
                type="button"
                onClick={() => onSwitchToForm()}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Prefere o formulário tradicional?{' '}
                <span className="text-violet-400 hover:text-violet-300">Clique aqui</span>
              </button>
            </div>
          </>
        )}

        {/* Step: Preview */}
        {step === 'preview' && parsedData && (
          <>
            {/* Botão voltar */}
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar e editar texto
            </button>

            {/* Texto original */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs text-zinc-500 mb-1">Texto processado:</p>
              <p className="text-sm text-zinc-400 line-clamp-2">{parsedData.original_text}</p>
            </div>

            {/* Preview Card */}
            <ClientPreviewCard
              parsedData={parsedData}
              onDataChange={handleDataChange}
              onConfirm={handleConfirm}
              onEdit={handleSwitchToForm}
              onCancel={handleClose}
              loading={loading}
            />

            {/* Erro */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
