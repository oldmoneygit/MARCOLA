# CLIENT_INTELLIGENCE.md - Sistema de IA para Base de Conhecimento do Cliente

---

## 🧠 Visão Geral

O módulo **Client Intelligence** usa IA para processar todas as informações do cliente e gerar:

1. **Base de Conhecimento** - Documento estruturado com todas as informações organizadas
2. **Resumo Executivo** - Visão rápida e visual do cliente
3. **Sugestões de Conteúdo** - Ideias personalizadas baseadas no nicho e estratégia
4. **Ofertas Sazonais** - Promoções recomendadas com base em datas comemorativas e orçamento

---

## 🎯 Problema que Resolve

| Antes | Depois |
|-------|--------|
| Informações espalhadas em várias abas | Tudo organizado em um resumo visual |
| Não sabe que conteúdo criar | IA sugere baseado no nicho |
| Perde datas sazonais importantes | Calendário de ofertas personalizado |
| Precisa ler tudo para entender o cliente | Resumo executivo instantâneo |
| Informações desatualizadas | Atualiza automaticamente ao editar |

---

## 📊 Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO DA FEATURE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. TRIGGER (Quando executa)                                        │
│     ├── Ao criar cliente (após salvar)                              │
│     ├── Ao editar cliente (após salvar)                             │
│     └── Manualmente (botão "Regenerar IA")                          │
│                                                                     │
│  2. COLETA (O que a IA recebe)                                      │
│     ├── Aba Informações: contato, financeiro, redes, links          │
│     ├── Aba Estratégia: briefing, objetivos, público-alvo           │
│     ├── Aba Credenciais: acessos, contas de anúncios                │
│     ├── Segmento/Nicho do cliente                                   │
│     └── Histórico de relatórios e pagamentos                        │
│                                                                     │
│  3. PROCESSAMENTO (O que a IA faz)                                  │
│     ├── Analisa todas as informações                                │
│     ├── Identifica pontos-chave do negócio                          │
│     ├── Mapeia oportunidades do nicho                               │
│     ├── Cruza com calendário sazonal                                │
│     └── Considera orçamento disponível                              │
│                                                                     │
│  4. OUTPUT (O que a IA gera)                                        │
│     ├── knowledge_base (JSON estruturado)                           │
│     ├── executive_summary (texto resumido)                          │
│     ├── content_suggestions (array de sugestões)                    │
│     └── seasonal_offers (array de ofertas sazonais)                 │
│                                                                     │
│  5. ARMAZENAMENTO (Onde salva)                                      │
│     └── Tabela client_intelligence no banco de dados                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schema do Banco de Dados

### Tabela: `client_intelligence`

```sql
CREATE TABLE client_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Base de Conhecimento (JSON estruturado)
  knowledge_base JSONB NOT NULL DEFAULT '{}',
  
  -- Resumo Executivo (texto gerado pela IA)
  executive_summary TEXT,
  
  -- Sugestões de Conteúdo (array de objetos)
  content_suggestions JSONB DEFAULT '[]',
  
  -- Ofertas Sazonais (array de objetos)
  seasonal_offers JSONB DEFAULT '[]',
  
  -- Metadados
  ai_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para garantir 1 registro por cliente
CREATE UNIQUE INDEX idx_client_intelligence_client ON client_intelligence(client_id);

-- Índice para busca por usuário
CREATE INDEX idx_client_intelligence_user ON client_intelligence(user_id);

-- Trigger para updated_at
CREATE TRIGGER set_client_intelligence_updated_at
  BEFORE UPDATE ON client_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### RLS Policy

```sql
ALTER TABLE client_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own client intelligence"
  ON client_intelligence FOR ALL
  USING (auth.uid() = user_id);
```

---

## 📊 Estrutura do Knowledge Base (JSON)

```typescript
interface KnowledgeBase {
  // Informações Básicas
  profile: {
    business_name: string;
    segment: string;
    niche_details: string;
    location: string;
    operating_since?: string;
  };
  
  // Contato
  contact: {
    primary_name: string;
    phone: string;
    email: string;
    best_contact_time?: string;
  };
  
  // Financeiro
  financial: {
    monthly_fee: number;
    payment_day: number;
    average_ticket: number;
    profit_margin: number; // NOVO: Margem de lucro em %
    monthly_ad_budget?: number;
    total_received?: number;
  };
  
