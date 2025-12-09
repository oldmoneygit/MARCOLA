/**
 * @file MeetingModal.tsx
 * @description Modal para criar/editar reuniões
 * @module components/meetings
 */

'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Link,
  FileText,
  User,
  Loader2,
} from 'lucide-react';

import type { Meeting, CreateMeetingDTO, MeetingType, MeetingPriority } from '@/types/meetings';
import { MEETING_TYPE_CONFIG, MEETING_PRIORITY_CONFIG } from '@/types/meetings';

interface Client {
  id: string;
  name: string;
}

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateMeetingDTO) => Promise<Meeting | null>;
  meeting?: Meeting | null;
  clients?: Client[];
}

export function MeetingModal({
  isOpen,
  onClose,
  onSave,
  meeting,
  clients = [],
}: MeetingModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<MeetingType>('online');
  const [priority, setPriority] = useState<MeetingPriority>('medium');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');

  // Preencher form quando editando
  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || '');
      setDescription(meeting.description || '');
      setClientId(meeting.client_id || '');
      setDate(meeting.date);
      setTime(meeting.time.substring(0, 5));
      setDuration(meeting.duration_minutes || 60);
      setType(meeting.type);
      setPriority(meeting.priority || 'medium');
      setLocation(meeting.location || '');
      setMeetingLink(meeting.meeting_link || '');
      setNotes(meeting.notes || '');
    } else {
      // Valores padrão para nova reunião
      setTitle('');
      setDescription('');
      setClientId('');
      const today = new Date();
      setDate(today.toISOString().split('T')[0] ?? '');
      setTime('10:00');
      setDuration(60);
      setType('online');
      setPriority('medium');
      setLocation('');
      setMeetingLink('');
      setNotes('');
    }
    setError(null);
  }, [meeting, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    if (!date || !time) {
      setError('Data e horário são obrigatórios');
      return;
    }

    try {
      setSaving(true);

      const data: CreateMeetingDTO = {
        title: title.trim(),
        description: description.trim() || undefined,
        client_id: clientId || undefined,
        date,
        time,
        duration_minutes: duration,
        type,
        priority,
        location: type === 'presencial' ? location.trim() : undefined,
        meeting_link: type === 'online' ? meetingLink.trim() : undefined,
        notes: notes.trim() || undefined,
      };

      const result = await onSave(data);

      if (result) {
        onClose();
      } else {
        setError('Erro ao salvar reunião');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-zinc-900/95 border border-white/[0.08] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {meeting ? 'Editar Reunião' : 'Nova Reunião'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alinhamento mensal, Apresentação de resultados..."
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              <User className="w-4 h-4 inline mr-1" />
              Cliente (opcional)
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
            >
              <option value="">Reunião interna (sem cliente)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Duração e Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Duração
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
                <option value={90}>1h 30min</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MeetingPriority)}
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              >
                {Object.entries(MEETING_PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tipo de Reunião
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MEETING_TYPE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key as MeetingType)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                    type === key
                      ? `${config.bgColor} ${config.textColor} border-current`
                      : 'bg-white/[0.02] border-white/[0.08] text-zinc-400 hover:bg-white/[0.05]'
                  }`}
                >
                  {key === 'online' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Link ou Local */}
          {type === 'online' ? (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                <Link className="w-4 h-4 inline mr-1" />
                Link da reunião
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1" />
                Local
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Endereço ou local do encontro"
                className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
              />
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1" />
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Pauta ou objetivos da reunião..."
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors resize-none"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Notas internas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anotações pessoais sobre a reunião..."
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors resize-none"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {meeting ? 'Salvar Alterações' : 'Agendar Reunião'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
