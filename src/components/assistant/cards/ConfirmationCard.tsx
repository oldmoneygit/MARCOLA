/**
 * @file ConfirmationCard.tsx
 * @description Componente roteador que renderiza o card de confirmação apropriado
 * @module components/assistant/cards
 */

'use client';

import type {
  ConfirmationData,
  MeetingConfirmationData,
  MeetingDeleteConfirmationData,
  MeetingUpdateConfirmationData,
  TaskConfirmationData,
  WhatsAppConfirmationData,
  PaymentConfirmationData,
  ReminderConfirmationData,
  ClientSelectData,
  GenericConfirmationData
} from '@/lib/assistant/types';

import { MeetingConfirmation } from './MeetingConfirmation';
import { MeetingDeleteConfirmation } from './MeetingDeleteConfirmation';
import { MeetingUpdateConfirmation } from './MeetingUpdateConfirmation';
import { TaskConfirmation } from './TaskConfirmation';
import { WhatsAppConfirmation } from './WhatsAppConfirmation';
import { PaymentConfirmation } from './PaymentConfirmation';
import { ReminderConfirmation } from './ReminderConfirmation';
import { ClientSelector } from './ClientSelector';
import { GenericConfirmation } from './GenericConfirmation';

interface ConfirmationCardProps {
  confirmation: ConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: unknown) => void;
  onSelectClient?: (clientId: string) => void;
  isExecuting?: boolean;
}

/**
 * Componente roteador que renderiza o card de confirmação correto
 * baseado no tipo da ação pendente
 */
export function ConfirmationCard({
  confirmation,
  onConfirm,
  onCancel,
  onEdit,
  onSelectClient,
  isExecuting = false
}: ConfirmationCardProps) {
  const { type, data } = confirmation;

  switch (type) {
    case 'meeting':
      return (
        <MeetingConfirmation
          data={data as MeetingConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
          isExecuting={isExecuting}
        />
      );

    case 'meeting_delete':
      return (
        <MeetingDeleteConfirmation
          data={data as MeetingDeleteConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isExecuting={isExecuting}
        />
      );

    case 'meeting_update':
      return (
        <MeetingUpdateConfirmation
          data={data as MeetingUpdateConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
          isExecuting={isExecuting}
        />
      );

    case 'task':
      return (
        <TaskConfirmation
          data={data as TaskConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
          isExecuting={isExecuting}
        />
      );

    case 'whatsapp':
      return (
        <WhatsAppConfirmation
          data={data as WhatsAppConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
          isExecuting={isExecuting}
        />
      );

    case 'payment':
      return (
        <PaymentConfirmation
          data={data as PaymentConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
          isExecuting={isExecuting}
        />
      );

    case 'reminder':
      return (
        <ReminderConfirmation
          data={data as ReminderConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
          isExecuting={isExecuting}
        />
      );

    case 'client_select':
      return (
        <ClientSelector
          data={data as ClientSelectData}
          onSelect={(clientId) => onSelectClient?.(clientId)}
          onCancel={onCancel}
        />
      );

    case 'generic':
      return (
        <GenericConfirmation
          data={data as GenericConfirmationData}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isExecuting={isExecuting}
        />
      );

    default:
      // Fallback para tipos não reconhecidos - usar GenericConfirmation
      return (
        <GenericConfirmation
          data={{
            title: `Confirmar: ${type}`,
            description: 'Deseja executar esta ação?',
            details: data as unknown as Record<string, unknown>
          }}
          onConfirm={onConfirm}
          onCancel={onCancel}
          isExecuting={isExecuting}
        />
      );
  }
}
