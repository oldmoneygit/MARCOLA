/**
 * @file AuditsPageContent.tsx
 * @description Conteúdo da página de auditorias
 * @module components/audits
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, GlassCard, Skeleton, EmptyState, Icon, Modal } from '@/components/ui';
import { AuditCard } from './AuditCard';
import { AuditDetailModal } from './AuditDetailModal';
import { AuditForm } from './AuditForm';

import type { Audit, AuditType, AuditStatus, CreateAuditDTO } from '@/types';
import { AUDIT_TYPE_CONFIG, AUDIT_STATUS_CONFIG } from '@/types';

/**
 * Página de Auditorias
 */
function AuditsPageContent() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AuditType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<AuditStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  // Fetch audits
  const fetchAudits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }
      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }

      const response = await fetch(`/api/audits?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar auditorias');
      }

      const data = await response.json();
      setAudits(data);
    } catch (err) {
      console.error('[AuditsPageContent] Error fetching audits:', err);
      setError('Não foi possível carregar as auditorias');
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedStatus]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Filtered audits (already filtered by API, but can add client-side filtering)
  const filteredAudits = useMemo(() => audits, [audits]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: audits.length,
      completed: audits.filter((a) => a.status === 'completed').length,
      draft: audits.filter((a) => a.status === 'draft').length,
      shared: audits.filter((a) => a.status === 'shared').length,
    };
  }, [audits]);

  const handleAuditClick = useCallback((audit: Audit) => {
    setSelectedAudit(audit);
  }, []);

  const handleAuditUpdate = useCallback((updatedAudit: Audit) => {
    setAudits(prev => prev.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    setSelectedAudit(updatedAudit);
  }, []);

  const handleAuditDelete = useCallback((id: string) => {
    setAudits(prev => prev.filter(a => a.id !== id));
    setSelectedAudit(null);
  }, []);

  const handleCreateAudit = useCallback(async (data: CreateAuditDTO) => {
    const response = await fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar auditoria');
    }

    setShowModal(false);
    fetchAudits();
  }, [fetchAudits]);

  return (
    <DashboardLayout
      title="Auditorias"
      subtitle="Gerencie auditorias de funil, concorrência, marca e cliente oculto"
      headerActions={
        <Button variant="primary" className="gap-2" onClick={() => setShowModal(true)}>
          <Icon name="plus" size="sm" />
          Nova Auditoria
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-zinc-400">Total</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-amber-400">{stats.draft}</div>
            <div className="text-sm text-zinc-400">Rascunhos</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-sm text-zinc-400">Concluídas</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.shared}</div>
            <div className="text-sm text-zinc-400">Compartilhadas</div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-zinc-400 mb-2">Tipo</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as AuditType | 'all')}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="all">Todos os tipos</option>
                {Object.entries(AUDIT_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-zinc-400 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AuditStatus | 'all')}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="all">Todos os status</option>
                {Object.entries(AUDIT_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : error ? (
          <GlassCard className="p-8 text-center">
            <Icon name="alert-circle" size="xl" className="text-red-400 mx-auto mb-4" />
            <p className="text-zinc-400">{error}</p>
            <Button variant="ghost" className="mt-4" onClick={fetchAudits}>
              Tentar novamente
            </Button>
          </GlassCard>
        ) : filteredAudits.length === 0 ? (
          <EmptyState
            icon="clipboard-list"
            title="Nenhuma auditoria encontrada"
            description="Crie sua primeira auditoria para analisar o funil, concorrência ou marca dos seus clientes."
            action={{
              label: 'Nova Auditoria',
              onClick: () => setShowModal(true),
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAudits.map((audit) => (
              <AuditCard
                key={audit.id}
                audit={audit}
                onClick={handleAuditClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Nova Auditoria */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Auditoria"
      >
        <AuditForm
          onSubmit={handleCreateAudit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Modal de Detalhes da Auditoria */}
      <AuditDetailModal
        audit={selectedAudit}
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        onUpdate={handleAuditUpdate}
        onDelete={handleAuditDelete}
      />
    </DashboardLayout>
  );
}

export { AuditsPageContent };
