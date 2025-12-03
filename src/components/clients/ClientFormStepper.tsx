/**
 * @file ClientFormStepper.tsx
 * @description Formulário de cliente com stepper visual - Onboarding simplificado
 * @module components/clients
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Input, Modal, Select } from '@/components/ui';
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
  { id: 1, title: 'Dados Básicos', description: 'Informações principais', icon: '📋' },
  { id: 2, title: 'Briefing', description: 'Questionário do nicho', icon: '📝' },
  { id: 3, title: 'Contato & Redes', description: 'Dados de contato e social', icon: '📞' },
  { id: 4, title: 'Links & Recursos', description: 'URLs e materiais', icon: '🔗' },
  { id: 5, title: 'Gestão', description: 'Reuniões e produção', icon: '⚙️' },
];

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

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stepper Header */}
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/[0.08]">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              className="flex flex-col items-center group"
              disabled={step.id > currentStep}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  step.id === currentStep
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30'
                    : step.id < currentStep
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/[0.05] text-zinc-500 border border-white/[0.08]'
                }`}
              >
                {step.id < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              <span
                className={`mt-2 text-[10px] font-medium hidden lg:block ${
                  step.id === currentStep ? 'text-white' : 'text-zinc-500'
                }`}
              >
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Title */}
      <div className="text-center pt-4">
        <h3 className="text-lg font-semibold text-white">{STEPS[currentStep - 1]?.title ?? ''}</h3>
        <p className="text-sm text-zinc-400">{STEPS[currentStep - 1]?.description ?? ''}</p>
      </div>

      {/* Step Content */}
      <div className="min-h-[320px] max-h-[50vh] overflow-y-auto pr-1">
        {/* Step 1: Dados Básicos */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <Input
              label="Nome do Cliente *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Ex: Academia XYZ, Restaurante ABC..."
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Segmento *"
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
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Valor Mensal (R$) *"
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
                label="Dia Vencimento *"
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
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Input
                label="Orçamento de Anúncios (R$/mês)"
                name="monthly_ad_budget"
                type="number"
                min={0}
                value={formData.monthly_ad_budget || ''}
                onChange={handleChange}
                placeholder="Ex: 5000"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* Step 2: Briefing */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <BriefingForm
              segment={formData.segment}
              existingData={isEditing ? client?.briefing_data : null}
              onChange={setBriefingData}
              readOnly={false}
            />
          </div>
        )}

        {/* Step 3: Contato & Redes */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
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
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />

              <Input
                label="Email"
                name="contact_email"
                type="email"
                value={formData.contact_email || ''}
                onChange={handleChange}
                error={errors.contact_email}
                placeholder="contato@empresa.com"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>

            <Input
              label="Instagram"
              name="instagram_url"
              value={formData.instagram_url || ''}
              onChange={handleChange}
              placeholder="@usuario ou URL completa"
              leftIcon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              }
            />
          </div>
        )}

        {/* Step 4: Links & Recursos */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <Input
              label="Link da Conta de Anúncios"
              name="ads_account_url"
              value={formData.ads_account_url || ''}
              onChange={handleChange}
              placeholder="https://business.facebook.com/..."
              autoFocus
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Website"
                name="website_url"
                value={formData.website_url || ''}
                onChange={handleChange}
                placeholder="https://www.site.com"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                }
              />

              <Input
                label="Cardápio / Catálogo"
                name="menu_url"
                value={formData.menu_url || ''}
                onChange={handleChange}
                placeholder="URL do cardápio digital"
              />
            </div>

            <Input
              label="Pasta do Google Drive"
              name="drive_url"
              value={formData.drive_url || ''}
              onChange={handleChange}
              placeholder="https://drive.google.com/drive/folders/..."
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
            />

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Links de Fotos/Vídeos (Assets)
              </label>
              <textarea
                name="assets_links"
                value={formData.assets_links || ''}
                onChange={handleChange}
                rows={2}
                placeholder="URLs de fotos, vídeos ou pastas de ativos (um por linha)"
                className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 5: Gestão */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
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
              <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
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
                      Marcar automaticamente no calendário as reuniões recorrentes
                    </p>
                  </div>
                </label>

                {formData.fixed_meeting_enabled && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
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
              </div>
            )}

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
                label="Vídeos p/ Campanha de Reconhecimento"
                name="videos_awareness"
                value={formData.videos_awareness || ''}
                onChange={handleChange}
                options={VIDEO_QUANTITY_RANGES}
                placeholder="Quantidade de vídeos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Solicitação de Produção de Conteúdo
              </label>
              <textarea
                name="content_request"
                value={formData.content_request || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva detalhes adicionais sobre os criativos para este cliente..."
                className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 text-sm"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                Informações adicionais sobre criativos, frequência de entrega e objetivos
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Observações e Anotações
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={2}
                placeholder="Informações adicionais, particularidades, alertas..."
                className="w-full rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] border-white/[0.08] focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/[0.15] hover:bg-white/[0.05] py-3 px-4 text-sm"
              />
            </div>
          </div>
        )}

      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
        <Button
          type="button"
          variant="ghost"
          onClick={currentStep === 1 ? onClose : handleBack}
          disabled={loading}
        >
          {currentStep === 1 ? 'Cancelar' : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </>
          )}
        </Button>

        {currentStep < STEPS.length ? (
          <Button type="button" onClick={handleNext}>
            Próximo
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        ) : (
          <Button type="submit" loading={loading} disabled={!canSubmit || loading}>
            {isEditing ? 'Salvar Alterações' : 'Criar Cliente'}
          </Button>
        )}
      </div>
    </form>
  );

  if (onClose) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Editar Cliente' : 'Novo Cliente - Onboarding'}
        size="lg"
      >
        {content}
      </Modal>
    );
  }

  return content;
}
