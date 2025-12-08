/**
 * @file page.tsx
 * @description Página principal de Leads - Lead Sniper
 * @module app/(dashboard)/leads
 */

'use client';

import { useState } from 'react';
import { List, BarChart3 } from 'lucide-react';

import { ProspeccaoDashboard, LeadsList, LeadDetailModal } from '@/components/lead-sniper';
import type { LeadProspectado } from '@/types/lead-sniper';

type TabType = 'dashboard' | 'leads';

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedLead, setSelectedLead] = useState<LeadProspectado | null>(null);

  const handleLeadClick = (lead: LeadProspectado) => {
    setSelectedLead(lead);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
  };

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-white/[0.08] mb-6 -mt-2">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'dashboard'
                ? 'text-violet-400 border-violet-400'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'leads'
                ? 'text-violet-400 border-violet-400'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            Lista de Leads
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-8">
        {activeTab === 'dashboard' && <ProspeccaoDashboard />}
        {activeTab === 'leads' && <LeadsList onLeadClick={handleLeadClick} />}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
