# 🚀 PROMPT: Implementar Templates Operacionais Completos

> **IMPORTANTE**: Leia este documento INTEIRO antes de começar. Não pule nenhuma seção.

---

## 📋 CONTEXTO

O MARCOLA já tem a **estrutura** de templates operacionais implementada:
- Tabela `task_templates` com campo `category: 'operational' | 'niche' | 'custom'`
- Recorrência inclui `'every_3_days'`
- Campo `is_system: true` para templates padrão

**O QUE FALTA:**
1. ❌ Seed dos 48 templates operacionais no banco
2. ❌ Visualização separada (Operacionais vs Nicho) no front-end
3. ❌ Aplicação automática de templates operacionais ao criar cliente
4. ❌ Filtros por categoria na página de tarefas

---

## 🔍 FASE 0: ANÁLISE (OBRIGATÓRIO)

Antes de implementar QUALQUER coisa, você DEVE:

### 0.1 Verificar banco de dados

```sql
-- Executar no Supabase SQL Editor e colar resultado aqui:

-- 1. Verificar estrutura da tabela task_templates
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'task_templates';

-- 2. Verificar se já existem templates operacionais
SELECT category, COUNT(*) as total 
FROM task_templates 
GROUP BY category;

-- 3. Verificar templates com is_system = true
SELECT id, category, title, recurrence 
FROM task_templates 
WHERE is_system = true 
LIMIT 10;
```

### 0.2 Verificar arquivos existentes

```bash
# Verificar se existem componentes de templates
ls -la src/components/tasks/
ls -la src/components/templates/

# Verificar hooks
ls -la src/hooks/use*Template*

# Verificar API routes
ls -la src/app/api/templates/
```

### 0.3 Verificar tipos TypeScript

```bash
# Ver definição de TaskTemplate
grep -r "TaskTemplate" src/types/
grep -r "TaskCategory" src/types/
```

**APÓS ANÁLISE, RESPONDA:**
- [ ] Tabela task_templates tem campo `category`? 
- [ ] Tabela tem campo `is_system`?
- [ ] Existem templates operacionais no banco? Quantos?
- [ ] Existe componente TemplateSelector?
- [ ] Existe página /templates?

---

## 📊 FASE 1: SEED DOS TEMPLATES OPERACIONAIS

Se não existirem os 48 templates operacionais, criar este seed:

### 1.1 Criar arquivo de migration

Criar arquivo: `supabase/migrations/YYYYMMDD_seed_operational_templates.sql`

