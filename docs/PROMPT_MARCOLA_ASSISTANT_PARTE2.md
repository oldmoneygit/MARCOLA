# 🤖 MARCOLA ASSISTANT - Parte 2: Tools e Voice Input

---

## 4. DEFINIÇÃO DOS TOOLS

```typescript
// src/lib/assistant/tools.ts

import { ToolDefinition } from './types';

export const ASSISTANT_TOOLS: ToolDefinition[] = [
  // ==================== CLIENTES ====================
  {
    name: 'buscar_cliente',
    description: 'Busca um cliente pelo nome ou características. Use sempre que o usuário mencionar um cliente.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nome ou característica do cliente' }
      },
      required: ['query']
    },
    requiresConfirmation: false
  },
  {
    name: 'listar_clientes',
    description: 'Lista todos os clientes do usuário.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'inactive', 'all'] },
        limit: { type: 'number' }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== REUNIÕES ====================
  {
    name: 'criar_reuniao',
    description: 'Agenda uma reunião com um cliente. Use quando pedirem para marcar/agendar reunião.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string', description: 'ID do cliente' },
        date: { type: 'string', description: 'Data (YYYY-MM-DD)' },
        time: { type: 'string', description: 'Horário (HH:mm)' },
        type: { type: 'string', enum: ['online', 'presencial'] },
        notes: { type: 'string', description: 'Notas opcionais' }
      },
      required: ['clientId', 'date', 'time']
    },
    requiresConfirmation: true,
    confirmationType: 'meeting'
  },
  {
    name: 'listar_reunioes',
    description: 'Lista reuniões agendadas.',
    parameters: {
      type: 'object',
      properties: {
        periodo: { type: 'string', enum: ['hoje', 'amanha', 'semana', 'mes'] },
        clientId: { type: 'string' }
      },
      required: []
    },
    requiresConfirmation: false
  },

  // ==================== TAREFAS ====================
  {
    name: 'criar_tarefa',
    description: 'Cria uma nova tarefa. Use quando pedirem para adicionar tarefa ou to-do.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título da tarefa' },
        description: { type: 'string' },
        clientId: { type: 'string' },
        dueDate: { type: 'string', description: 'Data limite (YYYY-MM-DD)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        category: { type: 'string', enum: ['optimization', 'creative', 'report', 'meeting', 'payment', 'other'] }
      },
      required: ['title']
    },
    requiresConfirmation: true,
    confirmationType: 'task'
  },
  {
    name: 'listar_tarefas',
    description: 'Lista tarefas pendentes.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'completed', 'all'] },
        clientId: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        periodo: { type: 'string', enum: ['hoje', 'semana', 'atrasadas', 'todas'] }
      },
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'concluir_tarefa',
    description: 'Marca uma tarefa como concluída.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string' }
      },
      required: ['taskId']
    },
    requiresConfirmation: false
  },

  // ==================== PAGAMENTOS ====================
  {
    name: 'criar_cobranca',
    description: 'Cria uma nova cobrança para um cliente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        amount: { type: 'number', description: 'Valor em reais' },
        dueDate: { type: 'string', description: 'Vencimento (YYYY-MM-DD)' },
        description: { type: 'string' }
      },
      required: ['clientId', 'amount', 'dueDate']
    },
    requiresConfirmation: true,
    confirmationType: 'payment'
  },
  {
    name: 'listar_pagamentos',
    description: 'Lista pagamentos pendentes ou vencidos.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'all'] },
        clientId: { type: 'string' }
      },
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'marcar_pago',
    description: 'Marca um pagamento como pago.',
    parameters: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        paidAt: { type: 'string' }
      },
      required: ['paymentId']
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },

  // ==================== WHATSAPP ====================
  {
    name: 'enviar_whatsapp',
    description: 'Envia mensagem WhatsApp para um cliente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        message: { type: 'string', description: 'Texto da mensagem' }
      },
      required: ['clientId', 'message']
    },
    requiresConfirmation: true,
    confirmationType: 'whatsapp'
  },
  {
    name: 'gerar_mensagem',
    description: 'Gera mensagem personalizada para um cliente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        tipo: { type: 'string', enum: ['lembrete_pagamento', 'confirmacao_reuniao', 'followup', 'boas_vindas', 'cobranca', 'custom'] },
        contexto: { type: 'string' }
      },
      required: ['clientId', 'tipo']
    },
    requiresConfirmation: false
  },

  // ==================== LEMBRETES ====================
  {
    name: 'criar_lembrete',
    description: 'Cria um lembrete pessoal.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        date: { type: 'string', description: 'Data (YYYY-MM-DD)' },
        time: { type: 'string', description: 'Horário opcional (HH:mm)' },
        clientId: { type: 'string' }
      },
      required: ['message', 'date']
    },
    requiresConfirmation: true,
    confirmationType: 'reminder'
  },

  // ==================== RESUMOS ====================
  {
    name: 'resumo_dia',
    description: 'Gera resumo do dia. Use quando pedirem "o que tenho hoje" ou "resumo".',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    requiresConfirmation: false
  },
  {
    name: 'resumo_cliente',
    description: 'Gera resumo completo de um cliente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' }
      },
      required: ['clientId']
    },
    requiresConfirmation: false
  },

  // ==================== ANÁLISE ====================
  {
    name: 'pesquisar_concorrentes',
    description: 'Pesquisa concorrentes de um cliente em uma região.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        regiao: { type: 'string', description: 'Cidade/região' },
        raioKm: { type: 'number' }
      },
      required: ['clientId', 'regiao']
    },
    requiresConfirmation: true,
    confirmationType: 'generic'
  },
  {
    name: 'analisar_performance',
    description: 'Analisa performance de um cliente.',
    parameters: {
      type: 'object',
      properties: {
        clientId: { type: 'string' },
        periodo: { type: 'string', enum: ['7d', '14d', '30d', '90d'] }
      },
      required: ['clientId']
    },
    requiresConfirmation: false
  }
];

// Helpers
export function getToolsForClaude() {
  return ASSISTANT_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
  }));
}

export function toolRequiresConfirmation(toolName: string): boolean {
  const tool = ASSISTANT_TOOLS.find(t => t.name === toolName);
  return tool?.requiresConfirmation ?? false;
}

export function getConfirmationType(toolName: string) {
  const tool = ASSISTANT_TOOLS.find(t => t.name === toolName);
  return tool?.confirmationType;
}
```

