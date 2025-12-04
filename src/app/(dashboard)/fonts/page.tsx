/**
 * @file page.tsx
 * @description Página de comparação de fontes para definição da identidade visual
 * @module app/(dashboard)/fonts
 */

'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui';

/** Tipo para configuração de fonte */
interface FontConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  files: Record<string, string>;
}

/** Configuração das fontes disponíveis */
const FONTS: FontConfig[] = [
  {
    id: 'clemente',
    name: 'Clemente PD',
    description: 'Fonte serifada elegante e sofisticada',
    category: 'Serif',
    files: {
      light: 'ClementePDae-Light.ttf',
      regular: 'ClementePDai-Regular.ttf',
      semibold: 'ClementePDak-SemiBold.ttf',
      bold: 'ClementePDam-Bold.ttf',
    },
  },
  {
    id: 'superior',
    name: 'LT Superior',
    description: 'Sans-serif moderna e versátil',
    category: 'Sans-serif',
    files: {
      light: 'LTSuperior-Light.ttf',
      regular: 'LTSuperior-Regular.ttf',
      medium: 'LTSuperior-Medium.ttf',
      semibold: 'LTSuperior-SemiBold.ttf',
      bold: 'LTSuperior-Bold.ttf',
    },
  },
  {
    id: 'baru',
    name: 'Baru Sans',
    description: 'Sans-serif geométrica e clean',
    category: 'Sans-serif',
    files: {
      light: 'BaruSansDemo-Light.ttf',
      regular: 'BaruSansDemo-Regular.ttf',
      medium: 'BaruSansDemo-Medium.ttf',
      bold: 'BaruSansDemo-Bold.ttf',
    },
  },
  {
    id: 'arual',
    name: 'Arual',
    description: 'Fonte alternativa única',
    category: 'Sans-serif',
    files: {
      regular: 'Arual.ttf',
    },
  },
];

/** Componente de preview de uma fonte */
function FontPreview({ font, isSelected, onClick }: {
  font: FontConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-all ${
        isSelected
          ? 'bg-violet-500/10 border-violet-500/50 ring-2 ring-violet-500/30'
          : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.15]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white" style={{ fontFamily: font.id }}>
          {font.name}
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400">
          {font.category}
        </span>
      </div>
      <p className="text-sm text-zinc-500">{font.description}</p>
    </button>
  );
}

