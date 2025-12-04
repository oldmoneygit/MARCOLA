/**
 * @file page.tsx
 * @description Página de gestão de templates WhatsApp
 * @module app/(dashboard)/whatsapp
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Mic,
  Plus,
  Sparkles,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Play,
  Pause,
  Upload,
  Loader2,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AudioRecorder } from '@/components/whatsapp';
import { useAuth } from '@/hooks/useAuth';
import type { TextTemplate, AudioTemplate, TemplateCategory } from '@/types/whatsapp';

// ═══════════════════════════════════════════════════════════════
// TIPOS LOCAIS
// ═══════════════════════════════════════════════════════════════

type TabType = 'text' | 'audio';

interface DropdownState {
  id: string | null;
  type: 'text' | 'audio' | null;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const CATEGORIES: { value: TemplateCategory; label: string; color: string }[] = [
  { value: 'payment', label: 'Pagamento', color: 'bg-green-500/20 text-green-400' },
  { value: 'followup', label: 'Follow-up', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'onboarding', label: 'Onboarding', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'report', label: 'Relatório', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'custom', label: 'Personalizado', color: 'bg-zinc-500/20 text-zinc-400' },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  // Templates
  const [textTemplates, setTextTemplates] = useState<TextTemplate[]>([]);
  const [audioTemplates, setAudioTemplates] = useState<AudioTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [showTextModal, setShowTextModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TextTemplate | null>(null);

  // Estados de dropdown
  const [dropdown, setDropdown] = useState<DropdownState>({ id: null, type: null });

  // Player de áudio - apenas controla qual áudio está tocando (cards gerenciam seus próprios elementos)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // CARREGAR TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  const loadTemplates = useCallback(async () => {
    if (!user?.id) {return;}

    try {
      setLoading(true);

      const [textRes, audioRes] = await Promise.all([
        fetch(`/api/whatsapp/text-templates?userId=${user.id}`),
        fetch(`/api/whatsapp/audio-templates?userId=${user.id}`),
      ]);

      if (textRes.ok) {
        const textData = await textRes.json();
        setTextTemplates(textData.templates || []);
      }

      if (audioRes.ok) {
        const audioData = await audioRes.json();
        setAudioTemplates(audioData.templates || []);
      }
    } catch (error) {
      console.error('[WhatsApp] Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ═══════════════════════════════════════════════════════════════
  // AÇÕES DE TEMPLATE DE TEXTO
  // ═══════════════════════════════════════════════════════════════

  const handleDeleteTextTemplate = async (id: string) => {
    if (!user?.id || !confirm('Tem certeza que deseja excluir este template?')) {return;}

    try {
      const res = await fetch(`/api/whatsapp/text-templates?id=${id}&userId=${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTextTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('[WhatsApp] Erro ao deletar template:', error);
    }

    setDropdown({ id: null, type: null });
  };

  const handleToggleFavorite = async (template: TextTemplate) => {
    if (!user?.id) {return;}

    try {
      const res = await fetch('/api/whatsapp/text-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          userId: user.id,
          is_favorite: !template.is_favorite,
        }),
      });

      if (res.ok) {
        setTextTemplates(prev =>
          prev.map(t =>
            t.id === template.id ? { ...t, is_favorite: !t.is_favorite } : t
          )
        );
      }
    } catch (error) {
      console.error('[WhatsApp] Erro ao favoritar:', error);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // AÇÕES DE TEMPLATE DE ÁUDIO
  // ═══════════════════════════════════════════════════════════════

  const handleDeleteAudioTemplate = async (id: string) => {
    if (!user?.id || !confirm('Tem certeza que deseja excluir este template de áudio?')) {return;}

    try {
      const res = await fetch(`/api/whatsapp/audio-templates?id=${id}&userId=${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAudioTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('[WhatsApp] Erro ao deletar template de áudio:', error);
    }

    setDropdown({ id: null, type: null });
  };

  const handlePlayAudio = (template: AudioTemplate) => {
    if (playingAudioId === template.id) {
      // Toggle off - cada card gerencia seu próprio áudio
      setPlayingAudioId(null);
    } else {
      // Trocar para novo áudio - o card anterior vai pausar automaticamente
      setPlayingAudioId(template.id);
    }
  };

  const handleAudioEnded = () => {
    setPlayingAudioId(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTROS
  // ═══════════════════════════════════════════════════════════════

  const filteredTextTemplates = textTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.template.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredAudioTemplates = audioTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.transcription || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <DashboardLayout
        title="WhatsApp Templates"
        subtitle="Gerencie seus templates de mensagens e áudios"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const headerActions = activeTab === 'text' ? (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowAIModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span>Gerar com IA</span>
      </button>
      <button
        onClick={() => {
          setEditingTemplate(null);
          setShowTextModal(true);
        }}
        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Novo Template</span>
      </button>
    </div>
  ) : (
    <button
      onClick={() => setShowAudioModal(true)}
      className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
    >
      <Upload className="w-4 h-4" />
      <span>Upload Áudio</span>
    </button>
  );

  return (
    <DashboardLayout
      title="WhatsApp Templates"
      subtitle="Gerencie seus templates de mensagens e áudios"
      headerActions={headerActions}
    >
      <div className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'text'
              ? 'bg-violet-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Texto ({textTemplates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'audio'
              ? 'bg-violet-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Áudio ({audioTemplates.length})</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Categoria */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500"
        >
          <option value="all">Todas as categorias</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Lista de Templates de Texto */}
      {activeTab === 'text' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTextTemplates.length === 0 ? (
            <GlassCard className="col-span-full p-8 text-center">
              <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">Nenhum template encontrado</h3>
              <p className="text-zinc-400 text-sm">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Crie seu primeiro template de mensagem'}
              </p>
            </GlassCard>
          ) : (
            filteredTextTemplates.map(template => (
              <TextTemplateCard
                key={template.id}
                template={template}
                onEdit={() => {
                  setEditingTemplate(template);
                  setShowTextModal(true);
                }}
                onDelete={() => handleDeleteTextTemplate(template.id)}
                onToggleFavorite={() => handleToggleFavorite(template)}
                isDropdownOpen={dropdown.id === template.id && dropdown.type === 'text'}
                onToggleDropdown={() =>
                  setDropdown(prev =>
                    prev.id === template.id && prev.type === 'text'
                      ? { id: null, type: null }
                      : { id: template.id, type: 'text' }
                  )
                }
              />
            ))
          )}
        </div>
      )}

      {/* Lista de Templates de Áudio */}
      {activeTab === 'audio' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAudioTemplates.length === 0 ? (
            <GlassCard className="col-span-full p-8 text-center">
              <Mic className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">Nenhum áudio encontrado</h3>
              <p className="text-zinc-400 text-sm">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Grave ou faça upload do seu primeiro áudio'}
              </p>
            </GlassCard>
          ) : (
            filteredAudioTemplates.map(template => (
              <AudioTemplateCard
                key={template.id}
                template={template}
                isPlaying={playingAudioId === template.id}
                onPlay={() => handlePlayAudio(template)}
                onEnded={handleAudioEnded}
                onDelete={() => handleDeleteAudioTemplate(template.id)}
                isDropdownOpen={dropdown.id === template.id && dropdown.type === 'audio'}
                onToggleDropdown={() =>
                  setDropdown(prev =>
                    prev.id === template.id && prev.type === 'audio'
                      ? { id: null, type: null }
                      : { id: template.id, type: 'audio' }
                  )
                }
              />
            ))
          )}
        </div>
      )}

      {/* Modais */}
      {showTextModal && (
        <TextTemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowTextModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            loadTemplates();
            setShowTextModal(false);
            setEditingTemplate(null);
          }}
          userId={user?.id || ''}
        />
      )}

      {showAudioModal && (
        <AudioUploadModal
          onClose={() => setShowAudioModal(false)}
          onSave={() => {
            loadTemplates();
            setShowAudioModal(false);
          }}
          userId={user?.id || ''}
        />
      )}

      {showAIModal && (
        <AIGenerateModal
          onClose={() => setShowAIModal(false)}
          onGenerated={(template) => {
            setTextTemplates(prev => [template, ...prev]);
            setShowAIModal(false);
          }}
          userId={user?.id || ''}
        />
      )}
      </div>
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════