```sql
-- ═══════════════════════════════════════════════════════════════
-- SEED: TEMPLATES OPERACIONAIS (48 templates)
-- Categoria: 'operational' | is_system: true
-- ═══════════════════════════════════════════════════════════════

-- Limpar templates operacionais antigos (se existirem)
DELETE FROM task_templates WHERE category = 'operational' AND is_system = true;

-- ═══════════════════════════════════════════════════════════════
-- DIÁRIAS (11 templates) - Código: D01-D11
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, is_system, order_index) VALUES
('operational', NULL, 'D01 - Checar Performance Básica', 'Verificar CPC, CTR, CPM, CPA, ROAS de todas as campanhas ativas', 'daily', 'high', false, true, 1),
('operational', NULL, 'D02 - Verificar Status de Anúncios', 'Checar reprovações, aprendizado limitado, quedas abruptas de performance', 'daily', 'high', false, true, 2),
('operational', NULL, 'D03 - Checar Orçamento', 'Verificar distribuição de budget e gastos do dia', 'daily', 'high', false, true, 3),
('operational', NULL, 'D04 - Microajustes de Lances', 'Ajustar lances se necessário baseado na performance do dia', 'daily', 'medium', false, true, 4),
('operational', NULL, 'D05 - Verificar Saturação de Públicos', 'Checar frequência de exibição e tamanho de públicos', 'daily', 'medium', false, true, 5),
('operational', NULL, 'D06 - Responder Cliente', 'Checar e responder mensagens do cliente (meta: até 2h)', 'daily', 'high', false, true, 6),
('operational', NULL, 'D07 - Monitorar Negócio do Cliente', 'Verificar promoções ativas, horários de pico, imprevistos', 'daily', 'medium', false, true, 7),
('operational', NULL, 'D08 - Atualizar Insights Diários', 'Registrar observações e insights do dia no sistema', 'daily', 'low', false, true, 8),
('operational', NULL, 'D09 - Checar Concorrência', 'Analisar anúncios ativos dos concorrentes diretos', 'daily', 'medium', false, true, 9),
('operational', NULL, 'D10 - Monitorar Reputação', 'Verificar avaliações no iFood/Google e tendências de reclamações', 'daily', 'medium', false, true, 10),
('operational', NULL, 'D11 - Checar Funil/SAC', 'Acompanhar WhatsApp, Instagram DM, taxa de resposta do atendimento', 'daily', 'medium', false, true, 11);

-- ═══════════════════════════════════════════════════════════════
-- A CADA 3 DIAS (8 templates) - Código: T01-T08
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, is_system, order_index) VALUES
('operational', NULL, 'T01 - Pausar Anúncios Fracos', 'Identificar e pausar criativos com CTR muito baixo (< 0.8%)', 'every_3_days', 'high', false, true, 12),
('operational', NULL, 'T02 - Duplicar Criativos Vencedores', 'Escalar criativos com boa performance para outros públicos', 'every_3_days', 'high', false, true, 13),
('operational', NULL, 'T03 - Ajustar Segmentações', 'Revisar e ajustar públicos frio/morno/quente', 'every_3_days', 'medium', false, true, 14),
('operational', NULL, 'T04 - Revisar Mix de Criativos', 'Balancear proporção entre estáticos e vídeos', 'every_3_days', 'medium', false, true, 15),
('operational', NULL, 'T05 - Novas Variações de Copy', 'Criar variações de texto para prevenir fadiga de anúncios', 'every_3_days', 'medium', false, true, 16),
('operational', NULL, 'T06 - Atualizar Criativos Saturados', 'Criar novas versões de criativos que estão cansando', 'every_3_days', 'medium', false, true, 17),
('operational', NULL, 'T07 - Revisar Mix de Ofertas', 'Ajustar promoções baseado em margem e giro de vendas', 'every_3_days', 'medium', false, true, 18),
('operational', NULL, 'T08 - Auditoria Leve de Funil', 'Verificar tempo de resposta, scripts de atendimento, páginas quebradas', 'every_3_days', 'medium', false, true, 19);

-- ═══════════════════════════════════════════════════════════════
-- SEMANAIS (8 templates) - Código: S01-S08
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, is_system, order_index) VALUES
('operational', NULL, 'S01 - Relatório de Performance Semanal', 'Gerar relatório completo: CPC, CPM, CTR, CPA por criativo + ROAS', 'weekly', 'high', true, true, 20),
('operational', NULL, 'S02 - Análise de Funil Completa', 'Mapear: Impressão → Clique → Conversa → Venda', 'weekly', 'high', false, true, 21),
('operational', NULL, 'S03 - Ranking de Criativos', 'Identificar top 3 vencedores e bottom 3 perdedores', 'weekly', 'medium', false, true, 22),
('operational', NULL, 'S04 - Reunião/Update com Cliente', 'Apresentar pontos positivos, alertas e recomendações', 'weekly', 'high', true, true, 23),
('operational', NULL, 'S05 - Planejamento Criativo Semanal', 'Definir criativos a serem produzidos na próxima semana', 'weekly', 'medium', false, true, 24),
('operational', NULL, 'S06 - Revisar Pauta de Conteúdo', 'Criar/revisar calendário de posts para redes sociais', 'weekly', 'medium', false, true, 25),
('operational', NULL, 'S07 - Atualizar Google Meu Negócio', 'Adicionar fotos, posts e promoções novas no GMB', 'weekly', 'low', false, true, 26),
('operational', NULL, 'S08 - Testar 1 Público Novo', 'Criar e testar pelo menos 1 público novo por semana', 'weekly', 'medium', false, true, 27);

-- ═══════════════════════════════════════════════════════════════
-- QUINZENAIS (10 templates) - Código: Q01-Q10
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, is_system, order_index) VALUES
('operational', NULL, 'Q01 - Deep Analysis CAC/LTV', 'Análise profunda de Custo de Aquisição e Lifetime Value', 'biweekly', 'high', false, true, 28),
('operational', NULL, 'Q02 - Análise de Recorrência', 'Verificar frequência de compra/visita dos clientes finais', 'biweekly', 'medium', false, true, 29),
('operational', NULL, 'Q03 - Melhores Dias e Horários', 'Identificar padrões de performance por dia/hora', 'biweekly', 'medium', false, true, 30),
('operational', NULL, 'Q04 - Detectar Padrões', 'Identificar quedas ou saltos de performance e suas causas', 'biweekly', 'medium', false, true, 31),
('operational', NULL, 'Q05 - Testes de Arquitetura', 'Testar estruturas diferentes: CBO vs ABO, Campaign vs AdSet', 'biweekly', 'medium', false, true, 32),
('operational', NULL, 'Q06 - Testar Novas Abordagens', 'Experimentar: UGC, depoimentos, autoridade, bastidores', 'biweekly', 'medium', false, true, 33),
('operational', NULL, 'Q07 - Testar Ofertas Fortes', 'Criar e testar novas ofertas de alto impacto', 'biweekly', 'high', false, true, 34),
('operational', NULL, 'Q08 - Criar Criativos Premium', 'Desenvolver criativos "flagship" de alta qualidade', 'biweekly', 'medium', false, true, 35),
('operational', NULL, 'Q09 - Produzir Vídeos Motion', 'Criar vídeos de impacto com motion graphics', 'biweekly', 'medium', false, true, 36),
('operational', NULL, 'Q10 - Análise Profunda de Concorrência', 'Pesquisar melhores campanhas dos concorrentes e documentar oportunidades', 'biweekly', 'medium', false, true, 37);

-- ═══════════════════════════════════════════════════════════════
-- MENSAIS (11 templates) - Código: M01-M11
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (category, segment, title, description, recurrence, priority, notify_client, is_system, order_index) VALUES
('operational', NULL, 'M01 - Reunião Estratégica Mensal', 'Revisão completa do mês, análise de ROI, plano de ação 30 dias', 'monthly', 'high', true, true, 38),
('operational', NULL, 'M02 - Revisão de Metas', 'Avaliar metas de faturamento e ajustar expectativas', 'monthly', 'high', false, true, 39),
('operational', NULL, 'M03 - Reavaliação de Persona', 'Revisar público-alvo e mensagens-chave da comunicação', 'monthly', 'medium', false, true, 40),
('operational', NULL, 'M04 - Calendário de Campanhas', 'Planejar campanhas e ações do próximo mês', 'monthly', 'medium', false, true, 41),
('operational', NULL, 'M05 - Mapear Datas Promocionais', 'Identificar oportunidades sazonais e datas comemorativas', 'monthly', 'medium', false, true, 42),
('operational', NULL, 'M06 - Criar Campanhas Premium', 'Desenvolver campanhas de alto impacto para o mês', 'monthly', 'high', false, true, 43),
('operational', NULL, 'M07 - Auditoria Completa de Funil', 'Analisar: WhatsApp → Atendimento → Fechamento → Pós-venda', 'monthly', 'high', false, true, 44),
('operational', NULL, 'M08 - Análise de Churn', 'Identificar pontos de retenção e motivos de cancelamento', 'monthly', 'medium', false, true, 45),
('operational', NULL, 'M09 - Atualizar Scripts', 'Revisar e melhorar scripts de atendimento', 'monthly', 'medium', false, true, 46),
('operational', NULL, 'M10 - Auditoria de Marca', 'Verificar padronização visual e tom de voz', 'monthly', 'low', false, true, 47),
('operational', NULL, 'M11 - Relatório de Tendências', 'Pesquisar tendências do setor e novas oportunidades', 'monthly', 'medium', false, true, 48);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════

-- Confirmar quantidade
SELECT 
  recurrence,
  COUNT(*) as total
FROM task_templates 
WHERE category = 'operational' AND is_system = true
GROUP BY recurrence
ORDER BY 
  CASE recurrence 
    WHEN 'daily' THEN 1 
    WHEN 'every_3_days' THEN 2 
    WHEN 'weekly' THEN 3 
    WHEN 'biweekly' THEN 4 
    WHEN 'monthly' THEN 5 
  END;

-- Esperado:
-- daily: 11
-- every_3_days: 8
-- weekly: 8
-- biweekly: 10
-- monthly: 11
-- TOTAL: 48
```

