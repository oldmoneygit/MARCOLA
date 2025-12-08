# 🤖 MARCOLA ASSISTANT - Parte 3: Cards de Confirmação

---

## 6. SISTEMA DE CONFIRMAÇÃO

### 6.1 Card de Confirmação de Reunião

```typescript
// src/components/assistant/cards/MeetingConfirmation.tsx

'use client';

import { useState } from 'react';
import { Calendar, Clock, User, MapPin, Check, X, Edit3, Loader2 } from 'lucide-react';
import { MeetingConfirmationData } from '@/lib/assistant/types';
import { cn } from '@/lib/utils';

interface Props {
  data: MeetingConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: MeetingConfirmationData) => void;
  isExecuting?: boolean;
  showActions?: boolean;
}

export function MeetingConfirmation({
  data, onConfirm, onCancel, onEdit, isExecuting = false, showActions = true
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (isEditing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          <Edit3 className="w-5 h-5" /> Editar Reunião
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Data</label>
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Horário</label>
            <input
              type="time"
              value={editData.time}
              onChange={(e) => setEditData({ ...editData, time: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <select
              value={editData.type || ''}
              onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="">Selecionar...</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onEdit?.(editData); setIsEditing(false); }}
            className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Salvar
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5" /> Confirmar Reunião
      </h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{data.clientName}</span>
          {data.contactName && <span className="text-gray-500">({data.contactName})</span>}
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{formatDate(data.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{data.time}</span>
        </div>
        {data.type && (
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="capitalize">{data.type}</span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={cn(
              'flex-1 py-2 rounded-md font-medium flex items-center justify-center gap-2',
              isExecuting ? 'bg-green-300 cursor-wait' : 'bg-green-500 text-white hover:bg-green-600'
            )}
          >
            {isExecuting ? <><Loader2 className="w-4 h-4 animate-spin" /> Agendando...</> : <><Check className="w-4 h-4" /> Confirmar</>}
          </button>
          <button onClick={() => setIsEditing(true)} disabled={isExecuting} className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Editar
          </button>
          <button onClick={onCancel} disabled={isExecuting} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6.2 Card de Confirmação WhatsApp

```typescript
// src/components/assistant/cards/WhatsAppConfirmation.tsx

'use client';

import { useState } from 'react';
import { MessageSquare, User, Phone, Check, X, Edit3, Loader2 } from 'lucide-react';
import { WhatsAppConfirmationData } from '@/lib/assistant/types';
import { cn } from '@/lib/utils';

interface Props {
  data: WhatsAppConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: WhatsAppConfirmationData) => void;
  isExecuting?: boolean;
  showActions?: boolean;
}

