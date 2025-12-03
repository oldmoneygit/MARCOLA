/**
 * @file ClientPreviewCard.tsx
 * @description Card compacto de preview dos dados extraídos pela IA com campos editáveis
 * @module components/clients
 *
 * @example
 * <ClientPreviewCard
 *   parsedData={parsedData}
 *   onDataChange={handleDataChange}
 *   onConfirm={handleConfirm}
 *   onEdit={handleEdit}
 * />
 */

'use client';

import { useCallback, useMemo, useState } from 'react';

import { SEGMENTS } from '@/lib/constants';

import type { ParsedClientData, CreateClientDTO } from '@/types';

interface ClientPreviewCardProps {
  /** Dados parseados pela IA */
  parsedData: ParsedClientData;
  /** Callback quando dados são alterados */
  onDataChange: (data: Partial<CreateClientDTO>) => void;
  /** Callback para confirmar e criar cliente */
  onConfirm: () => void;
  /** Callback para abrir no formulário tradicional */
  onEdit: () => void;
  /** Callback para cancelar */
  onCancel: () => void;
  /** Se está carregando */
  loading?: boolean;
}

/**
 * Card compacto de preview dos dados extraídos pela IA
 */
export function ClientPreviewCard({
  parsedData,
  onDataChange,
  onConfirm,
  onEdit,
  onCancel,
  loading = false,
}: ClientPreviewCardProps) {
  const { extracted, confidence, missing_fields, suggestions } = parsedData;
  const [showOptional, setShowOptional] = useState(false);

  // Verificar se tem os campos obrigatórios preenchidos
  const canConfirm = useMemo(() => {
    return (
      extracted.name &&
      extracted.segment &&
      extracted.monthly_value &&
      extracted.monthly_value > 0 &&
      extracted.due_day &&
      extracted.due_day >= 1 &&
      extracted.due_day <= 31
    );
  }, [extracted]);

  // Handler para mudanças nos campos
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      onDataChange({
        [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
      });
    },
    [onDataChange]
  );

  // Cor do indicador de confiança
  const confidenceColor = useMemo(() => {
    if (confidence >= 0.8) {
      return 'text-emerald-400 bg-emerald-500/10';
    }
    if (confidence >= 0.5) {
      return 'text-amber-400 bg-amber-500/10';
    }
    return 'text-red-400 bg-red-500/10';
  }, [confidence]);

  const confidenceLabel = useMemo(() => {
    if (confidence >= 0.8) {
      return 'Alta';
    }
    if (confidence >= 0.5) {
      return 'Média';
    }
    return 'Baixa';
  }, [confidence]);

  // Campos opcionais preenchidos
  const optionalFieldsCount = useMemo(() => {
    let count = 0;
    const optionalFields = [
      extracted.city,
      extracted.average_ticket,
      extracted.contact_name,
      extracted.contact_phone,
      extracted.contact_email,
      extracted.instagram_url,
      extracted.facebook_page_id,
      extracted.website_url,
      extracted.peak_hours,
      extracted.differentials,
      extracted.ideal_customer,
    ];
    for (const field of optionalFields) {
      if (field) {
        count++;
      }
    }
    return count;
  }, [extracted]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header compacto */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Dados Extraídos</h3>
            <p className="text-xs text-zinc-500">Revise antes de criar</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${confidenceColor}`}>
          {Math.round(confidence * 100)}% {confidenceLabel}
        </span>
      </div>

      {/* Alertas compactos em linha */}
      {(missing_fields.length > 0 || suggestions.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {missing_fields.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-amber-400">{missing_fields.length} campos faltando</span>
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs text-violet-400">{suggestions.length} sugestões</span>
            </div>
          )}
        </div>
      )}

      {/* Campos obrigatórios - Grid compacto */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Campos Obrigatórios</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Nome - Full width */}
          <div className="col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">Nome do Cliente *</label>
            <input
              name="name"
              value={extracted.name || ''}
              onChange={handleChange}
              placeholder="Nome da empresa"
              className={`w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                !extracted.name
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-white/[0.08] focus:ring-violet-500/50'
              }`}
            />
          </div>

          {/* Segmento */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Segmento *</label>
            <select
              name="segment"
              value={extracted.segment || ''}
              onChange={handleChange}
              className={`w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border text-white focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer ${
                !extracted.segment
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-white/[0.08] focus:ring-violet-500/50'
              }`}
            >
              <option value="" className="bg-zinc-900">Selecione</option>
              {SEGMENTS.map(seg => (
                <option key={seg.value} value={seg.value} className="bg-zinc-900">
                  {seg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Valor Mensal */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Valor Mensal *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">R$</span>
              <input
                name="monthly_value"
                type="number"
                value={extracted.monthly_value || ''}
                onChange={handleChange}
                placeholder="0,00"
                className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg bg-white/[0.05] border text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                  !extracted.monthly_value
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-white/[0.08] focus:ring-violet-500/50'
                }`}
              />
            </div>
          </div>

          {/* Dia Vencimento */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Vencimento *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">Dia</span>
              <input
                name="due_day"
                type="number"
                min={1}
                max={31}
                value={extracted.due_day || ''}
                onChange={handleChange}
                placeholder="10"
                className={`w-full h-9 pl-10 pr-3 text-sm rounded-lg bg-white/[0.05] border text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                  !extracted.due_day
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-white/[0.08] focus:ring-violet-500/50'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Campos opcionais - Expansível */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Campos Opcionais</span>
            {optionalFieldsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-400">
                {optionalFieldsCount} preenchidos
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${showOptional ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showOptional && (
          <div className="p-4 border-t border-white/[0.06] space-y-4">
            {/* Localização e Financeiro */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Cidade</label>
                <input
                  name="city"
                  value={extracted.city || ''}
                  onChange={handleChange}
                  placeholder="São Paulo, SP"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Ticket Médio (R$)</label>
                <input
                  name="average_ticket"
                  type="number"
                  value={extracted.average_ticket || ''}
                  onChange={handleChange}
                  placeholder="150"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Contato</label>
                <input
                  name="contact_name"
                  value={extracted.contact_name || ''}
                  onChange={handleChange}
                  placeholder="Nome"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">WhatsApp</label>
                <input
                  name="contact_phone"
                  value={extracted.contact_phone || ''}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
            </div>

            {/* Email e Redes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input
                  name="contact_email"
                  type="email"
                  value={extracted.contact_email || ''}
                  onChange={handleChange}
                  placeholder="email@empresa.com"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Instagram</label>
                <input
                  name="instagram_url"
                  value={extracted.instagram_url || ''}
                  onChange={handleChange}
                  placeholder="@usuario"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Website</label>
                <input
                  name="website_url"
                  value={extracted.website_url || ''}
                  onChange={handleChange}
                  placeholder="www.site.com"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Horários de Pico</label>
                <input
                  name="peak_hours"
                  value={extracted.peak_hours || ''}
                  onChange={handleChange}
                  placeholder="18h-22h"
                  className="w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ações compactas */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={loading}
            className="h-9 px-4 text-sm text-zinc-300 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all disabled:opacity-50"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className="h-9 px-5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            Criar Cliente
          </button>
        </div>
      </div>
    </div>
  );
}
