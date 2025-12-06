/**
 * @file VoiceRecorder.tsx
 * @description Componente animado de gravação de áudio com visualizador
 * @module components/assistant
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const VISUALIZER_BARS = 24;

/**
 * Componente de gravação de áudio com visualizador animado
 */
export function VoiceRecorder({
  onTranscription,
  onRecordingChange,
  disabled = false,
  className
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const processAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      if (audioBlob.size < 1000) {
        setError('Gravação muito curta');
        setIsProcessing(false);
        return;
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/assistant/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na transcrição');
      }

      if (data.text && data.text.trim()) {
        onTranscription(data.text.trim());
      } else {
        setError('Nenhum áudio detectado');
      }
    } catch (err) {
      console.error('[VoiceRecorder] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao transcrever');
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  }, [onTranscription]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        processAudio();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      setIsRecording(true);
      setRecordingTime(0);
      onRecordingChange?.(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[VoiceRecorder] Erro:', err);

      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permissão negada');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('Microfone não encontrado');
      } else {
        setError('Erro ao acessar microfone');
      }
    }
  }, [onRecordingChange, processAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      onRecordingChange?.(false);
    }
  }, [isRecording, onRecordingChange]);

  const toggleRecording = useCallback(() => {
    if (isProcessing) {
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, isProcessing, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'm' && !disabled && !isProcessing) {
        e.preventDefault();
        toggleRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, isProcessing, toggleRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Botão de gravação */}
      <motion.button
        type="button"
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          'focus:outline-none',
          isRecording
            ? 'bg-red-500/20 text-red-400'
            : isProcessing
              ? 'bg-zinc-700 text-zinc-500'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
          (disabled || isProcessing) && 'opacity-50 cursor-not-allowed'
        )}
        title={isRecording ? 'Parar (Alt+M)' : 'Gravar (Alt+M)'}
      >
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div key="loader" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.div>
          ) : isRecording ? (
            <motion.div
              key="stop"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
            >
              <Square className="w-4 h-4 fill-current" />
            </motion.div>
          ) : (
            <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Mic className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring quando gravando */}
        {isRecording && (
          <motion.span
            className="absolute inset-0 rounded-lg border-2 border-red-500"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Visualizador e timer quando gravando */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            {/* Timer */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-xs text-red-400 tabular-nums"
            >
              {formatTime(recordingTime)}
            </motion.span>

            {/* Visualizer Bars */}
            <div className="h-4 flex items-center gap-px">
              {[...Array(VISUALIZER_BARS)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-gradient-to-t from-red-500 to-red-400"
                  animate={
                    isClient
                      ? {
                          height: ['30%', `${20 + Math.random() * 80}%`, '30%']
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.5 + Math.random() * 0.5,
                    repeat: Infinity,
                    delay: i * 0.02,
                    ease: 'easeInOut'
                  }}
                  style={{
                    height: '30%',
                    opacity: 0.6 + (i / VISUALIZER_BARS) * 0.4
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status de processamento */}
      <AnimatePresence>
        {isProcessing && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-zinc-400"
          >
            Transcrevendo...
          </motion.span>
        )}
      </AnimatePresence>

      {/* Erro */}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