export function WhatsAppConfirmation({
  data, onConfirm, onCancel, onEdit, isExecuting = false, showActions = true
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(data.message);

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0,2)} (${cleaned.slice(2,4)}) ${cleaned.slice(4,9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  if (isEditing) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-green-800 flex items-center gap-2">
          <Edit3 className="w-5 h-5" /> Editar Mensagem
        </h3>
        <textarea
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          rows={5}
        />
        <div className="flex gap-2">
          <button
            onClick={() => { onEdit?.({ ...data, message: editMessage }); setIsEditing(false); }}
            className="flex-1 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Salvar
          </button>
          <button onClick={() => { setEditMessage(data.message); setIsEditing(false); }} className="px-4 py-2 border rounded-md hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5" /> Confirmar Mensagem WhatsApp
      </h3>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{data.contactName}</span>
          <span className="text-gray-500">({data.clientName})</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-gray-500" />
          <span>{formatPhone(data.phone)}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-3 mb-4 border border-green-100">
        <p className="text-sm text-gray-500 mb-1">Mensagem:</p>
        <p className="text-gray-800 whitespace-pre-wrap">{data.message}</p>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={cn(
              'flex-1 py-2 rounded-md font-medium flex items-center justify-center gap-2',
              isExecuting ? 'bg-green-300 cursor-wait' : 'bg-green-500 text-white hover:bg-green-600'
            )}
          >
            {isExecuting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Check className="w-4 h-4" /> Enviar</>}
          </button>
          <button onClick={() => setIsEditing(true)} disabled={isExecuting} className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Editar
          </button>
          <button onClick={onCancel} disabled={isExecuting} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6.3 Seletor de Cliente (Desambiguação)

```typescript
// src/components/assistant/cards/ClientSelector.tsx

'use client';

import { User, Building, X } from 'lucide-react';
import { ClientSelectData } from '@/lib/assistant/types';

interface Props {
  data: ClientSelectData;
  onSelect: (clientId: string) => void;
  onCancel: () => void;
}

export function ClientSelector({ data, onSelect, onCancel }: Props) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
        <User className="w-5 h-5" /> Qual cliente você quis dizer?
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Encontrei {data.candidates.length} clientes com "{data.query}":
      </p>

      <div className="space-y-2 mb-4">
        {data.candidates.map((client) => (
          <button
            key={client.id}
            onClick={() => onSelect(client.id)}
            className="w-full p-3 bg-white border rounded-lg hover:border-yellow-400 hover:bg-yellow-50 text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-800">{client.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {client.contactName && <span>{client.contactName}</span>}
                {client.niche && (
                  <>
                    {client.contactName && <span>•</span>}
                    <span className="flex items-center gap-1">
                      <Building className="w-3 h-3" /> {client.niche}
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="w-full py-2 border rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
      >
        <X className="w-4 h-4" /> Cancelar
      </button>
    </div>
  );
}
```

### 6.4 Card de Confirmação de Tarefa

```typescript
// src/components/assistant/cards/TaskConfirmation.tsx

'use client';

import { useState } from 'react';
import { CheckSquare, User, Calendar, Flag, Check, X, Edit3, Loader2 } from 'lucide-react';
import { TaskConfirmationData } from '@/lib/assistant/types';
import { cn } from '@/lib/utils';

const priorityConfig = {
  low: { label: 'Baixa', color: 'text-green-600 bg-green-100' },
  medium: { label: 'Média', color: 'text-yellow-600 bg-yellow-100' },
  high: { label: 'Alta', color: 'text-red-600 bg-red-100' }
};

interface Props {
  data: TaskConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: TaskConfirmationData) => void;
  isExecuting?: boolean;
  showActions?: boolean;
}

export function TaskConfirmation({
  data, onConfirm, onCancel, onEdit, isExecuting = false, showActions = true
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  
  const priority = data.priority || 'medium';
  const priorityInfo = priorityConfig[priority];

  if (isEditing) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-purple-800 flex items-center gap-2">
          <Edit3 className="w-5 h-5" /> Editar Tarefa
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Título</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Prazo</label>
              <input
                type="date"
                value={editData.dueDate || ''}
                onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Prioridade</label>
              <select
                value={editData.priority || 'medium'}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onEdit?.(editData); setIsEditing(false); }}
            className="flex-1 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Salvar
          </button>
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h3 className="font-semibold text-purple-800 flex items-center gap-2 mb-3">
        <CheckSquare className="w-5 h-5" /> Confirmar Tarefa
      </h3>

      <div className="space-y-2 mb-4">
        <p className="font-medium text-gray-800 text-lg">{data.title}</p>
        {data.description && <p className="text-gray-600 text-sm">{data.description}</p>}
        {data.clientName && (
          <div className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4 text-gray-500" /> {data.clientName}
          </div>
        )}
        {data.dueDate && (
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-gray-500" /> Prazo: {new Date(data.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-gray-500" />
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', priorityInfo.color)}>
            {priorityInfo.label}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={cn(
              'flex-1 py-2 rounded-md font-medium flex items-center justify-center gap-2',
              isExecuting ? 'bg-purple-300 cursor-wait' : 'bg-purple-500 text-white hover:bg-purple-600'
            )}
          >
            {isExecuting ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><Check className="w-4 h-4" /> Criar</>}
          </button>
          <button onClick={() => setIsEditing(true)} disabled={isExecuting} className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> Editar
          </button>
          <button onClick={onCancel} disabled={isExecuting} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
```

### 6.5 Componente Roteador de Confirmação

```typescript
// src/components/assistant/ConfirmationCard.tsx

'use client';

import { ConfirmationData } from '@/lib/assistant/types';
import { MeetingConfirmation } from './cards/MeetingConfirmation';
import { TaskConfirmation } from './cards/TaskConfirmation';
import { WhatsAppConfirmation } from './cards/WhatsAppConfirmation';
import { ClientSelector } from './cards/ClientSelector';

interface Props {
  confirmation: ConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (data: any) => void;
  onSelectClient?: (clientId: string) => void;
  isExecuting?: boolean;
}

export function ConfirmationCard({
  confirmation, onConfirm, onCancel, onEdit, onSelectClient, isExecuting = false
}: Props) {
  const { type, data, status } = confirmation;
  const showActions = status === 'pending';
  const commonProps = { onConfirm, onCancel, onEdit, isExecuting, showActions };

  switch (type) {
    case 'meeting':
      return <MeetingConfirmation data={data} {...commonProps} />;
    case 'task':
      return <TaskConfirmation data={data} {...commonProps} />;
    case 'whatsapp':
      return <WhatsAppConfirmation data={data} {...commonProps} />;
    case 'client_select':
      return <ClientSelector data={data} onSelect={onSelectClient!} onCancel={onCancel} />;
    default:
      return (
        <div className="bg-gray-50 border rounded-lg p-4">
          <p>Confirmação pendente: {type}</p>
          <div className="flex gap-2 mt-4">
            <button onClick={onConfirm} className="px-4 py-2 bg-blue-500 text-white rounded-md">Confirmar</button>
            <button onClick={onCancel} className="px-4 py-2 border rounded-md">Cancelar</button>
          </div>
        </div>
      );
  }
}
```

---

**Continua na Parte 4...**
