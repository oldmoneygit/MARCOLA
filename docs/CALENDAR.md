# CALENDAR.md - Cronograma de Conteúdo e Produção

---

## 📅 Visão Geral

O módulo de Calendário/Cronograma do TrafficHub permite planejar e visualizar toda a produção de conteúdo sincronizada com a agenda do cliente.

**Funcionalidades:**
- Calendário visual por cliente
- Planejamento de posts, vídeos, campanhas
- Status de produção (Planejado → Criado → Publicado)
- Datas importantes e promoções
- Visão mensal/semanal

---

## 🎯 Problema que Resolve

| Antes | Depois |
|-------|--------|
| Não sabe o que postar quando | Calendário visual planejado |
| Perde datas importantes | Eventos marcados com antecedência |
| Produção desorganizada | Status claro de cada conteúdo |
| Cliente não sabe o cronograma | Visão compartilhável |
| Promoções em cima da hora | Planejamento mensal |

---

## 🗄️ Schema do Banco de Dados

### Tabela: `content_calendar`

```sql
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('post', 'video', 'reels', 'stories', 'promo', 'campaign', 'event', 'other')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'creating', 'review', 'approved', 'published', 'cancelled')),
  platform TEXT[] DEFAULT '{}',
  color TEXT,
  attachments TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_content_calendar_client ON content_calendar(client_id);
CREATE INDEX idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);
CREATE INDEX idx_content_calendar_type ON content_calendar(type);

-- Trigger updated_at
CREATE TRIGGER set_content_calendar_updated_at
  BEFORE UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### Tabela: `calendar_templates` (Templates de Conteúdo Recorrente)

```sql
CREATE TABLE calendar_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  platform TEXT[],
  color TEXT,
  recurrence TEXT CHECK (recurrence IN ('weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER,
  day_of_month INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

```sql
-- content_calendar
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar"
  ON content_calendar FOR ALL
  USING (auth.uid() = user_id);

-- calendar_templates
ALTER TABLE calendar_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar templates"
  ON calendar_templates FOR ALL
  USING (auth.uid() = user_id);
```

---

## 📊 Types TypeScript

```typescript
// src/types/calendar.ts

/**
 * @file calendar.ts
 * @description Tipos relacionados ao calendário de conteúdo
 * @module types
 */

export type ContentType = 'post' | 'video' | 'reels' | 'stories' | 'promo' | 'campaign' | 'event' | 'other';
export type ContentStatus = 'planned' | 'creating' | 'review' | 'approved' | 'published' | 'cancelled';
export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'google' | 'youtube' | 'linkedin';
export type CalendarRecurrence = 'weekly' | 'biweekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  description?: string;
  type: ContentType;
  scheduled_date: string;
  scheduled_time?: string;
  status: ContentStatus;
  platform: Platform[];
  color?: string;
  attachments?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relações
  client?: {
    id: string;
    name: string;
  };
}

export interface CalendarTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: ContentType;
  platform: Platform[];
  color?: string;
  recurrence?: CalendarRecurrence;
  day_of_week?: number;
  day_of_month?: number;
  is_active: boolean;
  created_at: string;
}

// DTOs
export interface CreateCalendarEventDTO {
  client_id: string;
  title: string;
  description?: string;
  type: ContentType;
  scheduled_date: string;
  scheduled_time?: string;
  platform?: Platform[];
  color?: string;
  notes?: string;
}

export interface UpdateCalendarEventDTO extends Partial<CreateCalendarEventDTO> {
  status?: ContentStatus;
  attachments?: string[];
}

// View helpers
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}
```

---

## 🎨 Componentes

### Estrutura de Pastas

```
src/components/calendar/
├── Calendar.tsx              # Componente principal do calendário
├── CalendarHeader.tsx        # Header com navegação mês/semana
├── CalendarGrid.tsx          # Grid de dias
├── CalendarDay.tsx           # Célula do dia
├── CalendarEvent.tsx         # Evento no calendário
├── EventModal.tsx            # Modal criar/editar evento
├── EventCard.tsx             # Card detalhado do evento
├── EventTypeBadge.tsx        # Badge do tipo de conteúdo
├── StatusBadge.tsx           # Badge do status
├── PlatformIcons.tsx         # Ícones das plataformas
├── QuickAdd.tsx              # Adicionar evento rápido
├── MonthView.tsx             # Visualização mensal
├── WeekView.tsx              # Visualização semanal
├── ClientCalendar.tsx        # Calendário específico do cliente
└── index.ts
```

### Componente: `EventTypeBadge`

```tsx
/**
 * @file EventTypeBadge.tsx
 * @description Badge visual do tipo de conteúdo
 * @module components/calendar
 */
'use client';

import { ContentType } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface EventTypeBadgeProps {
  type: ContentType;
  size?: 'sm' | 'md';
}

const typeConfig: Record<ContentType, { label: string; icon: string; className: string }> = {
  post: {
    label: 'Post',
    icon: '📸',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  video: {
    label: 'Vídeo',
    icon: '🎬',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  reels: {
    label: 'Reels',
    icon: '🎞️',
    className: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  },
  stories: {
    label: 'Stories',
    icon: '📱',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  promo: {
    label: 'Promoção',
    icon: '🏷️',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  campaign: {
    label: 'Campanha',
    icon: '🚀',
    className: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  },
  event: {
    label: 'Evento',
    icon: '🎉',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  other: {
    label: 'Outro',
    icon: '📌',
    className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  },
};

export function EventTypeBadge({ type, size = 'md' }: EventTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
```

### Componente: `StatusBadge`

```tsx
/**
 * @file StatusBadge.tsx
 * @description Badge visual do status do conteúdo
 * @module components/calendar
 */
'use client';

import { ContentStatus } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ContentStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ContentStatus, { label: string; className: string }> = {
  planned: {
    label: 'Planejado',
    className: 'bg-zinc-500/20 text-zinc-400',
  },
  creating: {
    label: 'Criando',
    className: 'bg-blue-500/20 text-blue-400',
  },
  review: {
    label: 'Revisão',
    className: 'bg-yellow-500/20 text-yellow-400',
  },
  approved: {
    label: 'Aprovado',
    className: 'bg-emerald-500/20 text-emerald-400',
  },
  published: {
    label: 'Publicado',
    className: 'bg-green-500/20 text-green-400',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-500/20 text-red-400',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}
```

### Componente: `CalendarDay`

```tsx
/**
 * @file CalendarDay.tsx
 * @description Célula de um dia no calendário
 * @module components/calendar
 */
'use client';

import { CalendarDay as CalendarDayType } from '@/types/calendar';
import { cn } from '@/lib/utils';

interface CalendarDayProps {
  day: CalendarDayType;
  onDayClick: (date: Date) => void;
  onEventClick: (eventId: string) => void;
}

const typeColors: Record<string, string> = {
  post: 'bg-blue-500',
  video: 'bg-purple-500',
  reels: 'bg-pink-500',
  stories: 'bg-orange-500',
  promo: 'bg-green-500',
  campaign: 'bg-violet-500',
  event: 'bg-yellow-500',
  other: 'bg-zinc-500',
};

export function CalendarDay({ day, onDayClick, onEventClick }: CalendarDayProps) {
  const maxVisible = 3;
  const hasMore = day.events.length > maxVisible;
  const visibleEvents = day.events.slice(0, maxVisible);

  return (
    <div
      className={cn(
        'min-h-[100px] p-2 border border-white/[0.05] cursor-pointer transition-colors',
        'hover:bg-white/[0.02]',
        !day.isCurrentMonth && 'opacity-40',
        day.isToday && 'bg-violet-500/10 border-violet-500/30'
      )}
      onClick={() => onDayClick(day.date)}
    >
      {/* Número do dia */}
      <div
        className={cn(
          'text-sm font-medium mb-1',
          day.isToday ? 'text-violet-400' : 'text-zinc-400'
        )}
      >
        {day.date.getDate()}
      </div>

      {/* Eventos */}
      <div className="space-y-1">
        {visibleEvents.map(event => (
          <div
            key={event.id}
            className={cn(
              'text-xs px-2 py-1 rounded truncate cursor-pointer',
              'hover:opacity-80 transition-opacity',
              event.color ? `bg-[${event.color}]/20` : `${typeColors[event.type]}/20`,
              'text-white'
            )}
            style={event.color ? { backgroundColor: `${event.color}20` } : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event.id);
            }}
          >
            {event.scheduled_time && (
              <span className="text-zinc-400 mr-1">{event.scheduled_time.slice(0, 5)}</span>
            )}
            {event.title}
          </div>
        ))}
        {hasMore && (
          <div className="text-xs text-zinc-500 px-2">
            +{day.events.length - maxVisible} mais
          </div>
        )}
      </div>
    </div>
  );
}
```

### Componente: `Calendar` (Principal)

```tsx
/**
 * @file Calendar.tsx
 * @description Componente principal do calendário
 * @module components/calendar
 */
'use client';

import { useState, useMemo, useCallback } from 'react';
import { CalendarEvent, CalendarDay as CalendarDayType } from '@/types/calendar';
import { GlassCard } from '@/components/ui';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDay } from './CalendarDay';
import { EventModal } from './EventModal';

interface CalendarProps {
  events: CalendarEvent[];
  clientId?: string;
  onCreateEvent: (data: any) => Promise<void>;
  onUpdateEvent: (id: string, data: any) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Calendar({
  events,
  clientId,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Gera os dias do mês
  const calendarDays = useMemo((): CalendarDayType[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDayType[] = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.scheduled_date === dateStr);
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        events: dayEvents,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, events]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  }, []);

  const handleEventClick = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setSelectedDate(null);
      setIsModalOpen(true);
    }
  }, [events]);

  return (
    <GlassCard className="p-6">
      <CalendarHeader
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onAddEvent={() => {
          setSelectedDate(new Date());
          setSelectedEvent(null);
          setIsModalOpen(true);
        }}
      />

      {/* Dias da semana */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-center text-sm font-medium text-zinc-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7 border-t border-l border-white/[0.05]">
        {calendarDays.map((day, index) => (
          <CalendarDay
            key={index}
            day={day}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        ))}
      </div>

      {/* Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDate(null);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        initialDate={selectedDate}
        clientId={clientId}
        onSave={async (data) => {
          if (selectedEvent) {
            await onUpdateEvent(selectedEvent.id, data);
          } else {
            await onCreateEvent(data);
          }
          setIsModalOpen(false);
        }}
        onDelete={selectedEvent ? async () => {
          await onDeleteEvent(selectedEvent.id);
          setIsModalOpen(false);
        } : undefined}
      />
    </GlassCard>
  );
}
```

### Componente: `EventModal`

```tsx
/**
 * @file EventModal.tsx
 * @description Modal para criar/editar evento no calendário
 * @module components/calendar
 */
'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, ContentType, Platform, ContentStatus } from '@/types/calendar';
import { Modal, Button, Input, Select } from '@/components/ui';
import { EventTypeBadge } from './EventTypeBadge';
import { StatusBadge } from './StatusBadge';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  initialDate?: Date | null;
  clientId?: string;
  onSave: (data: any) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const contentTypes: { value: ContentType; label: string }[] = [
  { value: 'post', label: '📸 Post' },
  { value: 'video', label: '🎬 Vídeo' },
  { value: 'reels', label: '🎞️ Reels' },
  { value: 'stories', label: '📱 Stories' },
  { value: 'promo', label: '🏷️ Promoção' },
  { value: 'campaign', label: '🚀 Campanha' },
  { value: 'event', label: '🎉 Evento' },
  { value: 'other', label: '📌 Outro' },
];

const platforms: { value: Platform; label: string }[] = [
  { value: 'instagram', label: '📷 Instagram' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'tiktok', label: '🎵 TikTok' },
  { value: 'google', label: '🔍 Google' },
  { value: 'youtube', label: '▶️ YouTube' },
  { value: 'linkedin', label: '💼 LinkedIn' },
];

const statuses: { value: ContentStatus; label: string }[] = [
  { value: 'planned', label: 'Planejado' },
  { value: 'creating', label: 'Criando' },
  { value: 'review', label: 'Em Revisão' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'published', label: 'Publicado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function EventModal({
  isOpen,
  onClose,
  event,
  initialDate,
  clientId,
  onSave,
  onDelete,
}: EventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'post' as ContentType,
    scheduled_date: '',
    scheduled_time: '',
    status: 'planned' as ContentStatus,
    platform: [] as Platform[],
    notes: '',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        type: event.type,
        scheduled_date: event.scheduled_date,
        scheduled_time: event.scheduled_time || '',
        status: event.status,
        platform: event.platform || [],
        notes: event.notes || '',
      });
    } else if (initialDate) {
      setFormData(prev => ({
        ...prev,
        title: '',
        description: '',
        scheduled_date: initialDate.toISOString().split('T')[0],
        scheduled_time: '',
        status: 'planned',
        platform: [],
        notes: '',
      }));
    }
  }, [event, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        client_id: clientId || event?.client_id,
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: Platform) => {
    setFormData(prev => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter(p => p !== platform)
        : [...prev.platform, platform],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? '✏️ Editar Conteúdo' : '📅 Novo Conteúdo'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <Input
          label="Título"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Post Black Friday"
          required
        />

        {/* Tipo e Status */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ContentType }))}
            options={contentTypes}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ContentStatus }))}
            options={statuses}
          />
        </div>

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data"
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
            required
          />
          <Input
            label="Hora (opcional)"
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
          />
        </div>

        {/* Plataformas */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Plataformas
          </label>
          <div className="flex flex-wrap gap-2">
            {platforms.map(platform => (
              <button
                key={platform.value}
                type="button"
                onClick={() => togglePlatform(platform.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  formData.platform.includes(platform.value)
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                    : 'bg-white/[0.03] text-zinc-400 border border-white/[0.08] hover:bg-white/[0.06]'
                }`}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Descrição / Briefing
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Descreva o conteúdo..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
          />
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Notas internas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            placeholder="Anotações..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 resize-none"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-4">
          {onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              disabled={loading}
            >
              🗑️ Excluir
            </Button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {event ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
```

---

## 🔌 API Routes

### Estrutura

```
src/app/api/calendar/
├── route.ts                    # GET (list), POST (create)
├── [id]/
│   └── route.ts                # GET, PUT, DELETE
├── by-client/
│   └── [clientId]/
│       └── route.ts            # GET (eventos por cliente)
└── by-month/
    └── route.ts                # GET (eventos por mês)
```

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/calendar` | Lista eventos (query: client_id, month, year, type, status) |
| POST | `/api/calendar` | Cria evento |
| GET | `/api/calendar/[id]` | Detalhes do evento |
| PUT | `/api/calendar/[id]` | Atualiza evento |
| DELETE | `/api/calendar/[id]` | Exclui evento |
| GET | `/api/calendar/by-client/[clientId]` | Eventos de um cliente |
| GET | `/api/calendar/by-month?year=2025&month=12` | Eventos de um mês |

---

## 🪝 Hook `useCalendar`

```typescript
// src/hooks/useCalendar.ts

/**
 * @file useCalendar.ts
 * @description Hook para gerenciamento do calendário de conteúdo
 * @module hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarEvent, CreateCalendarEventDTO, UpdateCalendarEventDTO } from '@/types/calendar';

interface UseCalendarOptions {
  clientId?: string;
  month?: number;
  year?: number;
}

export function useCalendar(options: UseCalendarOptions = {}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (options.clientId) params.set('client_id', options.clientId);
      if (options.month) params.set('month', options.month.toString());
      if (options.year) params.set('year', options.year.toString());

      const res = await fetch(`/api/calendar?${params}`);
      if (!res.ok) throw new Error('Failed to fetch events');
      
      const data = await res.json();
      setEvents(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [options.clientId, options.month, options.year]);

  const createEvent = useCallback(async (data: CreateCalendarEventDTO) => {
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create event');
    
    const result = await res.json();
    setEvents(prev => [...prev, result.data]);
    return result.data;
  }, []);

  const updateEvent = useCallback(async (id: string, data: UpdateCalendarEventDTO) => {
    const res = await fetch(`/api/calendar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update event');
    
    const result = await res.json();
    setEvents(prev => prev.map(e => e.id === id ? result.data : e));
    return result.data;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete event');
    
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // Computed
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      if (!map[event.scheduled_date]) {
        map[event.scheduled_date] = [];
      }
      map[event.scheduled_date].push(event);
    });
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events
      .filter(e => e.scheduled_date >= today && e.status !== 'published' && e.status !== 'cancelled')
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      .slice(0, 5);
  }, [events]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    eventsByDate,
    upcomingEvents,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