### 1.2 Executar no Supabase

1. Abrir Supabase Dashboard
2. Ir em SQL Editor
3. Colar e executar o seed
4. Verificar resultado

**VALIDAR:**
```sql
SELECT COUNT(*) FROM task_templates WHERE category = 'operational';
-- Deve retornar: 48
```

---

## 🎨 FASE 2: VISUALIZAÇÃO NO FRONT-END

### 2.1 Criar/Atualizar TemplateList com separação por categoria

Arquivo: `src/components/templates/TemplateList.tsx`

```tsx
'use client';

import { useState } from 'react';
import { TaskTemplate } from '@/types/task';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Briefcase, 
  Tag, 
  Clock, 
  Calendar,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface TemplateListProps {
  templates: TaskTemplate[];
  onSelectTemplate?: (template: TaskTemplate) => void;
  showCategoryFilter?: boolean;
}

const RECURRENCE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  daily: { label: 'Diária', icon: <Clock className="w-3 h-3" />, color: 'text-red-400' },
  every_3_days: { label: 'A cada 3 dias', icon: <CalendarDays className="w-3 h-3" />, color: 'text-orange-400' },
  weekly: { label: 'Semanal', icon: <Calendar className="w-3 h-3" />, color: 'text-yellow-400' },
  biweekly: { label: 'Quinzenal', icon: <CalendarRange className="w-3 h-3" />, color: 'text-green-400' },
  monthly: { label: 'Mensal', icon: <CalendarCheck className="w-3 h-3" />, color: 'text-blue-400' },
};

export function TemplateList({ templates, onSelectTemplate, showCategoryFilter = true }: TemplateListProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'operational' | 'niche'>('all');
  const [expandedRecurrence, setExpandedRecurrence] = useState<string | null>('daily');

  // Separar templates por categoria
  const operationalTemplates = templates.filter(t => t.category === 'operational');
  const nicheTemplates = templates.filter(t => t.category === 'niche');

  // Filtrar baseado na seleção
  const filteredTemplates = categoryFilter === 'all' 
    ? templates 
    : categoryFilter === 'operational' 
      ? operationalTemplates 
      : nicheTemplates;

  // Agrupar por recorrência
  const groupedByRecurrence = filteredTemplates.reduce((acc, template) => {
    const key = template.recurrence || 'none';
    if (!acc[key]) acc[key] = [];
    acc[key].push(template);
    return acc;
  }, {} as Record<string, TaskTemplate[]>);

  const recurrenceOrder = ['daily', 'every_3_days', 'weekly', 'biweekly', 'monthly', 'none'];

  return (
    <div className="space-y-4">
      {/* Filtro de Categoria */}
      {showCategoryFilter && (
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              categoryFilter === 'all'
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            Todos ({templates.length})
          </button>
          <button
            onClick={() => setCategoryFilter('operational')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              categoryFilter === 'operational'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Operacionais ({operationalTemplates.length})
          </button>
          <button
            onClick={() => setCategoryFilter('niche')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              categoryFilter === 'niche'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            <Tag className="w-4 h-4" />
            Por Nicho ({nicheTemplates.length})
          </button>
        </div>
      )}

      {/* Lista agrupada por recorrência */}
      <div className="space-y-3">
        {recurrenceOrder.map(recurrence => {
          const templatesInGroup = groupedByRecurrence[recurrence];
          if (!templatesInGroup || templatesInGroup.length === 0) return null;

          const recurrenceInfo = RECURRENCE_LABELS[recurrence] || { 
            label: 'Sem recorrência', 
            icon: null, 
            color: 'text-zinc-400' 
          };
          const isExpanded = expandedRecurrence === recurrence;

          return (
            <GlassCard key={recurrence} className="overflow-hidden">
              {/* Header do grupo */}
              <button
                onClick={() => setExpandedRecurrence(isExpanded ? null : recurrence)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={recurrenceInfo.color}>
                    {recurrenceInfo.icon}
                  </span>
                  <span className="font-medium text-white">
                    {recurrenceInfo.label}
                  </span>
                  <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {templatesInGroup.length} templates
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {/* Lista de templates */}
              {isExpanded && (
                <div className="border-t border-white/5">
                  {templatesInGroup.map(template => (
                    <div
                      key={template.id}
                      onClick={() => onSelectTemplate?.(template)}
                      className="px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {template.category === 'operational' ? (
                              <Briefcase className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Tag className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="font-medium text-white">
                              {template.title}
                            </span>
                          </div>
                          {template.description && (
                            <p className="text-sm text-zinc-400 mt-1 ml-6">
                              {template.description}
                            </p>
                          )}
                        </div>
                        {template.segment && (
                          <span className="text-xs text-zinc-500 bg-white/5 px-2 py-1 rounded">
                            {template.segment}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
```

