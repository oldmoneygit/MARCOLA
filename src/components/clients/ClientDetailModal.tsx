/**
 * @file ClientDetailModal.tsx
 * @description Modal de detalhes completos do cliente com todas as informações de onboarding
 * @module components/clients
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Modal, StatusBadge } from '@/components/ui';
import { CLIENT_STATUS, SEGMENTS } from '@/lib/constants';
import { formatCurrency, formatPhone } from '@/lib/utils';
import { AvatarUpload } from './AvatarUpload';
import { CredentialsList } from './CredentialsList';

import type { Client, Report, Payment } from '@/types';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (client: Client) => void;
  onClientUpdate?: (client: Client) => void;
}

type TabType = 'info' | 'strategy' | 'credentials' | 'reports' | 'payments';

/**
 * Labels para frequência de reunião
 */
const MEETING_FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  on_demand: 'Sob demanda',
};

/**
 * Componente de item de informação
 */
function InfoItem({ label, value, isLink = false }: { label: string; value: string | null | undefined; isLink?: boolean }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      {isLink ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-white whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
}

/**
 * Componente de seção com título
 */
function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-zinc-400 border-b border-white/[0.05] pb-2">
        {icon}
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/**
 * Modal de detalhes do cliente
 */
export function ClientDetailModal({ client, isOpen, onClose, onEdit, onClientUpdate }: ClientDetailModalProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [loading, setLoading] = useState(false);
  const [localClient, setLocalClient] = useState<Client | null>(client);

  // Sincroniza o cliente local quando o prop mudar
  useEffect(() => {
    setLocalClient(client);
  }, [client]);

  /**
   * Callback para atualização do avatar
   */
  const handleAvatarUpdate = useCallback((updatedClient: Client) => {
    setLocalClient(updatedClient);
    onClientUpdate?.(updatedClient);
  }, [onClientUpdate]);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    async function loadData() {
      if (!client || !isOpen) {
        return;
      }

      setLoading(true);
      try {
        const [reportsRes, paymentsRes] = await Promise.all([
          fetch(`/api/reports?client_id=${client.id}`),
          fetch(`/api/payments?client_id=${client.id}`),
        ]);

        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data);
        }

        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data);
        }
      } catch (err) {
        console.error('[ClientDetailModal] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [client, isOpen]);

  // Reset tab quando fechar
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('info');
    }
  }, [isOpen]);

  const handleEdit = useCallback(() => {
    if (client && onEdit) {
      onEdit(client);
      onClose();
    }
  }, [client, onEdit, onClose]);

  if (!localClient) {
    return null;
  }

  const statusConfig = CLIENT_STATUS[localClient.status];
  const segmentLabel = SEGMENTS.find((s) => s.value === localClient.segment)?.label || localClient.segment;

  const paidPayments = payments.filter((p) => p.status === 'paid');
  const totalReceived = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // Verificar se tem dados de estratégia
  const hasStrategyData = localClient.differentials || localClient.ideal_customer || localClient.goals_short_term ||
    localClient.goals_long_term || localClient.content_request || localClient.peak_hours;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={localClient.name} size="xl">
      <div className="space-y-6">
        {/* Header com avatar, status e segmento */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar com upload integrado */}
            <AvatarUpload
              client={localClient}
              onUpdate={handleAvatarUpdate}
              size="sm"
            />
            <div>
              <p className="text-zinc-400 text-sm">{segmentLabel}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={localClient.status} label={statusConfig.label} />
                {localClient.city && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {localClient.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onEdit && (
            <Button variant="secondary" size="sm" onClick={handleEdit}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Button>
          )}
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-xs text-zinc-500 mb-1">Valor Mensal</p>
            <p className="text-lg font-bold text-white">{formatCurrency(localClient.monthly_value)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-xs text-zinc-500 mb-1">Dia Vencimento</p>
            <p className="text-lg font-bold text-white">Dia {localClient.due_day}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-xs text-zinc-500 mb-1">Relatórios</p>
            <p className="text-lg font-bold text-white">{reports.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-xs text-zinc-500 mb-1">Total Recebido</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalReceived)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 min-w-fit px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Informações
          </button>
          {hasStrategyData && (
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex-1 min-w-fit px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'strategy'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Estratégia
            </button>
          )}
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 min-w-fit px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Credenciais
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 min-w-fit px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Relatórios ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 min-w-fit px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Pagamentos ({payments.length})
          </button>
        </div>

        {/* Conteúdo das tabs */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-1">
            {/* Tab: Informações */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Contato */}
                <Section
                  title="Informações de Contato"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Nome do Contato" value={localClient.contact_name} />
                    <InfoItem label="Email" value={localClient.contact_email} />
                    <InfoItem label="Telefone/WhatsApp" value={localClient.contact_phone ? formatPhone(localClient.contact_phone) : null} />
                    <InfoItem label="Cidade" value={localClient.city} />
                    {localClient.address && (
                      <div className="col-span-2">
                        <InfoItem label="Endereço do Negócio" value={localClient.address} />
                      </div>
                    )}
                  </div>
                </Section>

                {/* Financeiro */}
                <Section
                  title="Informações Financeiras"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <InfoItem label="Valor Mensal" value={formatCurrency(localClient.monthly_value)} />
                    <InfoItem label="Dia de Vencimento" value={`Dia ${localClient.due_day}`} />
                    {localClient.average_ticket && (
                      <InfoItem label="Ticket Médio" value={formatCurrency(localClient.average_ticket)} />
                    )}
                  </div>
                </Section>

                {/* Redes Sociais */}
                {(localClient.instagram_url || localClient.facebook_page_id) && (
                  <Section
                    title="Redes Sociais"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      {localClient.instagram_url && (
                        <a
                          href={localClient.instagram_url.startsWith('http') ? localClient.instagram_url : `https://instagram.com/${localClient.instagram_url.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-pink-400 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          Instagram
                        </a>
                      )}
                      {localClient.facebook_page_id && (
                        <a
                          href={`https://facebook.com/${localClient.facebook_page_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors text-sm"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </a>
                      )}
                    </div>
                  </Section>
                )}

                {/* Links e Recursos */}
                <Section
                  title="Links e Recursos"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {localClient.ads_account_url && (
                      <a
                        href={localClient.ads_account_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Conta de Anúncios
                      </a>
                    )}
                    {localClient.website_url && (
                      <a
                        href={localClient.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Website
                      </a>
                    )}
                    {localClient.drive_url && (
                      <a
                        href={localClient.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Google Drive
                      </a>
                    )}
                    {localClient.menu_url && (
                      <a
                        href={localClient.menu_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Cardápio/Menu
                      </a>
                    )}
                    {!localClient.ads_account_url && !localClient.website_url && !localClient.drive_url && !localClient.menu_url && (
                      <span className="text-zinc-500 text-sm">Nenhum link cadastrado</span>
                    )}
                  </div>
                  {localClient.assets_links && (
                    <div className="mt-3">
                      <InfoItem label="Links de Assets/Criativos" value={localClient.assets_links} />
                    </div>
                  )}
                </Section>

                {/* Gestão */}
                <Section
                  title="Gestão do Cliente"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                >
                  <div className="grid grid-cols-2 gap-4">
                    {localClient.meeting_frequency && (
                      <InfoItem label="Frequência de Reuniões" value={MEETING_FREQUENCY_LABELS[localClient.meeting_frequency] || localClient.meeting_frequency} />
                    )}
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Autorização de Imagem</p>
                      <span className={`inline-flex items-center gap-1 text-sm ${localClient.image_authorization ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {localClient.image_authorization ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Autorizado
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Não autorizado
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </Section>

                {/* Observações */}
                {localClient.notes && (
                  <Section
                    title="Observações"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    }
                  >
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{localClient.notes}</p>
                  </Section>
                )}
              </div>
            )}

            {/* Tab: Estratégia */}
            {activeTab === 'strategy' && (
              <div className="space-y-6">
                {/* Metas */}
                {(localClient.goals_short_term || localClient.goals_long_term) && (
                  <Section
                    title="Metas e Objetivos"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    }
                  >
                    <div className="space-y-4">
                      {localClient.goals_short_term && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Metas de Curto Prazo</p>
                          <p className="text-sm text-white whitespace-pre-wrap">{localClient.goals_short_term}</p>
                        </div>
                      )}
                      {localClient.goals_long_term && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Metas de Longo Prazo</p>
                          <p className="text-sm text-white whitespace-pre-wrap">{localClient.goals_long_term}</p>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {/* Cliente Ideal e Diferenciais */}
                {(localClient.ideal_customer || localClient.differentials) && (
                  <Section
                    title="Público e Diferenciais"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                  >
                    <div className="space-y-4">
                      {localClient.ideal_customer && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Cliente Ideal</p>
                          <p className="text-sm text-white whitespace-pre-wrap">{localClient.ideal_customer}</p>
                        </div>
                      )}
                      {localClient.differentials && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Diferenciais</p>
                          <p className="text-sm text-white whitespace-pre-wrap">{localClient.differentials}</p>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {/* Operacional */}
                {localClient.peak_hours && (
                  <Section
                    title="Informações Operacionais"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    <InfoItem label="Horários de Pico" value={localClient.peak_hours} />
                  </Section>
                )}

                {/* Solicitação de Produção de Conteúdo */}
                {localClient.content_request && (
                  <Section
                    title="Solicitação de Produção de Conteúdo"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                  >
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{localClient.content_request}</p>
                  </Section>
                )}
              </div>
            )}

            {/* Tab: Credenciais */}
            {activeTab === 'credentials' && (
              <CredentialsList clientId={localClient.id} />
            )}

            {/* Tab: Relatórios */}
            {activeTab === 'reports' && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg className="w-12 h-12 text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-zinc-500">Nenhum relatório encontrado</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {new Date(report.period_start).toLocaleDateString('pt-BR')} -{' '}
                          {new Date(report.period_end).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-zinc-500">{report.source || 'Manual'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(Number(report.total_spend))}
                        </p>
                        <p className="text-xs text-zinc-500">{report.total_conversions} conversões</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Pagamentos */}
            {activeTab === 'payments' && (
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg className="w-12 h-12 text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-zinc-500">Nenhum pagamento encontrado</p>
                  </div>
                ) : (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div>
                        <p className="text-sm text-white">{payment.description}</p>
                        <p className="text-xs text-zinc-500">
                          Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {formatCurrency(Number(payment.amount))}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            payment.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : payment.status === 'overdue'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {payment.status === 'paid'
                            ? 'Pago'
                            : payment.status === 'overdue'
                            ? 'Atrasado'
                            : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
