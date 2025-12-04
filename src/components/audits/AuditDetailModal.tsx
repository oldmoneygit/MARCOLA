/**
 * @file AuditDetailModal.tsx
 * @description Modal para visualizar e editar detalhes de uma auditoria
 * @module components/audits
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Modal, Button, Icon, GlassCard } from '@/components/ui';
import { AuditTypeBadge } from './AuditTypeBadge';
import { AUDIT_STATUS_CONFIG } from '@/types';
import { cn } from '@/lib/utils';

import type { Audit, UpdateAuditDTO, AuditStatus } from '@/types';

interface AuditDetailModalProps {
  /** Auditoria para exibir */
  audit: Audit | null;
  /** Se está aberto */
  isOpen: boolean;
  /** Callback ao fechar */
  onClose: () => void;
  /** Callback ao atualizar */
  onUpdate?: (audit: Audit) => void;
  /** Callback ao deletar */
  onDelete?: (id: string) => void;
}

/**
 * Modal de detalhes da auditoria
 */
function AuditDetailModal({
  audit,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: AuditDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<UpdateAuditDTO>({});

  // Reset form when audit changes
  useEffect(() => {
    if (audit) {
      setFormData({
        title: audit.title,
        description: audit.description || '',
        overall_score: audit.overall_score || undefined,
        critical_issues: audit.critical_issues || [],
        quick_wins: audit.quick_wins || [],
        recommendations: audit.recommendations || [],
      });
      setEditMode(false);
    }
  }, [audit]);

  const handleUpdate = useCallback(async (updates: UpdateAuditDTO) => {
    if (!audit) { return; }

    try {
      setLoading(true);
      const response = await fetch(`/api/audits/${audit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar');
      }

      const updatedAudit = await response.json();
      onUpdate?.(updatedAudit);
      setEditMode(false);
    } catch (err) {
      console.error('[AuditDetailModal] Error updating:', err);
    } finally {
      setLoading(false);
    }
  }, [audit, onUpdate]);

  const handleStatusChange = useCallback(async (newStatus: AuditStatus) => {
    const updates: UpdateAuditDTO = { status: newStatus };
    if (newStatus === 'shared') {
      updates.shared_with_client = true;
    }
    await handleUpdate(updates);
  }, [handleUpdate]);

  const handleDelete = useCallback(async () => {
    if (!audit || !confirm('Tem certeza que deseja excluir esta auditoria?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/audits/${audit.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir');
      }

      onDelete?.(audit.id);
      onClose();
    } catch (err) {
      console.error('[AuditDetailModal] Error deleting:', err);
    } finally {
      setLoading(false);
    }
  }, [audit, onClose, onDelete]);

  const handleSaveEdit = useCallback(async () => {
    await handleUpdate(formData);
  }, [formData, handleUpdate]);

  const handleAddItem = useCallback((field: 'critical_issues' | 'quick_wins' | 'recommendations') => {
    const item = prompt(`Adicionar ${field === 'critical_issues' ? 'problema crítico' : field === 'quick_wins' ? 'quick win' : 'recomendação'}:`);
    if (item) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), item],
      }));
    }
  }, []);

  const handleRemoveItem = useCallback((field: 'critical_issues' | 'quick_wins' | 'recommendations', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  }, []);

  if (!audit) { return null; }

  const statusConfig = AUDIT_STATUS_CONFIG[audit.status];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editMode ? 'Editar Auditoria' : 'Detalhes da Auditoria'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            {editMode ? (
              <input
                type="text"
                value={formData.title || ''}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-bold text-white bg-transparent border-b border-white/20 focus:border-violet-500 outline-none w-full"
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{audit.title}</h2>
            )}
            <div className="flex items-center gap-3 mt-2">
              <AuditTypeBadge type={audit.type} />
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                statusConfig.bgColor,
                statusConfig.textColor
              )}>
                {statusConfig.label}
              </span>
              {audit.client && (
                <span className="text-sm text-zinc-400">
                  Cliente: {audit.client.name}
                </span>
              )}
            </div>
          </div>
          {!editMode && (
            <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
              <Icon name="edit" size="sm" />
            </Button>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Descrição</h3>
          {editMode ? (
            <textarea
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none focus:border-violet-500 outline-none"
              rows={3}
            />
          ) : (
            <p className="text-zinc-300">{audit.description || 'Sem descrição'}</p>
          )}
        </div>

        {/* Score */}
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-2">Score Geral</h3>
          {editMode ? (
            <input
              type="number"
              min="0"
              max="100"
              value={formData.overall_score || ''}
              onChange={e => setFormData(prev => ({ ...prev, overall_score: Number(e.target.value) || undefined }))}
              placeholder="0-100"
              className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-violet-500 outline-none"
            />
          ) : (
            <div className="flex items-center gap-2">
              {audit.overall_score !== null ? (
                <>
                  <span className={cn(
                    'text-3xl font-bold',
                    audit.overall_score >= 70 ? 'text-emerald-400' :
                    audit.overall_score >= 50 ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {audit.overall_score}
                  </span>
                  <span className="text-zinc-500">/100</span>
                </>
              ) : (
                <span className="text-zinc-500">Não avaliado</span>
              )}
            </div>
          )}
        </div>

        {/* Critical Issues */}
        <GlassCard className="p-4 border-red-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
              <Icon name="alert-triangle" size="sm" />
              Problemas Críticos
            </h3>
            {editMode && (
              <Button variant="ghost" size="sm" onClick={() => handleAddItem('critical_issues')}>
                <Icon name="plus" size="xs" />
              </Button>
            )}
          </div>
          {(editMode ? formData.critical_issues : audit.critical_issues)?.length ? (
            <ul className="space-y-2">
              {(editMode ? formData.critical_issues : audit.critical_issues)?.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Icon name="x-circle" size="xs" className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{issue}</span>
                  {editMode && (
                    <button onClick={() => handleRemoveItem('critical_issues', i)} className="text-red-400 hover:text-red-300">
                      <Icon name="trash" size="xs" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhum problema crítico identificado</p>
          )}
        </GlassCard>

        {/* Quick Wins */}
        <GlassCard className="p-4 border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
              <Icon name="zap" size="sm" />
              Quick Wins
            </h3>
            {editMode && (
              <Button variant="ghost" size="sm" onClick={() => handleAddItem('quick_wins')}>
                <Icon name="plus" size="xs" />
              </Button>
            )}
          </div>
          {(editMode ? formData.quick_wins : audit.quick_wins)?.length ? (
            <ul className="space-y-2">
              {(editMode ? formData.quick_wins : audit.quick_wins)?.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Icon name="check-circle" size="xs" className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{win}</span>
                  {editMode && (
                    <button onClick={() => handleRemoveItem('quick_wins', i)} className="text-red-400 hover:text-red-300">
                      <Icon name="trash" size="xs" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhum quick win identificado</p>
          )}
        </GlassCard>

        {/* Recommendations */}
        <GlassCard className="p-4 border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
              <Icon name="lightbulb" size="sm" />
              Recomendações
            </h3>
            {editMode && (
              <Button variant="ghost" size="sm" onClick={() => handleAddItem('recommendations')}>
                <Icon name="plus" size="xs" />
              </Button>
            )}
          </div>
          {(editMode ? formData.recommendations : audit.recommendations)?.length ? (
            <ul className="space-y-2">
              {(editMode ? formData.recommendations : audit.recommendations)?.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Icon name="arrow-right" size="xs" className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{rec}</span>
                  {editMode && (
                    <button onClick={() => handleRemoveItem('recommendations', i)} className="text-red-400 hover:text-red-300">
                      <Icon name="trash" size="xs" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma recomendação</p>
          )}
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            {audit.status === 'draft' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('completed')}
                disabled={loading}
                className="gap-2"
              >
                <Icon name="check" size="sm" />
                Marcar como Concluída
              </Button>
            )}
            {audit.status === 'completed' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange('shared')}
                disabled={loading}
                className="gap-2"
              >
                <Icon name="share-2" size="sm" />
                Compartilhar com Cliente
              </Button>
            )}
            {audit.status === 'shared' && audit.shared_at && (
              <span className="text-xs text-zinc-500">
                Compartilhado em {new Date(audit.shared_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading} className="text-red-400 hover:text-red-300">
                  <Icon name="trash" size="sm" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Fechar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export { AuditDetailModal };
export type { AuditDetailModalProps };
