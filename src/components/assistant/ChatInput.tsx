/**
 * @file ChatInput.tsx
 * @description Componente de input animado para o chat do MARCOLA Assistant
 * @module components/assistant
 */

'use client';

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react';
import { Send, Calendar, CheckSquare, DollarSign, Users, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { VoiceRecorder } from './VoiceRecorder';

interface QuickCommand {
  icon: React.ReactNode;
  label: string;
  description: string;
  command: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const QUICK_COMMANDS: QuickCommand[] = [
  {
    icon: <Calendar className="w-4 h-4" />,
    label: 'Resumo do dia',
    description: 'Ver reuniões e tarefas de hoje',
    command: 'O que tenho para hoje?'
  },
  {
    icon: <CheckSquare className="w-4 h-4" />,
    label: 'Tarefas',
    description: 'Listar tarefas pendentes',
    command: 'Quais tarefas estão pendentes?'
  },
  {
    icon: <DollarSign className="w-4 h-4" />,
    label: 'Pagamentos',
    description: 'Ver pagamentos atrasados',
    command: 'Tem algum pagamento atrasado?'
  },
  {
    icon: <Users className="w-4 h-4" />,
    label: 'Clientes',
    description: 'Listar todos os clientes',
    command: 'Quais são meus clientes?'
  }
];

/**
 * Hook para auto-resize do textarea
 */
function useAutoResizeTextarea(minHeight: number, maxHeight: number) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

/**
 * Componente de input animado para o chat
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Digite ou pressione Alt+M para falar...',
  className
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [activeCommand, setActiveCommand] = useState(-1);
  const [inputFocused, setInputFocused] = useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea(52, 150);
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  // Detectar comandos com /
  useEffect(() => {
    if (message.startsWith('/') && !message.includes(' ')) {
      setShowCommands(true);
      const matchingIndex = QUICK_COMMANDS.findIndex((cmd) =>
        cmd.label.toLowerCase().includes(message.slice(1).toLowerCase())
      );
      setActiveCommand(matchingIndex >= 0 ? matchingIndex : 0);
    } else {
      setShowCommands(false);
      setActiveCommand(-1);
    }
  }, [message]);

  // Fechar command palette ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector('[data-command-button]');

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommands(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
      adjustHeight(true);
    }
  }, [message, disabled, onSend, adjustHeight]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showCommands) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveCommand((prev) => (prev < QUICK_COMMANDS.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveCommand((prev) => (prev > 0 ? prev - 1 : QUICK_COMMANDS.length - 1));
        } else if (e.key === 'Tab' || e.key === 'Enter') {
          e.preventDefault();
          if (activeCommand >= 0) {
            const selectedCommand = QUICK_COMMANDS[activeCommand];
            if (selectedCommand) {
              onSend(selectedCommand.command);
              setMessage('');
              setShowCommands(false);
              adjustHeight(true);
            }
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowCommands(false);
        }
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [showCommands, activeCommand, handleSend, onSend, adjustHeight]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      adjustHeight();
    },
    [adjustHeight]
  );

  const handleTranscription = useCallback(
    (text: string) => {
      setMessage((prev) => (prev ? `${prev} ${text}` : text));
      textareaRef.current?.focus();
    },
    [textareaRef]
  );

  const handleRecordingChange = useCallback((recording: boolean) => {
    setIsRecording(recording);
  }, []);

  const selectCommand = useCallback(
    (index: number) => {
      const command = QUICK_COMMANDS[index];
      if (command) {
        onSend(command.command);
        setMessage('');
        setShowCommands(false);
        adjustHeight(true);
      }
    },
    [onSend, adjustHeight]
  );

  const canSend = message.trim().length > 0 && !disabled && !isRecording;

  return (
    <div className={cn('bg-zinc-900/80 backdrop-blur-xl p-4', className)}>
      <motion.div
        className="relative backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Command Palette */}
        <AnimatePresence>
          {showCommands && (
            <motion.div
              ref={commandPaletteRef}
              className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-zinc-900/95 rounded-xl z-50 shadow-2xl border border-white/10 overflow-hidden"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
            >
              <div className="py-2">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Comandos rápidos
                </div>
                {QUICK_COMMANDS.map((cmd, index) => (
                  <motion.div
                    key={cmd.label}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer',
                      activeCommand === index
                        ? 'bg-violet-500/20 text-white'
                        : 'text-zinc-300 hover:bg-white/5'
                    )}
                    onClick={() => selectCommand(index)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        activeCommand === index ? 'bg-violet-500/30 text-violet-300' : 'bg-zinc-800 text-zinc-400'
                      )}
                    >
                      {cmd.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{cmd.label}</div>
                      <div className="text-xs text-zinc-500">{cmd.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={placeholder}
              disabled={disabled || isRecording}
              rows={1}
              className={cn(
                'w-full px-4 py-3 resize-none bg-transparent border-none',
                'text-white/90 text-sm leading-relaxed',
                'focus:outline-none placeholder:text-zinc-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
              style={{ minHeight: '52px', maxHeight: '150px' }}
            />

            {/* Focus ring animado */}
            <AnimatePresence>
              {inputFocused && (
                <motion.span
                  className="absolute inset-0 rounded-xl pointer-events-none ring-2 ring-violet-500/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            {/* Command Button */}
            <motion.button
              type="button"
              data-command-button
              onClick={() => setShowCommands((prev) => !prev)}
              whileTap={{ scale: 0.94 }}
              className={cn(
                'p-2 rounded-lg transition-colors relative group',
                showCommands ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )}
              title="Comandos rápidos (/)"
            >
              <Command className="w-4 h-4" />
            </motion.button>

            {/* Voice Recorder */}
            <VoiceRecorder
              onTranscription={handleTranscription}
              onRecordingChange={handleRecordingChange}
              disabled={disabled}
            />
          </div>

          {/* Send Button */}
          <motion.button
            type="button"
            onClick={handleSend}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!canSend}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              'flex items-center gap-2',
              canSend
                ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-zinc-800 text-zinc-500'
            )}
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Hints */}
      <motion.div
        className="flex items-center justify-center gap-4 mt-3 text-[11px] text-zinc-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono">/</kbd>
          comandos
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono">Alt+M</kbd>
          voz
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono">Enter</kbd>
          enviar
        </span>
      </motion.div>
    </div>
  );
}
