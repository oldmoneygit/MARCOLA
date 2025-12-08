# 🤖 MARCOLA ASSISTANT - Parte 1: Visão Geral e Arquitetura

> **Agente de IA com voz, confirmação interativa e execução de ações**

---

## 1. VISÃO GERAL

### 1.1 O Que É

O MARCOLA Assistant é um **agente de IA** integrado à plataforma que funciona como uma "secretária pessoal" para gestores de tráfego.

**Capacidades:**
- Receber comandos por **texto** ou **voz** (Whisper)
- **Interpretar** a intenção do usuário via Claude API
- **Mostrar confirmação** antes de executar ações
- **Executar ações** no banco de dados
- **Sugerir próximas ações** após execução

### 1.2 Exemplos de Uso

```
GESTOR: "Marca reunião com o João dia 18 às 14h"
AGENTE: [Mostra card de confirmação]
        📅 CONFIRMAR REUNIÃO
        👤 Cliente: Hamburgueria do João
        📆 Data: 18/12/2025 às 14:00
        [✅ Confirmar] [✏️ Editar] [❌ Cancelar]
GESTOR: [Clica em Confirmar]
AGENTE: "✅ Reunião agendada! Quer enviar confirmação pro João?"
        [📱 Enviar confirmação] [📅 Ver calendário]
```

### 1.3 Stack Técnica

| Componente | Tecnologia |
|------------|------------|
| Frontend | Next.js 14+, React, Tailwind CSS |
| IA | Claude API (Anthropic) com Function Calling |
| Voz | OpenAI Whisper API |
| Backend | Next.js API Routes |
| Banco | Supabase (PostgreSQL) |
| WhatsApp | Z-API |

---

## 2. ARQUITETURA

### 2.1 Fluxo Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MARCOLA ASSISTANT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. INPUT                                                                   │
│     ├── Texto (digitado)                                                   │
│     └── Áudio → Whisper API → Transcrição                                  │
│                          │                                                  │
│                          ▼                                                  │
│  2. PROCESSAMENTO (Claude API)                                              │
│     ├── System Prompt com contexto do usuário                              │
│     ├── Lista de Tools disponíveis                                         │
│     └── Output: tool_calls + message                                       │
│                          │                                                  │
│                          ▼                                                  │
│  3. CONFIRMAÇÃO (se necessário)                                            │
│     ┌─────────────────────────────────────────────────────────────┐        │
│     │  📅 CONFIRMAR REUNIÃO                                       │        │
│     │  👤 Cliente: Hamburgueria do João                           │        │
│     │  📆 Data: 18/12/2025 às 14:00                               │        │
│     │  [✅ Confirmar]  [✏️ Editar]  [❌ Cancelar]                  │        │
│     └─────────────────────────────────────────────────────────────┘        │
│                          │                                                  │
│           [Usuário confirma]                                                │
│                          ▼                                                  │
│  4. EXECUÇÃO                                                               │
│     └── Tool Executor → Supabase                                           │
│                          │                                                  │
│                          ▼                                                  │
│  5. RESPOSTA                                                               │
│     ├── ✅ Mensagem de sucesso                                             │
│     └── Sugestões de próximas ações                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Estrutura de Arquivos

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── assistant/
│   │       └── page.tsx              # Página do assistente (opcional)
│   │
│   └── api/
│       └── assistant/
│           ├── chat/route.ts         # Processa mensagens
│           ├── transcribe/route.ts   # Transcreve áudio (Whisper)
│           ├── execute/route.ts      # Executa tools confirmados
│           └── context/route.ts      # Busca contexto do usuário
│
├── components/
│   └── assistant/
│       ├── AssistantChat.tsx         # Componente principal (floating)
│       ├── ChatMessage.tsx           # Mensagem individual
│       ├── ChatInput.tsx             # Input texto + voz
│       ├── VoiceRecorder.tsx         # Gravador de áudio
│       ├── ConfirmationCard.tsx      # Card de confirmação
│       ├── cards/
│       │   ├── MeetingConfirmation.tsx
│       │   ├── TaskConfirmation.tsx
│       │   ├── WhatsAppConfirmation.tsx
│       │   ├── PaymentConfirmation.tsx
│       │   ├── ReminderConfirmation.tsx
│       │   └── ClientSelector.tsx    # Desambiguação de cliente
│       ├── ActionButtons.tsx
│       └── TypingIndicator.tsx
│
├── lib/
│   └── assistant/
│       ├── types.ts                  # Tipos TypeScript
│       ├── tools.ts                  # Definição dos tools
│       ├── tool-executor.ts          # Executor de tools
│       ├── context-builder.ts        # Monta contexto do usuário
│       ├── prompt-builder.ts         # Monta system prompt
│       └── claude-client.ts          # Cliente Claude API
│
└── hooks/
    └── useAssistant.ts               # Hook principal