---

## 5. VOICE INPUT COM WHISPER

### 5.1 API de Transcrição

```typescript
// src/app/api/assistant/transcribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter arquivo de áudio
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Áudio não fornecido' }, { status: 400 });
    }

    // Transcrever com Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json'
    });

    return NextResponse.json({
      success: true,
      text: transcription.text
    });

  } catch (error: any) {
    console.error('Erro na transcrição:', error);
    return NextResponse.json(
      { error: 'Erro ao transcrever áudio', details: error.message },
      { status: 500 }
    );
  }
}
```

### 5.2 Componente VoiceRecorder

```typescript
// src/components/assistant/VoiceRecorder.tsx

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  disabled?: boolean;
}

export function VoiceRecorder({
  onTranscription,
  onRecordingChange,
  disabled = false
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpar recursos
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Atalho Alt + M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'm' && !disabled) {
        e.preventDefault();
        toggleRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, disabled]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      streamRef.current = stream;
      audioChunks.current = [];
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      recorder.onstop = () => processAudio();
      
      mediaRecorder.current = recorder;
      recorder.start(100);
      
      setIsRecording(true);
      setRecordingTime(0);
      onRecordingChange?.(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      onRecordingChange?.(false);
    }
  };

  const processAudio = async () => {
    if (audioChunks.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      
      if (audioBlob.size < 1000) {
        setIsProcessing(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/assistant/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Erro na transcrição');
      
      const { text } = await response.json();
      if (text?.trim()) onTranscription(text.trim());
      
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao transcrever áudio.');
    } finally {
      setIsProcessing(false);
      audioChunks.current = [];
    }
  };

  const toggleRecording = useCallback(() => {
    if (isProcessing) return;
    isRecording ? stopRecording() : startRecording();
  }, [isRecording, isProcessing]);

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="flex items-center gap-2">
      {isRecording && (
        <span className="text-sm text-red-500 font-mono animate-pulse">
          {formatTime(recordingTime)}
        </span>
      )}
      
      <button
        type="button"
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        className={cn(
          'p-2 rounded-full transition-all',
          isRecording
            ? 'bg-red-500 text-white animate-pulse'
            : isProcessing
            ? 'bg-gray-300 cursor-wait'
            : 'bg-gray-100 hover:bg-gray-200'
        )}
        title={isRecording ? 'Parar (Alt+M)' : 'Gravar (Alt+M)'}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
      
      {isRecording && <span className="text-xs text-red-500">Gravando...</span>}
      {isProcessing && <span className="text-xs text-gray-500">Transcrevendo...</span>}
    </div>
  );
}
```

### 5.3 Componente ChatInput

```typescript
// src/components/assistant/ChatInput.tsx

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTranscription = (text: string) => {
    setMessage(prev => prev ? `${prev} ${text}` : text);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Digite ou pressione Alt+M para falar...'}
          disabled={disabled || isRecording}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-lg border px-4 py-3',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'disabled:bg-gray-100'
          )}
          style={{ minHeight: '44px', maxHeight: '150px' }}
        />

        <VoiceRecorder
          onTranscription={handleTranscription}
          onRecordingChange={setIsRecording}
          disabled={disabled}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !message.trim() || isRecording}
          className={cn(
            'p-2 rounded-full transition-colors',
            message.trim() && !disabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        💡 <kbd className="px-1 bg-gray-100 rounded">Alt+M</kbd> para falar
        {' • '}
        <kbd className="px-1 bg-gray-100 rounded">Enter</kbd> para enviar
      </p>
    </div>
  );
}
```

---

**Continua na Parte 3...**
