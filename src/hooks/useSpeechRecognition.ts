/**
 * @file useSpeechRecognition.ts
 * @description Hook para transcrição de voz em tempo real usando Web Speech API
 * @module hooks
 *
 * @example
 * const { transcript, isListening, start, stop } = useSpeechRecognition({
 *   onResult: (text) => console.log(text),
 *   language: 'pt-BR'
 * });
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionOptions {
  /** Callback chamado quando há resultado de transcrição */
  onResult?: (transcript: string) => void;
  /** Callback chamado quando há erro */
  onError?: (error: string) => void;
  /** Idioma da transcrição */
  language?: string;
  /** Se deve continuar ouvindo após pausas */
  continuous?: boolean;
  /** Se deve retornar resultados intermediários */
  interimResults?: boolean;
}

interface SpeechRecognitionHook {
  /** Texto transcrito atual */
  transcript: string;
  /** Texto intermediário (ainda sendo processado) */
  interimTranscript: string;
  /** Se está ouvindo */
  isListening: boolean;
  /** Se o navegador suporta */
  isSupported: boolean;
  /** Iniciar reconhecimento */
  start: () => void;
  /** Parar reconhecimento */
  stop: () => void;
  /** Limpar transcrição */
  reset: () => void;
}

// Tipos para Web Speech API (não estão no TypeScript por padrão)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

/**
 * Hook para transcrição de voz em tempo real
 */
export function useSpeechRecognition({
  onResult,
  onError,
  language = 'pt-BR',
  continuous = true,
  interimResults = true,
}: SpeechRecognitionOptions = {}): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef('');

  // Verificar suporte do navegador
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Inicializar reconhecimento
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result?.[0];
        if (!result || !alternative) {
          continue;
        }
        if (result.isFinal) {
          final += alternative.transcript + ' ';
          finalTranscriptRef.current = final;
        } else {
          interim += alternative.transcript;
        }
      }

      setTranscript(final.trim());
      setInterimTranscript(interim);

      // Callback com texto completo (final + interim)
      const fullText = (final + interim).trim();
      if (fullText) {
        onResult?.(fullText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[useSpeechRecognition] Error:', event.error);

      // Ignorar erros de "no-speech" e "aborted"
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      let errorMessage = 'Erro no reconhecimento de voz';
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Permissão de microfone negada';
          break;
        case 'network':
          errorMessage = 'Erro de rede. Verifique sua conexão.';
          break;
        case 'audio-capture':
          errorMessage = 'Nenhum microfone encontrado';
          break;
        default:
          errorMessage = `Erro: ${event.error}`;
      }

      onError?.(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Reiniciar automaticamente se ainda deveria estar ouvindo
      if (isListening && continuous) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, language, continuous, interimResults, onResult, onError, isListening]);

  // Iniciar reconhecimento
  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) {
      return;
    }

    try {
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('[useSpeechRecognition] Start error:', error);
      onError?.('Erro ao iniciar reconhecimento de voz');
    }
  }, [isListening, onError]);

  // Parar reconhecimento
  const stop = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    setIsListening(false);
    recognitionRef.current.stop();
  }, []);

  // Limpar transcrição
  const reset = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    reset,
  };
}