```

---

## 3. TIPOS TYPESCRIPT

```typescript
// src/lib/assistant/types.ts

// ==================== MENSAGENS ====================

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageContentType = 
  | 'text'           // Texto simples
  | 'voice'          // Áudio transcrito
  | 'confirmation'   // Card de confirmação
  | 'result'         // Resultado de ação
  | 'error';         // Erro

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  contentType: MessageContentType;
  timestamp: Date;
  confirmation?: ConfirmationData;
  result?: ActionResult;
  suggestedActions?: SuggestedAction[];
  metadata?: {
    audioUrl?: string;
    audioDuration?: number;
    toolCalls?: ToolCall[];
  };
}

// ==================== CONFIRMAÇÕES ====================

export type ConfirmationType = 
  | 'meeting'        // Reunião
  | 'task'           // Tarefa
  | 'whatsapp'       // Mensagem WhatsApp
  | 'payment'        // Cobrança
  | 'reminder'       // Lembrete
  | 'client_select'  // Seleção de cliente
  | 'generic';       // Genérico

export type ConfirmationStatus = 'pending' | 'confirmed' | 'cancelled' | 'editing';

export interface ConfirmationData {
  id: string;
  type: ConfirmationType;
  status: ConfirmationStatus;
  data: any; // Dados específicos por tipo
  toolToExecute: ToolCall;
  createdAt: Date;
}

export interface MeetingConfirmationData {
  clientId: string;
  clientName: string;
  contactName?: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  type?: 'online' | 'presencial';
  notes?: string;
}

export interface TaskConfirmationData {
  clientId?: string;
  clientName?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface WhatsAppConfirmationData {
  clientId: string;
  clientName: string;
  contactName: string;
  phone: string;
  message: string;
}

export interface PaymentConfirmationData {
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  description?: string;
}

export interface ClientSelectData {
  query: string;
  candidates: Array<{
    id: string;
    name: string;
    niche?: string;
    contactName?: string;
  }>;
  originalRequest: string;
  pendingTool: ToolCall;
}

// ==================== TOOLS ====================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  requiresConfirmation: boolean;
  confirmationType?: ConfirmationType;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ==================== AÇÕES ====================

export interface SuggestedAction {
  id: string;
  label: string;
  icon?: string;
  action: 
    | { type: 'navigate'; path: string }
    | { type: 'tool'; toolCall: ToolCall }
    | { type: 'callback'; callbackId: string };
}

// ==================== CONTEXTO ====================

export interface UserContext {
  userId: string;
  userName: string;
  totalClients: number;
  activeClients: number;
  clients: Array<{
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    niche?: string;
    status: string;
  }>;
  upcomingMeetings: Array<{
    id: string;
    clientId: string;
    clientName: string;
    date: string;
    time: string;
  }>;
  pendingTasks: Array<{
    id: string;
    clientId?: string;
    clientName?: string;
    title: string;
    dueDate?: string;
    priority: string;
  }>;
  pendingPayments: Array<{
    id: string;
    clientId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    status: string;
    daysOverdue?: number;
  }>;
  currentDate: string;
  currentTime: string;
  currentDayOfWeek: string;
}

// ==================== ESTADO ====================

export type ChatState = 
  | 'idle'                    // Aguardando input
  | 'recording'               // Gravando áudio
  | 'transcribing'            // Transcrevendo
  | 'processing'              // Processando com Claude
  | 'awaiting_confirmation'   // Aguardando confirmação
  | 'executing'               // Executando tool
  | 'error';

export interface AssistantState {
  messages: ChatMessage[];
  state: ChatState;
  error?: string;
  pendingConfirmation?: ConfirmationData;
  context?: UserContext;
}
```

---

**Continua na Parte 2...**
