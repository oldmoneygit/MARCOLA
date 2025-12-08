# 🤖 MARCOLA ASSISTANT - Parte 5: Chat Principal e Finalização

---

## 9. COMPONENTE PRINCIPAL DO CHAT

```typescript
// src/components/assistant/AssistantChat.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Minimize2, Maximize2, X } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConfirmationCard } from './ConfirmationCard';
import { TypingIndicator } from './TypingIndicator';
import { useAssistant } from '@/hooks/useAssistant';
import { cn } from '@/lib/utils';

interface AssistantChatProps {
  userId: string;
  initialOpen?: boolean;
}

export function AssistantChat({ userId, initialOpen = false }: AssistantChatProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    state,
    pendingConfirmation,
    sendMessage,
    confirmAction,
    cancelAction,
    editConfirmation,
    selectClient
  } = useAssistant(userId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingConfirmation]);

  // Atalho Alt + A para abrir/fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Botão flutuante quando fechado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 hover:scale-105 transition-all flex items-center justify-center z-50"
        title="Abrir assistente (Alt+A)"
      >
        <Bot className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border transition-all duration-300',
        isMinimized ? 'w-80 h-14' : 'w-[420px] h-[600px] max-h-[80vh]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-500 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">Marcola</span>
          {state === 'processing' && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Pensando...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/20 rounded">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {!isMinimized && (
        <>
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Boas-vindas */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <h3 className="font-semibold text-gray-800 mb-2">Olá! Eu sou o Marcola 👋</h3>
                <p className="text-sm text-gray-600 mb-4">Seu assistente de gestão de clientes.</p>
                <div className="text-left bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="font-medium text-gray-700 mb-2">Experimente:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• "Marca reunião com [cliente] dia 18 às 14h"</li>
                    <li>• "Quais pagamentos estão vencidos?"</li>
                    <li>• "O que tenho pra fazer hoje?"</li>
                    <li>• "Manda mensagem pro [cliente]"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Lista de mensagens */}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Card de confirmação */}
            {pendingConfirmation && (
              <ConfirmationCard
                confirmation={pendingConfirmation}
                onConfirm={confirmAction}
                onCancel={cancelAction}
                onEdit={editConfirmation}
                onSelectClient={selectClient}
                isExecuting={state === 'executing'}
              />
            )}

            {/* Indicador de digitação */}
            {state === 'processing' && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            onSend={sendMessage}
            disabled={state === 'processing' || state === 'executing' || !!pendingConfirmation}
          />
        </>
      )}
    </div>
  );
}
```

---

## 10. HOOK useAssistant

```typescript
// src/hooks/useAssistant.ts

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, ChatState, ConfirmationData, UserContext, ToolCall } from '@/lib/assistant/types';
import { v4 as uuidv4 } from 'uuid';

export function useAssistant(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatState>('idle');
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationData | null>(null);
  const [context, setContext] = useState<UserContext | null>(null);

  useEffect(() => {
    loadContext();
  }, [userId]);

  const loadContext = async () => {
    try {
      const response = await fetch('/api/assistant/context');
      const data = await response.json();
      setContext(data.context);
    } catch (error) {
      console.error('Erro ao carregar contexto:', error);
    }
  };

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = { ...msg, id: uuidv4(), timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || state !== 'idle') return;

    addMessage({ role: 'user', content: text, contentType: 'text' });
    setState('processing');

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-10) })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.confirmation) {
        setPendingConfirmation(data.confirmation);
        if (data.message) addMessage({ role: 'assistant', content: data.message, contentType: 'text' });
      } else {
        addMessage({
          role: 'assistant',
          content: data.message,
          contentType: data.result ? 'result' : 'text',
          result: data.result,
          suggestedActions: data.suggestedActions
        });
      }
    } catch (error: any) {
      addMessage({ role: 'assistant', content: `Erro: ${error.message}`, contentType: 'error' });
    } finally {
      setState('idle');
    }
  }, [messages, state, addMessage]);

  const confirmAction = useCallback(async () => {
    if (!pendingConfirmation) return;
    setState('executing');

    try {
      const response = await fetch('/api/assistant/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolCall: pendingConfirmation.toolToExecute,
          confirmationData: pendingConfirmation.data
        })
      });

      const data = await response.json();

      setPendingConfirmation(prev => prev ? { ...prev, status: 'confirmed' } : null);
      addMessage({
        role: 'assistant',
        content: data.message || 'Ação executada!',
        contentType: 'result',
        result: data.result,
        suggestedActions: data.suggestedActions
      });

      setTimeout(() => setPendingConfirmation(null), 500);
      loadContext();
    } catch (error: any) {
      addMessage({ role: 'assistant', content: `Erro: ${error.message}`, contentType: 'error' });
    } finally {
      setState('idle');
    }
  }, [pendingConfirmation, addMessage]);

  const cancelAction = useCallback(() => {
    if (!pendingConfirmation) return;
    setPendingConfirmation(prev => prev ? { ...prev, status: 'cancelled' } : null);
    addMessage({ role: 'assistant', content: 'Ok, cancelado. Posso ajudar com mais algo?', contentType: 'text' });
    setTimeout(() => setPendingConfirmation(null), 500);
  }, [pendingConfirmation, addMessage]);

  const editConfirmation = useCallback((data: any) => {
    if (!pendingConfirmation) return;
    setPendingConfirmation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        data: { ...prev.data, ...data },
        toolToExecute: { ...prev.toolToExecute, parameters: { ...prev.toolToExecute.parameters, ...data } }
      };
    });
  }, [pendingConfirmation]);

  const selectClient = useCallback(async (clientId: string) => {
    if (!pendingConfirmation || pendingConfirmation.type !== 'client_select') return;

    const clientSelectData = pendingConfirmation.data as any;
    const updatedTool: ToolCall = {
      ...clientSelectData.pendingTool,
      parameters: { ...clientSelectData.pendingTool.parameters, clientId }
    };

    setState('processing');
    setPendingConfirmation(null);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clientSelectData.originalRequest, forceTool: updatedTool })
      });

      const data = await response.json();
      if (data.confirmation) setPendingConfirmation(data.confirmation);
      if (data.message) addMessage({ role: 'assistant', content: data.message, contentType: data.result ? 'result' : 'text' });
    } catch (error: any) {
      addMessage({ role: 'assistant', content: `Erro: ${error.message}`, contentType: 'error' });
    } finally {
      setState('idle');
    }
  }, [pendingConfirmation, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingConfirmation(null);
  }, []);

  return {
    messages,
    state,
    pendingConfirmation,
    context,
    sendMessage,
    confirmAction,
    cancelAction,
    editConfirmation,
    selectClient,
    clearMessages
  };
}
```

