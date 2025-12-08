/**
 * @file SettingsPageContent.tsx
 * @description Conteúdo principal da página de configurações
 * @module components/settings
 */

'use client';

import { useCallback, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  Globe,
  Loader2,
  Moon,
  Palette,
  Shield,
  Smartphone,
} from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface SettingToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Toggle switch para configurações
 */
function SettingToggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-violet-600' : 'bg-zinc-700',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

interface SettingOptionProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Seletor de opções para configurações
 */
function SettingOption({ label, value, options, onChange, disabled = false }: SettingOptionProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm font-medium text-white">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'px-3 py-1.5 rounded-lg',
          'bg-white/5 border border-white/10',
          'text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-violet-500/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-zinc-900">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Conteúdo principal da página de configurações
 */
export function SettingsPageContent() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    // Notificações
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    paymentReminders: true,
    weeklyReport: false,

    // Aparência
    theme: 'dark',
    language: 'pt-BR',
    compactMode: false,

    // Privacidade
    showOnlineStatus: true,
    shareAnalytics: true,
  });

  const handleToggle = useCallback((key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleOptionChange = useCallback((key: keyof typeof settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Simular salvamento (em breve integração com backend)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Salvar no localStorage por enquanto
      localStorage.setItem('marcola_settings', JSON.stringify(settings));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[SettingsPageContent] Save error:', err);
      setSaveError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
            'bg-gradient-to-r from-violet-600 to-violet-500 text-white',
            'hover:from-violet-500 hover:to-violet-400',
            'shadow-lg shadow-violet-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center gap-2'
          )}
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Check className="w-5 h-5" />
          <p>Configurações salvas com sucesso!</p>
        </div>
      )}

      {/* Error message */}
      {saveError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{saveError}</p>
        </div>
      )}

      {/* Notifications */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Notificações</h2>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <SettingToggle
            label="Notificações por Email"
            description="Receba atualizações importantes por email"
            enabled={settings.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
          />
          <SettingToggle
            label="Notificações Push"
            description="Receba notificações no navegador"
            enabled={settings.pushNotifications}
            onChange={() => handleToggle('pushNotifications')}
            disabled
          />
          <SettingToggle
            label="Lembretes de Tarefas"
            description="Seja notificado sobre tarefas próximas do vencimento"
            enabled={settings.taskReminders}
            onChange={() => handleToggle('taskReminders')}
          />
          <SettingToggle
            label="Lembretes de Pagamento"
            description="Receba alertas sobre cobranças pendentes"
            enabled={settings.paymentReminders}
            onChange={() => handleToggle('paymentReminders')}
          />
          <SettingToggle
            label="Relatório Semanal"
            description="Receba um resumo semanal por email"
            enabled={settings.weeklyReport}
            onChange={() => handleToggle('weeklyReport')}
          />
        </div>
      </GlassCard>

      {/* Appearance */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Aparência</h2>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <SettingOption
            label="Tema"
            value={settings.theme}
            options={[
              { value: 'dark', label: 'Escuro' },
              { value: 'light', label: 'Claro (em breve)' },
              { value: 'system', label: 'Sistema (em breve)' },
            ]}
            onChange={(value) => handleOptionChange('theme', value)}
          />
          <SettingOption
            label="Idioma"
            value={settings.language}
            options={[
              { value: 'pt-BR', label: 'Português (Brasil)' },
              { value: 'en', label: 'English (em breve)' },
            ]}
            onChange={(value) => handleOptionChange('language', value)}
          />
          <SettingToggle
            label="Modo Compacto"
            description="Reduz o espaçamento para ver mais informações"
            enabled={settings.compactMode}
            onChange={() => handleToggle('compactMode')}
            disabled
          />
        </div>
      </GlassCard>

      {/* Privacy */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Privacidade</h2>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <SettingToggle
            label="Mostrar Status Online"
            description="Permitir que outros vejam quando você está ativo"
            enabled={settings.showOnlineStatus}
            onChange={() => handleToggle('showOnlineStatus')}
          />
          <SettingToggle
            label="Compartilhar Análises"
            description="Ajude-nos a melhorar compartilhando dados anônimos de uso"
            enabled={settings.shareAnalytics}
            onChange={() => handleToggle('shareAnalytics')}
          />
        </div>
      </GlassCard>

      {/* Integrations */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Integrações</h2>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl',
              'bg-white/[0.02] border border-white/[0.06]',
              'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.04]',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5" />
              <span>WhatsApp Business</span>
            </div>
            <span className="text-xs text-zinc-500">Em breve</span>
          </button>

          <button
            type="button"
            disabled
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl',
              'bg-white/[0.02] border border-white/[0.06]',
              'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.04]',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5" />
              <span>Google Calendar</span>
            </div>
            <span className="text-xs text-zinc-500">Em breve</span>
          </button>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="p-6 border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Zona de Perigo</h2>

        <div className="space-y-3">
          <button
            type="button"
            disabled
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl',
              'bg-red-500/5 border border-red-500/20',
              'text-red-400 hover:bg-red-500/10',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span>Exportar Dados</span>
            <span className="text-xs text-red-400/70">Em breve</span>
          </button>

          <button
            type="button"
            disabled
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl',
              'bg-red-500/5 border border-red-500/20',
              'text-red-400 hover:bg-red-500/10',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span>Excluir Conta</span>
            <span className="text-xs text-red-400/70">Em breve</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