  // Presença Digital
  digital_presence: {
    instagram?: string;
    facebook?: string;
    website?: string;
    google_business?: string;
    other_platforms?: string[];
  };
  
  // Estratégia (extraído do briefing)
  strategy: {
    main_objectives: string[];
    target_audience: string;
    unique_selling_points: string[];
    competitors?: string[];
    tone_of_voice?: string;
    content_pillars?: string[];
  };
  
  // Recursos Disponíveis
  resources: {
    has_photos: boolean;
    has_videos: boolean;
    has_testimonials: boolean;
    brand_assets?: string;
    drive_folder?: string;
  };
  
  // Análise do Nicho
  niche_analysis: {
    market_position: string;
    growth_opportunities: string[];
    main_challenges: string[];
    seasonal_peaks: string[];
  };
  
  // Metadados
  meta: {
    completeness_score: number; // 0-100
    last_updated: string;
    version: number;
  };
}
```

---

## 📊 Estrutura das Sugestões de Conteúdo

As sugestões são **100% personalizadas para cada cliente**, baseadas em:
- Estratégia de campanha específica do cliente
- Objetivos definidos no briefing
- Público-alvo do cliente
- Tom de voz e posicionamento
- Histórico e recursos disponíveis

**NÃO são sugestões genéricas por nicho** - cada cliente recebe sugestões únicas.

```typescript
interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  content_type: 'post' | 'video' | 'reels' | 'stories' | 'carousel' | 'campaign';
  platform: ('instagram' | 'facebook' | 'tiktok' | 'google')[];
  objective: 'awareness' | 'engagement' | 'conversion' | 'retention';
  priority: 'high' | 'medium' | 'low';
  estimated_effort: 'quick' | 'medium' | 'complex';
  suggested_copy?: string;
  visual_suggestion?: string;
  hashtags?: string[];
  best_time_to_post?: string;
  based_on: string; // Qual informação do cliente gerou essa sugestão
  reasoning: string; // Por que a IA sugeriu isso para ESTE cliente
}
```

---

## 📊 Estrutura das Ofertas Sazonais

As ofertas são calculadas com base em:
- **Ticket Médio** do cliente (já preenchido nos dados básicos)
- **Margem de Lucro** do cliente (novo campo a ser adicionado)
- **Orçamento de Ads** disponível
- Datas sazonais relevantes para o negócio

### ⚠️ IMPORTANTE: Ângulos CRIATIVOS, não só desconto %

A IA **NÃO deve se limitar** a sugerir "X% de desconto". Deve pensar em **ângulos diferentes e criativos**:

| Tipo de Ângulo | Exemplo | Por que funciona |
|----------------|---------|------------------|
| **Compre 1, Leve 2** | "Traga um amigo grátis por 1 mês" | Aquisição viral + retenção |
| **Gamificação** | "Complete 20 treinos, ganhe 50% de volta" | Maioria não completa = você ganha |
| **Upsell/Bundle** | "Plano + avaliação + dieta por R$X" | Aumenta ticket, não dá desconto |
| **Parceria** | "Matricule-se e ganhe voucher do parceiro" | Custo zero pra você |
| **Early Bird** | "Primeiros 20 pagam X" | Urgência + escassez |
| **Indicação** | "Indique 3, ganhe 1 mês" | CAC zero |
| **Garantia** | "Resultado ou dinheiro de volta" | Remove objeção |
| **Experiência** | "Semana VIP grátis antes de decidir" | Trial que converte |
| **Escassez** | "Só 10 vagas com bônus X" | FOMO |
| **Sorteio** | "Comprando, concorre a X" | Engajamento sem custo garantido |

A IA deve sugerir **3-4 ângulos diferentes** para cada data sazonal, calculando o impacto financeiro de cada um.

```typescript
interface SeasonalOffer {
  id: string;
  title: string;
  description: string;
  seasonal_date: string; // Ex: "2025-02-14"
  seasonal_name: string; // Ex: "Dia dos Namorados"
  
  // Múltiplos ângulos criativos (3-4 opções diferentes)
  offer_angles: {
    angle_name: string; // Ex: "Compre 1 Leve 2", "Desafio Cashback", "Parceria Local"
    offer_type: 'bundle' | 'gamification' | 'upsell' | 'partnership' | 'early_bird' | 'referral' | 'guarantee' | 'experience' | 'scarcity' | 'giveaway' | 'percentage' | 'fixed';
    offer_description: string;
    discount_value?: string;
    
    // Cálculo financeiro
    original_price: number;
    offer_price: number;
    margin_impact: number; // % de impacto na margem (pode ser POSITIVO em upsells!)
    break_even_sales: number; // Quantas vendas precisa pra compensar
    
    target_audience: string;
    hook: string; // Gancho de copy para essa oferta
    why_this_works: string; // Por que esse ângulo funciona
  }[];
  