/** Card de UI Kit para uma fonte */
function FontUIKit({ font }: { font: FontConfig }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pb-6 border-b border-white/[0.08]">
        <span className="text-xs text-violet-400 uppercase tracking-wider mb-2 block">
          {font.category}
        </span>
        <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: font.id }}>
          {font.name}
        </h2>
        <p className="text-zinc-400" style={{ fontFamily: font.id }}>
          {font.description}
        </p>
      </div>

      {/* Tipografia */}
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Hierarquia Tipográfica</h3>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-zinc-500 mb-1 block">H1 - Display / Hero</span>
            <p className="text-4xl font-bold text-white" style={{ fontFamily: font.id }}>
              MARCOLA Dashboard
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-zinc-500 mb-1 block">H2 - Título de Seção</span>
            <p className="text-2xl font-semibold text-white" style={{ fontFamily: font.id }}>
              Gestão de Clientes
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-zinc-500 mb-1 block">H3 - Título de Card</span>
            <p className="text-xl font-medium text-white" style={{ fontFamily: font.id }}>
              Relatórios de Performance
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-zinc-500 mb-1 block">Body - Texto Principal</span>
            <p className="text-base text-zinc-300" style={{ fontFamily: font.id }}>
              Acompanhe as métricas de todos os seus clientes em tempo real.
              Visualize impressões, cliques, conversões e muito mais.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-zinc-500 mb-1 block">Small - Texto Secundário</span>
            <p className="text-sm text-zinc-400" style={{ fontFamily: font.id }}>
              Última atualização: 03 de Dezembro de 2024 às 14:30
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-zinc-500 mb-1 block">Caption - Labels e Tags</span>
            <p className="text-xs text-zinc-500 uppercase tracking-wider" style={{ fontFamily: font.id }}>
              Status: Ativo • Segmento: Fitness • Valor: R$ 2.500/mês
            </p>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Botões</h3>

        <div className="flex flex-wrap gap-3">
          <button
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-medium shadow-lg shadow-violet-500/25"
            style={{ fontFamily: font.id }}
          >
            Criar Cliente
          </button>
          <button
            className="px-6 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-medium hover:bg-white/[0.1]"
            style={{ fontFamily: font.id }}
          >
            Ver Detalhes
          </button>
          <button
            className="px-6 py-2.5 rounded-xl text-violet-400 font-medium hover:text-violet-300"
            style={{ fontFamily: font.id }}
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Cards de Exemplo */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Cards de Exemplo</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Metric Card */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400" style={{ fontFamily: font.id }}>
                Total de Clientes
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                +12%
              </span>
            </div>
            <p className="text-3xl font-bold text-white" style={{ fontFamily: font.id }}>
              48
            </p>
            <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: font.id }}>
              vs. 43 mês anterior
            </p>
          </GlassCard>

          {/* Status Card */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                A
              </div>
              <div>
                <p className="font-medium text-white" style={{ fontFamily: font.id }}>
                  Academia FitPower
                </p>
                <p className="text-xs text-zinc-500" style={{ fontFamily: font.id }}>
                  Fitness
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm" style={{ fontFamily: font.id }}>
              <span className="text-zinc-400">Valor Mensal</span>
              <span className="text-white font-medium">R$ 2.500</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Números e Métricas */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Números e Métricas</h3>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: font.id }}>
              R$ 156.890
            </p>
            <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: font.id }}>
              Faturamento
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
            <p className="text-3xl font-bold text-emerald-400" style={{ fontFamily: font.id }}>
              +23,5%
            </p>
            <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: font.id }}>
              Crescimento
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: font.id }}>
              1.2M
            </p>
            <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: font.id }}>
              Impressões
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: font.id }}>
              R$ 12,45
            </p>
            <p className="text-xs text-zinc-500 mt-1" style={{ fontFamily: font.id }}>
              CPA Médio
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Exemplo */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Tabela de Dados</h3>

        <div className="rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full" style={{ fontFamily: font.id }}>
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.08]">
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Cliente</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-right p-3 text-sm font-medium text-zinc-400">Valor</th>
                <th className="text-right p-3 text-sm font-medium text-zinc-400">ROI</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="p-3 text-sm text-white">Academia XYZ</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Ativo
                  </span>
                </td>
                <td className="p-3 text-sm text-white text-right">R$ 3.500</td>
                <td className="p-3 text-sm text-emerald-400 text-right">+180%</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="p-3 text-sm text-white">Restaurante Sabor</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    Ativo
                  </span>
                </td>
                <td className="p-3 text-sm text-white text-right">R$ 1.800</td>
                <td className="p-3 text-sm text-emerald-400 text-right">+95%</td>
              </tr>
              <tr>
                <td className="p-3 text-sm text-white">Clínica Bem Estar</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    Pausado
                  </span>
                </td>
                <td className="p-3 text-sm text-white text-right">R$ 2.200</td>
                <td className="p-3 text-sm text-zinc-400 text-right">--</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Elementos de Formulário</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2" style={{ fontFamily: font.id }}>
              Nome do Cliente
            </label>
            <input
              type="text"
              placeholder="Ex: Academia XYZ"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-500"
              style={{ fontFamily: font.id }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2" style={{ fontFamily: font.id }}>
              Valor Mensal
            </label>
            <input
              type="text"
              placeholder="R$ 0,00"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-zinc-500"
              style={{ fontFamily: font.id }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Página principal de comparação de fontes */
export default function FontsPage() {
  const [selectedFont, setSelectedFont] = useState<FontConfig>(FONTS[0] as FontConfig);

  return (
    <>
      {/* CSS para carregar as fontes */}
      <style jsx global>{`
        @font-face {
          font-family: 'clemente';
          src: url('/fonts/ClementePDai-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'clemente';
          src: url('/fonts/ClementePDae-Light.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }
        @font-face {
          font-family: 'clemente';
          src: url('/fonts/ClementePDak-SemiBold.ttf') format('truetype');
          font-weight: 600;
          font-style: normal;
        }
        @font-face {
          font-family: 'clemente';
          src: url('/fonts/ClementePDam-Bold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
        }

        @font-face {
          font-family: 'superior';
          src: url('/fonts/LTSuperior-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'superior';
          src: url('/fonts/LTSuperior-Light.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }
        @font-face {
          font-family: 'superior';
          src: url('/fonts/LTSuperior-Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        @font-face {
          font-family: 'superior';
          src: url('/fonts/LTSuperior-SemiBold.ttf') format('truetype');
          font-weight: 600;
          font-style: normal;
        }
        @font-face {
          font-family: 'superior';
          src: url('/fonts/LTSuperior-Bold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
        }

        @font-face {
          font-family: 'baru';
          src: url('/fonts/BaruSansDemo-Regular.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: 'baru';
          src: url('/fonts/BaruSansDemo-Light.ttf') format('truetype');
          font-weight: 300;
          font-style: normal;
        }
        @font-face {
          font-family: 'baru';
          src: url('/fonts/BaruSansDemo-Medium.ttf') format('truetype');
          font-weight: 500;
          font-style: normal;
        }
        @font-face {
          font-family: 'baru';
          src: url('/fonts/BaruSansDemo-Bold.ttf') format('truetype');
          font-weight: 700;
          font-style: normal;
        }

        @font-face {
          font-family: 'arual';
          src: url('/fonts/Arual.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Comparador de Fontes</h1>
          <p className="text-zinc-400 mt-1">
            Selecione uma fonte para visualizar como ela fica nos diferentes elementos da UI
          </p>
        </div>

        {/* Font Selector */}
        <div className="grid grid-cols-4 gap-4">
          {FONTS.map((font) => (
            <FontPreview
              key={font.id}
              font={font}
              isSelected={selectedFont.id === font.id}
              onClick={() => setSelectedFont(font)}
            />
          ))}
        </div>

        {/* UI Kit Preview */}
        <GlassCard className="p-8">
          <FontUIKit font={selectedFont} />
        </GlassCard>

        {/* Side by Side Comparison */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Comparação Lado a Lado</h2>
          <div className="grid grid-cols-2 gap-6">
            {FONTS.slice(0, 4).map((font) => (
              <GlassCard key={font.id} className="p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: font.id }}>
                  {font.name}
                </h3>
                <div className="space-y-3" style={{ fontFamily: font.id }}>
                  <p className="text-2xl font-bold text-white">MARCOLA</p>
                  <p className="text-lg font-semibold text-zinc-300">Gestor de Tráfegos</p>
                  <p className="text-base text-zinc-400">
                    Acompanhe todos os seus clientes em uma única plataforma moderna e intuitiva.
                  </p>
                  <p className="text-sm text-zinc-500">
                    R$ 156.890,00 • 48 clientes ativos • +23,5% crescimento
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium">
                      Criar Cliente
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-white/[0.05] text-white text-sm">
                      Ver Relatórios
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