---

## 11. COMPONENTES AUXILIARES

```typescript
// src/components/assistant/ChatMessage.tsx

'use client';

import { Bot, User, Mic } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/lib/assistant/types';
import { cn } from '@/lib/utils';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : '')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-gray-200' : 'bg-blue-500 text-white'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2',
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800',
        message.contentType === 'error' && 'bg-red-100 text-red-800'
      )}>
        {message.contentType === 'voice' && (
          <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
            <Mic className="w-3 h-3" /> Áudio transcrito
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* Ações sugeridas */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.suggestedActions.map(action => (
              <button
                key={action.id}
                className="text-xs px-3 py-1.5 bg-white text-blue-600 rounded-full border border-blue-200 hover:bg-blue-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// src/components/assistant/TypingIndicator.tsx

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-gray-100 rounded-lg px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
```

---

## 12. BANCO DE DADOS

```sql
-- Tabela de reuniões
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT CHECK (type IN ('online', 'presencial')),
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_user_date ON meetings(user_id, date);

-- Tabela de lembretes
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'custom',
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_pending ON reminders(is_sent, remind_at);

-- RLS Policies
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own meetings" ON meetings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);
```

---

## 13. VARIÁVEIS DE AMBIENTE

```env
# APIs de IA
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# App URL
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Pipedream (opcional)
PIPEDREAM_COMPETITORS_WEBHOOK=https://...
```

---

## 14. COMO USAR NO DASHBOARD

```typescript
// src/app/(dashboard)/layout.tsx ou página específica

import { AssistantChat } from '@/components/assistant/AssistantChat';

export default function DashboardLayout({ children }) {
  const user = await getUser(); // Seu método de auth

  return (
    <div>
      {children}
      
      {/* Assistente flutuante em todas as páginas */}
      <AssistantChat userId={user.id} />
    </div>
  );
}
```

---

## 15. CHECKLIST DE IMPLEMENTAÇÃO

### ✅ FASE 1: Estrutura Base
- [ ] Criar `src/lib/assistant/types.ts`
- [ ] Criar `src/lib/assistant/tools.ts`
- [ ] Criar `src/lib/assistant/context-builder.ts`
- [ ] Criar `src/lib/assistant/prompt-builder.ts`
- [ ] Criar `src/lib/assistant/claude-client.ts`
- [ ] Executar migrations do banco

### ✅ FASE 2: Voice Input
- [ ] Criar `/api/assistant/transcribe`
- [ ] Criar `VoiceRecorder.tsx`
- [ ] Criar `ChatInput.tsx`
- [ ] Testar gravação + transcrição

### ✅ FASE 3: Sistema de Confirmação
- [ ] Criar `ConfirmationCard.tsx`
- [ ] Criar `MeetingConfirmation.tsx`
- [ ] Criar `TaskConfirmation.tsx`
- [ ] Criar `WhatsAppConfirmation.tsx`
- [ ] Criar `ClientSelector.tsx`

### ✅ FASE 4: Tool Executor
- [ ] Criar `tool-executor.ts` completo
- [ ] Testar cada tool individualmente

### ✅ FASE 5: APIs
- [ ] Criar `/api/assistant/chat`
- [ ] Criar `/api/assistant/execute`
- [ ] Criar `/api/assistant/context`

### ✅ FASE 6: Integração
- [ ] Criar `AssistantChat.tsx`
- [ ] Criar `useAssistant.ts`
- [ ] Criar `ChatMessage.tsx`
- [ ] Criar `TypingIndicator.tsx`
- [ ] Adicionar ao Dashboard
- [ ] Testar fluxo completo

---

## 16. CUSTOS ESTIMADOS

| Item | Custo |
|------|-------|
| Claude Sonnet (input) | ~$0.003/1K tokens |
| Claude Sonnet (output) | ~$0.015/1K tokens |
| Whisper | $0.006/minuto |
| **Por gestor/mês** | **~$15-25** |

---

## 17. MELHORIAS FUTURAS

- [ ] Streaming de respostas
- [ ] Histórico persistente de conversas
- [ ] Mais tools (calendário, relatórios, etc.)
- [ ] Comandos de voz personalizados
- [ ] Modo offline com fallback
- [ ] Integração com calendário externo

---

*Prompt completo: MARCOLA Assistant v1.0*
*Criado em Dezembro 2025 para TrafficHub*