  // Orçamento baseado no que o cliente tem
  budget_options: {
    level: 'minimum' | 'recommended' | 'aggressive';
    budget: number;
    expected_reach: string;
    expected_leads: string;
    expected_sales: string;
    roi_estimate: string;
  }[];
  
  // Timeline
  timeline: {
    teaser_start: string; // Quando começar a esquentar
    promotion_start: string; // Quando lançar a oferta
    peak_day: string;
    promotion_end: string;
  };
  
  relevance_score: number; // 0-100
  reasoning: string; // Por que essa data é relevante para ESTE cliente
}
```

---

## 📊 Types TypeScript

```typescript
// src/types/intelligence.ts

/**
 * @file intelligence.ts
 * @description Tipos para o sistema de Client Intelligence
 * @module types
 */

export interface KnowledgeBase {
  profile: {
    business_name: string;
    segment: string;
    niche_details: string;
    location: string;
    operating_since?: string;
  };
  contact: {
    primary_name: string;
    phone: string;
    email: string;
    best_contact_time?: string;
  };
  financial: {
    monthly_fee: number;
    payment_day: number;
    average_ticket: number;
    monthly_ad_budget?: number;
    total_received?: number;
  };
  digital_presence: {
    instagram?: string;
    facebook?: string;
    website?: string;
    google_business?: string;
    other_platforms?: string[];
  };
  strategy: {
    main_objectives: string[];
    target_audience: string;
    unique_selling_points: string[];
    competitors?: string[];
    tone_of_voice?: string;
    content_pillars?: string[];
  };
  resources: {
    has_photos: boolean;
    has_videos: boolean;
    has_testimonials: boolean;
    brand_assets?: string;
    drive_folder?: string;
  };
  niche_analysis: {
    market_position: string;
    growth_opportunities: string[];
    main_challenges: string[];
    seasonal_peaks: string[];
  };
  meta: {
    completeness_score: number;
    last_updated: string;
    version: number;
  };
}

export type ContentType = 'post' | 'video' | 'reels' | 'stories' | 'carousel' | 'campaign';
export type ContentObjective = 'awareness' | 'engagement' | 'conversion' | 'retention';
export type ContentPriority = 'high' | 'medium' | 'low';
export type ContentEffort = 'quick' | 'medium' | 'complex';
export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'google';

export interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  content_type: ContentType;
  platform: Platform[];
  objective: ContentObjective;
  priority: ContentPriority;
  estimated_effort: ContentEffort;
  suggested_copy?: string;
  visual_suggestion?: string;
  hashtags?: string[];
  best_time_to_post?: string;
  reasoning: string;
}

export interface SeasonalOffer {
  id: string;
  title: string;
  description: string;
  seasonal_date: string;
  seasonal_name: string;
  offer_suggestion: {
    discount_type: 'percentage' | 'fixed' | 'bundle' | 'gift';
    discount_value?: string;
    offer_description: string;
    target_audience: string;
  };
  budget_suggestion: {
    min_budget: number;
    recommended_budget: number;
    expected_reach: string;
    expected_results: string;
  };
  timeline: {
    start_promotion: string;
    peak_day: string;
    end_promotion: string;
  };
  relevance_score: number;
  reasoning: string;
}

export interface ClientIntelligence {
  id: string;
  client_id: string;
  user_id: string;
  knowledge_base: KnowledgeBase;
  executive_summary: string;
  content_suggestions: ContentSuggestion[];
  seasonal_offers: SeasonalOffer[];
  ai_model: string;
  tokens_used: number;
  last_generated_at: string;
  generation_count: number;
  created_at: string;
  updated_at: string;
}

// DTO para regenerar
export interface RegenerateIntelligenceDTO {
  client_id: string;
  force?: boolean; // Força regeneração mesmo se recente
}
```

---

## 🤖 Prompt da IA para Geração

```typescript
// src/lib/ai/intelligence-prompt.ts

