/**
 * @file ClientFormStepper.tsx
 * @description Formulário de cliente com stepper visual - Onboarding moderno
 * @module components/clients
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, GlassCard, Icon, Input, Modal, Select } from '@/components/ui';
import { BriefingForm } from '@/components/clients/BriefingForm';
import { CAPTATION_FREQUENCIES, MEETING_FREQUENCIES, SEGMENTS, VIDEO_QUANTITY_RANGES, WEEK_DAYS } from '@/lib/constants';

import type { BriefingData, Client, CreateClientDTO } from '@/types';

interface ClientFormStepperProps {
  client?: Client | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit: (data: CreateClientDTO) => Promise<void>;
  loading?: boolean;
  /** Dados iniciais para pré-preencher (ex: vindos da IA) */
  initialData?: Partial<CreateClientDTO>;
}

const STEPS = [
  { id: 1, title: 'Dados Básicos', description: 'Informações principais do cliente', icon: 'building-2' },
  { id: 2, title: 'Briefing', description: 'Questionário personalizado do nicho', icon: 'clipboard-list' },
  { id: 3, title: 'Contato & Redes', description: 'Informações de contato e redes sociais', icon: 'users' },
  { id: 4, title: 'Links & Recursos', description: 'URLs e materiais do cliente', icon: 'link' },
  { id: 5, title: 'Gestão', description: 'Reuniões, produção e estratégia', icon: 'settings' },
];

/**
 * Componente de seção dentro do formulário
 */