### 2.2 Criar/Atualizar página de Templates

Arquivo: `src/app/(dashboard)/templates/page.tsx`

```tsx
import { Metadata } from 'next';
import { TemplatesPageContent } from '@/components/templates/TemplatesPageContent';

export const metadata: Metadata = {
  title: 'Templates de Tarefas | MARCOLA',
  description: 'Gerenciar templates operacionais e por nicho',
};

export default function TemplatesPage() {
  return <TemplatesPageContent />;
}
```

Arquivo: `src/components/templates/TemplatesPageContent.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { TemplateList } from './TemplateList';
import { PageHeader } from '@/components/ui/PageHeader';
import { Briefcase, Tag, Loader2 } from 'lucide-react';

export function TemplatesPageContent() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ operational: 0, niche: 0 });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
      
      // Calcular stats
      const operational = data.filter((t: any) => t.category === 'operational').length;
      const niche = data.filter((t: any) => t.category === 'niche').length;
      setStats({ operational, niche });
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates de Tarefas"
        description="Gerencie templates operacionais e por nicho"
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Briefcase className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.operational}</p>
              <p className="text-sm text-zinc-400">Templates Operacionais</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Tag className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.niche}</p>
              <p className="text-sm text-zinc-400">Templates por Nicho</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Lista de templates */}
      <TemplateList templates={templates} />
    </div>
  );
}
```