interface TextTemplateCardProps {
  template: TextTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
}

function TextTemplateCard({
  template,
  onEdit,
  onDelete,
  onToggleFavorite,
  isDropdownOpen,
  onToggleDropdown,
}: TextTemplateCardProps) {
  const [copied, setCopied] = useState(false);
  const category = CATEGORIES.find(c => c.value === template.category);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(template.template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className="p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {template.is_favorite && (
            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" />
          )}
          <h3 className="font-medium text-white truncate">{template.name}</h3>
        </div>

        <div className="relative">
          <button
            onClick={onToggleDropdown}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl py-1 min-w-[140px] z-10">
              <button
                onClick={onEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={onToggleFavorite}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"
              >
                {template.is_favorite ? (
                  <>
                    <StarOff className="w-4 h-4" />
                    Remover favorito
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    Favoritar
                  </>
                )}
              </button>
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/10"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categoria e badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {category && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}>
            {category.label}
          </span>
        )}
        {template.is_ai_generated && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            IA
          </span>
        )}
      </div>

      {/* Preview do template */}
      <div className="text-sm text-zinc-400 line-clamp-3 whitespace-pre-wrap">
        {template.template}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3 h-3" />
          <span>{template.usage_count} usos</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
    </GlassCard>
  );
}

