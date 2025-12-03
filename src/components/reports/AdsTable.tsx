/**
 * @file AdsTable.tsx
 * @description Tabela completa de anúncios com todas as métricas do Meta Ads
 * @module components/reports
 */

'use client';

import { useMemo, useState } from 'react';

import { StatusBadge } from '@/components/ui';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

import type { BadgeStatus } from '@/components/ui';
import type { Ad, AdStatus } from '@/types';

interface AdsTableProps {
  ads: Ad[];
}

type SortField =
  | 'ad_name'
  | 'spend'
  | 'impressions'
  | 'reach'
  | 'frequency'
  | 'clicks'
  | 'conversions'
  | 'ctr'
  | 'cpc'
  | 'cpm'
  | 'cpa'
  | 'roas'
  | 'purchase_value'
  | 'landing_page_views'
  | 'add_to_cart'
  | 'checkouts_initiated'
  | 'status';

type SortDirection = 'asc' | 'desc';

const STATUS_CONFIG: Record<AdStatus, { label: string; badgeStatus: BadgeStatus }> = {
  winner: { label: 'Winner', badgeStatus: 'success' },
  active: { label: 'Ativo', badgeStatus: 'info' },
  fatigue: { label: 'Fadiga', badgeStatus: 'warning' },
  paused: { label: 'Pausar', badgeStatus: 'danger' },
};

/**
 * Tabela completa de anúncios com todas as métricas do Meta Ads
 */
