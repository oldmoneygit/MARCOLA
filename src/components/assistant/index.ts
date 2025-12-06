/**
 * @file index.ts
 * @description Export barrel para componentes do MARCOLA Assistant
 * @module components/assistant
 */

// Componente principal
export { AssistantChat } from './AssistantChat';
export { ChatInterface } from './ChatInterface';

// Componentes de chat
export { ChatInput } from './ChatInput';
export { ChatMessage } from './ChatMessage';
export { FormattedContent } from './FormattedContent';
export { TypingIndicator } from './TypingIndicator';
export { VoiceRecorder } from './VoiceRecorder';

// Cards de confirmação
export * from './cards';