export function buildIntelligencePrompt(clientData: any): string {
  return `
Você é um especialista em marketing digital e gestão de tráfego pago. Analise as informações do cliente abaixo e gere insights PERSONALIZADOS para ESTE cliente específico.

## DADOS DO CLIENTE

**Informações Básicas:**
- Nome do Negócio: ${clientData.name}
- Segmento: ${clientData.segment}
- Localização: ${clientData.city || 'Não informado'}

**Contato:**
- Nome: ${clientData.contact_name || 'Não informado'}
- Telefone: ${clientData.contact_phone || 'Não informado'}
- Email: ${clientData.contact_email || 'Não informado'}

**Financeiro:**
- Valor Mensal (fee): R$ ${clientData.monthly_value || 0}
- Dia de Vencimento: ${clientData.due_day || 'Não informado'}
- Ticket Médio: R$ ${clientData.average_ticket || 'Não informado'}
- Margem de Lucro: ${clientData.profit_margin || 'Não informado'}%
- Orçamento de Ads: R$ ${clientData.ad_budget || 'Não informado'}

**Redes Sociais:**
${clientData.instagram ? `- Instagram: ${clientData.instagram}` : ''}
${clientData.facebook ? `- Facebook: ${clientData.facebook}` : ''}
${clientData.website ? `- Website: ${clientData.website}` : ''}

**Estratégia de Campanha do Cliente:**
${clientData.campaign_strategy || 'Não informado'}

**Briefing/Objetivos:**
${clientData.strategy_notes || 'Não informado'}

**Público-Alvo Definido:**
${clientData.target_audience || 'Não informado'}

**Links e Recursos:**
${clientData.drive_url ? `- Drive: ${clientData.drive_url}` : ''}
${clientData.ads_account_url ? `- Conta de Anúncios: ${clientData.ads_account_url}` : ''}

## SUA TAREFA

Gere um JSON com a seguinte estrutura. IMPORTANTE: Todas as sugestões devem ser ESPECÍFICAS para este cliente, baseadas na estratégia de campanha e objetivos dele.

{
  "knowledge_base": {
    // Base de conhecimento estruturada (veja schema)
  },
  "executive_summary": "Resumo executivo em 3-4 parágrafos sobre ESTE cliente específico, sua estratégia, pontos fortes e oportunidades",
  "content_suggestions": [
    // 5-8 sugestões de conteúdo PERSONALIZADAS baseadas na estratégia deste cliente
    // NÃO são sugestões genéricas de nicho
    // Cada sugestão deve ter "based_on" indicando qual informação do cliente gerou a sugestão
  ],
  "seasonal_offers": [
    // 3-5 ofertas sazonais com CÁLCULO DE MARGEM
    // Considerar ticket médio: R$ ${clientData.average_ticket}
    // Considerar margem de lucro: ${clientData.profit_margin}%
    // Sugerir diferentes ÂNGULOS de oferta (desconto, bônus, combo, etc)
    // Calcular impacto na margem e break-even
  ]
}

## REGRAS IMPORTANTES

1. **Seja ESPECÍFICO para ESTE cliente**: Não use sugestões genéricas de nicho. Baseie-se na estratégia de campanha definida pelo cliente.

2. **Sugestões de Conteúdo**: Cada sugestão deve estar conectada a um objetivo ou informação específica do cliente. Use o campo "based_on" para indicar.

3. **Ofertas com Cálculo de Margem**: 
   - O cliente tem ticket médio de R$ ${clientData.average_ticket || 'X'}
   - O cliente tem margem de lucro de ${clientData.profit_margin || 'X'}%
   - NÃO sugira descontos que eliminem a margem
   - Sugira 2-3 ângulos diferentes de oferta para cada data
   - Calcule o break-even (quantas vendas extras precisa para compensar o desconto)

4. **Orçamento**: Considere o orçamento de ads informado: R$ ${clientData.ad_budget || 'X'}

5. **Datas Sazonais**: Considere apenas datas relevantes para O NEGÓCIO DESTE CLIENTE nos próximos 3 meses.

6. **Calcule completeness_score**: De 0-100, baseado em quantas informações foram preenchidas.

7. **Retorne APENAS o JSON válido**, sem markdown ou explicações.
`;
}
```

---

## 🔌 API Routes

### Estrutura

```
src/app/api/intelligence/
├── route.ts                      # POST (gerar), GET (buscar por client_id)
├── [clientId]/
│   └── route.ts                  # GET (buscar), DELETE (remover)
├── regenerate/
│   └── route.ts                  # POST (forçar regeneração)
└── suggestions/
    └── [clientId]/
        └── route.ts              # GET (apenas sugestões)
