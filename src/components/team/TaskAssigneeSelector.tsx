/**
 * @file TaskAssigneeSelector.tsx
 * @description Seletor de membro da equipe para atribuição de tarefas
 * @module components/team
 */

'use client';

import { Check, ChevronDown, User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { TeamMemberAvatar } from './TeamMemberAvatar';

import type { TeamMember } from '@/types';

interface TaskAssigneeSelectorProps {
  /** Lista de membros disponíveis */
  members: TeamMember[];
  /** ID do membro selecionado */
  selectedId?: string | null;
  /** Callback ao selecionar membro */
  onSelect: (memberId: string | null) => void;
  /** Se está carregando */
  loading?: boolean;
  /** Placeholder */
  placeholder?: string;
  /** Tamanho */
  size?: 'sm' | 'md';
  /** Se está desabilitado */
  disabled?: boolean;
  /** Classes adicionais */
  className?: string;
}

/**
 * Seletor de membro da equipe para atribuição de tarefas
 */
export function TaskAssigneeSelector({
  members,
  selectedId,
  onSelect,
  loading = false,
  placeholder = 'Atribuir a...',
  size = 'md',
  disabled = false,
  className,
}: TaskAssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMember = selectedId
    ? members.find((m) => m.id === selectedId)
    : null;

  const filteredMembers = members.filter(
    (m) =>
      m.is_active &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focar no input ao abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (memberId: string | null) => {
      onSelect(memberId);
      setIsOpen(false);
      setSearch('');
    },
    [onSelect]
  );

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-sm',
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled || loading}
        className={cn(
          'w-full flex items-center gap-2 px-3 rounded-lg border transition-colors',
          'bg-white/5 border-white/10 hover:border-white/20',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
          disabled && 'opacity-50 cursor-not-allowed',
          sizeClasses[size]
        )}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
        ) : selectedMember ? (
          <>
            <TeamMemberAvatar
              name={selectedMember.name}
              avatarUrl={selectedMember.avatar_url}
              color={selectedMember.color}
              size="xs"
            />
            <span className="flex-1 text-left text-white truncate">
              {selectedMember.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-0.5 hover:bg-white/10 rounded"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          </>
        ) : (
          <>
            <User className="w-4 h-4 text-zinc-500" />
            <span className="flex-1 text-left text-zinc-500">{placeholder}</span>
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 rounded-lg bg-zinc-900 border border-white/10 shadow-xl">
          {/* Search input */}
          <div className="px-2 pb-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar membro..."
              className="w-full px-3 py-2 text-sm rounded-md bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {/* Opção para remover atribuição */}
            {selectedId && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-left"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center">
                  <X className="w-3 h-3 text-zinc-400" />
                </div>
                <span className="text-sm text-zinc-400">Remover atribuição</span>
              </button>
            )}

            {filteredMembers.length === 0 ? (
              <p className="px-3 py-4 text-sm text-zinc-500 text-center">
                Nenhum membro encontrado
              </p>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelect(member.id)}
                  className={cn(
                    'w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-left',
                    selectedId === member.id && 'bg-violet-500/10'
                  )}
                >
                  <TeamMemberAvatar
                    name={member.name}
                    avatarUrl={member.avatar_url}
                    color={member.color}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{member.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{member.email}</p>
                  </div>
                  {selectedId === member.id && (
                    <Check className="w-4 h-4 text-violet-400" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