export function AdsTable({ ads }: AdsTableProps) {
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => {
      let comparison = 0;

      const getValue = (ad: Ad, field: SortField): number | string => {
        switch (field) {
          case 'ad_name':
            return ad.ad_name;
          case 'status':
            return ad.status;
          case 'reach':
            return ad.reach ?? 0;
          case 'frequency':
            return ad.frequency ?? 0;
          case 'roas':
            return ad.roas ?? 0;
          case 'purchase_value':
            return ad.purchase_value ?? 0;
          case 'landing_page_views':
            return ad.landing_page_views ?? 0;
          case 'add_to_cart':
            return ad.add_to_cart ?? 0;
          case 'checkouts_initiated':
            return ad.checkouts_initiated ?? 0;
          default:
            return ad[field] as number;
        }
      };

      const aVal = getValue(a, sortField);
      const bVal = getValue(b, sortField);

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = (aVal as number) - (bVal as number);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [ads, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) {
      return (
        <svg className="w-3 h-3 opacity-30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const HeaderButton = ({ field, children, align = 'right' }: { field: SortField; children: React.ReactNode; align?: 'left' | 'right' | 'center' }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wider hover:text-white transition-colors whitespace-nowrap ${
        align === 'right' ? 'justify-end w-full' : align === 'center' ? 'justify-center w-full' : ''
      }`}
    >
      {children}
      <SortIcon field={field} />
    </button>
  );

  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
      <table className="w-full min-w-[1400px]">
        <thead>
          {/* Cabeçalho de grupos */}
          <tr className="border-b border-white/[0.05]">
            <th className="py-2 px-3 text-left" colSpan={2}>
              <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Identificação</span>
            </th>
            <th className="py-2 px-3 text-center border-l border-white/[0.05]" colSpan={3}>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Alcance</span>
            </th>
            <th className="py-2 px-3 text-center border-l border-white/[0.05]" colSpan={5}>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Engajamento</span>
            </th>
            <th className="py-2 px-3 text-center border-l border-white/[0.05]" colSpan={6}>
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Conversões</span>
            </th>
            <th className="py-2 px-3 text-center border-l border-white/[0.05]">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Status</span>
            </th>
          </tr>
          {/* Cabeçalho de colunas */}
          <tr className="border-b border-white/[0.08]">
            {/* Identificação */}
            <th className="py-2 px-3 text-left">
              <HeaderButton field="ad_name" align="left">Anúncio</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="spend">Gasto</HeaderButton>
            </th>

            {/* Alcance */}
            <th className="py-2 px-3 text-right border-l border-white/[0.05]">
              <HeaderButton field="reach">Alcance</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="impressions">Impr.</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="frequency">Freq.</HeaderButton>
            </th>

            {/* Engajamento */}
            <th className="py-2 px-3 text-right border-l border-white/[0.05]">
              <HeaderButton field="clicks">Cliques</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="ctr">CTR</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="cpc">CPC</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="cpm">CPM</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="landing_page_views">LP Views</HeaderButton>
            </th>

            {/* Conversões */}
            <th className="py-2 px-3 text-right border-l border-white/[0.05]">
              <HeaderButton field="add_to_cart">Carrinho</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="checkouts_initiated">Checkout</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="conversions">Compras</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="cpa">CPA</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="purchase_value">Valor</HeaderButton>
            </th>
            <th className="py-2 px-3 text-right">
              <HeaderButton field="roas">ROAS</HeaderButton>
            </th>

            {/* Status */}
            <th className="py-2 px-3 text-center border-l border-white/[0.05]">
              <HeaderButton field="status" align="center">Status</HeaderButton>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {sortedAds.map((ad) => {
            const statusConfig = STATUS_CONFIG[ad.status];
            return (
              <tr key={ad.id} className="hover:bg-white/[0.02] transition-colors group">
                {/* Identificação */}
                <td className="py-3 px-3">
                  <div className="max-w-[180px]">
                    <p className="text-sm font-medium text-white truncate" title={ad.ad_name}>
                      {ad.ad_name}
                    </p>
                    {ad.ad_set_name && (
                      <p className="text-[10px] text-zinc-500 truncate" title={ad.ad_set_name}>
                        {ad.ad_set_name}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm font-medium text-white">{formatCurrency(ad.spend)}</span>
                </td>

                {/* Alcance */}
                <td className="py-3 px-3 text-right border-l border-white/[0.03]">
                  <span className="text-sm text-zinc-400">
                    {ad.reach !== null ? formatNumber(ad.reach) : '-'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-zinc-400">{formatNumber(ad.impressions)}</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-zinc-400">
                    {ad.frequency !== null ? ad.frequency.toFixed(2) : '-'}
                  </span>
                </td>

                {/* Engajamento */}
                <td className="py-3 px-3 text-right border-l border-white/[0.03]">
                  <span className="text-sm text-zinc-400">{formatNumber(ad.clicks)}</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`text-sm font-medium ${
                    ad.ctr >= 2 ? 'text-emerald-400' :
                    ad.ctr < 0.5 ? 'text-red-400' :
                    'text-zinc-400'
                  }`}>
                    {formatPercent(ad.ctr)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-zinc-400">{formatCurrency(ad.cpc)}</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-zinc-400">{formatCurrency(ad.cpm)}</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-zinc-400">
                    {ad.landing_page_views !== null ? formatNumber(ad.landing_page_views) : '-'}
                  </span>
                </td>

                {/* Conversões */}
                <td className="py-3 px-3 text-right border-l border-white/[0.03]">
                  <span className="text-sm text-zinc-400">
                    {ad.add_to_cart !== null ? formatNumber(ad.add_to_cart) : '-'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-zinc-400">
                    {ad.checkouts_initiated !== null ? formatNumber(ad.checkouts_initiated) : '-'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`text-sm font-medium ${
                    ad.conversions > 0 ? 'text-white' : 'text-zinc-500'
                  }`}>
                    {ad.conversions}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`text-sm font-medium ${
                    ad.cpa > 0 && ad.cpa <= 50 ? 'text-emerald-400' :
                    ad.cpa > 150 ? 'text-red-400' :
                    'text-zinc-400'
                  }`}>
                    {ad.cpa > 0 ? formatCurrency(ad.cpa) : '-'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-sm text-zinc-400">
                    {ad.purchase_value !== null && ad.purchase_value > 0
                      ? formatCurrency(ad.purchase_value)
                      : '-'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`text-sm font-medium ${
                    ad.roas !== null && ad.roas >= 3 ? 'text-emerald-400' :
                    ad.roas !== null && ad.roas < 1 ? 'text-red-400' :
                    'text-zinc-400'
                  }`}>
                    {ad.roas !== null && ad.roas > 0 ? `${ad.roas.toFixed(2)}x` : '-'}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-3 text-center border-l border-white/[0.03]">
                  <StatusBadge status={statusConfig.badgeStatus} label={statusConfig.label} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legenda */}
      <div className="mt-4 pt-4 border-t border-white/[0.05] flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>CTR &ge; 2% | CPA &le; R$50 | ROAS &ge; 3x</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          <span>CTR &lt; 0.5% | CPA &gt; R$150 | ROAS &lt; 1x</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">-</span>
          <span>Dados não disponíveis</span>
        </div>
      </div>
    </div>
  );
}
