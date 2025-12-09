/**
 * @file ExecutionModal.tsx
 * @description Modal para criar/editar execução
 * @module components/execution-history
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type {
  TaskExecution,
  CreateExecutionDTO,
  ExecutionActionType,
  OptimizationType,
  ExecutionResult,
  ExecutionMetrics,
} from '@/types/execution-history';
import {
  ACTION_TYPE_LABELS,
  OPTIMIZATION_TYPE_LABELS,
  RESULT_LABELS,
} from '@/types/execution-history';

interface Client {
  id: string;
  name: string;
}

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateExecutionDTO) => Promise<void>;
  execution?: TaskExecution | null;
  clients?: Client[];
}

export function ExecutionModal({
  isOpen,
  onClose,
  onSave,
  execution,
  clients = [],
}: ExecutionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateExecutionDTO>({
    actionType: 'manual_action',
    title: '',
  });

  const [showOptimization, setShowOptimization] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  // Reseta form quando modal abre/fecha ou execution muda
  useEffect(() => {
    if (execution) {
      setFormData({
        clientId: execution.clientId || undefined,
        actionType: execution.actionType,
        title: execution.title,
        description: execution.description,
        optimizationType: execution.optimizationType,
        optimizationDetails: execution.optimizationDetails,
        result: execution.result,
        resultMetrics: execution.resultMetrics,
        notes: execution.notes,
      });
      setShowOptimization(!!execution.optimizationType);
      setShowMetrics(!!execution.resultMetrics);
    } else {
      setFormData({
        actionType: 'manual_action',
        title: '',
      });
      setShowOptimization(false);
      setShowMetrics(false);
    }
  }, [execution, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (key: keyof ExecutionMetrics, value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFormData((prev) => ({
      ...prev,
      resultMetrics: {
        ...prev.resultMetrics,
        [key]: numValue,
      },
    }));
  };

  if (!isOpen) {
    return null;
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700/50 text-white text-sm placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:outline-none';

  const labelClass = 'block text-sm font-medium text-zinc-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-900 border border-white/[0.1] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/[0.08] bg-zinc-900">
          <h2 className="text-lg font-semibold text-white">
            {execution ? 'Editar Execução' : 'Registrar Execução'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.1] transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Cliente */}
          <div>
            <label className={labelClass}>Cliente</label>
            <select
              value={formData.clientId || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clientId: e.target.value || undefined,
                }))
              }
              className={inputClass}
            >
              <option value="">Selecione um cliente (opcional)</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Ação */}
          <div>
            <label className={labelClass}>
              Tipo de Ação <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.actionType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  actionType: e.target.value as ExecutionActionType,
                }))
              }
              required
              className={inputClass}
            >
              {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className={labelClass}>
              Título <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ex: Ajuste de orçamento para R$500/dia"
              required
              className={inputClass}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descreva a ação realizada..."
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Toggle Otimização */}
          <div className="pt-2 border-t border-white/[0.08]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOptimization}
                onChange={(e) => setShowOptimization(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500/30"
              />
              <span className="text-sm text-zinc-300">
                Esta é uma otimização (com detalhes)
              </span>
            </label>
          </div>

          {/* Campos de Otimização */}
          {showOptimization && (
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div>
                <label className={labelClass}>Tipo de Otimização</label>
                <select
                  value={formData.optimizationType || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      optimizationType: (e.target.value as OptimizationType) || undefined,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Selecione o tipo</option>
                  {Object.entries(OPTIMIZATION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Detalhes da Otimização</label>
                <textarea
                  value={formData.optimizationDetails || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      optimizationDetails: e.target.value,
                    }))
                  }
                  placeholder="O que foi alterado e por quê..."
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Resultado */}
          <div>
            <label className={labelClass}>Resultado</label>
            <select
              value={formData.result || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  result: (e.target.value as ExecutionResult) || undefined,
                }))
              }
              className={inputClass}
            >
              <option value="">Selecione o resultado</option>
              {Object.entries(RESULT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Métricas */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMetrics}
                onChange={(e) => setShowMetrics(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500/30"
              />
              <span className="text-sm text-zinc-300">
                Adicionar métricas de resultado
              </span>
            </label>
          </div>

          {/* Métricas */}
          {showMetrics && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">ROAS</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.resultMetrics?.roas || ''}
                  onChange={(e) => handleMetricChange('roas', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">CPC (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.resultMetrics?.cpc || ''}
                  onChange={(e) => handleMetricChange('cpc', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">CTR (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.resultMetrics?.ctr || ''}
                  onChange={(e) => handleMetricChange('ctr', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">CPL (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.resultMetrics?.cpl || ''}
                  onChange={(e) => handleMetricChange('cpl', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Conversões</label>
                <input
                  type="number"
                  value={formData.resultMetrics?.conversions || ''}
                  onChange={(e) => handleMetricChange('conversions', e.target.value)}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Investimento</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.resultMetrics?.spend || ''}
                  onChange={(e) => handleMetricChange('spend', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className={labelClass}>Notas Adicionais</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Observações relevantes..."
              rows={2}
              className={inputClass}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/[0.1] text-zinc-300 hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {execution ? 'Salvar Alterações' : 'Registrar Execução'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
