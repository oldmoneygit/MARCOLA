/**
 * @file MeetingCard.tsx
 * @description Card para exibir informações de uma reunião
 * @module components/meetings
 */

'use client';

import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  MoreVertical,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';

import type { MeetingWithDisplay } from '@/types/meetings';
import { MEETING_STATUS_CONFIG, MEETING_TYPE_CONFIG } from '@/types/meetings';

interface MeetingCardProps {
  meeting: MeetingWithDisplay;
  onEdit?: (meeting: MeetingWithDisplay) => void;
  onDelete?: (meeting: MeetingWithDisplay) => void;
  onStatusChange?: (meeting: MeetingWithDisplay, status: MeetingWithDisplay['status']) => void;
  compact?: boolean;
}

export function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onStatusChange,
  compact = false,
}: MeetingCardProps) {
  const statusConfig = MEETING_STATUS_CONFIG[meeting.status];
  const typeConfig = MEETING_TYPE_CONFIG[meeting.type];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
        <div className={`w-1 h-10 rounded-full ${statusConfig.bgColor.replace('/20', '/60')}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{meeting.title}</span>
            {meeting.isToday && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded">
                HOJE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {meeting.displayTime}
            </span>
            {meeting.client && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {meeting.client.name}
              </span>
            )}
          </div>
        </div>

        <div className={`p-1.5 rounded-lg ${typeConfig.bgColor}`}>
          {meeting.type === 'online' ? (
            <Video className={`w-3.5 h-3.5 ${typeConfig.textColor}`} />
          ) : (
            <MapPin className={`w-3.5 h-3.5 ${typeConfig.textColor}`} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.05] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{meeting.title}</h3>
            {meeting.isToday && (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                HOJE
              </span>
            )}
            {meeting.isTomorrow && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                AMANHÃ
              </span>
            )}
          </div>
          {meeting.client && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <User className="w-4 h-4" />
              <span>{meeting.client.name}</span>
            </div>
          )}
        </div>

        {/* Menu de ações */}
        <div className="relative group">
          <button className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-zinc-500" />
          </button>
          <div className="absolute right-0 top-8 z-10 hidden group-hover:block bg-zinc-900 border border-white/[0.08] rounded-lg shadow-xl py-1 min-w-[140px]">
            {onEdit && (
              <button
                onClick={() => onEdit(meeting)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05]"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            )}
            {meeting.status === 'scheduled' && onStatusChange && (
              <button
                onClick={() => onStatusChange(meeting, 'confirmed')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-white/[0.05]"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar
              </button>
            )}
            {(meeting.status === 'scheduled' || meeting.status === 'confirmed') && onStatusChange && (
              <button
                onClick={() => onStatusChange(meeting, 'completed')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-white/[0.05]"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Realizada
              </button>
            )}
            {meeting.status !== 'cancelled' && onStatusChange && (
              <button
                onClick={() => onStatusChange(meeting, 'cancelled')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-white/[0.05]"
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(meeting)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/[0.05]"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span>{meeting.displayDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span>{meeting.displayTime} ({meeting.duration_minutes}min)</span>
        </div>
      </div>

      {/* Tipo e Local */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor}`}>
          {meeting.type === 'online' ? (
            <Video className="w-3.5 h-3.5" />
          ) : (
            <MapPin className="w-3.5 h-3.5" />
          )}
          {typeConfig.label}
        </span>

        {meeting.type === 'online' && meeting.meeting_link && (
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Entrar
          </a>
        )}

        {meeting.type === 'presencial' && meeting.location && (
          <span className="text-xs text-zinc-500 truncate">
            {meeting.location}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
          {statusConfig.label}
        </span>

        {meeting.isPast && meeting.status !== 'completed' && meeting.status !== 'cancelled' && (
          <span className="text-xs text-amber-400">Pendente</span>
        )}
      </div>

      {/* Notes */}
      {meeting.notes && (
        <p className="mt-3 text-sm text-zinc-500 line-clamp-2 border-t border-white/[0.05] pt-3">
          {meeting.notes}
        </p>
      )}
    </div>
  );
}
