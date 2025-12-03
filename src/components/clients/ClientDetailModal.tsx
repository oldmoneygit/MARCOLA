/**
 * @file ClientDetailModal.tsx
 * @description Modal de perfil completo do cliente com todas as informações
 * @module components/clients
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, GlassCard, Icon, Modal, StatusBadge } from '@/components/ui';
import { CLIENT_STATUS, SEGMENTS } from '@/lib/constants';
import { formatCurrency, formatPhone } from '@/lib/utils';
import { AvatarUpload } from './AvatarUpload';
import { CredentialsList } from './CredentialsList';
import {
  IntelligenceCard,
  ExecutiveSummaryCard,
  ContentSuggestionsGrid,
  SeasonalOffersCarousel,
  IntelligenceLoadingSkeleton,
} from '@/components/intelligence';
import { useClientIntelligence } from '@/hooks';

import type { Client, Report, Payment, BriefingData, BriefingAnswer } from '@/types';

interface ClientDetailModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (client: Client) => void;
  onClientUpdate?: (client: Client) => void;
}

type TabType = 'overview' | 'briefing' | 'intelligence' | 'credentials' | 'reports' | 'payments';

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
 * Configuração das abas
 */
const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: 'user' },
  { id: 'briefing', label: 'Briefing', icon: 'clipboard-list' },
  { id: 'intelligence', label: 'Inteligência', icon: 'bot' },
  { id: 'credentials', label: 'Credenciais', icon: 'key' },
  { id: 'reports', label: 'Relatórios', icon: 'bar-chart-2' },
  { id: 'payments', label: 'Pagamentos', icon: 'credit-card' },
];

/**
 * Componente de seção com título
 */
