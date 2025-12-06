/**
 * @file TypingIndicator.tsx
 * @description Indicador animado de digitação/processamento do assistente
 * @module components/assistant
 */

'use client';

import { Bot, Mic, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { ChatState } from '@/lib/assistant/types';

interface TypingIndicatorProps {
  state: ChatState;
}

/**
 * Componente de dots animados
 */
function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-cyan-400 rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.85, 1.2, 0.85]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: 'easeInOut'
          }}
          style={{
            boxShadow: '0 0 8px rgba(34, 211, 238, 0.4)'
          }}
        />
      ))}
    </div>
  );
}

/**
 * Indicador animado de processamento
 */
export function TypingIndicator({ state }: TypingIndicatorProps) {
  if (state === 'idle' || state === 'awaiting_confirmation' || state === 'error') {
    return null;
  }

  const getMessage = () => {
    switch (state) {
      case 'recording':
        return 'Gravando';
      case 'transcribing':
        return 'Transcrevendo';
      case 'processing':
        return 'Pensando';
      case 'executing':
        return 'Executando';
      default:
        return 'Processando';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'recording':
        return <Mic className="w-4 h-4" />;
      case 'transcribing':
        return <Mic className="w-4 h-4" />;
      case 'executing':
        return <Zap className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getIconColor = () => {
    switch (state) {
      case 'recording':
        return 'text-red-400';
      case 'transcribing':
        return 'text-amber-400';
      case 'executing':
        return 'text-green-400';
      default:
        return 'text-cyan-400';
    }
  };

  const getGradient = () => {
    switch (state) {
      case 'recording':
        return 'from-red-500/20 to-red-500/5';
      case 'transcribing':
        return 'from-amber-500/20 to-amber-500/5';
      case 'executing':
        return 'from-green-500/20 to-green-500/5';
      default:
        return 'from-cyan-500/20 to-cyan-500/5';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`inline-flex items-center gap-3 px-4 py-3 backdrop-blur-xl bg-gradient-to-r ${getGradient()} rounded-2xl border border-white/10 shadow-xl`}
      >
        {/* Avatar */}
        <motion.div
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg"
          animate={{
            scale: [1, 1.05, 1],
            rotate: state === 'processing' ? [0, 5, -5, 0] : 0
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Bot className="w-4 h-4 text-white" />
        </motion.div>

        {/* Indicador */}
        <div className="flex items-center gap-2">
          <motion.span
            className={getIconColor()}
            animate={{
              scale: state === 'recording' ? [1, 1.2, 1] : 1,
              opacity: state === 'recording' ? [1, 0.5, 1] : 1
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {getIcon()}
          </motion.span>

          <span className="text-sm text-zinc-300 font-medium">{getMessage()}</span>

          {/* Dots animados para estados de processamento */}
          {(state === 'processing' || state === 'executing') && <TypingDots />}

          {/* Barra de progresso para gravação */}
          {state === 'recording' && (
            <motion.div
              className="w-16 h-1 bg-zinc-700 rounded-full overflow-hidden ml-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                animate={{
                  width: ['0%', '100%']
                }}
                transition={{
                  duration: 60,
                  ease: 'linear'
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${
              state === 'recording'
                ? 'rgba(239, 68, 68, 0.1)'
                : state === 'executing'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(34, 211, 238, 0.1)'
            } 0%, transparent 70%)`
          }}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
