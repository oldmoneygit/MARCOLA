/**
 * @file ChatMessage.tsx
 * @description Componente de mensagem animada do chat do assistente
 * @module components/assistant
 */

'use client';

import { User, Bot, Mic, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

import { cn } from '@/lib/utils';
import { FormattedContent } from './FormattedContent';
import type { ChatMessage as ChatMessageType, SuggestedAction } from '@/lib/assistant/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onActionClick?: (action: SuggestedAction) => void;
}

/**
 * Formata timestamp para exibição
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Variantes de animação para mensagens
 */
const messageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24
    }
  }
};

const actionButtonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      type: 'spring' as const,
      stiffness: 400,
      damping: 20
    }
  })
};

/**
 * Componente de mensagem animada do chat
 */
export function ChatMessage({ message, onActionClick }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.contentType === 'error';
  const isResult = message.contentType === 'result';
  const isVoice = message.contentType === 'voice';

  const handleCopy = useCallback(async () => {
    try {
      // Limpar HTML comments do conteúdo
      const cleanContent = message.content.replace(/<!--[\s\S]*?-->/g, '').trim();
      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  }, [message.content]);

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex gap-4 p-4 rounded-2xl relative group',
        isUser
          ? 'bg-gradient-to-r from-[#BDCDCF]/10 to-[#BDCDCF]/5 border border-[#BDCDCF]/10'
          : 'bg-white/[0.03] border border-white/[0.06]'
      )}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg',
          isUser
            ? 'bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD]'
            : 'bg-gradient-to-br from-[#7ED4A6] to-[#5CC48A]'
        )}
      >
        {isUser ? <User className="w-5 h-5 text-[#0a0a0f]" /> : <Bot className="w-5 h-5 text-[#0a0a0f]" />}
      </motion.div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-sm font-semibold', isUser ? 'text-[#BDCDCF]' : 'text-[#7ED4A6]')}>
            {isUser ? 'Você' : 'Marcola'}
          </span>
          <span className="text-xs text-zinc-500">{formatTime(new Date(message.timestamp))}</span>

          {isVoice && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-700/50 px-2 py-0.5 rounded-full"
            >
              <Mic className="w-3 h-3" />
              voz
            </motion.span>
          )}

          {/* Copy button - aparece no hover */}
          {!isUser && (
            <motion.button
              onClick={handleCopy}
              className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
              whileTap={{ scale: 0.9 }}
              title="Copiar mensagem"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>

        {/* Texto da mensagem */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'leading-relaxed break-words',
            isError ? 'text-red-400' : 'text-zinc-100'
          )}
        >
          {isError && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex mr-2">
              <AlertCircle className="w-4 h-4 -mt-0.5" />
            </motion.span>
          )}
          {isResult && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex mr-2">
              <CheckCircle className="w-4 h-4 -mt-0.5 text-green-400" />
            </motion.span>
          )}
          {/* Usar FormattedContent para mensagens do assistente, texto simples para usuário */}
          {isUser ? (
            <span className="whitespace-pre-wrap">
              {message.content.replace(/<!--[\s\S]*?-->/g, '').trim()}
            </span>
          ) : (
            <FormattedContent content={message.content} />
          )}
        </motion.div>

        {/* Ações sugeridas */}
        <AnimatePresence>
          {message.suggestedActions && message.suggestedActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {message.suggestedActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  custom={index}
                  variants={actionButtonVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => onActionClick?.(action)}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-xl transition-all',
                    'bg-white/[0.05] border border-white/[0.08]',
                    'text-[#BDCDCF]',
                    'hover:bg-[#BDCDCF]/10 hover:border-[#BDCDCF]/20',
                    'hover:text-white',
                    'shadow-lg shadow-black/20'
                  )}
                >
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glow effect para mensagens do usuário */}
      {isUser && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#BDCDCF]/5 to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
      )}
    </motion.div>
  );
}
