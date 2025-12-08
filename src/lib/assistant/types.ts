/**
 * @file types.ts
 * @description Tipos TypeScript para o MARCOLA Assistant
 * @module lib/assistant
 */

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
  | 'meeting'         // Criar reunião
  | 'meeting_delete'  // Excluir reunião
  | 'meeting_update'  // Atualizar reunião
  | 'task'            // Tarefa
  | 'whatsapp'        // Mensagem WhatsApp
  | 'payment'         // Cobrança
  | 'reminder'        // Lembrete
  | 'client_select'   // Seleção de cliente
  | 'generic';        // Genérico

export type ConfirmationStatus = 'pending' | 'confirmed' | 'cancelled' | 'editing';

export interface ConfirmationData {
  id: string;
  type: ConfirmationType;
  status: ConfirmationStatus;
  data: MeetingConfirmationData | MeetingDeleteConfirmationData | MeetingUpdateConfirmationData | TaskConfirmationData | WhatsAppConfirmationData | PaymentConfirmationData | ReminderConfirmationData | ClientSelectData | GenericConfirmationData;
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

export interface MeetingDeleteConfirmationData {
  meetingId: string;
  clientId: string;
  clientName: string;
  contactName?: string;
  date: string;
  time: string;
  type?: 'online' | 'presencial';
}

export interface MeetingUpdateConfirmationData {
  meetingId: string;
  clientId: string;
  clientName: string;
  contactName?: string;
  currentDate: string;
  currentTime: string;
  newDate?: string;
  newTime?: string;
  newType?: 'online' | 'presencial';
  type?: 'online' | 'presencial';
}

export interface TaskConfirmationData {
  clientId?: string;
  clientName?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
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

export interface ReminderConfirmationData {
  message: string;
  date: string;
  time?: string;
  clientId?: string;
  clientName?: string;
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

export interface GenericConfirmationData {
  title: string;
  description?: string;
  details?: Record<string, unknown>;
}

// ==================== TOOLS ====================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterProperty>;
    required: string[];
  };
  requiresConfirmation: boolean;
  confirmationType?: ConfirmationType;
}

export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: {
    type: string;
    properties?: Record<string, ToolParameterProperty>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// ==================== AÇÕES ====================

export interface ActionResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export type SuggestedActionType =
  | { type: 'navigate'; path: string }
  | { type: 'tool'; toolCall: ToolCall }
  | { type: 'callback'; callbackId: string };

export interface SuggestedAction {
  id: string;
  label: string;
  icon?: string;
  action: SuggestedActionType;
}

// ==================== CONTEXTO ====================

export interface ClientContext {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  segment?: string;
  status: string;
}

export interface MeetingContext {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
}

export interface TaskContext {
  id: string;
  clientId?: string;
  clientName?: string;
  title: string;
  dueDate?: string;
  priority: string;
}

export interface PaymentContext {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: string;
  daysOverdue?: number;
}

export interface CalendarEventContext {
  id: string;
  title: string;
  scheduledDate: string;
  type: string;
  status: string;
  clientId?: string;
  clientName?: string;
  platform?: string[];
}

export interface UserContext {
  userId: string;
  userName: string;
  totalClients: number;
  activeClients: number;
  clients: ClientContext[];
  upcomingMeetings: MeetingContext[];
  calendarEvents: CalendarEventContext[];
  pendingTasks: TaskContext[];
  pendingPayments: PaymentContext[];
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

// ==================== CLAUDE API ====================

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ClaudeResponse {
  message: string;
  toolCalls: ToolCall[];
  stopReason: string;
}

// ==================== API RESPONSES ====================

export interface ChatApiResponse {
  message?: string;
  confirmation?: ConfirmationData;
  result?: ToolResult;
  suggestedActions?: SuggestedAction[];
  error?: string;
}

export interface ExecuteApiResponse {
  success: boolean;
  result?: ToolResult;
  message?: string;
  suggestedActions?: SuggestedAction[];
  error?: string;
}

export interface ContextApiResponse {
  context?: UserContext;
  error?: string;
}

export interface TranscribeApiResponse {
  success: boolean;
  text?: string;
  error?: string;
}
