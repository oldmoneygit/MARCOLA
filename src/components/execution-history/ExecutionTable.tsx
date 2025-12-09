/**
 * @file ExecutionTable.tsx
 * @description Tabela de execuções com ações
 * @module components/execution-history
 */

'use client';

import { useState } from 'react';
import {
  Plus,
  Play,
  CheckCircle,
  XCircle,
  Sparkles,
  Hand,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  TaskExecution,
  ExecutionActionType,
} from '@/types/execution-history';
import {
  ACTION_TYPE_LABELS,
  RESULT_COLORS,
  RESULT_LABELS,
} from '@/types/execution-history';

interface ExecutionTableProps {
  executions: TaskExecution[];
  loading?: boolean;
  onView?: (execution: TaskExecution) => void;
  onEdit?: (execution: TaskExecution) => void;
  onDelete?: (execution: TaskExecution) => void;
}

const ACTION_ICONS: Record<ExecutionActionType, typeof Plus> = {
  task_created: Plus,
  task_started: Play,
  task_completed: CheckCircle,
  task_cancelled: XCircle,
  optimization_applied: Sparkles,
  manual_action: Hand,
};

export function ExecutionTable({
  executions,
  loading,
  onView,
  onEdit,
  onDelete,
}: ExecutionTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-white/[0.05]">
              <div className="h-4 w-24 bg-white/[0.05] rounded" />
              <div className="h-4 w-32 bg-white/[0.05] rounded" />
              <div className="h-4 flex-1 bg-white/[0.05] rounded" />
              <div className="h-4 w-20 bg-white/[0.05] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-zinc-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          Nenhuma execução encontrada
        </h3>
        <p className="text-zinc-400 text-sm">
          Registre suas primeiras ações ou ajuste os filtros.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Ação
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Resultado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {executions.map((execution) => {
              const ActionIcon = ACTION_ICONS[execution.actionType] || Hand;
              const resultColors = execution.result
                ? RESULT_COLORS[execution.result]
                : null;

              return (
                <tr
                  key={execution.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-zinc-300">
                      {formatDate(execution.executedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-white font-medium">
                      {execution.clientName || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-white/[0.05]">
                        <ActionIcon className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate max-w-[300px]">
                          {execution.title}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {ACTION_TYPE_LABELS[execution.actionType]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {execution.result && resultColors ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${resultColors.bg} ${resultColors.text} ${resultColors.border} border`}
                      >
                        {RESULT_LABELS[execution.result]}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === execution.id ? null : execution.id
                          )
                        }
                        className="p-1.5 rounded hover:bg-white/[0.1] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-zinc-400" />
                      </button>

                      {openMenuId === execution.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-36 rounded-lg bg-zinc-900 border border-white/[0.1] shadow-xl z-20">
                            {onView && (
                              <button
                                onClick={() => {
                                  onView(execution);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05] transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Detalhes
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => {
                                  onEdit(execution);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.05] transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                                Editar
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => {
                                  onDelete(execution);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
