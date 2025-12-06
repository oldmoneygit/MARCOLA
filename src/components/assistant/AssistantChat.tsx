/**
 * @file AssistantChat.tsx
 * @description Componente principal animado do chat flutuante do MARCOLA Assistant
 * @module components/assistant
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Minimize2, Maximize2, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { useAssistant } from '@/hooks/useAssistant';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ConfirmationCard } from './cards';

interface AssistantChatProps {
  defaultOpen?: boolean;
}

/**
 * Variantes de animação
 */
const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

const welcomeButtonVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.1,
      type: 'spring' as const,
      stiffness: 400,
      damping: 20
    }
  })
};

/**
 * Componente principal do chat flutuante do assistente
 */
export function AssistantChat({ defaultOpen = false }: AssistantChatProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    clearMessages
  } = useAssistant();

  // Scroll automático para última mensagem
  useEffect(() => {
    if (isOpen && !isMinimized && messagesEndRef.current) {
      // Pequeno delay para garantir que o DOM está renderizado
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [messages, chatState, isOpen, isMinimized]);

  // Atalho de teclado para abrir/fechar (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage]
  );

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

  const quickActions = [
    { label: 'Resumo do dia', icon: '📅', command: 'O que tenho para hoje?' },
    { label: 'Tarefas pendentes', icon: '✅', command: 'Quais tarefas estão pendentes?' },
    { label: 'Pagamentos', icon: '💰', command: 'Tem algum pagamento atrasado?' },
    { label: 'Meus clientes', icon: '👥', command: 'Quais são meus clientes?' }
  ];

  return (
    <>
      {/* Botão flutuante quando fechado */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl shadow-lg shadow-violet-500/25 flex items-center justify-center z-50 group"
            title="Abrir assistente (Ctrl+Shift+M)"
          >
            <Bot className="w-6 h-6 text-white" />

            {/* Pulse effect */}
            <motion.span
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500"
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Online indicator */}
            <motion.span
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-zinc-900"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed z-50',
              isMinimized ? 'bottom-6 right-6 w-80' : 'bottom-6 right-6 w-[480px] h-[700px] max-h-[85vh]'
            )}
          >
            <div
              className={cn(
                'bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative',
                isMinimized ? 'h-auto' : 'h-full'
              )}
            >
              {/* Background glow effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
              </div>

              {/* Header */}
              <motion.div
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-b border-white/10 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                      Marcola
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <p className="text-xs text-zinc-400">Assistente de Tráfego</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <motion.button
                      onClick={clearMessages}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
                      title="Limpar conversa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}

                  <motion.button
                    onClick={() => setIsMinimized(!isMinimized)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
                    title={isMinimized ? 'Expandir' : 'Minimizar'}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </motion.button>

                  <motion.button
                    onClick={() => setIsOpen(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Fechar (Ctrl+Shift+M)"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Content */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex-1 flex flex-col overflow-hidden relative z-10"
                  >
                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {/* Welcome message */}
                      {messages.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-8"
                        >
                          <motion.div
                            className="w-20 h-20 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/20"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          >
                            <Bot className="w-10 h-10 text-white" />
                          </motion.div>

                          <motion.h4
                            className="text-xl font-semibold text-zinc-100 mb-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            Olá! Sou o Marcola
                          </motion.h4>

                          <motion.p
                            className="text-base text-zinc-400 max-w-[320px] mx-auto leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                          >
                            Seu assistente de tráfego pago. Posso ajudar com reuniões, tarefas, cobranças, WhatsApp e muito
                            mais!
                          </motion.p>

                          <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {quickActions.map((action, index) => (
                              <motion.button
                                key={action.label}
                                custom={index}
                                variants={welcomeButtonVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => sendMessage(action.command)}
                                className="px-4 py-2.5 text-sm font-medium bg-zinc-800/80 text-zinc-200 rounded-xl hover:bg-zinc-700 hover:text-white transition-all border border-white/5 hover:border-white/10 shadow-lg"
                              >
                                <span className="mr-1.5">{action.icon}</span>
                                {action.label}
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Messages list */}
                      {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} onActionClick={executeSuggestedAction} />
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

                      {/* Scroll anchor */}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-white/5">
                      <ChatInput
                        onSend={handleSend}
                        disabled={isLoading || isAwaitingConfirmation}
                        placeholder={isAwaitingConfirmation ? 'Aguardando confirmação...' : 'Digite ou use / para comandos...'}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