function Section({
  title,
  children,
  icon,
  className = ''
}: {
  title: string;
  children: React.ReactNode;
  icon: string;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-zinc-400 border-b border-white/[0.05] pb-2">
        <Icon name={icon} size="sm" />
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/**
 * Componente de item de informação
 */
function InfoItem({
  label,
  value,
  isLink = false
}: {
  label: string;
  value: string | null | undefined;
  isLink?: boolean
}) {
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
 * Formata o valor da resposta baseado no tipo
 */
function formatBriefingValue(value: BriefingAnswer['value'], fieldType: string): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  // Para campos de data
  if (fieldType === 'date' && typeof value === 'string') {
    try {
      return new Date(value).toLocaleDateString('pt-BR');
    } catch {
      return value;
    }
  }

  return String(value);
}

/**
 * Componente para exibir item de briefing
 */
function BriefingItem({ answer }: { answer: BriefingAnswer }) {
  const displayValue = formatBriefingValue(answer.value, answer.field_type);

  if (displayValue === '-' || displayValue === '') {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.03] transition-colors">
      <p className="text-xs text-zinc-500 mb-2">{answer.question_text}</p>
      <p className="text-sm text-white whitespace-pre-wrap">{displayValue}</p>
    </div>
  );
}

/**
 * Modal de perfil do cliente
 */
export function ClientDetailModal({
  client,
  isOpen,
  onClose,
  onEdit,
  onClientUpdate
}: ClientDetailModalProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [localClient, setLocalClient] = useState<Client | null>(client);

  // Hook para inteligência do cliente
  const {
    intelligence,
    loading: intelligenceLoading,
    generating: intelligenceGenerating,
    isStale: intelligenceIsStale,
    generate: generateIntelligence,
    regenerate: regenerateIntelligence,
  } = useClientIntelligence({
    clientId: client?.id || '',
    autoFetch: isOpen && activeTab === 'intelligence',
  });

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
      setActiveTab('overview');
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

  // Verificar se tem dados de briefing
  const briefingData = localClient.briefing_data as BriefingData | null;
  const hasBriefingData = briefingData && Object.keys(briefingData).length > 0;

  // Filtrar tabs visíveis
  const visibleTabs = TABS.filter(tab => {
    if (tab.id === 'briefing' && !hasBriefingData) {
      return false;
    }
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="profile"
      showCloseButton={false}
      noPadding
    >
      <div className="flex flex-col h-full">
        {/* Header do Perfil */}
        <div className="relative">
          {/* Background gradient - usa cores da marca se disponíveis */}
          <div
            className="h-24"
            style={
              localClient.brand_colors
                ? {
                    background: `linear-gradient(to right, ${localClient.brand_colors.primary}40, ${localClient.brand_colors.secondary}40, ${localClient.brand_colors.accent}40)`,
                  }
                : {
                    background: 'linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(219, 39, 119, 0.2))',
                  }
            }
          />

          {/* Conteúdo do header */}
          <div className="px-6 pb-4">
            <div className="flex items-end gap-4 -mt-10">
              {/* Avatar */}
              <div className="relative">
                <AvatarUpload
                  client={localClient}
                  onUpdate={handleAvatarUpdate}
                  size="lg"
                />
                <div className="absolute -bottom-1 -right-1">
                  <StatusBadge status={localClient.status} size="sm" />
                </div>
              </div>

              {/* Info principal */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{localClient.name}</h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={
                      localClient.brand_colors
                        ? {
                            backgroundColor: `${localClient.brand_colors.primary}30`,
                            color: localClient.brand_colors.primary,
                          }
                        : {
                            backgroundColor: 'rgba(139, 92, 246, 0.2)',
                            color: 'rgb(196, 181, 253)',
                          }
                    }
                  >
                    {segmentLabel}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                  {localClient.city && (
                    <span className="flex items-center gap-1">
                      <Icon name="map-pin" size="xs" />
                      {localClient.city}
                    </span>
                  )}
                  {localClient.contact_name && (
                    <span className="flex items-center gap-1">
                      <Icon name="user" size="xs" />
                      {localClient.contact_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pb-2">
                {onEdit && (
                  <Button variant="secondary" size="sm" onClick={handleEdit}>
                    <Icon name="edit-2" size="sm" className="mr-2" />
                    Editar
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <Icon name="x" size="sm" />
                </Button>
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <p className="text-2xl font-bold text-white">{formatCurrency(localClient.monthly_value)}</p>
                <p className="text-xs text-zinc-500">Valor Mensal</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <p className="text-2xl font-bold text-white">Dia {localClient.due_day}</p>
                <p className="text-xs text-zinc-500">Vencimento</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <p className="text-2xl font-bold text-white">{reports.length}</p>
                <p className="text-xs text-zinc-500">Relatórios</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalReceived)}</p>
                <p className="text-xs text-zinc-500">Total Recebido</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação por abas */}
        <div className="px-6 border-b border-white/[0.08]">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon name={tab.icon} size="sm" />
                {tab.label}
                {tab.id === 'reports' && reports.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400">
                    {reports.length}
                  </span>
                )}
                {tab.id === 'payments' && payments.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400">
                    {payments.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
            </div>
          ) : (
            <>
              {/* Tab: Visão Geral */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coluna 1 */}
                  <div className="space-y-6">
                    {/* Contato */}
                    <GlassCard className="p-5">
                      <Section title="Informações de Contato" icon="user">
                        <div className="grid grid-cols-2 gap-4">
                          <InfoItem label="Nome do Contato" value={localClient.contact_name} />
                          <InfoItem label="Email" value={localClient.contact_email} />
                          <InfoItem
                            label="Telefone/WhatsApp"
                            value={localClient.contact_phone ? formatPhone(localClient.contact_phone) : null}
                          />
                          <InfoItem label="Cidade" value={localClient.city} />
                        </div>
                        {localClient.address && (
                          <div className="mt-4">
                            <InfoItem label="Endereço do Negócio" value={localClient.address} />
                          </div>
                        )}
                      </Section>
                    </GlassCard>

                    {/* Financeiro */}
                    <GlassCard className="p-5">
                      <Section title="Informações Financeiras" icon="dollar-sign">
                        <div className="grid grid-cols-2 gap-4">
                          <InfoItem label="Valor Mensal" value={formatCurrency(localClient.monthly_value)} />
                          <InfoItem label="Dia de Vencimento" value={`Dia ${localClient.due_day}`} />
                          {localClient.average_ticket && (
                            <InfoItem label="Ticket Médio" value={formatCurrency(localClient.average_ticket)} />
                          )}
                          {localClient.profit_margin && (
                            <InfoItem label="Margem de Lucro" value={`${localClient.profit_margin}%`} />
                          )}
                          {localClient.monthly_ad_budget && (
                            <InfoItem label="Orçamento de Anúncios" value={formatCurrency(localClient.monthly_ad_budget)} />
                          )}
                        </div>
                      </Section>
                    </GlassCard>

                    {/* Gestão */}
                    <GlassCard className="p-5">
                      <Section title="Gestão do Cliente" icon="clipboard">
                        <div className="grid grid-cols-2 gap-4">
                          {localClient.meeting_frequency && (
                            <InfoItem
                              label="Frequência de Reuniões"
                              value={MEETING_FREQUENCY_LABELS[localClient.meeting_frequency] || localClient.meeting_frequency}
                            />
                          )}
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Autorização de Imagem</p>
                            <span className={`inline-flex items-center gap-1 text-sm ${localClient.image_authorization ? 'text-emerald-400' : 'text-zinc-400'}`}>
                              <Icon
                                name={localClient.image_authorization ? 'check-circle' : 'x-circle'}
                                size="sm"
                              />
                              {localClient.image_authorization ? 'Autorizado' : 'Não autorizado'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Status</p>
                            <StatusBadge status={localClient.status} label={statusConfig.label} />
                          </div>
                        </div>
                      </Section>
                    </GlassCard>
                  </div>

                  {/* Coluna 2 */}
                  <div className="space-y-6">
                    {/* Redes Sociais */}
                    <GlassCard className="p-5">
                      <Section title="Redes Sociais" icon="share-2">
                        <div className="flex flex-wrap gap-2">
                          {localClient.instagram_url && (
                            <a
                              href={localClient.instagram_url.startsWith('http')
                                ? localClient.instagram_url
                                : `https://instagram.com/${localClient.instagram_url.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 text-pink-400 transition-colors text-sm"
                            >
                              <Icon name="instagram" size="sm" />
                              Instagram
                            </a>
                          )}
                          {localClient.facebook_page_id && (
                            <a
                              href={`https://facebook.com/${localClient.facebook_page_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors text-sm"
                            >
                              <Icon name="facebook" size="sm" />
                              Facebook
                            </a>
                          )}
                          {!localClient.instagram_url && !localClient.facebook_page_id && (
                            <span className="text-zinc-500 text-sm">Nenhuma rede social cadastrada</span>
                          )}
                        </div>
                      </Section>
                    </GlassCard>

                    {/* Links e Recursos */}
                    <GlassCard className="p-5">
                      <Section title="Links e Recursos" icon="link">
                        <div className="space-y-2">
                          {localClient.ads_account_url && (
                            <a
                              href={localClient.ads_account_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white transition-colors"
                            >
                              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Icon name="bar-chart" size="sm" className="text-orange-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Conta de Anúncios</p>
                                <p className="text-xs text-zinc-500 truncate max-w-[200px]">{localClient.ads_account_url}</p>
                              </div>
                              <Icon name="external-link" size="sm" className="ml-auto text-zinc-500" />
                            </a>
                          )}
                          {localClient.website_url && (
                            <a
                              href={localClient.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white transition-colors"
                            >
                              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Icon name="globe" size="sm" className="text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Website</p>
                                <p className="text-xs text-zinc-500 truncate max-w-[200px]">{localClient.website_url}</p>
                              </div>
                              <Icon name="external-link" size="sm" className="ml-auto text-zinc-500" />
                            </a>
                          )}
                          {localClient.drive_url && (
                            <a
                              href={localClient.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white transition-colors"
                            >
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Icon name="folder" size="sm" className="text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Google Drive</p>
                                <p className="text-xs text-zinc-500">Pasta de arquivos</p>
                              </div>
                              <Icon name="external-link" size="sm" className="ml-auto text-zinc-500" />
                            </a>
                          )}
                          {localClient.menu_url && (
                            <a
                              href={localClient.menu_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 hover:text-white transition-colors"
                            >
                              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Icon name="file-text" size="sm" className="text-amber-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Cardápio/Menu</p>
                                <p className="text-xs text-zinc-500">Catálogo de produtos</p>
                              </div>
                              <Icon name="external-link" size="sm" className="ml-auto text-zinc-500" />
                            </a>
                          )}
                          {!localClient.ads_account_url && !localClient.website_url && !localClient.drive_url && !localClient.menu_url && (
                            <span className="text-zinc-500 text-sm">Nenhum link cadastrado</span>
                          )}
                        </div>
                      </Section>
                    </GlassCard>

                    {/* Observações */}
                    {localClient.notes && (
                      <GlassCard className="p-5">
                        <Section title="Observações" icon="file-text">
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{localClient.notes}</p>
                        </Section>
                      </GlassCard>
                    )}
                  </div>
                </div>
              )}


              {/* Tab: Briefing */}
              {activeTab === 'briefing' && hasBriefingData && briefingData && (
                <div className="space-y-6">
                  {/* Header com info do template */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Icon name="clipboard-list" size="md" className="text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{briefingData.template_name}</h3>
                        <p className="text-sm text-zinc-400">
                          Respondido em {new Date(briefingData.answered_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{briefingData.answers?.length || 0}</p>
                      <p className="text-xs text-zinc-500">perguntas respondidas</p>
                    </div>
                  </div>

                  {/* Grid de respostas */}
                  {briefingData.answers && briefingData.answers.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {briefingData.answers.map((answer, index) => (
                        <BriefingItem key={answer.question_id || index} answer={answer} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                        <Icon name="clipboard-list" size="lg" className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-400 mb-1">Nenhuma resposta encontrada</p>
                      <p className="text-sm text-zinc-600">O briefing foi salvo mas não contém respostas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Inteligência */}
              {activeTab === 'intelligence' && (
                <div className="space-y-6">
                  {intelligenceGenerating ? (
                    <IntelligenceLoadingSkeleton
                      message={`Analisando dados de ${localClient.name}...`}
                    />
                  ) : (
                    <>
                      {/* Card principal de inteligência */}
                      <IntelligenceCard
                        intelligence={intelligence}
                        loading={intelligenceLoading}
                        generating={intelligenceGenerating}
                        isStale={intelligenceIsStale}
                        onGenerate={intelligence ? regenerateIntelligence : generateIntelligence}
                      />

                      {/* Conteúdo da inteligência */}
                      {intelligence && (
                        <>
                          {/* Resumo Executivo */}
                          <ExecutiveSummaryCard
                            summary={intelligence.executive_summary}
                            lastUpdated={intelligence.last_generated_at}
                          />

                          {/* Sugestões de Conteúdo */}
                          <ContentSuggestionsGrid
                            suggestions={intelligence.content_suggestions || []}
                          />

                          {/* Ofertas Sazonais */}
                          <SeasonalOffersCarousel
                            offers={intelligence.seasonal_offers || []}
                          />
                        </>
                      )}
                    </>
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
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                        <Icon name="bar-chart-2" size="lg" className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-400 mb-1">Nenhum relatório encontrado</p>
                      <p className="text-sm text-zinc-600">Os relatórios importados aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {reports.map((report) => (
                        <GlassCard
                          key={report.id}
                          className="p-4 hover:border-violet-500/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {new Date(report.period_start).toLocaleDateString('pt-BR')} -{' '}
                                {new Date(report.period_end).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">{report.source || 'Manual'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">
                                {formatCurrency(Number(report.total_spend))}
                              </p>
                              <p className="text-xs text-zinc-500">{report.total_conversions} conversões</p>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Pagamentos */}
              {activeTab === 'payments' && (
                <div className="space-y-3">
                  {payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                        <Icon name="credit-card" size="lg" className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-400 mb-1">Nenhum pagamento encontrado</p>
                      <p className="text-sm text-zinc-600">Os pagamentos gerados aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.map((payment) => (
                        <GlassCard
                          key={payment.id}
                          className="p-4 hover:border-violet-500/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                payment.status === 'paid'
                                  ? 'bg-emerald-500/20'
                                  : payment.status === 'overdue'
                                  ? 'bg-red-500/20'
                                  : 'bg-amber-500/20'
                              }`}>
                                <Icon
                                  name={payment.status === 'paid' ? 'check' : payment.status === 'overdue' ? 'alert-circle' : 'clock'}
                                  size="sm"
                                  className={
                                    payment.status === 'paid'
                                      ? 'text-emerald-400'
                                      : payment.status === 'overdue'
                                      ? 'text-red-400'
                                      : 'text-amber-400'
                                  }
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{payment.description}</p>
                                <p className="text-xs text-zinc-500">
                                  Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">
                                {formatCurrency(Number(payment.amount))}
                              </p>
                              <StatusBadge
                                status={payment.status === 'paid' ? 'success' : payment.status === 'overdue' ? 'danger' : 'warning'}
                                size="sm"
                                label={payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                              />
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