```

---

## 🎨 Visual de Referência

### Calendário do Cliente

```
┌─────────────────────────────────────────────────────────────────┐
│  📅 Cronograma - Academia FitMax                                │
│                                                                 │
│  ← Novembro      Dezembro 2025      Janeiro →      [+ Evento]  │
├─────────────────────────────────────────────────────────────────┤
│  Dom    Seg    Ter    Qua    Qui    Sex    Sab                 │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│  1   │  2   │  3   │  4   │  5   │  6   │  7   │
│      │ 📸   │      │      │ 🏷️   │      │      │
│      │ Post │      │      │ Promo│      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│  8   │  9   │ 10   │ 11   │ 12   │ 13   │ 14   │
│      │ 📸   │      │ 🎬   │      │      │      │
│      │ Post │      │ Video│      │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ 15   │ 16   │ 17   │ 18   │ 19   │ 20   │ 21   │
│      │ 📸   │      │      │      │ 🚀   │      │
│      │ Post │      │      │      │ Camp │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
│                                                                 │
│  Legenda: 📸 Post  🎬 Video  🏷️ Promo  🚀 Campanha            │
└─────────────────────────────────────────────────────────────────┘
```

### Widget Próximos Conteúdos (Dashboard)

```
┌─────────────────────────────────────────────────────┐
│  📅 Próximos Conteúdos                [Ver todos →] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  05/12  Academia FitMax                             │
│         📸 Post - Dicas de treino                   │
│         Status: 🟡 Em revisão                       │
│                                                     │
│  06/12  Loja Fashion                                │
│         🏷️ Promo - Black Week                       │
│         Status: ✅ Aprovado                         │
│                                                     │
│  08/12  Clínica Saúde                               │
│         🎬 Video - Depoimento cliente               │
│         Status: ⚪ Planejado                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

- [ ] Migration SQL (content_calendar, calendar_templates)
- [ ] RLS Policies
- [ ] Types TypeScript
- [ ] API Routes (calendar, by-client, by-month)
- [ ] Hook useCalendar
- [ ] Componentes UI (Calendar, CalendarDay, EventModal, etc)
- [ ] Aba Cronograma no card do cliente
- [ ] Widget "Próximos Conteúdos" no dashboard
- [ ] Página /calendar (visão geral)
- [ ] Filtros por tipo e status

---

*Última atualização: Dezembro 2025*
