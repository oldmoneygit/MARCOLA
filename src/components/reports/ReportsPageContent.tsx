/**
 * @file ReportsPageContent.tsx
 * @description Conteúdo interativo da página de relatórios
 * @module components/reports
 */

'use client';

import { useCallback, useState } from 'react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, EmptyState, Modal, Skeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useReports } from '@/hooks';

import { CSVImporter } from './CSVImporter';
import { ReportCard } from './ReportCard';

import type { Report } from '@/types';

/**
 * Conteúdo interativo da página de relatórios
 * Gerencia estado de modais e ações
 */
export function ReportsPageContent() {
  const { reports, loading, error, deleteReport } = useReports();
  const { addToast } = useToast();

  // Estado dos modais
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deletingReport, setDeletingReport] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Abre modal de importação
  const handleOpenImport = useCallback(() => {
    setIsImportOpen(true);
  }, []);

  // Fecha modal de importação
  const handleCloseImport = useCallback(() => {
    setIsImportOpen(false);
  }, []);

  // Sucesso na importação
  const handleImportSuccess = useCallback(() => {
    setIsImportOpen(false);
    addToast({
      type: 'success',
      title: 'Relatório importado!',
      message: 'O relatório foi importado com sucesso e já está disponível na lista.',
    });
  }, [addToast]);

  // Abre modal de confirmação de delete
  const handleDeleteClick = useCallback((report: Report) => {
    setDeletingReport(report);
  }, []);

  // Confirma delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingReport) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteReport(deletingReport.id);
      setDeletingReport(null);
      if (success) {
        addToast({
          type: 'success',
          title: 'Relatório excluído',
          message: 'O relatório foi excluído com sucesso.',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deletingReport, deleteReport, addToast]);

  // Loading skeleton
  if (loading) {
    return (
      <DashboardLayout
        title="Relatórios"
        subtitle="Visualize relatórios de performance das campanhas"
        headerActions={
          <Button disabled>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar CSV
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton.Card key={i} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Relatórios"
      subtitle="Visualize relatórios de performance das campanhas"
      headerActions={
        <Button
          onClick={handleOpenImport}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          }
        >
          Importar CSV
        </Button>
      }
    >
      {/* Erro global */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Conteúdo */}
      {reports.length === 0 ? (
        <EmptyState
          title="Nenhum relatório encontrado"
          description="Importe um relatório CSV para visualizar os dados de performance."
          icon={
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          action={{
            label: 'Importar Relatório',
            onClick: handleOpenImport,
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            ),
          }}
        />
      ) : (
        <>
          {/* Contador */}
          <div className="text-sm text-zinc-400 mb-6">
            {reports.length} relatório{reports.length !== 1 ? 's' : ''}
          </div>

          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal de importação */}
      <CSVImporter
        isOpen={isImportOpen}
        onClose={handleCloseImport}
        onSuccess={handleImportSuccess}
      />

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={Boolean(deletingReport)}
        onClose={() => setDeletingReport(null)}
        title="Excluir Relatório"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingReport(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isDeleting}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-zinc-300">
          Tem certeza que deseja excluir este relatório?
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Esta ação não pode ser desfeita. Todos os dados de anúncios associados também serão excluídos.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