### 2.3 Adicionar link no menu/sidebar

Verificar e adicionar em `src/components/layout/Sidebar.tsx` ou equivalente:

```tsx
{
  name: 'Templates',
  href: '/templates',
  icon: Briefcase, // ou LayoutTemplate
}
```

---

## ⚙️ FASE 3: API ROUTE PARA TEMPLATES

### 3.1 Criar/Verificar API de templates

Arquivo: `src/app/api/templates/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category'); // 'operational' | 'niche' | null
    const segment = searchParams.get('segment'); // para filtrar por nicho específico

    let query = supabase
      .from('task_templates')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    // Filtrar por categoria
    if (category) {
      query = query.eq('category', category);
    }

    // Filtrar por segmento (para templates de nicho)
    if (segment) {
      query = query.eq('segment', segment);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API de templates:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
```

### 3.2 API para aplicar templates a um cliente

Arquivo: `src/app/api/templates/apply/route.ts`

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, templateIds, applyOperational = true } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 });
    }

    // Buscar templates selecionados
    let query = supabase
      .from('task_templates')
      .select('*')
      .eq('is_active', true);

    if (templateIds && templateIds.length > 0) {
      query = query.in('id', templateIds);
    }

    if (applyOperational) {
      query = query.or(`category.eq.operational,id.in.(${templateIds?.join(',') || ''})`);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      return NextResponse.json({ error: templatesError.message }, { status: 500 });
    }

    // Criar tarefas baseadas nos templates
    const today = new Date();
    const tasks = templates.map(template => ({
      client_id: clientId,
      user_id: user.id,
      template_id: template.id,
      category: template.category,
      title: template.title,
      description: template.description,
      priority: template.priority,
      is_recurring: !!template.recurrence,
      recurrence: template.recurrence,
      notify_client: template.notify_client,
      notify_message: template.notify_message,
      due_date: calculateDueDate(today, template.recurrence),
      status: 'todo',
    }));

    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      created: createdTasks.length,
      tasks: createdTasks 
    });
  } catch (error) {
    console.error('Erro ao aplicar templates:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

function calculateDueDate(baseDate: Date, recurrence: string | null): string {
  const date = new Date(baseDate);
  
  switch (recurrence) {
    case 'daily':
      // Hoje
      break;
    case 'every_3_days':
      date.setDate(date.getDate() + 3);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      // Sem recorrência = 7 dias
      date.setDate(date.getDate() + 7);
  }

  return date.toISOString().split('T')[0];
}
```

---

## 🧪 FASE 4: TESTAR LOCALMENTE

### 4.1 Verificar banco de dados

```sql
-- No Supabase SQL Editor:
SELECT category, recurrence, COUNT(*) 
FROM task_templates 
WHERE is_system = true 
GROUP BY category, recurrence
ORDER BY category, recurrence;
```

**Esperado:**
```
operational | daily         | 11
operational | every_3_days  | 8
operational | weekly        | 8
operational | biweekly      | 10
operational | monthly       | 11
```

### 4.2 Testar API

```bash
# Terminal local
curl http://localhost:3000/api/templates | jq '.[] | .category' | sort | uniq -c
```

**Esperado:** 48 operational, X niche

### 4.3 Testar página

1. Rodar `npm run dev`
2. Acessar http://localhost:3000/templates
3. Verificar:
   - [ ] Cards de resumo aparecem (Operacionais: 48, Por Nicho: X)
   - [ ] Filtros funcionam (Todos, Operacionais, Por Nicho)
   - [ ] Templates agrupados por recorrência
   - [ ] Expandir/colapsar grupos funciona
   - [ ] Cores e ícones corretos

### 4.4 Testar no Dashboard

1. Ir para página de Tarefas
2. Verificar se aparece opção de filtrar por categoria
3. Criar nova tarefa a partir de template

---

## ✅ FASE 5: CONFIRMAÇÃO

Após implementar, responda:

```
## ✅ IMPLEMENTAÇÃO CONCLUÍDA

### Banco de Dados
- [ ] 48 templates operacionais inseridos
- [ ] Verificado com query SQL

### Front-end
- [ ] Página /templates criada e funcionando
- [ ] Filtros por categoria (Operacionais/Nicho) funcionando
- [ ] Agrupamento por recorrência funcionando
- [ ] Link no menu/sidebar adicionado

### API
- [ ] GET /api/templates funcionando
- [ ] GET /api/templates?category=operational funcionando
- [ ] POST /api/templates/apply funcionando

### Testes
- [ ] npm run dev sem erros
- [ ] npm run build sem erros
- [ ] Página carrega corretamente
- [ ] Dados aparecem corretamente

### Screenshots
[Anexar screenshots da página funcionando]
```

---

## 🚨 REGRAS CRÍTICAS

1. **SEMPRE testar localmente** antes de reportar como concluído
2. **NUNCA deixar componente sem visualização** - se criou, tem que aparecer no front
3. **SEMPRE verificar build** - `npm run build` não pode dar erro
4. **SEMPRE verificar tipos** - `npm run type-check` não pode dar erro
5. **SEMPRE documentar** - o que foi alterado/criado

---

## 📝 NOTAS FINAIS

Se encontrar algum problema:
1. Documente o erro exato
2. Mostre o código relevante
3. Proponha solução
4. Aguarde aprovação antes de implementar algo diferente do especificado

**PRÓXIMO PASSO APÓS CONCLUSÃO:**
Implementar Team Management & Task Assignment (Sistema de atribuição por função/pessoa)

---

*Prompt criado em Dezembro 2025 para o projeto MARCOLA Gestor de Tráfegos*
