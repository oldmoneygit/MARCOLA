/**
 * @file AudioRecorder.tsx
 * @description Componente de gravação de áudio com visualização de ondas
 * @module components/ui
 *
 * @example
 * <AudioRecorder
 *   onRecordingComplete={handleAudioBlob}
 *   maxDuration={120}
 * />
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { TranscriptionStatus } from '@/types';

interface AudioRecorderProps {
  /** Callback com o blob de áudio quando gravação termina */
  onRecordingComplete: (audioBlob: Blob) => void;
  /** Callback quando ocorre erro */
  onError?: (error: string) => void;
  /** Status atual da transcrição */
  transcriptionStatus?: TranscriptionStatus;
  /** Duração máxima em segundos */
  maxDuration?: number;
  /** Se está processando */
  disabled?: boolean;
}

/**
 * Componente de gravação de áudio
 */
export function AudioRecorder({
  onRecordingComplete,
  onError,
  transcriptionStatus = 'idle',
  maxDuration = 120,
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Formatar duração para MM:SS
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Limpar recursos
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Atualizar nível de áudio para visualização
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) {
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calcular média do nível de áudio
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      // Configurar analyser para visualização
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        cleanup();
      };

      // Iniciar gravação
      mediaRecorder.start(100); // Chunks a cada 100ms
      setIsRecording(true);
      setDuration(0);

      // Timer para duração
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration - 1) {
            // Parar gravação quando atingir o limite
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Iniciar visualização
      updateAudioLevel();
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
      setHasPermission(false);

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          onError?.('Permissão para microfone negada. Habilite nas configurações do navegador.');
        } else if (error.name === 'NotFoundError') {
          onError?.('Nenhum microfone encontrado.');
        } else {
          onError?.('Erro ao acessar microfone: ' + error.message);
        }
      } else {
        onError?.('Erro desconhecido ao acessar microfone.');
      }
    }
  }, [maxDuration, onRecordingComplete, onError, cleanup, updateAudioLevel]);

  // Parar gravação
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Verificar suporte do navegador
  const isSupported = typeof window !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices;

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
        <p className="text-sm text-red-400">
          Seu navegador não suporta gravação de áudio.
        </p>
      </div>
    );
  }

  const isProcessing = transcriptionStatus === 'transcribing';
  const isDisabled = disabled || isProcessing;

  return (
    <div className="space-y-4">
      {/* Área de gravação */}
      <div className="relative flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] transition-all duration-300">
        {/* Indicador de permissão negada */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="text-center p-4">
              <svg className="w-12 h-12 mx-auto text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <p className="text-sm text-red-400">Microfone não autorizado</p>
              <button
                onClick={startRecording}
                className="mt-2 text-xs text-violet-400 hover:text-violet-300"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Botão de gravação */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isDisabled}
          className={`relative w-20 h-20 rounded-full transition-all duration-300 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 scale-110'
              : isDisabled
              ? 'bg-zinc-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 hover:scale-105'
          }`}
        >
          {/* Animação de ondas durante gravação */}
          {isRecording && (
            <>
              <span
                className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"
                style={{ transform: `scale(${1 + audioLevel * 0.5})` }}
              />
              <span
                className="absolute inset-0 rounded-full bg-red-500/30"
                style={{ transform: `scale(${1.2 + audioLevel * 0.3})` }}
              />
            </>
          )}

          {/* Ícone */}
          {isRecording ? (
            <svg className="w-8 h-8 mx-auto text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : isProcessing ? (
            <svg className="w-8 h-8 mx-auto text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Timer e status */}
        <div className="mt-4 text-center">
          {isRecording ? (
            <>
              <p className="text-2xl font-mono text-white">{formatDuration(duration)}</p>
              <p className="text-xs text-red-400 mt-1 animate-pulse">Gravando...</p>
            </>
          ) : isProcessing ? (
            <p className="text-sm text-violet-400">Transcrevendo áudio...</p>
          ) : (
            <>
              <p className="text-sm text-zinc-400">Clique para gravar</p>
              <p className="text-xs text-zinc-500 mt-1">Máximo: {formatDuration(maxDuration)}</p>
            </>
          )}
        </div>

        {/* Barra de nível de áudio */}
        {isRecording && (
          <div className="mt-4 w-full max-w-xs">
            <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-red-500 transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dica */}
      <p className="text-xs text-center text-zinc-500">
        Diga o nome do cliente, segmento, valor mensal, dia de vencimento e dados de contato.
      </p>
    </div>
  );
}
