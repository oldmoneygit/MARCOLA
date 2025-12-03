/**
 * @file CSVImporter.tsx
 * @description Modal para importação de CSV
 * @module components/reports
 */

'use client';

import { useCallback, useState } from 'react';

import { Button, Input, Modal, Select } from '@/components/ui';
import { useClients, useReports } from '@/hooks';
import { parseCSV, validateCSVData } from '@/lib/csv-parser';

interface CSVImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal de importação de CSV
 */
export function CSVImporter({ isOpen, onClose, onSuccess }: CSVImporterProps) {
  const { clients } = useClients();
  const { importReport } = useReports();

  const [file, setFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ adsCount: number } | null>(null);

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.name,
  }));

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setPreview(null);
    }
  }, []);

  const handlePreview = useCallback(async () => {
    if (!file || !clientId || !periodStart || !periodEnd) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await parseCSV(file, clientId, periodStart, periodEnd);

      if (!result.success) {
        setError(result.errors?.join(', ') || 'Erro ao processar arquivo');
        return;
      }

      if (result.data) {
        const validationErrors = validateCSVData(result.data);
        if (validationErrors.length > 0) {
          setError(validationErrors.join(', '));
          return;
        }

        setPreview({ adsCount: result.data.ads.length });
      }
    } catch (err) {
      console.error('[CSVImporter] Preview error:', err);
      setError('Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  }, [file, clientId, periodStart, periodEnd]);

  const handleClose = useCallback(() => {
    setFile(null);
    setClientId('');
    setPeriodStart('');
    setPeriodEnd('');
    setError(null);
    setPreview(null);
    onClose();
  }, [onClose]);

  const handleImport = useCallback(async () => {
    if (!file || !clientId || !periodStart || !periodEnd) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await parseCSV(file, clientId, periodStart, periodEnd);

      if (!result.success || !result.data) {
        setError(result.errors?.join(', ') || 'Erro ao processar arquivo');
        return;
      }

      const report = await importReport(result.data);

      if (report) {
        onSuccess?.();
        handleClose();
      } else {
        setError('Erro ao importar relatório');
      }
    } catch (err) {
      console.error('[CSVImporter] Import error:', err);
      setError('Erro ao importar relatório');
    } finally {
      setLoading(false);
    }
  }, [file, clientId, periodStart, periodEnd, importReport, onSuccess, handleClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Relatório CSV"
      size="md"
    >
      <div className="space-y-6">
        {/* Seleção de cliente */}
        <Select
          label="Cliente"
          options={clientOptions}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Selecione um cliente"
          required
        />

        {/* Período */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data Início"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
          <Input
            label="Data Fim"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>

        {/* Upload de arquivo */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Arquivo CSV
            <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="flex-1">
                {file ? (
                  <p className="text-sm text-white">{file.name}</p>
                ) : (
                  <p className="text-sm text-zinc-400">Clique para selecionar um arquivo CSV</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-emerald-400">Arquivo válido</span>
            </div>
            <p className="text-sm text-zinc-300">{preview.adsCount} anúncios encontrados</p>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Instruções */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Formato esperado</h4>
          <ul className="text-xs text-zinc-500 space-y-1">
            <li>• Colunas: Ad Name, Spend, Impressions, Clicks, Conversions</li>
            <li>• Formatos aceitos: CSV exportado do Meta Ads ou Google Ads</li>
            <li>• Separadores: vírgula ou ponto-e-vírgula</li>
          </ul>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          {!preview ? (
            <Button onClick={handlePreview} loading={loading} disabled={!file}>
              Validar Arquivo
            </Button>
          ) : (
            <Button onClick={handleImport} loading={loading}>
              Importar {preview.adsCount} Anúncios
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