interface AudioTemplateCardProps {
  template: AudioTemplate;
  isPlaying: boolean;
  onPlay: () => void;
  onEnded: () => void;
  onDelete: () => void;
  isDropdownOpen: boolean;
  onToggleDropdown: () => void;
}

function AudioTemplateCard({
  template,
  isPlaying,
  onPlay,
  onEnded,
  onDelete,
  isDropdownOpen,
  onToggleDropdown,
}: AudioTemplateCardProps) {
  const category = CATEGORIES.find(c => c.value === template.category);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(template.duration_seconds || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [durationLoaded, setDurationLoaded] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);

  // Formata tempo em MM:SS
  const formatTime = (seconds: number) => {
    // Tratar valores inválidos
    if (!seconds || !isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular duração dinamicamente se não estiver disponível
  useEffect(() => {
    if (durationLoaded || (template.duration_seconds && template.duration_seconds > 0)) {
      if (template.duration_seconds && template.duration_seconds > 0) {
        setDuration(template.duration_seconds);
        setDurationLoaded(true);
      }
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    // Carregar áudio via fetch para contornar CORS
    const loadDuration = async () => {
      try {
        // Fetch o áudio como blob
        const response = await fetch(template.audio_url);
        if (!response.ok || cancelled) { return; }

        const blob = await response.blob();
        if (cancelled) { return; }

        // Criar Object URL do blob
        objectUrl = URL.createObjectURL(blob);

        // Criar elemento de áudio com o blob
        const tempAudio = new Audio();

        tempAudio.onloadedmetadata = () => {
          if (!cancelled && isFinite(tempAudio.duration) && tempAudio.duration > 0) {
            setDuration(Math.round(tempAudio.duration));
            setDurationLoaded(true);
          }
        };

        tempAudio.ondurationchange = () => {
          if (!cancelled && isFinite(tempAudio.duration) && tempAudio.duration > 0) {
            setDuration(Math.round(tempAudio.duration));
            setDurationLoaded(true);
          }
        };

        tempAudio.preload = 'auto';
        tempAudio.src = objectUrl;
        tempAudio.load();
      } catch (err) {
        console.error('[AudioCard] Erro ao calcular duração:', err);
      }
    };

    loadDuration();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [template.audio_url, template.duration_seconds, durationLoaded]);

  // Criar e gerenciar elemento de áudio para playback
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      // Usar duração do áudio se válida
      const audioDuration = audio.duration;
      if (isFinite(audioDuration) && audioDuration > 0) {
        setDuration(Math.round(audioDuration));
        setDurationLoaded(true);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime >= 0) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setCurrentTime(0);
      onEnded();
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      // Tentar obter duração novamente quando o áudio estiver pronto
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
        setDurationLoaded(true);
      }
    };

    const handleDurationChange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
        setDurationLoaded(true);
      }
    };

    const handleError = () => {
      setIsLoading(false);
      console.error('[AudioCard] Erro ao carregar áudio:', template.audio_url);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('error', handleError);

    // Configurar e carregar áudio - usar preload auto para melhor suporte
    audio.preload = 'auto';
    audio.src = template.audio_url;
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [template.audio_url, onEnded]);

  // Controlar play/pause baseado no estado externo
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      setIsLoading(true);
      audio.play()
        .then(() => setIsLoading(false))
        .catch((err) => {
          console.error('[AudioCard] Erro ao reproduzir:', err);
          setIsLoading(false);
        });
    } else {
      audio.pause();
      setIsLoading(false);
    }
  }, [isPlaying]);

  // Calcular progresso em porcentagem
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Clique na barra de progresso para seek
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) {
      return;
    }

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Gerar barras de waveform pseudo-aleatórias (baseadas no id do template para consistência)
  const waveformBars = React.useMemo(() => {
    const seed = template.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 32 }, (_, i) => {
      const height = 20 + ((seed * (i + 1) * 7) % 60);
      return height;
    });
  }, [template.id]);

  return (
    <GlassCard className="p-4 flex flex-col gap-3">
      {/* Header com nome e menu */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{template.name}</h3>
          {category && (
            <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${category.color}`}>
              {category.label}
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={onToggleDropdown}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-white/10 rounded-xl shadow-xl py-1 min-w-[140px] z-10">
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/10"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Player visual com waveform */}
      <div className="bg-black/20 rounded-xl p-3 space-y-3">
        {/* Waveform / Progress */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="relative h-12 cursor-pointer group"
        >
          {/* Barras de waveform */}
          <div className="absolute inset-0 flex items-center justify-between gap-[2px]">
            {waveformBars.map((height, i) => {
              const barProgress = (i / waveformBars.length) * 100;
              const isActive = barProgress <= progress;
              const isCurrent = Math.abs(barProgress - progress) < (100 / waveformBars.length);

              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-150 ${
                    isActive
                      ? 'bg-violet-500'
                      : 'bg-white/20 group-hover:bg-white/30'
                  } ${isCurrent && isPlaying ? 'animate-pulse' : ''}`}
                  style={{
                    height: `${height}%`,
                    opacity: isActive ? 1 : 0.5
                  }}
                />
              );
            })}
          </div>

          {/* Overlay de loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Controles e tempo */}
        <div className="flex items-center gap-3">
          {/* Botão Play/Pause */}
          <button
            onClick={onPlay}
            disabled={isLoading}
            className={`p-2.5 rounded-full transition-all ${
              isPlaying
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white'
            } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {/* Barra de progresso linear */}
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Tempo */}
          <div className="text-xs text-zinc-400 tabular-nums min-w-[70px] text-right">
            <span className={isPlaying ? 'text-white' : ''}>
              {formatTime(currentTime)}
            </span>
            <span className="text-zinc-600 mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Transcrição */}
      {template.transcription && (
        <p className="text-sm text-zinc-400 line-clamp-2">
          {template.transcription}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3 h-3" />
          <span>{template.usage_count} usos</span>
        </div>
        <span className="text-xs text-zinc-500">
          {template.file_size_bytes
            ? `${(template.file_size_bytes / 1024).toFixed(1)} KB`
            : ''}
        </span>
      </div>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODAIS
// ═══════════════════════════════════════════════════════════════

interface TextTemplateModalProps {
  template: TextTemplate | null;
  onClose: () => void;
  onSave: () => void;
  userId: string;
}

function TextTemplateModal({ template, onClose, onSave, userId }: TextTemplateModalProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState<TemplateCategory>(template?.category || 'custom');
  const [templateText, setTemplateText] = useState(template?.template || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !templateText) {return;}

    try {
      setSaving(true);

      const method = template ? 'PUT' : 'POST';
      const body = template
        ? { id: template.id, userId, name, description, category, template: templateText }
        : { userId, name, description, category, template: templateText };

      const res = await fetch('/api/whatsapp/text-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSave();
      }
    } catch (error) {
      console.error('[Modal] Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {template ? 'Editar Template' : 'Novo Template'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lembrete de Pagamento"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do template"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">
                Mensagem
                <span className="text-zinc-600 ml-2">Use {'{variavel}'} para dados dinâmicos</span>
              </label>
              <textarea
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
                placeholder="Olá {nome}! 👋&#10;&#10;Aqui está sua mensagem..."
                rows={6}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !name || !templateText}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface AudioUploadModalProps {
  onClose: () => void;
  onSave: () => void;
  userId: string;
}

function AudioUploadModal({ onClose, onSave, userId }: AudioUploadModalProps) {
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    // Calcular duração do áudio antes de definir o blob
    const getAudioDuration = (audioFile: File): Promise<number> => {
      return new Promise((resolve) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(audioFile);
        audio.src = objectUrl;
        audio.onloadedmetadata = () => {
          const duration = Math.floor(audio.duration);
          URL.revokeObjectURL(objectUrl);
          resolve(duration);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(0);
        };
      });
    };

    const duration = await getAudioDuration(file);
    setAudioDuration(duration);
    setAudioBlob(file);
  };

  const handleSave = async () => {
    if (!name || !audioBlob) {return;}

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('audio', audioBlob);
      formData.append('mimeType', audioBlob.type);
      formData.append('duration', audioDuration.toString());
      formData.append('saveAsTemplate', 'true');
      formData.append('templateName', name);
      formData.append('templateCategory', category);

      const res = await fetch('/api/whatsapp/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onSave();
      }
    } catch (error) {
      console.error('[AudioModal] Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Novo Template de Áudio</h2>

          {/* Tabs Gravar/Upload */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
            <button
              onClick={() => setMode('record')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mode === 'record'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Gravar</span>
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mode === 'upload'
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nome do Template</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Follow-up Vendas"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Área de gravação/upload */}
            <div className="bg-white/5 rounded-xl p-4">
              {mode === 'record' ? (
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onCancel={() => {
                    setAudioBlob(null);
                    setAudioDuration(0);
                  }}
                  maxDuration={120}
                />
              ) : (
                <div className="text-center">
                  {audioBlob ? (
                    <div className="space-y-3">
                      <audio
                        controls
                        src={URL.createObjectURL(audioBlob)}
                        className="w-full"
                      />
                      <button
                        onClick={() => {
                          setAudioBlob(null);
                          setAudioDuration(0);
                        }}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remover áudio
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-violet-500 transition-colors">
                        <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
                        <p className="text-zinc-400">
                          Clique para selecionar um arquivo de áudio
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          MP3, WAV, OGG, WEBM (máx. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name || !audioBlob}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Template'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AIGenerateModalProps {
  onClose: () => void;
  onGenerated: (template: TextTemplate) => void;
  userId: string;
}

function AIGenerateModal({ onClose, onGenerated, userId }: AIGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [generating, setGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<{
    name: string;
    description: string;
    template: string;
    variables: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) {return;}

    try {
      setGenerating(true);
      setGeneratedTemplate(null);

      const res = await fetch('/api/whatsapp/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, category }),
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedTemplate({
          name: data.name,
          description: data.description,
          template: data.template,
          variables: data.variables,
        });
      }
    } catch (error) {
      console.error('[AI Modal] Erro ao gerar:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedTemplate) {return;}

    try {
      setSaving(true);

      const res = await fetch('/api/whatsapp/text-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: generatedTemplate.name,
          description: generatedTemplate.description,
          category,
          template: generatedTemplate.template,
          variables: generatedTemplate.variables,
          is_ai_generated: true,
          ai_prompt: prompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onGenerated(data.template);
      }
    } catch (error) {
      console.error('[AI Modal] Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-violet-600/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Gerar com IA</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">O que você precisa?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Um lembrete amigável de pagamento para cliente que está com fatura atrasada há 3 dias"
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {!generatedTemplate ? (
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Gerar Template</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white mb-1">
                    {generatedTemplate.name}
                  </h4>
                  <p className="text-xs text-zinc-500 mb-3">
                    {generatedTemplate.description}
                  </p>
                  <div className="text-sm text-zinc-300 whitespace-pre-wrap bg-black/20 rounded-lg p-3">
                    {generatedTemplate.template}
                  </div>
                  {generatedTemplate.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {generatedTemplate.variables.map(v => (
                        <span
                          key={v}
                          className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded"
                        >
                          {'{' + v + '}'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setGeneratedTemplate(null)}
                    className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  >
                    Gerar Outro
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar Template'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
