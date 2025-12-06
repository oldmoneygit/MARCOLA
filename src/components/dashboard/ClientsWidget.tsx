/**
 * @file ClientsWidget.tsx
 * @description Widget de clientes com alertas para o dashboard
 * @module components/dashboard
 */

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Users, AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';

import { GlassCard } from '@/components/ui';

interface ClientWithHealth {
  id: string;
  name: string;
  health_score?: number | null;
  status: string;
  avatar_url?: string | null;
}

interface ClientsOverview {
  total: number;
  active: number;
  needsAttention: number;
  clients: ClientWithHealth[];
}

/**
 * Retorna cor baseada no health score
 */
function getHealthColor(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return 'text-[#6B8A8D]';
  }
  if (score >= 70) {
    return 'text-[#7ED4A6]';
  }
  if (score >= 40) {
    return 'text-[#E3B8B8]';
  }
  return 'text-[#E57373]';
}

/**
 * Retorna ícone baseado no health score
 */
function getHealthIcon(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return <Minus className="w-3.5 h-3.5" />;
  }
  if (score >= 70) {
    return <TrendingUp className="w-3.5 h-3.5" />;
  }
  if (score >= 40) {
    return <Minus className="w-3.5 h-3.5" />;
  }
  return <TrendingDown className="w-3.5 h-3.5" />;
}

/**
 * Widget de clientes com status de saúde
 */
export function ClientsWidget() {
  const [data, setData] = useState<ClientsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch('/api/clients?limit=5&sort=health_score&order=asc');
      if (response.ok) {
        const result = await response.json();
        const clients = result.clients || result || [];

        // Calcular métricas
        const active = clients.filter((c: ClientWithHealth) => c.status === 'active').length;
        const needsAttention = clients.filter((c: ClientWithHealth) =>
          c.health_score !== null && c.health_score !== undefined && c.health_score < 50
        ).length;

        setData({
          total: clients.length,
          active,
          needsAttention,
          clients: clients.slice(0, 5),
        });
      }
    } catch (err) {
      console.error('[ClientsWidget] Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  if (loading) {
    return (
      <GlassCard className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-white whitespace-nowrap">Clientes</h2>
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      </GlassCard>
    );
  }

  const clients = data?.clients || [];
  const needsAttentionCount = data?.needsAttention || 0;

  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-semibold text-white whitespace-nowrap">Clientes</h2>
          {needsAttentionCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#E3B8B8]/10 text-[#E3B8B8] flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <AlertTriangle className="w-3 h-3" />
              {needsAttentionCount}
            </span>
          )}
        </div>
        <Link
          href="/clients"
          className="text-xs text-[#BDCDCF] hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
        >
          Ver todos
        </Link>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between gap-2 mb-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-[#BDCDCF] flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-base font-semibold text-white">{data?.total || 0}</p>
            <p className="text-xs text-[#6B8A8D]">Total</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/[0.08] flex-shrink-0" />
        <div className="text-center">
          <p className="text-base font-semibold text-[#7ED4A6]">{data?.active || 0}</p>
          <p className="text-xs text-[#6B8A8D]">Ativos</p>
        </div>
        <div className="w-px h-8 bg-white/[0.08] flex-shrink-0" />
        <div className="text-center">
          <p className="text-base font-semibold text-[#E3B8B8]">{needsAttentionCount}</p>
          <p className="text-xs text-[#6B8A8D]">Atenção</p>
        </div>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="text-center py-6 text-[#8FAAAD] flex-1 flex flex-col justify-center">
          <Users className="w-8 h-8 mx-auto text-[#BDCDCF]" />
          <p className="mt-2 text-sm">Nenhum cliente cadastrado</p>
          <Link
            href="/clients/new"
            className="text-xs text-[#BDCDCF] hover:text-white mt-1 inline-block"
          >
            Adicionar cliente
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {client.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={client.avatar_url}
                    alt={client.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-[#0a0a0f]">
                    {client.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-[#BDCDCF] transition-colors">
                  {client.name}
                </p>
                <p className="text-xs text-[#6B8A8D] capitalize">
                  {client.status === 'active' ? 'Ativo' : client.status}
                </p>
              </div>

              {/* Health Score */}
              <div className={`flex items-center gap-1 ${getHealthColor(client.health_score)}`}>
                {getHealthIcon(client.health_score)}
                <span className="text-sm font-medium">
                  {client.health_score !== null && client.health_score !== undefined
                    ? `${client.health_score}%`
                    : '—'
                  }
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-[#6B8A8D] text-center">
        Health Score indica a saúde geral do cliente
      </div>
    </GlassCard>
  );
}
