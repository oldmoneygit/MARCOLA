/**
 * @file AudioRecorder.tsx
 * @description Componente para gravação de áudio no navegador
 * @module components/whatsapp
 *
 * @example
 * <AudioRecorder
 *   onRecordingComplete={(blob, duration) => handleAudio(blob, duration)}
 *   maxDuration={120}
 * />
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Pause, Play, Trash2, Send, Loader2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onCancel?: () => void;
  maxDuration?: number; // em segundos
  showSendButton?: boolean;
  onSend?: (blob: Blob, duration: number) => Promise<void>;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'recorded';

// ═══════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════

export function AudioRecorder({
  onRecordingComplete,
  onCancel,
  maxDuration = 120,
  showSendButton = false,
  onSend,
  disabled = false,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Auto-stop quando atingir duração máxima
  useEffect(() => {
    if (state === 'recording' && duration >= maxDuration) {
      handleStopRecording();
    }
  }, [duration, maxDuration, state]);

  /**
   * Formata duração em MM:SS
   */
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Inicia gravação
   */
  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);

      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      streamRef.current = stream;

      // Criar MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        audioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('recorded');
        onRecordingComplete(blob, duration);
      };

      // Iniciar gravação
      mediaRecorder.start(100); // chunks a cada 100ms
      setState('recording');

      // Iniciar timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[AudioRecorder] Erro ao iniciar:', err);
      setError('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, [duration, onRecordingComplete]);

  /**
   * Para gravação
   */
  const handleStopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  /**
   * Pausa/Continua gravação
   */
  const handlePauseResume = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setState('paused');
    } else if (state === 'paused') {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      setState('recording');
    }
  }, [state]);

  /**
   * Descarta gravação
   */
  const handleDiscard = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    audioBlobRef.current = null;
    setDuration(0);
    setState('idle');
    onCancel?.();
  }, [audioUrl, onCancel]);

  /**
   * Envia áudio
   */
  const handleSend = useCallback(async () => {
    if (!audioBlobRef.current || !onSend) {
      return;
    }

    try {
      setIsSending(true);
      await onSend(audioBlobRef.current, duration);
      handleDiscard();
    } catch (err) {
      console.error('[AudioRecorder] Erro ao enviar:', err);
      setError('Erro ao enviar áudio');
    } finally {
      setIsSending(false);
    }
  }, [duration, onSend, handleDiscard]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col gap-3">
      {/* Erro */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Estado: Idle - Botão de iniciar */}
      {state === 'idle' && (
        <button
          onClick={handleStartRecording}
          disabled={disabled}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mic className="w-5 h-5" />
          <span>Gravar Áudio</span>
        </button>
      )}

      {/* Estado: Gravando ou Pausado */}
      {(state === 'recording' || state === 'paused') && (
        <div className="flex flex-col gap-3">
          {/* Indicador de gravação */}
          <div className="flex items-center justify-center gap-3 py-4 bg-white/5 rounded-xl">
            <div className={`w-3 h-3 rounded-full ${state === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-2xl font-mono text-white">
              {formatDuration(duration)}
            </span>
            <span className="text-xs text-zinc-400">
              / {formatDuration(maxDuration)}
            </span>
          </div>

          {/* Barra de progresso */}
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-1000"
              style={{ width: `${(duration / maxDuration) * 100}%` }}
            />
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-4">
            {/* Pausar/Continuar */}
            <button
              onClick={handlePauseResume}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title={state === 'recording' ? 'Pausar' : 'Continuar'}
            >
              {state === 'recording' ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Parar */}
            <button
              onClick={handleStopRecording}
              className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
              title="Parar gravação"
            >
              <Square className="w-6 h-6 text-white" />
            </button>

            {/* Descartar */}
            <button
              onClick={handleDiscard}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title="Descartar"
            >
              <Trash2 className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* Estado: Gravado - Preview e enviar */}
      {state === 'recorded' && audioUrl && (
        <div className="flex flex-col gap-3">
          {/* Player de áudio */}
          <div className="bg-white/5 rounded-xl p-3">
            <audio controls src={audioUrl} className="w-full" />
            <div className="flex items-center justify-between mt-2 text-sm text-zinc-400">
              <span>Duração: {formatDuration(duration)}</span>
              <span>{audioBlobRef.current ? `${(audioBlobRef.current.size / 1024).toFixed(1)} KB` : ''}</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center gap-3">
            {/* Descartar */}
            <button
              onClick={handleDiscard}
              disabled={isSending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Descartar</span>
            </button>

            {/* Gravar novamente */}
            <button
              onClick={() => {
                handleDiscard();
                setTimeout(handleStartRecording, 100);
              }}
              disabled={isSending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
              <span>Regravar</span>
            </button>

            {/* Enviar (se habilitado) */}
            {showSendButton && onSend && (
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;
