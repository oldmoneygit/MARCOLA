/**
 * @file SendWhatsAppModal.tsx
 * @description Modal para envio de mensagens WhatsApp com seleção de template e áudio
 * @module components/whatsapp
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  CreditCard,
  AlertTriangle,
  ClipboardCheck,
  BarChart3,
  Edit3,
  Phone,
  Pencil,
  Check,
  Mic,
  Upload,
  Play,
  Pause,
  Trash2,
  Plus,
  Star,
} from 'lucide-react';

import { useWhatsApp } from '@/hooks/useWhatsApp';
import { useAuth } from '@/hooks/useAuth';
import { processTemplate } from '@/lib/whatsapp/message-templates';
import { cn } from '@/lib/utils';
import { AudioRecorder } from './AudioRecorder';

import type { MessageTemplateType, AudioTemplate, TextTemplate } from '@/types/whatsapp';

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  defaultTemplate?: MessageTemplateType;
  defaultVariables?: Record<string, string>;
  onSuccess?: () => void;
  onPhoneUpdate?: (newPhone: string) => Promise<void>;
}

interface ClientPreferences {
  default_text_template: MessageTemplateType | null;
  default_audio_template_id: string | null;
}

type AudioMode = 'none' | 'record' | 'upload' | 'template';
type SendMode = 'text' | 'audio' | 'both';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const TEMPLATE_OPTIONS = [
  {
    type: 'payment_reminder' as MessageTemplateType,
    label: 'Lembrete de Pagamento',
    icon: CreditCard,
    color: 'text-blue-400',
  },
  {
    type: 'payment_overdue' as MessageTemplateType,
    label: 'Pagamento em Atraso',
    icon: AlertTriangle,
    color: 'text-amber-400',
  },
  {
    type: 'task_completed' as MessageTemplateType,
    label: 'Tarefa Concluída',
    icon: ClipboardCheck,
    color: 'text-green-400',
  },
  {
    type: 'report_ready' as MessageTemplateType,
    label: 'Relatório Pronto',
    icon: BarChart3,
    color: 'text-purple-400',
  },
  {
    type: 'custom' as MessageTemplateType,
    label: 'Mensagem Personalizada',
    icon: Edit3,
    color: 'text-zinc-400',
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatPhoneDisplay(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) { return numbers; }
  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════

export function SendWhatsAppModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientPhone,
  defaultTemplate,
  defaultVariables = {},
  onSuccess,
  onPhoneUpdate,
}: SendWhatsAppModalProps) {
  const { sendMessage, sending, error, clearError } = useWhatsApp();
  const { user } = useAuth();

  // Refs
  const hasInitialized = useRef(false);
  const prevIsOpen = useRef(false);

  // Estados principais
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'compose' | 'success'>('compose');
  const [phone, setPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneChanged, setPhoneChanged] = useState(false);

  // Template de texto
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateType>('payment_reminder');
  const [message, setMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  // Preferências do cliente
  const [preferences, setPreferences] = useState<ClientPreferences | null>(null);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Modo de envio (texto, áudio, ou ambos)
  const [sendMode, setSendMode] = useState<SendMode>('text');

  // Templates de texto personalizados
  const [textTemplates, setTextTemplates] = useState<TextTemplate[]>([]);
  const [selectedTextTemplate, setSelectedTextTemplate] = useState<TextTemplate | null>(null);

  // Áudio
  const [audioMode, setAudioMode] = useState<AudioMode>('template');
  const [audioTemplates, setAudioTemplates] = useState<AudioTemplate[]>([]);
  const [selectedAudioTemplate, setSelectedAudioTemplate] = useState<AudioTemplate | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; duration: number } | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<{ url: string; duration: number } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isAudioDropdownOpen, setIsAudioDropdownOpen] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlayingUploadedAudio, setIsPlayingUploadedAudio] = useState(false);
  const [uploadedAudioElement, setUploadedAudioElement] = useState<HTMLAudioElement | null>(null);
  const [uploadedAudioProgress, setUploadedAudioProgress] = useState(0);
  const [uploadedAudioDuration, setUploadedAudioDuration] = useState(0);
  const [calculatedDurations, setCalculatedDurations] = useState<Record<string, number>>({});

  // Estados de envio
  const [sendingAll, setSendingAll] = useState(false);

  // Mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Carregar preferências do cliente
  const loadPreferences = useCallback(async () => {
    if (!clientId || !user?.id) { return; }
    try {
      const res = await fetch(`/api/whatsapp/client-preferences?clientId=${clientId}&userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
          // Aplicar preferências se não houver template padrão passado
          if (!defaultTemplate && data.preferences.default_text_template) {
            setSelectedTemplate(data.preferences.default_text_template);
          }
        }
      }
    } catch (err) {
      console.error('[Modal] Erro ao carregar preferências:', err);
    }
  }, [clientId, user?.id, defaultTemplate]);

  // Carregar templates de áudio
  const loadAudioTemplates = useCallback(async () => {
    if (!user?.id) { return; }
    try {
      const res = await fetch(`/api/whatsapp/audio-templates?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAudioTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('[Modal] Erro ao carregar áudios:', err);
    }
  }, [user?.id]);

  // Carregar templates de texto personalizados
  const loadTextTemplates = useCallback(async () => {
    if (!user?.id) { return; }
    try {
      const res = await fetch(`/api/whatsapp/text-templates?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTextTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('[Modal] Erro ao carregar templates de texto:', err);
    }
  }, [user?.id]);

  // Inicializar quando modal abre
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setStep('compose');
      setPhone(clientPhone || '');
      setSelectedTemplate(defaultTemplate || 'payment_reminder');
      setSelectedTextTemplate(null);
      setVariables({ nome: clientName || '', ...defaultVariables });
      setMessage('');
      setIsEditingPhone(false);
      setPhoneChanged(false);
      setSaveAsDefault(false);
      setSendMode('text');
      setAudioMode('template');
      setSelectedAudioTemplate(null);
      setRecordedAudio(null);
      setUploadedAudio(null);
      setPlayingAudioId(null);
      setIsAudioDropdownOpen(false);
      setAudioProgress(0);
      setAudioDuration(0);
      clearError();
      hasInitialized.current = true;
      loadPreferences();
      loadAudioTemplates();
      loadTextTemplates();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, clientPhone, clientName, defaultTemplate, defaultVariables, clearError, loadPreferences, loadAudioTemplates, loadTextTemplates, user?.id]);

  // Recarregar templates quando user ficar disponível (fix timing issues)
  useEffect(() => {
    if (isOpen && user?.id && audioTemplates.length === 0) {
      loadAudioTemplates();
    }
  }, [isOpen, user?.id, audioTemplates.length, loadAudioTemplates]);

  useEffect(() => {
    if (isOpen && user?.id && textTemplates.length === 0) {
      loadTextTemplates();
    }
  }, [isOpen, user?.id, textTemplates.length, loadTextTemplates]);

  // Atualizar preview quando template ou variáveis mudam
  useEffect(() => {
    // Se tiver um template personalizado selecionado, usar ele
    if (selectedTextTemplate && hasInitialized.current) {
      let preview = selectedTextTemplate.template;
      // Substituir variáveis
      Object.entries({ nome: clientName || variables.nome || '[Nome]', ...variables }).forEach(([key, value]) => {
        preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
      });
      setMessage(preview);
    } else if (selectedTemplate && selectedTemplate !== 'custom' && hasInitialized.current) {
      const preview = processTemplate(selectedTemplate, {
        nome: clientName || variables.nome || '[Nome]',
        ...variables,
      });
      setMessage(preview);
    }
  }, [selectedTemplate, selectedTextTemplate, variables, clientName]);

  // Selecionar template de áudio das preferências
  useEffect(() => {
    if (preferences?.default_audio_template_id && audioTemplates.length > 0) {
      const defaultAudio = audioTemplates.find(t => t.id === preferences.default_audio_template_id);
      if (defaultAudio) {
        setSelectedAudioTemplate(defaultAudio);
        setSendMode('both');
        setAudioMode('template');
      }
    }
  }, [preferences, audioTemplates]);

  // Calcular durações dos templates de áudio dinamicamente
  useEffect(() => {
    if (audioTemplates.length === 0) { return; }

    let cancelled = false;

    const calculateDurations = async () => {
      const durations: Record<string, number> = {};

      // Processar cada template sequencialmente para atualizar UI progressivamente
      for (const template of audioTemplates) {
        if (cancelled) { break; }

        // Se já tem duração válida no banco, usa ela
        if (template.duration_seconds && template.duration_seconds > 0) {
          durations[template.id] = template.duration_seconds;
          continue;
        }

        // Senão, calcula via fetch + blob para contornar CORS
        try {
          const response = await fetch(template.audio_url);
          if (!response.ok || cancelled) { continue; }

          const blob = await response.blob();
          if (cancelled) { continue; }

          const objectUrl = URL.createObjectURL(blob);

          const duration = await new Promise<number>((resolve) => {
            const audio = new Audio();
            let resolved = false;

            const handleDuration = () => {
              if (!resolved && audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                resolved = true;
                resolve(Math.round(audio.duration));
              }
            };

            audio.onloadedmetadata = handleDuration;
            audio.ondurationchange = handleDuration;
            audio.oncanplaythrough = handleDuration;

            audio.onerror = () => {
              if (!resolved) {
                resolved = true;
                resolve(0);
              }
            };

            audio.preload = 'auto';
            audio.src = objectUrl;
            audio.load();

            // Timeout fallback
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                // Tentar obter duração uma última vez
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                  resolve(Math.round(audio.duration));
                } else {
                  resolve(0);
                }
              }
            }, 3000);
          });

          URL.revokeObjectURL(objectUrl);

          if (duration > 0) {
            durations[template.id] = duration;
            // Atualizar estado progressivamente
            if (!cancelled) {
              setCalculatedDurations(prev => ({ ...prev, [template.id]: duration }));
            }
          }
        } catch {
          // Ignora erros
        }
      }

      // Atualizar estado final com todas as durações
      if (!cancelled) {
        setCalculatedDurations(durations);
      }
    };

    calculateDurations();

    return () => {
      cancelled = true;
    };
  }, [audioTemplates]);

  // Handler para salvar telefone
  const handleSavePhone = useCallback(async () => {
    if (!onPhoneUpdate || !phoneChanged) {
      setIsEditingPhone(false);
      return;
    }
    setSavingPhone(true);
    try {
      await onPhoneUpdate(phone);
      setPhoneChanged(false);
      setIsEditingPhone(false);
    } catch (err) {
      console.error('Erro ao salvar telefone:', err);
    } finally {
      setSavingPhone(false);
    }
  }, [phone, phoneChanged, onPhoneUpdate]);

  // Handler para mudar telefone
  const handlePhoneChange = useCallback((value: string) => {
    const newPhone = value.replace(/\D/g, '');
    setPhone(newPhone);
    setPhoneChanged(newPhone !== (clientPhone || '').replace(/\D/g, ''));
  }, [clientPhone]);

  // Handler para atualizar variáveis
  const updateVariable = useCallback((key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handler para salvar preferências
  const savePreferences = useCallback(async () => {
    if (!clientId || !user?.id) { return; }
    setSavingPreferences(true);
    try {
      await fetch('/api/whatsapp/client-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          userId: user.id,
          defaultTextTemplate: selectedTemplate,
          defaultAudioTemplateId: selectedAudioTemplate?.id || null,
        }),
      });
    } catch (err) {
      console.error('[Modal] Erro ao salvar preferências:', err);
    } finally {
      setSavingPreferences(false);
    }
  }, [clientId, user?.id, selectedTemplate, selectedAudioTemplate]);

  // Upload de áudio gravado
  const uploadRecordedAudio = useCallback(async (): Promise<string | null> => {
    if (!recordedAudio || !user?.id) { return null; }
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('audio', recordedAudio.blob);
    formData.append('mimeType', recordedAudio.blob.type);
    formData.append('duration', recordedAudio.duration.toString());

    try {
      const res = await fetch('/api/whatsapp/upload-audio', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.audioUrl;
      }
    } catch (err) {
      console.error('[Modal] Erro no upload:', err);
    }
    return null;
  }, [recordedAudio, user?.id]);

  // Handler de envio completo (texto, áudio, ou ambos)
  const handleSend = useCallback(async () => {
    const includeText = sendMode === 'text' || sendMode === 'both';
    const includeAudio = sendMode === 'audio' || sendMode === 'both';
    const hasAudioContent = selectedAudioTemplate || recordedAudio || uploadedAudio;

    // Validações
    if (!phone) { return; }
    if (includeText && !message.trim()) { return; }
    if (includeAudio && !hasAudioContent) { return; }

    setSendingAll(true);

    try {
      // 1. Enviar mensagem de texto (se incluído)
      if (includeText) {
        await sendMessage({
          phone,
          message: selectedTemplate === 'custom' ? message : undefined,
          templateType: selectedTemplate,
          variables: { nome: clientName || '', ...variables },
          clientId,
        });
      }

      // 2. Enviar áudio (se incluído)
      if (includeAudio && hasAudioContent) {
        let audioUrl: string | null = null;

        if (selectedAudioTemplate) {
          audioUrl = selectedAudioTemplate.audio_url;
        } else if (uploadedAudio) {
          audioUrl = uploadedAudio.url;
        } else if (recordedAudio) {
          audioUrl = await uploadRecordedAudio();
        }

        if (audioUrl) {
          await fetch('/api/whatsapp/send-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              audioUrl,
              clientId,
              templateId: selectedAudioTemplate?.id,
              userId: user?.id,
            }),
          });
        }
      }

      // 3. Salvar preferências se marcado
      if (saveAsDefault) {
        await savePreferences();
      }

      setStep('success');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('[Modal] Erro ao enviar:', err);
    } finally {
      setSendingAll(false);
    }
  }, [
    phone, message, selectedTemplate, variables, clientName, clientId,
    sendMode, selectedAudioTemplate, uploadedAudio, recordedAudio,
    saveAsDefault, sendMessage, uploadRecordedAudio, savePreferences,
    user?.id, onClose, onSuccess
  ]);

  // Play/Pause áudio com progresso
  const handlePlayAudio = useCallback((template: AudioTemplate) => {
    if (playingAudioId === template.id) {
      audioElement?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioElement) { audioElement.pause(); }
      const audio = new Audio(template.audio_url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration || template.duration_seconds || 0);
      };
      audio.ontimeupdate = () => {
        setAudioProgress(audio.currentTime);
      };
      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress(0);
      };
      audio.play();
      setAudioElement(audio);
      setPlayingAudioId(template.id);
    }
  }, [playingAudioId, audioElement]);

  // Play/Pause áudio de upload
  const handlePlayUploadedAudio = useCallback(() => {
    if (!uploadedAudio) { return; }

    if (isPlayingUploadedAudio) {
      uploadedAudioElement?.pause();
      setIsPlayingUploadedAudio(false);
    } else {
      if (uploadedAudioElement) { uploadedAudioElement.pause(); }
      const audio = new Audio(uploadedAudio.url);
      audio.onloadedmetadata = () => {
        setUploadedAudioDuration(audio.duration || uploadedAudio.duration || 0);
      };
      audio.ontimeupdate = () => {
        setUploadedAudioProgress(audio.currentTime);
      };
      audio.onended = () => {
        setIsPlayingUploadedAudio(false);
        setUploadedAudioProgress(0);
      };
      audio.play();
      setUploadedAudioElement(audio);
      setIsPlayingUploadedAudio(true);
    }
  }, [uploadedAudio, isPlayingUploadedAudio, uploadedAudioElement]);

  // Formatar duração do áudio
  const formatAudioDuration = useCallback((seconds: number): string => {
    if (!seconds || !isFinite(seconds)) { return '0:00'; }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Obter duração do template (calculada ou do banco)
  const getTemplateDuration = useCallback((template: AudioTemplate): number => {
    return calculatedDurations[template.id] || template.duration_seconds || 0;
  }, [calculatedDurations]);

  // Upload de arquivo
  const handleAudioFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) { return; }

    // Calcular duração do áudio antes do upload
    const getAudioDuration = (audioFile: File): Promise<number> => {
      return new Promise((resolve) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(audioFile);
        audio.src = objectUrl;
        audio.onloadedmetadata = () => {
          const duration = audio.duration;
          URL.revokeObjectURL(objectUrl);
          resolve(Math.round(duration));
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(0);
        };
      });
    };

    const duration = await getAudioDuration(file);

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('audio', file);
    formData.append('mimeType', file.type);
    formData.append('duration', duration.toString());

    try {
      const res = await fetch('/api/whatsapp/upload-audio', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadedAudio({ url: data.audioUrl, duration: data.duration || duration });
        setRecordedAudio(null);
        setSelectedAudioTemplate(null);
      }
    } catch (err) {
      console.error('[Modal] Erro no upload:', err);
    }
  }, [user?.id]);

  if (!isOpen || !mounted) { return null; }

  const selectedTemplateOption = TEMPLATE_OPTIONS.find(t => t.type === selectedTemplate);
  const hasAudio = selectedAudioTemplate || recordedAudio || uploadedAudio;
  const isSending = sending || sendingAll || savingPreferences;
  const includeText = sendMode === 'text' || sendMode === 'both';
  const includeAudioInSend = sendMode === 'audio' || sendMode === 'both';
  const canSend = phone && (
    (includeText && message.trim()) ||
    (includeAudioInSend && hasAudio)
  ) && !(includeText && !message.trim()) && !(includeAudioInSend && !hasAudio);

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose(); } }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {step === 'success' ? 'Enviado!' : 'Enviar WhatsApp'}
              </h2>
              {clientName && step !== 'success' && (
                <p className="text-sm text-zinc-400">Para: {clientName}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {step === 'compose' && (
            <>
              {/* Telefone */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-medium">Telefone</span>
                  </div>
                  {!isEditingPhone ? (
                    <button onClick={() => setIsEditingPhone(true)} className="p-1 rounded hover:bg-white/10 transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
                    </button>
                  ) : (
                    <button onClick={handleSavePhone} disabled={savingPhone} className="p-1 rounded hover:bg-white/10 transition-colors">
                      {savingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-green-400" />}
                    </button>
                  )}
                </div>
                {isEditingPhone ? (
                  <input
                    type="tel"
                    value={formatPhoneDisplay(phone)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    autoFocus
                    className="w-full mt-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                ) : (
                  <p className="mt-1 text-white font-medium">
                    {phone ? formatPhoneDisplay(phone) : <span className="text-zinc-500 italic">Nenhum telefone</span>}
                  </p>
                )}
              </div>

              {/* Toggle de Modo de Envio */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  onClick={() => setSendMode('text')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    sendMode === 'text' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  Texto
                </button>
                <button
                  onClick={() => setSendMode('audio')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    sendMode === 'audio' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Mic className="w-4 h-4" />
                  Áudio
                </button>
                <button
                  onClick={() => setSendMode('both')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    sendMode === 'both' ? 'bg-green-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  Ambos
                </button>
              </div>

              {/* === SEÇÃO DE TEXTO === */}
              {includeText && (
                <>
                  {/* Seleção de Template */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Template de Mensagem</label>
                <div className="relative">
                  <button
                    onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {selectedTextTemplate ? (
                        <>
                          <Star className="w-4 h-4 text-amber-400" />
                          <span className="text-sm text-white">{selectedTextTemplate.name}</span>
                          <span className="text-xs text-zinc-500">(Personalizado)</span>
                        </>
                      ) : selectedTemplateOption ? (
                        <>
                          <selectedTemplateOption.icon className={cn('w-4 h-4', selectedTemplateOption.color)} />
                          <span className="text-sm text-white">{selectedTemplateOption.label}</span>
                        </>
                      ) : null}
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform', isTemplateDropdownOpen && 'rotate-180')} />
                  </button>

                  {isTemplateDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-10 max-h-72 overflow-y-auto">
                      {/* Templates Padrão */}
                      <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Templates Padrão
                      </div>
                      {TEMPLATE_OPTIONS.map((option) => (
                        <button
                          key={option.type}
                          onClick={() => {
                            setSelectedTemplate(option.type);
                            setSelectedTextTemplate(null);
                            setIsTemplateDropdownOpen(false);
                            if (option.type === 'custom') { setMessage(''); }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 transition-colors',
                            !selectedTextTemplate && selectedTemplate === option.type && 'bg-green-500/10'
                          )}
                        >
                          <option.icon className={cn('w-4 h-4', option.color)} />
                          <span className="text-sm text-white">{option.label}</span>
                          {!selectedTextTemplate && selectedTemplate === option.type && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                        </button>
                      ))}

                      {/* Templates Personalizados */}
                      {textTemplates.length > 0 && (
                        <>
                          <div className="border-t border-white/10 my-1" />
                          <div className="px-3 py-1.5 text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Star className="w-3 h-3" />
                            Seus Templates
                          </div>
                          {textTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => {
                                setSelectedTextTemplate(template);
                                setSelectedTemplate('custom');
                                setIsTemplateDropdownOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 transition-colors',
                                selectedTextTemplate?.id === template.id && 'bg-amber-500/10'
                              )}
                            >
                              <Star className={cn('w-4 h-4', template.is_favorite ? 'text-amber-400' : 'text-zinc-500')} />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-white block truncate">{template.name}</span>
                                {template.description && (
                                  <span className="text-xs text-zinc-500 block truncate">{template.description}</span>
                                )}
                              </div>
                              {selectedTextTemplate?.id === template.id && <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Campos de variáveis específicos */}
              {(selectedTemplate === 'payment_reminder' || selectedTemplate === 'payment_overdue') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Vencimento</label>
                    <input
                      type="text"
                      value={variables.data_vencimento || ''}
                      onChange={(e) => updateVariable('data_vencimento', e.target.value)}
                      placeholder="10/01/2025"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Valor (R$)</label>
                    <input
                      type="text"
                      value={variables.valor || ''}
                      onChange={(e) => updateVariable('valor', e.target.value)}
                      placeholder="1.500,00"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    />
                  </div>
                  {selectedTemplate === 'payment_overdue' && (
                    <div className="col-span-2">
                      <label className="block text-xs text-zinc-400 mb-1">Dias em Atraso</label>
                      <input
                        type="text"
                        value={variables.dias_atraso || ''}
                        onChange={(e) => updateVariable('dias_atraso', e.target.value)}
                        placeholder="5"
                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      />
                    </div>
                  )}
                </div>
              )}

                  {/* Preview da mensagem */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                      {selectedTemplate === 'custom' ? 'Mensagem' : 'Preview da Mensagem'}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      readOnly={selectedTemplate !== 'custom'}
                      placeholder="Digite sua mensagem..."
                      className={cn(
                        'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50',
                        selectedTemplate !== 'custom' && 'opacity-70 cursor-default'
                      )}
                    />
                  </div>
                </>
              )}

              {/* === SEÇÃO DE ÁUDIO === */}
              {includeAudioInSend && (
                <div className="space-y-3">
                  {/* Dropdown de Template de Áudio */}
                  {audioTemplates.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Template de Áudio</label>
                      <div className="relative">
                        <button
                          onClick={() => setIsAudioDropdownOpen(!isAudioDropdownOpen)}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Mic className={cn('w-4 h-4', selectedAudioTemplate ? 'text-green-400' : 'text-zinc-400')} />
                            <span className="text-sm text-white">
                              {selectedAudioTemplate ? selectedAudioTemplate.name : 'Selecionar template...'}
                            </span>
                            {selectedAudioTemplate && (
                              <span className="text-xs text-zinc-500">
                                ({formatAudioDuration(getTemplateDuration(selectedAudioTemplate))})
                              </span>
                            )}
                          </div>
                          <ChevronDown className={cn('w-4 h-4 text-zinc-400 transition-transform', isAudioDropdownOpen && 'rotate-180')} />
                        </button>

                        {isAudioDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                            <button
                              onClick={() => {
                                setSelectedAudioTemplate(null);
                                setIsAudioDropdownOpen(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 transition-colors',
                                !selectedAudioTemplate && 'bg-green-500/10'
                              )}
                            >
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Mic className="w-4 h-4 text-zinc-400" />
                              </div>
                              <span className="text-sm text-zinc-400">Nenhum template</span>
                            </button>
                            {audioTemplates.map((template) => (
                              <button
                                key={template.id}
                                onClick={() => {
                                  setSelectedAudioTemplate(template);
                                  setRecordedAudio(null);
                                  setUploadedAudio(null);
                                  setAudioMode('template');
                                  setIsAudioDropdownOpen(false);
                                }}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 transition-colors',
                                  selectedAudioTemplate?.id === template.id && 'bg-green-500/10'
                                )}
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePlayAudio(template); }}
                                  className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                                    playingAudioId === template.id ? 'bg-green-600 text-white' : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                                  )}
                                >
                                  {playingAudioId === template.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">{template.name}</p>
                                  <p className="text-xs text-zinc-500">{formatAudioDuration(getTemplateDuration(template))}</p>
                                </div>
                                {selectedAudioTemplate?.id === template.id && <Check className="w-4 h-4 text-green-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preview do áudio selecionado */}
                  {selectedAudioTemplate && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handlePlayAudio(selectedAudioTemplate)}
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                            playingAudioId === selectedAudioTemplate.id
                              ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                              : 'bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white'
                          )}
                        >
                          {playingAudioId === selectedAudioTemplate.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{selectedAudioTemplate.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all duration-100"
                                style={{
                                  width: playingAudioId === selectedAudioTemplate.id && audioDuration > 0
                                    ? `${(audioProgress / audioDuration) * 100}%`
                                    : '0%'
                                }}
                              />
                            </div>
                            <span className="text-xs text-zinc-400 tabular-nums">
                              {playingAudioId === selectedAudioTemplate.id
                                ? formatAudioDuration(audioProgress)
                                : '0:00'} / {formatAudioDuration(audioDuration || getTemplateDuration(selectedAudioTemplate))}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedAudioTemplate(null)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Alternativas: Gravar ou Upload */}
                  {!selectedAudioTemplate && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAudioMode('record')}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm',
                            audioMode === 'record'
                              ? 'bg-green-600/20 border-green-500/50 text-green-400'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                          )}
                        >
                          <Mic className="w-4 h-4" />
                          Gravar
                        </button>
                        <button
                          onClick={() => setAudioMode('upload')}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all text-sm',
                            audioMode === 'upload'
                              ? 'bg-green-600/20 border-green-500/50 text-green-400'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                          )}
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </button>
                      </div>

                      {/* Gravar */}
                      {audioMode === 'record' && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <AudioRecorder
                            onRecordingComplete={(blob, duration) => {
                              setRecordedAudio({ blob, duration });
                              setUploadedAudio(null);
                              setSelectedAudioTemplate(null);
                            }}
                            onCancel={() => setRecordedAudio(null)}
                            maxDuration={120}
                            disabled={!phone}
                          />
                          {recordedAudio && (
                            <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                              <div className="flex items-center gap-2 text-green-400">
                                <Check className="w-4 h-4" />
                                <span className="text-sm">Áudio gravado ({Math.round(recordedAudio.duration)}s)</span>
                              </div>
                              <button
                                onClick={() => setRecordedAudio(null)}
                                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Upload */}
                      {audioMode === 'upload' && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          {uploadedAudio ? (
                            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={handlePlayUploadedAudio}
                                  className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
                                    isPlayingUploadedAudio
                                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                                      : 'bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white'
                                  )}
                                >
                                  {isPlayingUploadedAudio ? (
                                    <Pause className="w-5 h-5" />
                                  ) : (
                                    <Play className="w-5 h-5 ml-0.5" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white">Áudio carregado</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-green-500 transition-all duration-100"
                                        style={{
                                          width: isPlayingUploadedAudio && uploadedAudioDuration > 0
                                            ? `${(uploadedAudioProgress / uploadedAudioDuration) * 100}%`
                                            : '0%'
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                                      {isPlayingUploadedAudio
                                        ? formatAudioDuration(uploadedAudioProgress)
                                        : '0:00'} / {formatAudioDuration(uploadedAudioDuration || uploadedAudio.duration)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (isPlayingUploadedAudio) {
                                      uploadedAudioElement?.pause();
                                      setIsPlayingUploadedAudio(false);
                                    }
                                    setUploadedAudio(null);
                                    setUploadedAudioProgress(0);
                                    setUploadedAudioDuration(0);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="cursor-pointer block">
                              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-green-500/50 hover:bg-green-500/5 transition-all">
                                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                                <p className="text-sm text-white mb-1">Clique para selecionar</p>
                                <p className="text-xs text-zinc-500">MP3, WAV, OGG ou M4A</p>
                              </div>
                              <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aviso se não tem áudio */}
                  {!hasAudio && audioTemplates.length === 0 && audioMode === 'template' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                      <p>Você não tem templates de áudio salvos.</p>
                      <p className="text-xs text-amber-400/70 mt-1">Grave um áudio ou faça upload para continuar.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Checkbox salvar como padrão */}
              {clientId && (
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <button
                    onClick={() => setSaveAsDefault(!saveAsDefault)}
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded border transition-colors',
                      saveAsDefault ? 'bg-green-500 border-green-500' : 'border-white/30'
                    )}
                  >
                    {saveAsDefault && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-white">Usar como padrão</span>
                    </div>
                    <p className="text-xs text-zinc-500">Salvar template para este cliente</p>
                  </div>
                </label>
              )}
            </>
          )}

          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Enviado com Sucesso!</h3>
              <p className="text-sm text-zinc-400">
                {sendMode === 'both' ? 'Mensagem e áudio enviados' : sendMode === 'audio' ? 'Áudio enviado' : 'Mensagem enviada'} para {clientName || 'o cliente'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'compose' && (
          <div className="flex justify-end gap-2 p-4 border-t border-white/10">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 rounded-lg bg-white/5 text-zinc-400 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !canSend}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  {sendMode === 'audio' ? <Mic className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>
                    {sendMode === 'both' ? 'Enviar Tudo' : sendMode === 'audio' ? 'Enviar Áudio' : 'Enviar'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