function FormSection({
  title,
  icon,
  children,
  className = ''
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Icon name={icon} size="sm" className="text-violet-400" />
        </div>
        <h4 className="text-sm font-medium text-zinc-300">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/**
 * Formulário de cliente com stepper visual - 5 etapas
 */
export function ClientFormStepper({
  client,
  isOpen = true,
  onClose,
  onSubmit,
  loading = false,
  initialData,
}: ClientFormStepperProps) {
  const isEditing = Boolean(client);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<CreateClientDTO>({
    // Obrigatórios
    name: client?.name || initialData?.name || '',
    segment: client?.segment || initialData?.segment || '',
    monthly_value: client?.monthly_value || initialData?.monthly_value || 0,
    due_day: client?.due_day || initialData?.due_day || 10,
    // Financeiro
    average_ticket: client?.average_ticket || initialData?.average_ticket || undefined,
    profit_margin: client?.profit_margin || initialData?.profit_margin || undefined,
    monthly_ad_budget: client?.monthly_ad_budget || initialData?.monthly_ad_budget || undefined,
    // Localização
    city: client?.city || initialData?.city || '',
    address: client?.address || initialData?.address || '',
    // Contato
    contact_name: client?.contact_name || initialData?.contact_name || '',
    contact_phone: client?.contact_phone || initialData?.contact_phone || '',
    contact_email: client?.contact_email || initialData?.contact_email || '',
    // Redes sociais
    instagram_url: client?.instagram_url || initialData?.instagram_url || '',
    // Links e recursos
    ads_account_url: client?.ads_account_url || initialData?.ads_account_url || '',
    website_url: client?.website_url || initialData?.website_url || '',
    drive_url: client?.drive_url || initialData?.drive_url || '',
    menu_url: client?.menu_url || initialData?.menu_url || '',
    assets_links: client?.assets_links || initialData?.assets_links || '',
    // Gestão
    meeting_frequency: client?.meeting_frequency || initialData?.meeting_frequency || undefined,
    captation_frequency: client?.captation_frequency || initialData?.captation_frequency || undefined,
    videos_sales: client?.videos_sales || initialData?.videos_sales || undefined,
    videos_awareness: client?.videos_awareness || initialData?.videos_awareness || undefined,
    fixed_meeting_enabled: client?.fixed_meeting_enabled ?? initialData?.fixed_meeting_enabled ?? false,
    fixed_meeting_day: client?.fixed_meeting_day || initialData?.fixed_meeting_day || undefined,
    fixed_meeting_time: client?.fixed_meeting_time || initialData?.fixed_meeting_time || undefined,
    image_authorization: client?.image_authorization ?? initialData?.image_authorization ?? undefined,
    content_request: client?.content_request || initialData?.content_request || '',
    organic_content_strategy: client?.organic_content_strategy || initialData?.organic_content_strategy || '',
    // Observações
    notes: client?.notes || initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [briefingData, setBriefingData] = useState<BriefingData | null>(client?.briefing_data || null);
  const [canSubmit, setCanSubmit] = useState(false);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      // Preserve existing briefing data when editing
      setBriefingData(client?.briefing_data || null);
      setCanSubmit(false);
    }
  }, [isOpen, client?.briefing_data]);

  // Habilita submit apenas quando estiver no último step por um momento
  useEffect(() => {
    if (currentStep === STEPS.length) {
      // Delay para evitar submit automático ao transicionar
      const timer = setTimeout(() => {
        setCanSubmit(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    setCanSubmit(false);
    return undefined;
  }, [currentStep]);

  // Update form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        segment: client.segment || '',
        monthly_value: client.monthly_value || 0,
        due_day: client.due_day || 10,
        average_ticket: client.average_ticket || undefined,
        profit_margin: client.profit_margin || undefined,
        monthly_ad_budget: client.monthly_ad_budget || undefined,
        city: client.city || '',
        address: client.address || '',
        contact_name: client.contact_name || '',
        contact_phone: client.contact_phone || '',
        contact_email: client.contact_email || '',
        instagram_url: client.instagram_url || '',
        ads_account_url: client.ads_account_url || '',
        website_url: client.website_url || '',
        drive_url: client.drive_url || '',
        menu_url: client.menu_url || '',
        assets_links: client.assets_links || '',
        meeting_frequency: client.meeting_frequency || undefined,
        captation_frequency: client.captation_frequency || undefined,
        videos_sales: client.videos_sales || undefined,
        videos_awareness: client.videos_awareness || undefined,
        fixed_meeting_enabled: client.fixed_meeting_enabled ?? false,
        fixed_meeting_day: client.fixed_meeting_day || undefined,
        fixed_meeting_time: client.fixed_meeting_time || undefined,
        image_authorization: client.image_authorization ?? undefined,
        content_request: client.content_request || '',
        organic_content_strategy: client.organic_content_strategy || '',
        notes: client.notes || '',
      });
    }
  }, [client]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? (value ? Number(value) : undefined) : value,
      }));
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validateStep = useCallback((step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (!formData.segment) {
        newErrors.segment = 'Selecione um segmento';
      }
      if (!formData.monthly_value || formData.monthly_value <= 0) {
        newErrors.monthly_value = 'Valor deve ser maior que zero';
      }
      if (!formData.due_day || formData.due_day < 1 || formData.due_day > 31) {
        newErrors.due_day = 'Dia deve estar entre 1 e 31';
      }
    }

    if (step === 3) {
      if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = 'Email inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    } else if (stepId === currentStep + 1 && validateStep(currentStep)) {
      setCurrentStep(stepId);
    }
  }, [currentStep, validateStep]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Proteção contra submit automático
      if (!canSubmit) {
        return;
      }

      if (!validateStep(currentStep)) {
        return;
      }

      try {
        // Include briefing data in form submission
        const dataToSubmit: CreateClientDTO = {
          ...formData,
          briefing_data: briefingData || undefined,
        };
        await onSubmit(dataToSubmit);
        onClose?.();
      } catch {
        // Error handled by parent
      }
    },
    [formData, currentStep, validateStep, onSubmit, onClose, briefingData, canSubmit]
  );

  const progress = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep - 1];

  const content = (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header com Step Info */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        {/* Progress bar elegante */}
        <div className="relative h-1 bg-white/[0.06] rounded-full overflow-hidden mb-6">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isClickable = step.id <= currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                disabled={!isClickable}
                className={`flex-1 group relative transition-all duration-300 ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div className={`
                  flex flex-col items-center p-3 rounded-xl transition-all duration-300
                  ${isActive
                    ? 'bg-violet-500/10 border border-violet-500/30'
                    : isCompleted
                      ? 'bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10'
                      : 'bg-white/[0.02] border border-white/[0.05]'
                  }
                `}>
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25'
                      : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/[0.05] text-zinc-500'
                    }
                  `}>
                    {isCompleted ? (
                      <Icon name="check" size="sm" />
                    ) : (
                      <Icon name={step.icon} size="sm" />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors ${
                    isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                  }`}>
                    {step.title}
                  </span>
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className={`
                    absolute top-1/2 -right-1 w-2 h-0.5 -translate-y-1/2
                    ${isCompleted ? 'bg-emerald-500/40' : 'bg-white/[0.08]'}
                  `} />
                )}
              </button>
            );
          })}
        </div>

        {/* Current Step Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
            <Icon name={currentStepData?.icon || 'file'} size="md" className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{currentStepData?.title}</h3>
            <p className="text-sm text-zinc-400">{currentStepData?.description}</p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-2xl font-bold text-white">{currentStep}</span>
            <span className="text-sm text-zinc-500">/{STEPS.length}</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="min-h-[400px]">
          {/* Step 1: Dados Básicos */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <FormSection title="Identificação" icon="building-2">
                <Input
                  label="Nome do Cliente"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Ex: Academia XYZ, Restaurante ABC..."
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Segmento"
                    name="segment"
                    value={formData.segment}
                    onChange={handleChange}
                    error={errors.segment}
                    options={SEGMENTS}
                    placeholder="Selecione o nicho"
                  />

                  <Input
                    label="Cidade / Região"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    placeholder="São Paulo, SP"
                  />
                </div>

                <Input
                  label="Endereço do Negócio"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Rua, número, bairro (para negócios locais)"
                />
              </FormSection>

              <FormSection title="Financeiro" icon="dollar-sign">
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Valor Mensal (R$)"
                    name="monthly_value"
                    type="number"
                    value={formData.monthly_value || ''}
                    onChange={handleChange}
                    error={errors.monthly_value}
                    placeholder="0,00"
                  />

                  <Input
                    label="Ticket Médio (R$)"
                    name="average_ticket"
                    type="number"
                    value={formData.average_ticket || ''}
                    onChange={handleChange}
                    placeholder="Ex: 150"
                  />

                  <Input
                    label="Dia Vencimento"
                    name="due_day"
                    type="number"
                    min={1}
                    max={31}
                    value={formData.due_day || ''}
                    onChange={handleChange}
                    error={errors.due_day}
                    placeholder="10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Margem de Lucro (%)"
                    name="profit_margin"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={formData.profit_margin || ''}
                    onChange={handleChange}
                    placeholder="Ex: 30"
                  />

                  <Input
                    label="Orçamento de Anúncios (R$/mês)"
                    name="monthly_ad_budget"
                    type="number"
                    min={0}
                    value={formData.monthly_ad_budget || ''}
                    onChange={handleChange}
                    placeholder="Ex: 5000"
                  />
                </div>
              </FormSection>
            </div>
          )}

          {/* Step 2: Briefing */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              {formData.segment ? (
                <BriefingForm
                  segment={formData.segment}
                  existingData={isEditing ? client?.briefing_data : null}
                  onChange={setBriefingData}
                  readOnly={false}
                />
              ) : (
                <GlassCard className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <Icon name="alert-triangle" size="lg" className="text-amber-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">Segmento não selecionado</h4>
                  <p className="text-sm text-zinc-400 mb-4">
                    Volte ao passo anterior e selecione um segmento para ver o briefing personalizado.
                  </p>
                  <Button variant="secondary" onClick={handleBack}>
                    <Icon name="arrow-left" size="sm" className="mr-2" />
                    Voltar
                  </Button>
                </GlassCard>
              )}
            </div>
          )}

          {/* Step 3: Contato & Redes */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <FormSection title="Pessoa de Contato" icon="user">
                <Input
                  label="Nome do Contato"
                  name="contact_name"
                  value={formData.contact_name || ''}
                  onChange={handleChange}
                  placeholder="Nome da pessoa responsável"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Telefone / WhatsApp"
                    name="contact_phone"
                    value={formData.contact_phone || ''}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />

                  <Input
                    label="Email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={handleChange}
                    error={errors.contact_email}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </FormSection>

              <FormSection title="Redes Sociais" icon="instagram">
                <Input
                  label="Instagram"
                  name="instagram_url"
                  value={formData.instagram_url || ''}
                  onChange={handleChange}
                  placeholder="@usuario ou URL completa"
                />

                <p className="text-xs text-zinc-500">
                  Mais redes sociais podem ser adicionadas posteriormente no perfil do cliente.
                </p>
              </FormSection>
            </div>
          )}

          {/* Step 4: Links & Recursos */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <FormSection title="Conta de Anúncios" icon="bar-chart-2">
                <Input
                  label="Link da Conta de Anúncios"
                  name="ads_account_url"
                  value={formData.ads_account_url || ''}
                  onChange={handleChange}
                  placeholder="https://business.facebook.com/..."
                  autoFocus
                />
              </FormSection>

              <FormSection title="Presença Digital" icon="globe">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Website"
                    name="website_url"
                    value={formData.website_url || ''}
                    onChange={handleChange}
                    placeholder="https://www.site.com"
                  />

                  <Input
                    label="Cardápio / Catálogo"
                    name="menu_url"
                    value={formData.menu_url || ''}
                    onChange={handleChange}
                    placeholder="URL do cardápio digital"
                  />
                </div>
              </FormSection>

              <FormSection title="Materiais e Assets" icon="folder">
                <Input
                  label="Pasta do Google Drive"
                  name="drive_url"
                  value={formData.drive_url || ''}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/drive/folders/..."
                />

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Links de Fotos/Vídeos (Assets)
                  </label>
                  <textarea
                    name="assets_links"
                    value={formData.assets_links || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="URLs de fotos, vídeos ou pastas de ativos (um por linha)"
                    className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 text-sm"
                  />
                </div>
              </FormSection>
            </div>
          )}

          {/* Step 5: Gestão */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <FormSection title="Reuniões" icon="calendar">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Frequência de Reuniões"
                    name="meeting_frequency"
                    value={formData.meeting_frequency || ''}
                    onChange={handleChange}
                    options={MEETING_FREQUENCIES}
                    placeholder="Selecione a frequência"
                  />

                  <Select
                    label="Frequência de Captações"
                    name="captation_frequency"
                    value={formData.captation_frequency || ''}
                    onChange={handleChange}
                    options={CAPTATION_FREQUENCIES}
                    placeholder="Selecione a frequência"
                  />
                </div>

                {/* Opção de Dia Fixo para Reuniões */}
                {formData.meeting_frequency && formData.meeting_frequency !== 'on_demand' && (
                  <GlassCard className="p-4 bg-violet-500/5 border-violet-500/20">
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        name="fixed_meeting_enabled"
                        checked={formData.fixed_meeting_enabled ?? false}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-white/[0.2] bg-white/[0.05] text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0"
                      />
                      <div>
                        <span className="text-sm font-medium text-white">Definir dia fixo para reunião</span>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Marcar automaticamente no calendário
                        </p>
                      </div>
                    </label>

                    {formData.fixed_meeting_enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <Select
                          label="Dia da Semana"
                          name="fixed_meeting_day"
                          value={formData.fixed_meeting_day || ''}
                          onChange={handleChange}
                          options={WEEK_DAYS}
                          placeholder="Selecione o dia"
                        />

                        <Input
                          label="Horário"
                          name="fixed_meeting_time"
                          type="time"
                          value={formData.fixed_meeting_time || ''}
                          onChange={handleChange}
                          placeholder="14:00"
                        />
                      </div>
                    )}
                  </GlassCard>
                )}
              </FormSection>

              <FormSection title="Produção de Vídeos" icon="video">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Vídeos p/ Campanha de Vendas"
                    name="videos_sales"
                    value={formData.videos_sales || ''}
                    onChange={handleChange}
                    options={VIDEO_QUANTITY_RANGES}
                    placeholder="Quantidade de vídeos"
                  />

                  <Select
                    label="Vídeos p/ Reconhecimento"
                    name="videos_awareness"
                    value={formData.videos_awareness || ''}
                    onChange={handleChange}
                    options={VIDEO_QUANTITY_RANGES}
                    placeholder="Quantidade de vídeos"
                  />
                </div>
              </FormSection>

              <FormSection title="Estratégia de Conteúdo" icon="target">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estratégia de Conteúdo Pago
                  </label>
                  <textarea
                    name="content_request"
                    value={formData.content_request || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descreva a estratégia de conteúdo para campanhas pagas..."
                    className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Estratégia de Conteúdo Orgânico
                  </label>
                  <textarea
                    name="organic_content_strategy"
                    value={formData.organic_content_strategy || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Descreva a estratégia para redes sociais orgânicas..."
                    className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 text-sm"
                  />
                </div>
              </FormSection>

              <FormSection title="Autorizações" icon="shield-check">
                <GlassCard className="p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="image_authorization"
                      checked={formData.image_authorization ?? false}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-white/[0.2] bg-white/[0.05] text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0"
                    />
                    <div>
                      <span className="text-sm font-medium text-white">Autorização de Imagem</span>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Cliente autorizou uso de fotos/vídeos em anúncios
                      </p>
                    </div>
                  </label>
                </GlassCard>
              </FormSection>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 1 ? onClose : handleBack}
            disabled={loading}
          >
            {currentStep === 1 ? (
              'Cancelar'
            ) : (
              <>
                <Icon name="arrow-left" size="sm" className="mr-2" />
                Voltar
              </>
            )}
          </Button>

          <div className="flex items-center gap-3">
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext}>
                Próximo
                <Icon name="arrow-right" size="sm" className="ml-2" />
              </Button>
            ) : (
              <Button type="submit" loading={loading} disabled={!canSubmit || loading}>
                <Icon name="check" size="sm" className="mr-2" />
                {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );

  if (onClose) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        size="xl"
        noPadding
      >
        {content}
      </Modal>
    );
  }

  return content;
}