```

### Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/intelligence` | Gera intelligence para um cliente |
| GET | `/api/intelligence?client_id=xxx` | Busca intelligence de um cliente |
| GET | `/api/intelligence/[clientId]` | Busca intelligence por ID do cliente |
| DELETE | `/api/intelligence/[clientId]` | Remove intelligence |
| POST | `/api/intelligence/regenerate` | Força regeneração |
| GET | `/api/intelligence/suggestions/[clientId]` | Retorna apenas sugestões |

---

## 🎨 Componentes

### Estrutura de Pastas

```
src/components/intelligence/
├── IntelligenceCard.tsx        # Card principal no cliente
├── ExecutiveSummary.tsx        # Resumo executivo visual
├── ContentSuggestions.tsx      # Lista de sugestões de conteúdo
├── SeasonalOffers.tsx          # Ofertas sazonais
├── KnowledgeBaseView.tsx       # Visualização da base de conhecimento
├── RegenerateButton.tsx        # Botão de regenerar
├── SuggestionCard.tsx          # Card individual de sugestão
├── OfferCard.tsx               # Card individual de oferta
├── CompletenessScore.tsx       # Indicador de completude
└── index.ts
```

### Componente: `IntelligenceCard` (Principal)

```tsx
/**
 * @file IntelligenceCard.tsx
 * @description Card principal de Client Intelligence
 * @module components/intelligence
 */
'use client';

import { useState } from 'react';
import { ClientIntelligence } from '@/types/intelligence';
import { GlassCard, Button } from '@/components/ui';
import { ExecutiveSummary } from './ExecutiveSummary';
import { ContentSuggestions } from './ContentSuggestions';
import { SeasonalOffers } from './SeasonalOffers';
import { CompletenessScore } from './CompletenessScore';
import { formatDistanceToNow } from '@/lib/utils';

interface IntelligenceCardProps {
  intelligence: ClientIntelligence | null;
  clientId: string;
  onRegenerate: () => Promise<void>;
  isLoading?: boolean;
}

type TabType = 'summary' | 'content' | 'offers';

export function IntelligenceCard({
  intelligence,
  clientId,
  onRegenerate,
  isLoading,
}: IntelligenceCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  // Se não tem intelligence ainda
  if (!intelligence) {
    return (
      <GlassCard className="p-6">
        <div className="text-center py-8">
          <span className="text-5xl mb-4 block">🧠</span>
          <h3 className="text-lg font-semibold text-white mb-2">
            Análise de IA não gerada
          </h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Clique no botão abaixo para gerar a base de conhecimento, 
            sugestões de conteúdo e ofertas sazonais personalizadas.
          </p>
          <Button onClick={handleRegenerate} loading={regenerating || isLoading}>
            <span className="mr-2">✨</span>
            Gerar Análise com IA
          </Button>
        </div>
      </GlassCard>
    );
  }

  const tabs = [
    { id: 'summary', label: '📋 Resumo', count: null },
    { id: 'content', label: '💡 Conteúdos', count: intelligence.content_suggestions.length },
    { id: 'offers', label: '🎯 Ofertas', count: intelligence.seasonal_offers.length },
  ];

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🧠 Client Intelligence
          </h3>
          <p className="text-sm text-zinc-500">
            Atualizado {formatDistanceToNow(intelligence.last_generated_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CompletenessScore score={intelligence.knowledge_base.meta.completeness_score} />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRegenerate}
            loading={regenerating}
          >
            🔄 Regenerar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/[0.08] pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'summary' && (
        <ExecutiveSummary 
          summary={intelligence.executive_summary}
          knowledgeBase={intelligence.knowledge_base}
        />
      )}
      {activeTab === 'content' && (
        <ContentSuggestions suggestions={intelligence.content_suggestions} />
      )}
      {activeTab === 'offers' && (
        <SeasonalOffers offers={intelligence.seasonal_offers} />
      )}
    </GlassCard>
  );
}
```

### Componente: `ExecutiveSummary`

