/**
 * @file ChatInterface.tsx
 * @description Interface de chat full-width estilo ChatGPT/Claude para o Dashboard
 * @module components/assistant
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  Calendar,
  CheckSquare,
  DollarSign,
  Users,
  ClipboardList,
  CalendarPlus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { useAssistant } from '@/hooks/useAssistant';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ConfirmationCard } from './cards';
import { VoiceRecorder } from './VoiceRecorder';

/**
 * Ações rápidas para o estado inicial
 */
const quickActions = [
  { label: 'Resumo do dia', Icon: Calendar, command: 'O que tenho para hoje?' },
  { label: 'Tarefas pendentes', Icon: CheckSquare, command: 'Quais tarefas estão pendentes?' },
  { label: 'Pagamentos atrasados', Icon: DollarSign, command: 'Tem algum pagamento atrasado?' },
  { label: 'Meus clientes', Icon: Users, command: 'Quais são meus clientes?' },
  { label: 'Criar tarefa', Icon: ClipboardList, command: 'Criar uma nova tarefa' },
  { label: 'Agendar reunião', Icon: CalendarPlus, command: 'Agendar uma reunião' },
];

/**
 * Interface de chat full-width estilo ChatGPT/Claude
 */
export function ChatInterface() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    chatState,
    pendingConfirmation,
    isLoading,
    isAwaitingConfirmation,
    isExecuting,
    sendMessage,
    confirmAction,
    cancelAction,
    selectClient,
    executeSuggestedAction,
    clearMessages,
  } = useAssistant();

  // Track previous messages length to only scroll on new messages
  const prevMessagesLengthRef = useRef(messages.length);

  // Scroll automático apenas dentro do container de mensagens
  useEffect(() => {
    // Only scroll if a new message was added
    if (messages.length > prevMessagesLengthRef.current && messagesContainerRef.current) {
      const timeoutId = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
      prevMessagesLengthRef.current = messages.length;
      return () => clearTimeout(timeoutId);
    }
    // Update ref if messages were cleared or reduced
    prevMessagesLengthRef.current = messages.length;
    return undefined;
  }, [messages.length]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  const handleSend = useCallback(() => {
    if (inputRef.current && inputRef.current.value.trim()) {
      const input = inputRef.current.value.trim();

      // Verificar se é um comando /clear
      if (input.toLowerCase() === '/clear' || input.toLowerCase() === '/limpar') {
        clearMessages();
        inputRef.current.value = '';
        inputRef.current.style.height = 'auto';
        return;
      }

      sendMessage(input);
      inputRef.current.value = '';
      inputRef.current.style.height = 'auto';
    }
  }, [sendMessage, clearMessages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleConfirm = useCallback(() => {
    if (pendingConfirmation) {
      confirmAction(pendingConfirmation);
    }
  }, [pendingConfirmation, confirmAction]);

  const handleCancel = useCallback(() => {
    cancelAction();
  }, [cancelAction]);

  const handleSelectClient = useCallback(
    (clientId: string) => {
      if (pendingConfirmation?.type === 'client_select') {
        const clientSelectData = pendingConfirmation.data as {
          pendingTool: { id: string; name: string; parameters: Record<string, unknown> };
        };
        selectClient(clientId, clientSelectData.pendingTool);
      }
    },
    [pendingConfirmation, selectClient]
  );

  const handleEdit = useCallback(
    (updatedData: unknown) => {
      if (pendingConfirmation) {
        confirmAction(pendingConfirmation, updatedData as Record<string, unknown>);
      }
    },
    [pendingConfirmation, confirmAction]
  );

  const handleVoiceTranscription = useCallback((text: string) => {
    if (inputRef.current) {
      inputRef.current.value = text;
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[900px]">
      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Welcome state */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              {/* Logo/Icon */}
              <motion.div
                className="w-20 h-20 bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD] rounded-2xl flex items-center justify-center mb-8 shadow-xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Bot className="w-10 h-10 text-[#0a0a0f]" />
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-3xl font-bold text-white mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Como posso ajudar?
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-base text-[#8FAAAD] max-w-md text-center mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                Sou o Marcola, seu assistente de tráfego pago. Posso ajudar com tarefas, reuniões, cobranças, WhatsApp e muito mais.
              </motion.p>

              {/* Quick actions grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(action.command)}
                    className={cn(
                      'p-4 rounded-xl text-left transition-all',
                      'bg-white/[0.03] border border-white/[0.08]',
                      'hover:bg-white/[0.06] hover:border-white/[0.15]',
                      'group'
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#BDCDCF]/20 to-[#8FAAAD]/20 flex items-center justify-center mb-3 group-hover:from-[#BDCDCF]/30 group-hover:to-[#8FAAAD]/30 transition-all">
                      <action.Icon className="w-5 h-5 text-[#BDCDCF]" />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-[#BDCDCF] transition-colors">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages list */}
          {messages.length > 0 && (
            <div className="space-y-6">
              {/* Header com botão de limpar */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B8A8D]">
                  {messages.length} mensage{messages.length === 1 ? 'm' : 'ns'}
                </span>
                <motion.button
                  onClick={clearMessages}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#6B8A8D] hover:text-[#E57373] bg-white/[0.03] hover:bg-[#E57373]/10 border border-white/[0.06] hover:border-[#E57373]/20 rounded-lg transition-all"
                  title="Limpar chat (/clear)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar
                </motion.button>
              </div>

              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onActionClick={executeSuggestedAction}
                />
              ))}

              {/* Typing indicator */}
              <TypingIndicator state={chatState} />

              {/* Confirmation card */}
              <AnimatePresence>
                {pendingConfirmation && isAwaitingConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ConfirmationCard
                      confirmation={pendingConfirmation}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      onEdit={handleEdit}
                      onSelectClient={handleSelectClient}
                      isExecuting={isExecuting}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="border-t border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className={cn(
            'flex items-end gap-3 p-3 rounded-2xl',
            'bg-white/[0.03] border border-white/[0.08]',
            'focus-within:border-[#BDCDCF]/30 focus-within:bg-white/[0.05]',
            'transition-all duration-200'
          )}>
            {/* Textarea */}
            <textarea
              ref={inputRef}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isAwaitingConfirmation}
              placeholder={
                isAwaitingConfirmation
                  ? 'Aguardando confirmação...'
                  : 'Envie uma mensagem para o Marcola...'
              }
              rows={1}
              className={cn(
                'flex-1 bg-transparent border-none outline-none resize-none',
                'text-white placeholder:text-[#6B8A8D]',
                'text-base leading-relaxed',
                'max-h-[200px]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />

            {/* Voice recorder */}
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
              disabled={isLoading || isAwaitingConfirmation}
            />

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={isLoading || isAwaitingConfirmation}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'p-2.5 rounded-xl transition-all',
                'bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD]',
                'text-[#0a0a0f] font-medium',
                'hover:shadow-lg hover:shadow-[#BDCDCF]/20',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Footer hint */}
          <p className="text-xs text-[#6B8A8D] text-center mt-3 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Marcola pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}
