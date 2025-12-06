/**
 * @file useAssistant.ts
 * @description Hook principal para gerenciar o MARCOLA Assistant
 * @module hooks
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ChatMessage,
  AssistantState,
  ChatState,
  ConfirmationData,
  ToolCall,
  UserContext,
  SuggestedAction
} from '@/lib/assistant/types';

const STORAGE_KEY = 'marcola_chat_history';

/**
 * Gera um ID único para mensagens
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Carrega mensagens do sessionStorage
 */
function loadMessagesFromStorage(): ChatMessage[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const messages = JSON.parse(stored) as ChatMessage[];
      // Converter timestamps de string para Date
      return messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    }
  } catch (error) {
    console.error('[useAssistant] Erro ao carregar histórico:', error);
  }
  return [];
}

/**
 * Salva mensagens no sessionStorage
 */
function saveMessagesToStorage(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('[useAssistant] Erro ao salvar histórico:', error);
  }
}

/**
 * Hook principal do assistente
 * Gerencia estado, mensagens, confirmações e comunicação com as APIs
 * O histórico persiste durante a sessão do navegador
 */
export function useAssistant() {
  // Estado principal - inicializa com histórico do sessionStorage
  const [state, setState] = useState<AssistantState>(() => ({
    messages: loadMessagesFromStorage(),
    state: 'idle',
    error: undefined,
    pendingConfirmation: undefined,
    context: undefined
  }));

  // Salvar mensagens no sessionStorage sempre que mudarem
  useEffect(() => {
    saveMessagesToStorage(state.messages);
  }, [state.messages]);

  // Ref para controlar requests em andamento
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Atualiza o estado do chat
   */
  const setChatState = useCallback((newState: ChatState) => {
    setState((prev) => ({ ...prev, state: newState, error: undefined }));
  }, []);

  /**
   * Define erro no estado
   */
  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, state: 'error', error }));
  }, []);

  /**
   * Adiciona uma mensagem ao histórico
   */
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date()
    };
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
    return newMessage;
  }, []);

  /**
   * Atualiza a última mensagem do assistente
   */
  const updateLastAssistantMessage = useCallback(
    (updates: Partial<ChatMessage>) => {
      setState((prev) => {
        const messages = [...prev.messages];
        const lastIndex = messages.length - 1;
        const lastMessage = messages[lastIndex];
        if (lastIndex >= 0 && lastMessage && lastMessage.role === 'assistant') {
          messages[lastIndex] = { ...lastMessage, ...updates };
        }
        return { ...prev, messages };
      });
    },
    []
  );

  /**
   * Limpa todas as mensagens (também limpa sessionStorage)
   */
  const clearMessages = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setState((prev) => ({
      ...prev,
      messages: [],
      pendingConfirmation: undefined,
      error: undefined
    }));
  }, []);

  /**
   * Busca contexto do usuário
   */
  const fetchContext = useCallback(async (): Promise<UserContext | null> => {
    try {
      const response = await fetch('/api/assistant/context');
      const data = await response.json();
      if (data.context) {
        setState((prev) => ({ ...prev, context: data.context }));
        return data.context;
      }
      return null;
    } catch (error) {
      console.error('[useAssistant] Erro ao buscar contexto:', error);
      return null;
    }
  }, []);

  /**
   * Envia uma mensagem para o assistente
   */
  const sendMessage = useCallback(
    async (content: string, contentType: 'text' | 'voice' = 'text') => {
      // Cancelar request anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Adicionar mensagem do usuário
      addMessage({
        role: 'user',
        content,
        contentType
      });

      setChatState('processing');

      try {
        // Preparar histórico para a API
        const conversationHistory = state.messages.map((m) => ({
          role: m.role,
          content: m.content
        }));

        const response = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            conversationHistory
          }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao processar mensagem');
        }

        const data = await response.json();

        // Adicionar resposta do assistente
        const assistantMessage = addMessage({
          role: 'assistant',
          content: data.message || '',
          contentType: 'text',
          confirmation: data.confirmation,
          suggestedActions: data.suggestedActions
        });

        // Se há confirmação pendente
        if (data.confirmation) {
          setState((prev) => ({
            ...prev,
            state: 'awaiting_confirmation',
            pendingConfirmation: data.confirmation
          }));
        } else {
          setChatState('idle');
        }

        return assistantMessage;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return null;
        }
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(errorMessage);
        addMessage({
          role: 'assistant',
          content: `Desculpe, ocorreu um erro: ${errorMessage}`,
          contentType: 'error'
        });
        return null;
      }
    },
    [state.messages, addMessage, setChatState, setError]
  );

  /**
   * Confirma uma ação pendente
   */
  const confirmAction = useCallback(
    async (confirmation: ConfirmationData, updatedParams?: Record<string, unknown>) => {
      setChatState('executing');

      try {
        const response = await fetch('/api/assistant/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolCall: confirmation.toolToExecute,
            updatedParams
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erro ao executar ação');
        }

        // Atualizar última mensagem com resultado
        updateLastAssistantMessage({
          result: data.result,
          suggestedActions: data.suggestedActions
        });

        // Adicionar mensagem de sucesso
        addMessage({
          role: 'assistant',
          content: data.message || 'Ação executada com sucesso!',
          contentType: 'result',
          result: data.result,
          suggestedActions: data.suggestedActions
        });

        // Limpar confirmação pendente
        setState((prev) => ({
          ...prev,
          state: 'idle',
          pendingConfirmation: undefined
        }));

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao executar ação';
        setError(errorMessage);
        addMessage({
          role: 'assistant',
          content: `Desculpe, ocorreu um erro: ${errorMessage}`,
          contentType: 'error'
        });
        return null;
      }
    },
    [setChatState, setError, updateLastAssistantMessage, addMessage]
  );

  /**
   * Cancela uma ação pendente
   */
  const cancelAction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      state: 'idle',
      pendingConfirmation: undefined
    }));
    addMessage({
      role: 'assistant',
      content: 'Ok, ação cancelada. Em que mais posso ajudar?',
      contentType: 'text'
    });
  }, [addMessage]);

  /**
   * Seleciona um cliente em caso de ambiguidade
   */
  const selectClient = useCallback(
    async (clientId: string, pendingTool: ToolCall) => {
      // Atualizar o tool call com o clientId selecionado
      const updatedToolCall: ToolCall = {
        ...pendingTool,
        parameters: {
          ...pendingTool.parameters,
          clientId
        }
      };

      // Re-processar com o cliente selecionado
      setChatState('processing');

      try {
        const response = await fetch('/api/assistant/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolCall: updatedToolCall
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erro ao executar ação');
        }

        addMessage({
          role: 'assistant',
          content: data.message || 'Ação executada com sucesso!',
          contentType: 'result',
          result: data.result,
          suggestedActions: data.suggestedActions
        });

        setState((prev) => ({
          ...prev,
          state: 'idle',
          pendingConfirmation: undefined
        }));

        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao executar ação';
        setError(errorMessage);
        return null;
      }
    },
    [setChatState, setError, addMessage]
  );

  /**
   * Processa callbacks de ações sugeridas
   */
  const handleCallback = useCallback(
    async (callbackId: string) => {
      // Callback de copiar é tratado localmente
      if (callbackId === 'copy-to-clipboard') {
        // Encontrar última mensagem com conteúdo para copiar
        const lastMessage = state.messages
          .filter(m => m.role === 'assistant')
          .pop();

        if (lastMessage?.content) {
          try {
            const cleanContent = lastMessage.content.replace(/<!--[\s\S]*?-->/g, '').trim();
            await navigator.clipboard.writeText(cleanContent);
            addMessage({
              role: 'assistant',
              content: 'Texto copiado para a área de transferência! 📋',
              contentType: 'text'
            });
          } catch {
            addMessage({
              role: 'assistant',
              content: 'Não foi possível copiar o texto.',
              contentType: 'error'
            });
          }
        }
        return;
      }

      setChatState('processing');

      try {
        const response = await fetch('/api/assistant/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callbackId })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erro ao processar ação');
        }

        // Se retornou URL do WhatsApp, abrir em nova aba
        if (data.data?.whatsappUrl) {
          window.open(data.data.whatsappUrl, '_blank');
          addMessage({
            role: 'assistant',
            content: data.message || 'Abrindo WhatsApp...',
            contentType: 'text'
          });
        } else {
          // Mensagem de sucesso
          addMessage({
            role: 'assistant',
            content: data.message || 'Ação executada com sucesso!',
            contentType: 'result'
          });
        }

        setChatState('idle');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao processar ação';
        setError(errorMessage);
        addMessage({
          role: 'assistant',
          content: `Desculpe, ocorreu um erro: ${errorMessage}`,
          contentType: 'error'
        });
      }
    },
    [state.messages, addMessage, setChatState, setError]
  );

  /**
   * Executa uma ação sugerida
   */
  const executeSuggestedAction = useCallback(
    async (action: SuggestedAction) => {
      switch (action.action.type) {
        case 'navigate':
          // Navegar para rota (externa ou interna)
          if (action.action.path.startsWith('http')) {
            window.open(action.action.path, '_blank');
          } else {
            window.location.href = action.action.path;
          }
          break;

        case 'tool':
          // Executar tool diretamente
          confirmAction({
            id: generateMessageId(),
            type: 'generic',
            status: 'pending',
            data: { title: action.label, description: '' },
            toolToExecute: action.action.toolCall,
            createdAt: new Date()
          });
          break;

        case 'callback':
          // Processar callback via API
          await handleCallback(action.action.callbackId);
          break;
      }
    },
    [confirmAction, handleCallback]
  );

  /**
   * Transcreve áudio usando Whisper
   */
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    setChatState('transcribing');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/assistant/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro na transcrição');
      }

      setChatState('idle');
      return data.text;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na transcrição';
      setError(errorMessage);
      return null;
    }
  }, [setChatState, setError]);

  /**
   * Envia mensagem de voz (grava, transcreve, envia)
   */
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      const transcribedText = await transcribeAudio(audioBlob);
      if (transcribedText) {
        return sendMessage(transcribedText, 'voice');
      }
      return null;
    },
    [transcribeAudio, sendMessage]
  );

  return {
    // Estado
    messages: state.messages,
    chatState: state.state,
    error: state.error,
    pendingConfirmation: state.pendingConfirmation,
    context: state.context,

    // Estado helpers
    isLoading: state.state === 'processing' || state.state === 'transcribing',
    isRecording: state.state === 'recording',
    isExecuting: state.state === 'executing',
    isAwaitingConfirmation: state.state === 'awaiting_confirmation',

    // Ações
    sendMessage,
    sendVoiceMessage,
    transcribeAudio,
    confirmAction,
    cancelAction,
    selectClient,
    executeSuggestedAction,
    clearMessages,
    fetchContext,

    // Controle de estado
    setChatState,
    setError
  };
}

export type UseAssistantReturn = ReturnType<typeof useAssistant>;