```tsx
/**
 * @file ExecutiveSummary.tsx
 * @description Resumo executivo visual do cliente
 * @module components/intelligence
 */
'use client';

import { KnowledgeBase } from '@/types/intelligence';
import { GlassCard } from '@/components/ui';

interface ExecutiveSummaryProps {
  summary: string;
  knowledgeBase: KnowledgeBase;
}

export function ExecutiveSummary({ summary, knowledgeBase }: ExecutiveSummaryProps) {
  const { strategy, niche_analysis } = knowledgeBase;

  return (
    <div className="space-y-6">
      {/* Resumo em texto */}
      <div className="prose prose-invert max-w-none">
        <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </div>

      {/* Cards de Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Objetivos */}
        {strategy.main_objectives.length > 0 && (
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <h4 className="text-sm font-medium text-violet-400 mb-2">
              🎯 Objetivos Principais
            </h4>
            <ul className="space-y-1">
              {strategy.main_objectives.map((obj, i) => (
                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Diferenciais */}
        {strategy.unique_selling_points.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="text-sm font-medium text-emerald-400 mb-2">
              ✨ Diferenciais
            </h4>
            <ul className="space-y-1">
              {strategy.unique_selling_points.map((usp, i) => (
                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  {usp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Oportunidades */}
        {niche_analysis.growth_opportunities.length > 0 && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="text-sm font-medium text-blue-400 mb-2">
              📈 Oportunidades
            </h4>
            <ul className="space-y-1">
              {niche_analysis.growth_opportunities.map((opp, i) => (
                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {opp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Desafios */}
        {niche_analysis.main_challenges.length > 0 && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <h4 className="text-sm font-medium text-orange-400 mb-2">
              ⚠️ Desafios
            </h4>
            <ul className="space-y-1">
              {niche_analysis.main_challenges.map((challenge, i) => (
                <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  {challenge}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Público-Alvo */}
      {strategy.target_audience && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">
            👥 Público-Alvo
          </h4>
          <p className="text-zinc-300">{strategy.target_audience}</p>
        </div>
      )}
    </div>
  );
}
```

### Componente: `SuggestionCard`

