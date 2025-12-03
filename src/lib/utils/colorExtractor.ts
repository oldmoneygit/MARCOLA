/**
 * @file colorExtractor.ts
 * @description Utilitário para extrair cores dominantes de imagens
 * @module lib/utils
 *
 * @example
 * const colors = await extractColorsFromImage(imageFile);
 * console.log(colors.primary); // "#6366f1"
 */

import type { BrandColors } from '@/types';

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Converte RGB para HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calcula a luminosidade de uma cor
 */
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Calcula a saturação de uma cor
 */
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) {
    return 0;
  }
  return (max - min) / max;
}

/**
 * Agrupa cores similares usando k-means simplificado
 */
function clusterColors(colors: RGB[], numClusters: number): RGB[] {
  if (colors.length <= numClusters) {
    return colors;
  }

  // Inicializar centroides com cores aleatórias do array
  const step = Math.floor(colors.length / numClusters);
  let centroids: RGB[] = [];
  for (let i = 0; i < numClusters; i++) {
    const idx = i * step;
    const color = colors[idx];
    if (color) {
      centroids.push({ r: color.r, g: color.g, b: color.b });
    }
  }

  // Iterar para convergir
  for (let iter = 0; iter < 10; iter++) {
    // Agrupar cores por centroide mais próximo
    const clusters: RGB[][] = Array.from({ length: numClusters }, () => []);

    for (const color of colors) {
      let minDist = Infinity;
      let closestIdx = 0;

      for (let i = 0; i < centroids.length; i++) {
        const centroid = centroids[i];
        if (!centroid) {
          continue;
        }
        const dist = Math.sqrt(
          Math.pow(color.r - centroid.r, 2) +
          Math.pow(color.g - centroid.g, 2) +
          Math.pow(color.b - centroid.b, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      const cluster = clusters[closestIdx];
      if (cluster) {
        cluster.push(color);
      }
    }

    // Recalcular centroides
    const newCentroids: RGB[] = [];
    for (let i = 0; i < numClusters; i++) {
      const cluster = clusters[i];
      const centroid = centroids[i];

      if (!cluster || cluster.length === 0) {
        if (centroid) {
          newCentroids.push(centroid);
        }
        continue;
      }

      const avgR = cluster.reduce((sum, c) => sum + c.r, 0) / cluster.length;
      const avgG = cluster.reduce((sum, c) => sum + c.g, 0) / cluster.length;
      const avgB = cluster.reduce((sum, c) => sum + c.b, 0) / cluster.length;

      newCentroids.push({ r: avgR, g: avgG, b: avgB });
    }

    centroids = newCentroids;
  }

  return centroids;
}

/**
 * Extrai cores dominantes de uma imagem
 *
 * @param file - Arquivo de imagem
 * @returns Promise com as cores da marca
 */
export async function extractColorsFromImage(file: File): Promise<BrandColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto do canvas'));
      return;
    }

    img.onload = () => {
      // Redimensionar para performance
      const maxSize = 100;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Extrair pixels
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      const colors: RGB[] = [];

      // Amostrar pixels (a cada 4 para performance)
      for (let i = 0; i < pixels.length; i += 16) {
        const r = pixels[i] ?? 0;
        const g = pixels[i + 1] ?? 0;
        const b = pixels[i + 2] ?? 0;
        const a = pixels[i + 3] ?? 0;

        // Ignorar pixels muito transparentes
        if (a < 128) {
          continue;
        }

        // Ignorar pixels muito claros (brancos) ou muito escuros (pretos)
        const luminance = getLuminance(r, g, b);
        if (luminance < 0.1 || luminance > 0.9) {
          continue;
        }

        // Preferir cores mais saturadas
        const saturation = getSaturation(r, g, b);
        if (saturation < 0.1) {
          continue;
        }

        colors.push({ r, g, b });
      }

      // Se não encontrou cores suficientes, usar fallback
      if (colors.length < 3) {
        resolve({
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#a855f7',
        });
        return;
      }

      // Clusterizar para encontrar cores dominantes
      const clusters = clusterColors(colors, 5);

      // Ordenar por saturação (cores mais vibrantes primeiro)
      clusters.sort((colorA, colorB) => {
        if (!colorA || !colorB) {
          return 0;
        }
        const satA = getSaturation(colorA.r, colorA.g, colorA.b);
        const satB = getSaturation(colorB.r, colorB.g, colorB.b);
        return satB - satA;
      });

      // Cores padrão
      const defaultPrimary: RGB = { r: 99, g: 102, b: 241 };
      const defaultSecondary: RGB = { r: 139, g: 92, b: 246 };
      const defaultAccent: RGB = { r: 168, g: 85, b: 247 };

      // Selecionar cores
      const primary = clusters[0] ?? defaultPrimary;
      const secondary = clusters[1] ?? clusters[0] ?? defaultSecondary;
      const accent = clusters[2] ?? clusters[1] ?? clusters[0] ?? defaultAccent;

      resolve({
        primary: rgbToHex(primary.r, primary.g, primary.b),
        secondary: rgbToHex(secondary.r, secondary.g, secondary.b),
        accent: rgbToHex(accent.r, accent.g, accent.b),
      });
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    // Criar URL do arquivo
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Gera cores com opacidade para uso em backgrounds
 */
export function getColorWithOpacity(hex: string, opacity: number): string {
  return `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Escurece uma cor hex
 */
export function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

/**
 * Clareia uma cor hex
 */
export function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
  const b = Math.min(255, (num & 0x0000FF) + amount);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
