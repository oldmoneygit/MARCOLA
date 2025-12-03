/**
 * @file AvatarUpload.tsx
 * @description Componente para upload de avatar do cliente com extração de cores
 * @module components/clients
 */

'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { extractColorsFromImage } from '@/lib/utils/colorExtractor';

import type { BrandColors, Client } from '@/types';

interface AvatarUploadProps {
  client: Client;
  onUpdate?: (client: Client) => void;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const ICON_SIZE_CLASSES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const TEXT_SIZE_CLASSES = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-4xl',
};

/**
 * Componente de upload de avatar com extração de cores
 */
export function AvatarUpload({ client, onUpdate, size = 'lg' }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<BrandColors | null>(null);
  const { addToast } = useToast();

  /**
   * Abre seletor de arquivo
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Processa arquivo selecionado
   */
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      addToast({ type: 'error', title: 'Erro', message: 'Use apenas JPEG, PNG, WebP ou GIF' });
      return;
    }

    // Validar tamanho
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'error', title: 'Erro', message: 'Imagem muito grande. Máximo 5MB.' });
      return;
    }

    // Criar preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Extrair cores
    try {
      const colors = await extractColorsFromImage(file);
      setExtractedColors(colors);
    } catch (err) {
      console.error('[AvatarUpload] Error extracting colors:', err);
    }

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (extractedColors) {
        formData.append('colors', JSON.stringify(extractedColors));
      }

      const response = await fetch(`/api/clients/${client.id}/avatar`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      const data = await response.json();
      addToast({ type: 'success', title: 'Sucesso', message: 'Avatar atualizado!' });

      if (onUpdate && data.client) {
        onUpdate(data.client);
      }
    } catch (err) {
      console.error('[AvatarUpload] Upload error:', err);
      addToast({
        type: 'error',
        title: 'Erro',
        message: err instanceof Error ? err.message : 'Erro ao fazer upload',
      });
      // Limpar preview em caso de erro
      setPreviewUrl(null);
      setExtractedColors(null);
    } finally {
      setUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [client.id, extractedColors, addToast, onUpdate]);

  /**
   * Remove avatar
   */
  const handleRemove = useCallback(async () => {
    if (!client.avatar_url) {
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/avatar`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao remover avatar');
      }

      setPreviewUrl(null);
      setExtractedColors(null);
      addToast({ type: 'success', title: 'Sucesso', message: 'Avatar removido!' });

      if (onUpdate) {
        onUpdate({ ...client, avatar_url: null, brand_colors: null });
      }
    } catch (err) {
      console.error('[AvatarUpload] Remove error:', err);
      addToast({ type: 'error', title: 'Erro', message: 'Erro ao remover avatar' });
    } finally {
      setUploading(false);
    }
  }, [client, addToast, onUpdate]);

  const displayUrl = previewUrl || client.avatar_url;
  const colors = extractedColors || client.brand_colors;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="relative group">
        <div
          className={`${SIZE_CLASSES[size]} rounded-2xl overflow-hidden border-2 border-white/10 transition-all duration-300 group-hover:border-violet-500/50`}
          style={{
            background: colors
              ? `linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40, ${colors.accent}40)`
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4))',
          }}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={client.name}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className={`${TEXT_SIZE_CLASSES[size]} font-bold text-white`}>
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Overlay de upload */}
          <div
            onClick={handleClick}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : (
              <svg className={ICON_SIZE_CLASSES[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Botão de remover */}
        {displayUrl && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remover avatar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Input hidden */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview de cores extraídas */}
      {colors && (
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full border border-white/20"
            style={{ backgroundColor: colors.primary }}
            title="Cor primária"
          />
          <div
            className="w-4 h-4 rounded-full border border-white/20"
            style={{ backgroundColor: colors.secondary }}
            title="Cor secundária"
          />
          <div
            className="w-3 h-3 rounded-full border border-white/20"
            style={{ backgroundColor: colors.accent }}
            title="Cor de destaque"
          />
        </div>
      )}

      {/* Botão de upload (opcional) */}
      {size === 'lg' && (
        <Button variant="secondary" size="sm" onClick={handleClick} loading={uploading}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {client.avatar_url ? 'Trocar foto' : 'Adicionar foto'}
        </Button>
      )}
    </div>
  );
}