```tsx
/**
 * @file SuggestionCard.tsx
 * @description Card de sugestão de conteúdo
 * @module components/intelligence
 */
'use client';

import { ContentSuggestion } from '@/types/intelligence';
import { GlassCard } from '@/components/ui';

interface SuggestionCardProps {
  suggestion: ContentSuggestion;
  onAddToCalendar?: (suggestion: ContentSuggestion) => void;
}

const typeEmoji: Record<string, string> = {
  post: '📸',
  video: '🎬',
  reels: '🎞️',
  stories: '📱',
  carousel: '🖼️',
  campaign: '🚀',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const effortLabels: Record<string, string> = {
  quick: '⚡ Rápido',
  medium: '🔧 Médio',
  complex: '🏗️ Complexo',
};

export function SuggestionCard({ suggestion, onAddToCalendar }: SuggestionCardProps) {
  return (
    <GlassCard className="p-4 hover:bg-white/[0.04] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xl">{typeEmoji[suggestion.content_type]}</span>
            <h4 className="font-medium text-white">{suggestion.title}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityColors[suggestion.priority]}`}>
              {suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
            </span>
            <span className="text-xs text-zinc-500">{effortLabels[suggestion.estimated_effort]}</span>
          </div>

          {/* Descrição */}
          <p className="text-sm text-zinc-400 mb-3">{suggestion.description}</p>

          {/* Plataformas */}
          <div className="flex items-center gap-2 mb-3">
            {suggestion.platform.map(p => (
              <span key={p} className="px-2 py-1 rounded-lg bg-white/[0.05] text-xs text-zinc-400">
                {p}
              </span>
            ))}
          </div>

          {/* Copy Sugerida */}
          {suggestion.suggested_copy && (
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] mb-3">
              <p className="text-xs text-zinc-500 mb-1">💬 Copy sugerida:</p>
              <p className="text-sm text-zinc-300 italic">"{suggestion.suggested_copy}"</p>
            </div>
          )}

          {/* Hashtags */}
          {suggestion.hashtags && suggestion.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestion.hashtags.map(tag => (
                <span key={tag} className="text-xs text-violet-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ação */}
        {onAddToCalendar && (
          <button
            onClick={() => onAddToCalendar(suggestion)}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-violet-400 transition-colors"
            title="Adicionar ao calendário"
          >
            📅
          </button>
        )}
      </div>

      {/* Reasoning */}
      <div className="mt-3 pt-3 border-t border-white/[0.05]">
        <p className="text-xs text-zinc-500">
          <span className="text-zinc-400">💡 Por que sugerimos:</span> {suggestion.reasoning}
        </p>
      </div>
    </GlassCard>
  );
}
```

---

## 🪝 Hook `useClientIntelligence`

```typescript
// src/hooks/useClientIntelligence.ts

/**
 * @file useClientIntelligence.ts
 * @description Hook para gerenciamento de Client Intelligence
 * @module hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { ClientIntelligence } from '@/types/intelligence';

export function useClientIntelligence(clientId: string) {
  const [intelligence, setIntelligence] = useState<ClientIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Buscar intelligence existente
  const fetchIntelligence = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/intelligence/${clientId}`);
      
      if (res.status === 404) {
        setIntelligence(null);
        return;
      }
      
      if (!res.ok) throw new Error('Failed to fetch intelligence');
      
      const data = await res.json();
      setIntelligence(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Gerar/Regenerar intelligence
  const generateIntelligence = useCallback(async (force = false) => {
    if (!clientId) return;
    
    try {
      setGenerating(true);
      const res = await fetch('/api/intelligence/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, force }),
      });
      
      if (!res.ok) throw new Error('Failed to generate intelligence');
      
      const data = await res.json();
      setIntelligence(data.data);
      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  return {
    intelligence,
    loading,
    generating,
    error,
    fetchIntelligence,
    generateIntelligence,
    regenerate: () => generateIntelligence(true),
  };
}
```

---

## 🔄 Trigger Automático

### No formulário de cliente (após salvar)

```typescript
// Em ClientForm.tsx ou similar

const handleSaveClient = async (data: ClientFormData) => {
  try {
    // 1. Salva o cliente
    const client = isEditing 
      ? await updateClient(clientId, data)
      : await createClient(data);
    
    // 2. Dispara geração de intelligence em background
    // (não bloqueia o usuário)
    fetch('/api/intelligence/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        client_id: client.id,
        force: isEditing // Força se for edição
      }),
    }).catch(console.error); // Silencioso em caso de erro
    
    // 3. Feedback pro usuário
    toast.success(isEditing ? 'Cliente atualizado!' : 'Cliente criado!');
    
  } catch (error) {
    toast.error('Erro ao salvar cliente');
  }
};
```

---

## 🎨 Integração no Card do Cliente

Adicionar nova aba "🧠 IA" no modal do cliente:

```tsx
// Nas tabs do cliente
const tabs = [
  { id: 'info', label: 'Informações' },
  { id: 'strategy', label: 'Estratégia' },
  { id: 'credentials', label: 'Credenciais' },
  { id: 'reports', label: `Relatórios (${reportsCount})` },
  { id: 'payments', label: `Pagamentos (${paymentsCount})` },
  { id: 'intelligence', label: '🧠 IA' }, // NOVA ABA
];

// Conteúdo da aba
{activeTab === 'intelligence' && (
  <IntelligenceCard
    intelligence={intelligence}
    clientId={client.id}
    onRegenerate={regenerateIntelligence}
    isLoading={generatingIntelligence}
  />
)}
```

---

## ✅ Checklist de Implementação

### Database
- [ ] Migration para tabela `client_intelligence`
- [ ] RLS Policy configurada
- [ ] Índices criados

### Types
- [ ] src/types/intelligence.ts com todos os types

### API Routes
- [ ] POST /api/intelligence (gerar)
- [ ] GET /api/intelligence/[clientId] (buscar)
- [ ] POST /api/intelligence/regenerate (regenerar)
- [ ] DELETE /api/intelligence/[clientId] (remover)

### Lib IA
- [ ] src/lib/ai/intelligence-prompt.ts (prompt builder)
- [ ] src/lib/ai/generate-intelligence.ts (chamada à API do Claude)

### Hook
- [ ] src/hooks/useClientIntelligence.ts

### Componentes
- [ ] IntelligenceCard.tsx
- [ ] ExecutiveSummary.tsx
- [ ] ContentSuggestions.tsx
- [ ] SeasonalOffers.tsx
- [ ] SuggestionCard.tsx
- [ ] OfferCard.tsx
- [ ] CompletenessScore.tsx
- [ ] RegenerateButton.tsx

### Integração
- [ ] Nova aba "🧠 IA" no modal do cliente
- [ ] Trigger automático ao criar/editar cliente
- [ ] Toast de feedback

---

*Última atualização: Dezembro 2025*
