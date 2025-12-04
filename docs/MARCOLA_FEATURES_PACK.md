# 🚀 MARCOLA - Pacote de Features Premium

> **Documentação completa** para implementar o sistema de tarefas operacionais, checklists, auditorias e features de alto padrão.

**Versão:** 1.0  
**Data:** Dezembro 2025  
**Baseado em:** Pesquisa de mercado para agências de alto padrão

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Sistema de Templates Operacionais](#2-sistema-de-templates-operacionais)
3. [Checklists de Rotina](#3-checklists-de-rotina)
4. [Sistema de Auditorias](#4-sistema-de-auditorias)
5. [Features Premium de Diferenciação](#5-features-premium-de-diferenciação)
6. [**🆕 Team Management & Task Assignment**](#6-team-management--task-assignment)
7. [Schema de Banco de Dados](#7-schema-de-banco-de-dados)
8. [Componentes React](#8-componentes-react)
9. [API Routes](#9-api-routes)
10. [Prompt de Implementação](#10-prompt-de-implementação)

---

## 1. Visão Geral

### O que este pacote adiciona ao MARCOLA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MARCOLA - ESTADO ATUAL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✅ Clientes (CRUD, Briefing, Credenciais)                                  │
│  ✅ Tarefas (Templates por NICHO - Fitness, Delivery, etc)                  │
│  ✅ Calendário de Conteúdo                                                  │
│  ✅ Client Intelligence (Knowledge Base, Sugestões, Ofertas)                │
│  ✅ Relatórios e Análises                                                   │
│  ✅ Financeiro                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOVAS FEATURES (ESTE PACOTE)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  🆕 Templates OPERACIONAIS (independente de nicho)                          │
│     ├── Diárias: Monitoramento, SAC, Concorrência                          │
│     ├── A cada 3 dias: Otimizações táticas, Criativos                      │
│     ├── Semanais: Relatórios, Reuniões, SEO Local                          │
│     ├── Quinzenais: Deep Analysis, Testes estruturais                      │
│     └── Mensais: Estratégia, Auditoria completa, Branding                  │
│                                                                             │
│  🆕 Checklists de Rotina (verificações rápidas)                            │
│     ├── Checklist Diário de Performance                                    │
│     ├── Checklist de Otimização (3 dias)                                   │
│     ├── Checklist Semanal de Qualidade                                     │
│     └── Checklist Mensal de Auditoria                                      │
│                                                                             │
│  🆕 Sistema de Auditorias                                                   │
│     ├── Auditoria de Funil (WhatsApp → Atendimento → Venda)                │
│     ├── Auditoria de Concorrência                                          │
│     ├── Auditoria de Marca/Branding                                        │
│     └── Auditoria Fantasma (Cliente Oculto)                                │
│                                                                             │
│  🆕 Features Premium de Alto Padrão                                         │
│     ├── Health Score do Cliente                                            │
│     ├── Relatório em Vídeo (integração Loom)                               │
│     ├── Boletim de Oportunidades                                           │
│     └── Dashboard de Inteligência de Mercado                               │
│                                                                             │
│  🆕 Team Management & Task Assignment                                       │
│     ├── Perfis/Funções: Gestor de Tráfego, Editor, Designer, etc           │
│     ├── Membros da Equipe: Colaboradores com acesso controlado             │
│     ├── Atribuição de Tarefas: Delegar por função ou pessoa                │
│     ├── Níveis de Acesso: Admin, Editor, Viewer                            │
│     └── Notificações: WhatsApp ou acesso à plataforma                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Diferença entre Templates por NICHO vs OPERACIONAIS

| Tipo | O que é | Exemplo |
|------|---------|---------|
| **Por Nicho** | Tarefas específicas do segmento do cliente | "Criar campanha de aulas experimentais" (Fitness) |
| **Operacional** | Tarefas padrão de TODO gestor de tráfego | "Checar CPC, CTR, CPM de todas as campanhas" |

**Por que precisamos dos dois?**
- Templates por nicho: Definem O QUE fazer para aquele tipo de negócio
- Templates operacionais: Definem COMO gerenciar o tráfego (independente do negócio)

---

## 2. Sistema de Templates Operacionais

### 2.1 Templates DIÁRIOS

| ID | Tarefa | Descrição | Tempo Est. |
|----|--------|-----------|------------|
| D01 | **Checar Performance Básica** | Verificar CPC, CTR, CPM, CPA, ROAS de todas as campanhas ativas | 15min |
| D02 | **Verificar Status de Anúncios** | Checar reprovações, aprendizado limitado, quedas abruptas | 10min |
| D03 | **Checar Orçamento** | Verificar distribuição de budget e gastos do dia | 5min |
| D04 | **Microajustes de Lances** | Ajustar lances se necessário baseado na performance | 10min |
| D05 | **Verificar Saturação de Públicos** | Checar frequência e tamanho de públicos | 10min |
| D06 | **Responder Cliente** | Checar e responder mensagens (meta: até 2h) | 15min |
| D07 | **Monitorar Negócio do Cliente** | Ver promoções, horários de pico, imprevistos | 10min |
| D08 | **Atualizar Insights Diários** | Registrar observações do dia no sistema | 5min |
| D09 | **Checar Concorrência** | Analisar anúncios ativos dos concorrentes | 15min |
| D10 | **Monitorar Reputação** | Verificar avaliações iFood/Google (delivery) | 10min |
| D11 | **Checar Funil/SAC** | Acompanhar WhatsApp, Instagram, taxa de resposta | 10min |

**Tempo total diário estimado: ~2h por cliente**

### 2.2 Templates A CADA 3 DIAS

| ID | Tarefa | Descrição | Tempo Est. |
|----|--------|-----------|------------|
| T01 | **Pausar Anúncios Fracos** | Pausar criativos com CTR muito baixo | 15min |
| T02 | **Duplicar Vencedores** | Escalar criativos com boa performance | 15min |
| T03 | **Ajustar Segmentações** | Revisar públicos frio/morno/quente | 20min |
| T04 | **Revisar Mix de Criativos** | Balancear estáticos vs vídeos | 15min |
| T05 | **Novas Variações de Copy** | Criar variações para prevenir fadiga | 30min |
| T06 | **Atualizar Criativos Saturados** | Novas versões de criativos cansados | 45min |
| T07 | **Revisar Mix de Ofertas** | Ajustar promoções baseado em margem/giro | 20min |
| T08 | **Auditoria Leve de Funil** | Tempo de resposta, scripts, páginas | 20min |

**Tempo total a cada 3 dias: ~3h por cliente**

### 2.3 Templates SEMANAIS

| ID | Tarefa | Descrição | Tempo Est. |
|----|--------|-----------|------------|
| S01 | **Relatório de Performance** | CPC, CPM, CTR, CPA por criativo + ROAS | 1h |
| S02 | **Análise de Funil** | Impressão → Clique → Conversa → Venda | 30min |
| S03 | **Identificar Vencedores/Perdedores** | Ranking de criativos por performance | 20min |
| S04 | **Reunião/Update com Cliente** | Pontos positivos, alertas, recomendações | 30min |
| S05 | **Planejamento Criativo** | Definir criativos da próxima semana | 1h |
| S06 | **Pauta de Conteúdo** | Criar/revisar calendário de posts | 30min |
| S07 | **Atualizar Google Meu Negócio** | Fotos, posts, promoções novas | 30min |
| S08 | **Testar 1 Público Novo** | Criar novo público para teste | 30min |

**Tempo total semanal: ~5h por cliente**

### 2.4 Templates QUINZENAIS

| ID | Tarefa | Descrição | Tempo Est. |
|----|--------|-----------|------------|
| Q01 | **Deep Analysis CAC/LTV** | Análise profunda de custo de aquisição e lifetime value | 1h |
| Q02 | **Análise de Recorrência** | Frequência de compra/visita dos clientes | 45min |
| Q03 | **Melhores Dias/Horários** | Identificar padrões de performance | 30min |
| Q04 | **Detectar Padrões** | Identificar quedas ou saltos de performance | 30min |
| Q05 | **Testes de Arquitetura** | Testar CBO vs ABO, estruturas diferentes | 1h |
| Q06 | **Testar Novas Abordagens** | UGC, depoimentos, autoridade | 1h |
| Q07 | **Testar Ofertas Fortes** | Novas ofertas de alto impacto | 45min |
| Q08 | **Criativos Premium** | Criar criativos "flagship" de alta qualidade | 2h |
| Q09 | **Vídeos Motion** | Criar vídeos de impacto | 2h |
| Q10 | **Análise Profunda de Concorrência** | Pesquisar melhores campanhas, comparar, documentar oportunidades | 1h |

**Tempo total quinzenal: ~10h por cliente**

### 2.5 Templates MENSAIS

| ID | Tarefa | Descrição | Tempo Est. |
|----|--------|-----------|------------|
| M01 | **Reunião Estratégica** | Revisão completa, ROI, plano de ação 30 dias | 1h |
| M02 | **Revisão de Metas** | Avaliar metas de faturamento | 30min |
| M03 | **Reavaliação de Persona** | Revisar público-alvo e mensagens-chave | 45min |
| M04 | **Calendário de Campanhas** | Planejar campanhas do mês | 1h |
| M05 | **Definir Datas Promocionais** | Mapear oportunidades sazonais | 30min |
| M06 | **Criar Campanhas Premium** | Campanhas de alto impacto | 2h |
| M07 | **Auditoria Completa de Funil** | WhatsApp → Atendimento → Fechamento → Pós-venda | 1h |
| M08 | **Análise de Churn** | Pontos de retenção e cancelamento | 45min |
| M09 | **Atualizar Scripts** | Revisar scripts de atendimento | 30min |
| M10 | **Auditoria de Marca** | Padronização visual, tom de voz | 1h |
| M11 | **Relatório de Tendências** | Tendências do setor, novas oportunidades | 1h |

**Tempo total mensal: ~10h por cliente**

---

## 3. Checklists de Rotina

### 3.1 Estrutura de Checklist

Diferente das tarefas, os checklists são **verificações rápidas** que o gestor faz sem necessariamente criar uma tarefa para cada item.

```typescript
interface Checklist {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | '3days' | 'weekly' | 'biweekly' | 'monthly';
  items: ChecklistItem[];
  client_id?: string; // null = checklist global
  completed_at?: string;
  completed_by?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  is_checked: boolean;
  notes?: string;
  alert_if_unchecked?: boolean; // Gera alerta se não marcar
}
```

### 3.2 Checklist Diário de Performance

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ CHECKLIST DIÁRIO DE PERFORMANCE                             │
│  Cliente: Academia Primer                    Data: 04/12/2025   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 MÉTRICAS                                                    │
│  ☐ CPC dentro da meta? (Meta: < R$ 2,00)                       │
│  ☐ CTR acima de 1%?                                            │
│  ☐ CPM estável? (variação < 20%)                               │
│  ☐ ROAS positivo?                                              │
│  ☐ Frequência abaixo de 3?                                     │
│                                                                 │
│  🚨 ALERTAS                                                     │
│  ☐ Algum anúncio reprovado?                                    │
│  ☐ Alguma campanha em "Aprendizado Limitado"?                  │
│  ☐ Queda brusca de performance (> 30%)?                        │
│  ☐ Orçamento gastando muito rápido/devagar?                    │
│                                                                 │
│  👥 PÚBLICOS                                                    │
│  ☐ Públicos com tamanho saudável?                              │
│  ☐ Frequência de exibição controlada?                          │
│  ☐ Sobreposição de públicos verificada?                        │
│                                                                 │
│  💬 COMUNICAÇÃO                                                 │
│  ☐ Mensagens do cliente respondidas?                           │
│  ☐ Algum alerta para reportar ao cliente?                      │
│                                                                 │
│  [Salvar Checklist]                     Completo: 8/13 (62%)   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Checklist de Otimização (A cada 3 dias)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔧 CHECKLIST DE OTIMIZAÇÃO (3 DIAS)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📉 ANÚNCIOS FRACOS                                             │
│  ☐ Identificou criativos com CTR < 0.8%?                       │
│  ☐ Pausou os piores performers?                                │
│  ☐ Documentou motivo da pausa?                                 │
│                                                                 │
│  📈 ANÚNCIOS VENCEDORES                                         │
│  ☐ Identificou top 3 criativos?                                │
│  ☐ Duplicou para escalar?                                      │
│  ☐ Testou em outros públicos?                                  │
│                                                                 │
│  🎯 SEGMENTAÇÃO                                                 │
│  ☐ Públicos frios performando?                                 │
│  ☐ Públicos mornos com boa conversão?                          │
│  ☐ Remarketing ativo e saudável?                               │
│                                                                 │
│  🎨 CRIATIVOS                                                   │
│  ☐ Mix estático/vídeo equilibrado?                             │
│  ☐ Algum criativo saturando? (freq > 4)                        │
│  ☐ Novas variações de copy criadas?                            │
│                                                                 │
│  📝 OFERTAS                                                     │
│  ☐ Ofertas atuais ainda relevantes?                            │
│  ☐ Margem das ofertas verificada?                              │
│  ☐ Concorrência com oferta melhor?                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Checklist Semanal de Qualidade

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 CHECKLIST SEMANAL DE QUALIDADE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 RELATÓRIO                                                   │
│  ☐ Relatório de performance gerado?                            │
│  ☐ Comparativo com semana anterior?                            │
│  ☐ Insights principais documentados?                           │
│  ☐ Enviado/apresentado ao cliente?                             │
│                                                                 │
│  🎯 FUNIL                                                       │
│  ☐ Taxa de clique → lead verificada?                           │
│  ☐ Taxa de lead → venda verificada?                            │
│  ☐ Gargalos identificados?                                     │
│                                                                 │
│  🧪 TESTES                                                      │
│  ☐ 1 público novo criado esta semana?                          │
│  ☐ Resultados de testes anteriores analisados?                 │
│                                                                 │
│  📍 SEO LOCAL                                                   │
│  ☐ Google Meu Negócio atualizado?                              │
│  ☐ Novas fotos/posts adicionados?                              │
│  ☐ Avaliações respondidas?                                     │
│                                                                 │
│  📅 PLANEJAMENTO                                                │
│  ☐ Criativos da próxima semana definidos?                      │
│  ☐ Pauta de conteúdo criada/revisada?                          │
│  ☐ Ofertas da próxima semana planejadas?                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Sistema de Auditorias

### 4.1 Tipos de Auditoria

| Tipo | Frequência | Objetivo |
|------|------------|----------|
| **Auditoria de Funil** | Mensal | Mapear todo fluxo: Anúncio → Lead → Venda |
| **Auditoria de Concorrência** | Quinzenal | Analisar estratégias dos competidores |
| **Auditoria de Marca** | Mensal | Consistência visual e tom de voz |
| **Auditoria Fantasma** | Trimestral | Experiência como cliente oculto |

### 4.2 Auditoria de Funil

```typescript
interface FunnelAudit {
  id: string;
  client_id: string;
  audit_date: string;
  auditor_id: string;
  
  // Etapas do Funil
  stages: {
    stage: string;
    conversion_rate: number;
    avg_time: string; // Tempo médio na etapa
    bottlenecks: string[];
    recommendations: string[];
    score: number; // 1-10
  }[];
  
  // Canais avaliados
  channels: {
    channel: 'whatsapp' | 'instagram' | 'phone' | 'website' | 'app';
    response_time: string;
    quality_score: number;
    issues: string[];
  }[];
  
  // Scripts de atendimento
  scripts: {
    script_name: string;
    is_updated: boolean;
    effectiveness_score: number;
    suggestions: string[];
  }[];
  
  // Resumo
  overall_score: number;
  critical_issues: string[];
  quick_wins: string[];
  long_term_improvements: string[];
}
```

**Visualização:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 AUDITORIA DE FUNIL - Academia Primer                        │
│  Data: 04/12/2025                    Auditor: Jeferson          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 VISÃO GERAL DO FUNIL                                        │
│                                                                 │
│  Impressão ──────► Clique ──────► Lead ──────► Venda           │
│    10.000          850           120           18               │
│              8.5%         14.1%         15%                     │
│              ✅            ⚠️            ❌                      │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  📱 CANAIS DE ATENDIMENTO                                       │
│                                                                 │
│  WhatsApp                                                       │
│  ├── Tempo de resposta: 45min ⚠️ (meta: 15min)                 │
│  ├── Taxa de resposta: 78%                                     │
│  └── Score: 6/10                                               │
│                                                                 │
│  Instagram DM                                                   │
│  ├── Tempo de resposta: 2h ❌ (meta: 1h)                       │
│  ├── Taxa de resposta: 45%                                     │
│  └── Score: 4/10                                               │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  🚨 PROBLEMAS CRÍTICOS                                          │
│  • Tempo de resposta no WhatsApp muito alto                    │
│  • Instagram DM sendo ignorado                                 │
│  • Script de fechamento desatualizado                          │
│                                                                 │
│  ⚡ QUICK WINS                                                   │
│  • Configurar respostas automáticas no WhatsApp                │
│  • Treinar equipe para responder Instagram                     │
│  • Atualizar script com novas objeções                         │
│                                                                 │
│  📈 SCORE GERAL: 5.5/10                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Auditoria de Concorrência

```typescript
interface CompetitorAudit {
  id: string;
  client_id: string;
  audit_date: string;
  
  competitors: {
    name: string;
    instagram?: string;
    website?: string;
    
    // Análise de Anúncios
    ads_analysis: {
      active_ads_count: number;
      main_offers: string[];
      creative_types: string[]; // video, static, carousel
      hooks_used: string[];
      estimated_budget: 'low' | 'medium' | 'high';
      quality_score: number;
    };
    
    // Análise de Posicionamento
    positioning: {
      price_level: 'economy' | 'mid' | 'premium';
      main_differentiators: string[];
      target_audience: string;
      tone_of_voice: string;
    };
    
    // Pontos Fortes e Fracos
    strengths: string[];
    weaknesses: string[];
    
    // Oportunidades para nosso cliente
    opportunities: string[];
  }[];
  
  // Resumo Estratégico
  market_gaps: string[];
  differentiation_opportunities: string[];
  threats_to_watch: string[];
  recommended_actions: string[];
}
```

### 4.4 Auditoria Fantasma (Cliente Oculto)

```typescript
interface MysteryShopperAudit {
  id: string;
  client_id: string;
  audit_date: string;
  auditor_id: string;
  audit_type: 'delivery_order' | 'gym_visit' | 'service_request';
  
  // Para Delivery
  delivery_audit?: {
    order_time: string;
    delivery_time: string;
    total_time_minutes: number;
    packaging_score: number; // 1-10
    food_presentation_score: number;
    food_temperature_score: number;
    delivery_person_score: number;
    app_experience_score: number;
    issues_found: string[];
    photos: string[]; // URLs das fotos
  };
  
  // Para Academia
  gym_audit?: {
    first_contact_score: number;
    reception_score: number;
    tour_score: number;
    sales_approach_score: number;
    facilities_score: number;
    cleanliness_score: number;
    equipment_score: number;
    staff_friendliness_score: number;
    issues_found: string[];
    photos: string[];
  };
  
  // Resumo
  overall_score: number;
  positive_highlights: string[];
  critical_issues: string[];
  improvement_suggestions: string[];
  comparison_with_competitors?: string;
}
```

**Visualização:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🕵️ AUDITORIA FANTASMA - Delivery Sushi Premium                │
│  Data: 04/12/2025         Tipo: Pedido como cliente oculto     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⏱️ TEMPO                                                       │
│  Pedido: 19:30 | Entrega: 20:15 | Total: 45min ✅               │
│                                                                 │
│  📦 EMBALAGEM                        Score: 8/10 ✅             │
│  ├── Caixa térmica: Sim                                        │
│  ├── Organização: Boa                                          │
│  ├── Vazamentos: Não                                           │
│  └── Apresentação: Profissional                                │
│                                                                 │
│  🍣 PRODUTO                          Score: 7/10 ⚠️             │
│  ├── Temperatura: Adequada                                     │
│  ├── Apresentação: Boa                                         │
│  ├── Quantidade: Conforme pedido                               │
│  └── Sabor: Bom (arroz um pouco seco)                          │
│                                                                 │
│  🛵 ENTREGADOR                       Score: 9/10 ✅             │
│  ├── Pontualidade: Excelente                                   │
│  ├── Educação: Muito bom                                       │
│  └── Uniforme: Sim, limpo                                      │
│                                                                 │
│  📱 EXPERIÊNCIA NO APP               Score: 6/10 ⚠️             │
│  ├── Fotos do cardápio: Desatualizadas                         │
│  ├── Descrições: Incompletas                                   │
│  └── Rastreamento: Funcionando                                 │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  📈 SCORE GERAL: 7.5/10                                         │
│                                                                 │
│  ✅ DESTAQUES POSITIVOS                                         │
│  • Entrega rápida e dentro do prazo                            │
│  • Embalagem profissional                                      │
│  • Entregador educado e uniformizado                           │
│                                                                 │
│  🚨 PROBLEMAS ENCONTRADOS                                       │
│  • Fotos do cardápio no iFood desatualizadas                   │
│  • Arroz do sushi estava um pouco seco                         │
│  • Descrições dos pratos incompletas                           │
│                                                                 │
│  💡 SUGESTÕES DE MELHORIA                                       │
│  • Atualizar fotos do cardápio (urgente!)                      │
│  • Revisar processo de preparo do arroz                        │
│  • Completar descrições com ingredientes                       │
│                                                                 │
│  [📷 Ver Fotos]  [📄 Exportar PDF]  [📤 Enviar ao Cliente]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Features Premium de Diferenciação

### 5.1 Health Score do Cliente

Sistema de pontuação que indica a "saúde" do relacionamento com cada cliente.

```typescript
interface ClientHealthScore {
  client_id: string;
  calculated_at: string;
  
  // Componentes do Score
  components: {
    // Performance (40% do score)
    performance: {
      score: number; // 0-100
      roas_trend: 'up' | 'stable' | 'down';
      cpa_trend: 'up' | 'stable' | 'down';
      conversion_trend: 'up' | 'stable' | 'down';
    };
    
    // Engajamento (30% do score)
    engagement: {
      score: number;
      response_time_avg: number; // horas
      meetings_attended: number;
      feedback_given: boolean;
    };
    
    // Financeiro (20% do score)
    financial: {
      score: number;
      payments_on_time: number; // %
      contract_value_trend: 'up' | 'stable' | 'down';
      upsell_potential: 'high' | 'medium' | 'low';
    };
    
    // Satisfação (10% do score)
    satisfaction: {
      score: number;
      last_nps?: number;
      complaints_last_30_days: number;
      compliments_last_30_days: number;
    };
  };
  
  // Score Final
  overall_score: number; // 0-100
  health_status: 'excellent' | 'good' | 'attention' | 'critical';
  
  // Alertas e Ações
  alerts: string[];
  recommended_actions: string[];
  churn_risk: 'low' | 'medium' | 'high';
}
```

**Visualização no Dashboard:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ❤️ HEALTH SCORE DOS CLIENTES                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ 🟢 92/100   │ │ 🟢 85/100   │ │ 🟡 68/100   │ │ 🔴 45/100 │ │
│  │ Academia    │ │ Delivery    │ │ Clínica     │ │ Loja X    │ │
│  │ Primer      │ │ Sushi       │ │ Saúde       │ │           │ │
│  │             │ │             │ │             │ │           │ │
│  │ ↑ ROAS      │ │ ↑ Vendas    │ │ ↓ Respostas │ │ ⚠️ Churn  │ │
│  │ ✅ Pagto    │ │ ✅ Pagto    │ │ ⚠️ Reunião  │ │ ❌ Pagto  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  🚨 ALERTAS DE ATENÇÃO                                          │
│  • Loja X: Pagamento atrasado há 15 dias + ROAS em queda       │
│  • Clínica Saúde: Não respondeu últimas 3 mensagens            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Boletim de Oportunidades

Insights exclusivos de mercado enviados aos clientes.

```typescript
interface OpportunityBulletin {
  id: string;
  title: string;
  created_at: string;
  
  // Segmentos relevantes
  relevant_segments: string[]; // ['fitness', 'delivery', 'ecommerce']
  
  // Conteúdo
  summary: string;
  full_content: string;
  
  // Dados de suporte
  source: string;
  data_points: {
    metric: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  
  // Ação recomendada
  recommended_action: string;
  urgency: 'high' | 'medium' | 'low';
  
  // Status de envio
  sent_to_clients: string[]; // client_ids
  opened_by: string[];
}
```

**Exemplo de Boletim:**

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 BOLETIM DE OPORTUNIDADES #47                                │
│  Data: 04/12/2025                    Segmento: Fitness          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔥 TENDÊNCIA: Buscas por "academia perto de mim"              │
│     aumentaram 47% na última semana                             │
│                                                                 │
│  📈 DADOS:                                                      │
│  • Google Trends: +47% vs semana anterior                       │
│  • Meta Ads: CPM caiu 12% no segmento fitness                   │
│  • Período: Típico pré-verão + resoluções de fim de ano        │
│                                                                 │
│  💡 OPORTUNIDADE:                                               │
│  Momento ideal para campanhas de captação. Sugerimos:          │
│  • Aumentar budget em 30% esta semana                          │
│  • Focar em "aula experimental grátis"                         │
│  • Criativos com transformação/antes-depois                    │
│                                                                 │
│  ⚡ URGÊNCIA: ALTA - Janela de 2 semanas                        │
│                                                                 │
│  [Aplicar aos Clientes Fitness]  [Ver Dados Completos]         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Relatório em Vídeo (Integração Loom)

```typescript
interface VideoReport {
  id: string;
  client_id: string;
  report_date: string;
  
  // Dados do vídeo
  video_url: string; // URL do Loom ou similar
  thumbnail_url: string;
  duration_seconds: number;
  
  // Metadados
  title: string;
  description: string;
  key_points: string[];
  
  // Métricas mencionadas
  metrics_covered: {
    metric: string;
    value: string;
    comparison: string;
  }[];
  
  // Tracking
  viewed_at?: string;
  viewed_duration_seconds?: number;
}
```

---

## 6. Team Management & Task Assignment

### 6.1 Visão Geral

Sistema de gerenciamento de equipe que permite:
- Criar **funções/perfis** (Gestor de Tráfego, Editor de Vídeo, Designer, etc)
- Adicionar **membros da equipe** com diferentes níveis de acesso
- **Atribuir tarefas** a funções específicas ou pessoas específicas
- **Notificar** colaboradores via WhatsApp ou acesso à plataforma

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HIERARQUIA DE ACESSO                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👑 ADMIN (Dono da Conta)                                                   │
│     ├── Acesso total a todas as features                                   │
│     ├── Gerenciar membros da equipe                                        │
│     ├── Criar/editar/deletar qualquer coisa                                │
│     └── Ver financeiro e relatórios completos                              │
│                                                                             │
│  ✏️ EDITOR (Colaborador com permissão de edição)                            │
│     ├── Ver clientes atribuídos                                            │
│     ├── Criar/editar tarefas                                               │
│     ├── Atualizar status de tarefas                                        │
│     ├── Ver calendário de conteúdo                                         │
│     └── NÃO vê financeiro nem outros colaboradores                         │
│                                                                             │
│  👁️ VIEWER (Colaborador só visualização)                                    │
│     ├── Ver tarefas atribuídas a ele                                       │
│     ├── Atualizar APENAS status da tarefa (pendente → concluído)           │
│     ├── Adicionar notas/comentários                                        │
│     └── NÃO pode criar, editar ou deletar nada                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Funções/Perfis (Roles)

Funções representam o **tipo de trabalho**, não a pessoa. Uma pessoa pode ter múltiplas funções.

| Função | Código | Cor | Tarefas Típicas |
|--------|--------|-----|-----------------|
| **Gestor de Tráfego** | `traffic_manager` | 🟣 Violeta | Otimização, análise, relatórios |
| **Editor de Vídeo** | `video_editor` | 🔴 Vermelho | Edição de vídeos, motion |
| **Designer** | `designer` | 🔵 Azul | Criativos estáticos, identidade |
| **Copywriter** | `copywriter` | 🟢 Verde | Textos, headlines, CTAs |
| **Social Media** | `social_media` | 🟡 Amarelo | Posts, stories, engajamento |
| **Videomaker** | `videomaker` | 🟠 Laranja | Gravação, produção |
| **Atendimento** | `customer_service` | 🩵 Ciano | SAC, WhatsApp, respostas |

```typescript
interface Role {
  id: string;
  code: string; // traffic_manager, video_editor, etc
  name: string;
  color: string; // hex color
  description?: string;
  is_default: boolean; // roles padrão do sistema
  created_by?: string; // user_id se for customizado
}
```

### 6.3 Membros da Equipe

```typescript
interface TeamMember {
  id: string;
  owner_id: string; // dono da conta que convidou
  
  // Identificação
  name: string;
  email: string;
  phone?: string; // para notificações WhatsApp
  avatar_url?: string;
  
  // Acesso
  access_level: 'admin' | 'editor' | 'viewer';
  auth_user_id?: string; // ID do Supabase Auth (se tiver conta)
  invite_status: 'pending' | 'accepted' | 'expired';
  invite_token?: string;
  invited_at: string;
  accepted_at?: string;
  
  // Funções
  roles: string[]; // IDs das funções
  
  // Clientes atribuídos (se vazio = todos)
  assigned_clients: string[]; // IDs dos clientes
  
  // Notificações
  notify_via: ('email' | 'whatsapp' | 'platform')[];
  
  // Status
  is_active: boolean;
  last_active_at?: string;
  
  created_at: string;
  updated_at: string;
}
```

### 6.4 Atribuição de Tarefas

Duas formas de atribuir tarefas:

**1. Por Função (Recomendado)**
- Tarefa atribuída a uma FUNÇÃO (ex: "Editor de Vídeo")
- Qualquer membro com essa função pode pegar a tarefa
- Útil quando não importa QUEM faz, mas SIM o tipo de trabalho

**2. Por Pessoa Específica**
- Tarefa atribuída a um MEMBRO específico (ex: "João Silva")
- Somente essa pessoa pode executar
- Útil para tarefas que dependem de skills específicos

```typescript
// Campos adicionados na tabela tasks
interface TaskAssignment {
  // Atribuição por função
  assigned_role_id?: string; // ID da função
  
  // Atribuição por pessoa
  assigned_member_id?: string; // ID do membro
  
  // Quem aceitou/pegou a tarefa (se por função)
  claimed_by?: string; // ID do membro que pegou
  claimed_at?: string;
  
  // Status de atribuição
  assignment_status: 'unassigned' | 'assigned' | 'claimed' | 'in_progress' | 'completed';
  
  // Notificações
  notification_sent: boolean;
  notification_sent_at?: string;
}
```

### 6.5 Fluxo de Atribuição

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE ATRIBUIÇÃO DE TAREFA                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ ADMIN CRIA TAREFA                                                       │
│     │                                                                       │
│     ├── Seleciona cliente                                                  │
│     ├── Define título, descrição, prazo                                    │
│     └── Escolhe atribuição:                                                │
│         ├── 🏷️ Por Função: "Editor de Vídeo"                               │
│         └── 👤 Por Pessoa: "João Silva"                                    │
│                                                                             │
│  2️⃣ SISTEMA NOTIFICA                                                        │
│     │                                                                       │
│     ├── Se por FUNÇÃO → Notifica todos com essa função                     │
│     └── Se por PESSOA → Notifica apenas a pessoa                           │
│                                                                             │
│  3️⃣ COLABORADOR RECEBE                                                      │
│     │                                                                       │
│     ├── Via WhatsApp: "Nova tarefa: Editar vídeo - Academia X"             │
│     ├── Via Email: Detalhes completos + link                               │
│     └── Via Plataforma: Notificação no dashboard                           │
│                                                                             │
│  4️⃣ COLABORADOR ACEITA (se por função)                                      │
│     │                                                                       │
│     └── Clica em "Pegar tarefa" → Tarefa fica atribuída a ele              │
│                                                                             │
│  5️⃣ COLABORADOR EXECUTA                                                     │
│     │                                                                       │
│     ├── Muda status: Pendente → Em Progresso → Concluído                   │
│     ├── Adiciona notas/comentários                                         │
│     └── Upload de arquivos (se necessário)                                 │
│                                                                             │
│  6️⃣ ADMIN ACOMPANHA                                                         │
│     │                                                                       │
│     ├── Vê todas as tarefas e status                                       │
│     ├── Recebe alerta se tarefa atrasada                                   │
│     └── Pode reatribuir se necessário                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Visualização no Formulário de Tarefa

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 NOVA TAREFA                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente: [Academia Primer        ▼]                            │
│                                                                 │
│  Título: [Editar vídeo de treino                    ]           │
│                                                                 │
│  Descrição:                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Editar o vídeo gravado ontem com o personal trainer.   │   │
│  │ Adicionar intro, cortes e música de fundo.             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Prazo: [10/12/2025]              Prioridade: [Alta ▼]         │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  👥 ATRIBUIÇÃO                                                  │
│                                                                 │
│  ○ Por Função                    ● Por Pessoa                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  👤 Selecione o responsável:                            │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ 🔴 João Silva                                    │   │   │
│  │  │    Editor de Vídeo                               │   │   │
│  │  │    📱 +55 11 99999-9999                          │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ 🔵 Maria Santos                                  │   │   │
│  │  │    Designer                                      │   │   │
│  │  │    📱 +55 11 88888-8888                          │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🔔 Notificar via:                                              │
│  ☑️ WhatsApp   ☐ Email   ☑️ Plataforma                          │
│                                                                 │
│  [Cancelar]                                    [Criar Tarefa]  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.7 Visualização por Função

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 NOVA TAREFA                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👥 ATRIBUIÇÃO                                                  │
│                                                                 │
│  ● Por Função                    ○ Por Pessoa                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏷️ Selecione a função:                                 │   │
│  │                                                          │   │
│  │  ┌────────────────────┐ ┌────────────────────┐          │   │
│  │  │ 🟣 Gestor de       │ │ 🔴 Editor de       │          │   │
│  │  │    Tráfego         │ │    Vídeo           │          │   │
│  │  │    2 membros       │ │    1 membro        │          │   │
│  │  └────────────────────┘ └────────────────────┘          │   │
│  │                                                          │   │
│  │  ┌────────────────────┐ ┌────────────────────┐          │   │
│  │  │ 🔵 Designer        │ │ 🟢 Copywriter      │          │   │
│  │  │    1 membro        │ │    0 membros       │          │   │
│  │  └────────────────────┘ └────────────────────┘          │   │
│  │                                                          │   │
│  │  [+ Criar nova função]                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ℹ️ Todos os membros com essa função serão notificados.        │
│     O primeiro a aceitar ficará responsável.                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.8 Dashboard do Colaborador (Viewer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏠 MARCOLA - Bem-vindo, João Silva                              [Sair]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 MINHAS TAREFAS                                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔴 PENDENTES (3)                                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Editar vídeo de treino                                      │   │   │
│  │  │ 🏢 Academia Primer          📅 Prazo: 10/12/2025            │   │   │
│  │  │ ⚡ Prioridade: Alta                                         │   │   │
│  │  │                                                              │   │   │
│  │  │ [Ver Detalhes]  [▶️ Iniciar]  [✅ Concluir]                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Criar stories para Black Friday                             │   │   │
│  │  │ 🏢 Delivery Sushi           📅 Prazo: 12/12/2025            │   │   │
│  │  │ ⚡ Prioridade: Média                                        │   │   │
│  │  │                                                              │   │   │
│  │  │ [Ver Detalhes]  [▶️ Iniciar]  [✅ Concluir]                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🟡 EM PROGRESSO (1)                                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ Montar reels com depoimentos                                │   │   │
│  │  │ 🏢 Clínica Saúde            📅 Prazo: 08/12/2025            │   │   │
│  │  │ ⏱️ Iniciado há 2 dias                                       │   │   │
│  │  │                                                              │   │   │
│  │  │ [Ver Detalhes]  [💬 Notas]  [✅ Concluir]                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🟢 CONCLUÍDAS ESTA SEMANA (5)                          [Ver todas] │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.9 Notificação via WhatsApp

Template de mensagem quando tarefa é atribuída:

```
🔔 *Nova tarefa atribuída!*

📋 *{task_title}*
🏢 Cliente: {client_name}
📅 Prazo: {due_date}
⚡ Prioridade: {priority}

📝 {task_description}

👉 Acesse: {platform_url}

---
MARCOLA Gestor de Tráfegos
```

### 6.10 Página de Gerenciamento de Equipe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  👥 EQUIPE                                              [+ Convidar Membro] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 RESUMO                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │     3       │ │     2       │ │     1       │ │     15      │           │
│  │   Membros   │ │   Ativos    │ │  Pendentes  │ │   Tarefas   │           │
│  │   Ativos    │ │    Hoje     │ │   Convite   │ │  Atribuídas │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  🏷️ FUNÇÕES                                             [+ Nova Função]    │
│                                                                             │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐         │
│  │ 🟣 Gestor de      │ │ 🔴 Editor de      │ │ 🔵 Designer       │         │
│  │    Tráfego        │ │    Vídeo          │ │                   │         │
│  │    2 membros      │ │    1 membro       │ │    1 membro       │         │
│  │    8 tarefas      │ │    5 tarefas      │ │    2 tarefas      │         │
│  └───────────────────┘ └───────────────────┘ └───────────────────┘         │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  👤 MEMBROS DA EQUIPE                                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 João Silva                                          [⚙️] [🗑️]   │   │
│  │ 📧 joao@email.com  📱 +55 11 99999-9999                             │   │
│  │ 🏷️ Editor de Vídeo, Videomaker                                      │   │
│  │ 🔐 Acesso: Viewer                                                   │   │
│  │ 📊 5 tarefas pendentes | Último acesso: Hoje, 14:30                 │   │
│  │ ✅ Convite aceito                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Maria Santos                                        [⚙️] [🗑️]   │   │
│  │ 📧 maria@email.com  📱 +55 11 88888-8888                            │   │
│  │ 🏷️ Designer                                                         │   │
│  │ 🔐 Acesso: Editor                                                   │   │
│  │ 📊 2 tarefas pendentes | Último acesso: Ontem, 18:45                │   │
│  │ ✅ Convite aceito                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Carlos Oliveira                                     [⚙️] [🗑️]   │   │
│  │ 📧 carlos@email.com                                                 │   │
│  │ 🏷️ Gestor de Tráfego                                                │   │
│  │ 🔐 Acesso: Editor                                                   │   │
│  │ ⏳ Convite pendente (enviado há 2 dias)            [Reenviar]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.11 Modal de Convite

```
┌─────────────────────────────────────────────────────────────────┐
│  ✉️ CONVIDAR MEMBRO                                      [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nome: [                                        ]               │
│                                                                 │
│  Email: [                                       ]               │
│                                                                 │
│  Telefone (WhatsApp): [                         ]               │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  🔐 Nível de Acesso:                                            │
│                                                                 │
│  ○ Editor                                                      │
│    Pode criar e editar tarefas, ver clientes atribuídos        │
│                                                                 │
│  ● Viewer                                                      │
│    Só pode ver e atualizar status das tarefas atribuídas       │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  🏷️ Funções:                                                    │
│                                                                 │
│  ☑️ Editor de Vídeo                                             │
│  ☐ Designer                                                    │
│  ☐ Copywriter                                                  │
│  ☐ Gestor de Tráfego                                           │
│  ☐ Social Media                                                │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  🏢 Clientes (deixe vazio para todos):                          │
│                                                                 │
│  ☑️ Academia Primer                                             │
│  ☑️ Delivery Sushi                                              │
│  ☐ Clínica Saúde                                               │
│  ☐ Loja X                                                      │
│                                                                 │
│  ════════════════════════════════════════════════════════════  │
│                                                                 │
│  📱 Enviar convite via:                                         │
│  ☑️ Email   ☑️ WhatsApp                                         │
│                                                                 │
│  [Cancelar]                               [Enviar Convite]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Schema de Banco de Dados

### 7.1 Novas Tabelas

```sql
-- ============================================
-- TEMPLATES OPERACIONAIS
-- ============================================

CREATE TABLE operational_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  code VARCHAR(10) NOT NULL, -- D01, T01, S01, Q01, M01
  title TEXT NOT NULL,
  description TEXT,
  
  -- Periodicidade
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', '3days', 'weekly', 'biweekly', 'monthly')),
  
  -- Configuração
  estimated_time_minutes INTEGER DEFAULT 15,
  is_critical BOOLEAN DEFAULT false,
  category TEXT, -- 'performance', 'communication', 'optimization', 'analysis'
  
  -- Aplicabilidade
  applies_to_segments TEXT[] DEFAULT '{}', -- vazio = todos
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_operational_templates_frequency ON operational_templates(frequency);
CREATE INDEX idx_operational_templates_user ON operational_templates(user_id);

-- RLS
ALTER TABLE operational_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own operational templates"
  ON operational_templates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- CHECKLISTS
-- ============================================

CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- null = global
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', '3days', 'weekly', 'biweekly', 'monthly')),
  
  -- Itens (JSON array)
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Status
  is_template BOOLEAN DEFAULT false, -- true = template reutilizável
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completions de Checklists
CREATE TABLE checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Data da completude
  completed_date DATE NOT NULL,
  
  -- Itens marcados (JSON com status de cada item)
  items_status JSONB NOT NULL DEFAULT '[]',
  
  -- Notas
  notes TEXT,
  
  -- Métricas
  completion_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_checklist_completions_date ON checklist_completions(completed_date);
CREATE INDEX idx_checklist_completions_client ON checklist_completions(client_id);

-- RLS
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklists"
  ON checklists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own checklist completions"
  ON checklist_completions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- AUDITORIAS
-- ============================================

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de auditoria
  audit_type TEXT NOT NULL CHECK (audit_type IN ('funnel', 'competitor', 'brand', 'mystery_shopper')),
  
  -- Data
  audit_date DATE NOT NULL,
  
  -- Dados da auditoria (estrutura varia por tipo)
  audit_data JSONB NOT NULL DEFAULT '{}',
  
  -- Resumo
  overall_score DECIMAL(4,2),
  critical_issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  
  -- Anexos
  attachments TEXT[] DEFAULT '{}', -- URLs de fotos/documentos
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'sent_to_client')),
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audits_client ON audits(client_id);
CREATE INDEX idx_audits_type ON audits(audit_type);
CREATE INDEX idx_audits_date ON audits(audit_date);

-- RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own audits"
  ON audits FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- HEALTH SCORE
-- ============================================

CREATE TABLE client_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Data do cálculo
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Componentes (JSON detalhado)
  components JSONB NOT NULL DEFAULT '{}',
  
  -- Score Final
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  health_status TEXT NOT NULL CHECK (health_status IN ('excellent', 'good', 'attention', 'critical')),
  
  -- Risco de Churn
  churn_risk TEXT DEFAULT 'low' CHECK (churn_risk IN ('low', 'medium', 'high')),
  
  -- Alertas e Ações
  alerts JSONB DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manter apenas último score por cliente (ou histórico limitado)
CREATE INDEX idx_health_scores_client ON client_health_scores(client_id);
CREATE INDEX idx_health_scores_date ON client_health_scores(calculated_at);

-- RLS
ALTER TABLE client_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own health scores"
  ON client_health_scores FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- BOLETINS DE OPORTUNIDADES
-- ============================================

CREATE TABLE opportunity_bulletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conteúdo
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_content TEXT,
  
  -- Segmentos relevantes
  relevant_segments TEXT[] DEFAULT '{}',
  
  -- Dados de suporte
  source TEXT,
  data_points JSONB DEFAULT '[]',
  
  -- Ação recomendada
  recommended_action TEXT,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('high', 'medium', 'low')),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking de envio
CREATE TABLE bulletin_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id UUID REFERENCES opportunity_bulletins(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  
  UNIQUE(bulletin_id, client_id)
);

-- RLS
ALTER TABLE opportunity_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bulletins"
  ON opportunity_bulletins FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bulletin deliveries"
  ON bulletin_deliveries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM opportunity_bulletins b 
    WHERE b.id = bulletin_id AND b.user_id = auth.uid()
  ));

-- ============================================
-- VIDEO REPORTS
-- ============================================

CREATE TABLE video_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Período do relatório
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  
  -- Dados do vídeo
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Metadados
  title TEXT NOT NULL,
  description TEXT,
  key_points JSONB DEFAULT '[]',
  metrics_covered JSONB DEFAULT '[]',
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  viewed_duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE video_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own video reports"
  ON video_reports FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- TEAM MANAGEMENT - FUNÇÕES/ROLES
-- ============================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  code VARCHAR(50) NOT NULL, -- traffic_manager, video_editor, etc
  name TEXT NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#8B5CF6', -- hex color
  description TEXT,
  
  -- Tipo
  is_default BOOLEAN DEFAULT false, -- roles padrão do sistema
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(owner_id, code)
);

-- Índices
CREATE INDEX idx_roles_owner ON roles(owner_id);

-- RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own roles"
  ON roles FOR ALL
  USING (auth.uid() = owner_id OR owner_id IS NULL);

-- ============================================
-- TEAM MANAGEMENT - MEMBROS DA EQUIPE
-- ============================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT, -- para notificações WhatsApp
  avatar_url TEXT,
  
  -- Acesso
  access_level TEXT NOT NULL DEFAULT 'viewer' CHECK (access_level IN ('admin', 'editor', 'viewer')),
  auth_user_id UUID REFERENCES auth.users(id), -- ID do Supabase Auth (se tiver conta)
  
  -- Convite
  invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'expired')),
  invite_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  -- Funções (array de role IDs)
  role_ids UUID[] DEFAULT '{}',
  
  -- Clientes atribuídos (vazio = todos)
  assigned_client_ids UUID[] DEFAULT '{}',
  
  -- Notificações
  notify_via TEXT[] DEFAULT ARRAY['platform'],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(owner_id, email)
);

-- Índices
CREATE INDEX idx_team_members_owner ON team_members(owner_id);
CREATE INDEX idx_team_members_auth_user ON team_members(auth_user_id);
CREATE INDEX idx_team_members_invite_token ON team_members(invite_token);

-- RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their team members"
  ON team_members FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Members can view themselves"
  ON team_members FOR SELECT
  USING (auth.uid() = auth_user_id);

-- ============================================
-- ATUALIZAÇÃO DA TABELA TASKS - CAMPOS DE ATRIBUIÇÃO
-- ============================================

-- Adicionar campos de atribuição na tabela tasks existente
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'unassigned' CHECK (assignment_status IN ('unassigned', 'assigned', 'claimed', 'in_progress', 'completed'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- Índices para atribuição
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_role ON tasks(assigned_role_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_member ON tasks(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignment_status ON tasks(assignment_status);

-- Comentários
COMMENT ON COLUMN tasks.assigned_role_id IS 'Função atribuída à tarefa (qualquer membro com essa função pode pegar)';
COMMENT ON COLUMN tasks.assigned_member_id IS 'Membro específico atribuído à tarefa';
COMMENT ON COLUMN tasks.claimed_by IS 'Membro que pegou a tarefa (quando atribuída por função)';
COMMENT ON COLUMN tasks.assignment_status IS 'Status da atribuição: unassigned, assigned, claimed, in_progress, completed';

-- ============================================
-- NOTIFICAÇÕES DE TAREFAS
-- ============================================

CREATE TABLE task_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  -- Tipo de notificação
  notification_type TEXT NOT NULL CHECK (notification_type IN ('assigned', 'reminder', 'overdue', 'completed')),
  
  -- Canal
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'platform')),
  
  -- Status
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Conteúdo (para histórico)
  content JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_task_notifications_task ON task_notifications(task_id);
CREATE INDEX idx_task_notifications_member ON task_notifications(member_id);

-- RLS
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task notifications"
  ON task_notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.id = member_id AND (tm.owner_id = auth.uid() OR tm.auth_user_id = auth.uid())
  ));
```

### 7.2 Seed de Templates Operacionais

```sql
-- Inserir roles padrão do sistema
INSERT INTO roles (owner_id, code, name, color, description, is_default) VALUES
(NULL, 'traffic_manager', 'Gestor de Tráfego', '#8B5CF6', 'Responsável por otimização, análise e relatórios de campanhas', true),
(NULL, 'video_editor', 'Editor de Vídeo', '#EF4444', 'Responsável por edição e montagem de vídeos', true),
(NULL, 'designer', 'Designer', '#3B82F6', 'Responsável por criativos estáticos e identidade visual', true),
(NULL, 'copywriter', 'Copywriter', '#22C55E', 'Responsável por textos, headlines e CTAs', true),
(NULL, 'social_media', 'Social Media', '#EAB308', 'Responsável por posts, stories e engajamento', true),
(NULL, 'videomaker', 'Videomaker', '#F97316', 'Responsável por gravação e produção de vídeos', true),
(NULL, 'customer_service', 'Atendimento', '#06B6D4', 'Responsável por SAC, WhatsApp e respostas', true);

-- Inserir templates operacionais padrão
INSERT INTO operational_templates (user_id, code, title, description, frequency, estimated_time_minutes, is_critical, category) VALUES

-- DIÁRIAS
(NULL, 'D01', 'Checar Performance Básica', 'Verificar CPC, CTR, CPM, CPA, ROAS de todas as campanhas ativas', 'daily', 15, true, 'performance'),
(NULL, 'D02', 'Verificar Status de Anúncios', 'Checar reprovações, aprendizado limitado, quedas abruptas', 'daily', 10, true, 'performance'),
(NULL, 'D03', 'Checar Orçamento', 'Verificar distribuição de budget e gastos do dia', 'daily', 5, true, 'performance'),
(NULL, 'D04', 'Microajustes de Lances', 'Ajustar lances se necessário baseado na performance', 'daily', 10, false, 'optimization'),
(NULL, 'D05', 'Verificar Saturação de Públicos', 'Checar frequência e tamanho de públicos', 'daily', 10, false, 'analysis'),
(NULL, 'D06', 'Responder Cliente', 'Checar e responder mensagens (meta: até 2h)', 'daily', 15, true, 'communication'),
(NULL, 'D07', 'Monitorar Negócio do Cliente', 'Ver promoções, horários de pico, imprevistos', 'daily', 10, false, 'communication'),
(NULL, 'D08', 'Atualizar Insights Diários', 'Registrar observações do dia no sistema', 'daily', 5, false, 'analysis'),
(NULL, 'D09', 'Checar Concorrência', 'Analisar anúncios ativos dos concorrentes', 'daily', 15, false, 'analysis'),
(NULL, 'D10', 'Monitorar Reputação', 'Verificar avaliações iFood/Google (delivery)', 'daily', 10, false, 'communication'),
(NULL, 'D11', 'Checar Funil/SAC', 'Acompanhar WhatsApp, Instagram, taxa de resposta', 'daily', 10, false, 'analysis'),

-- A CADA 3 DIAS
(NULL, 'T01', 'Pausar Anúncios Fracos', 'Pausar criativos com CTR muito baixo', '3days', 15, true, 'optimization'),
(NULL, 'T02', 'Duplicar Vencedores', 'Escalar criativos com boa performance', '3days', 15, false, 'optimization'),
(NULL, 'T03', 'Ajustar Segmentações', 'Revisar públicos frio/morno/quente', '3days', 20, false, 'optimization'),
(NULL, 'T04', 'Revisar Mix de Criativos', 'Balancear estáticos vs vídeos', '3days', 15, false, 'analysis'),
(NULL, 'T05', 'Novas Variações de Copy', 'Criar variações para prevenir fadiga', '3days', 30, false, 'optimization'),
(NULL, 'T06', 'Atualizar Criativos Saturados', 'Novas versões de criativos cansados', '3days', 45, false, 'optimization'),
(NULL, 'T07', 'Revisar Mix de Ofertas', 'Ajustar promoções baseado em margem/giro', '3days', 20, false, 'analysis'),
(NULL, 'T08', 'Auditoria Leve de Funil', 'Tempo de resposta, scripts, páginas', '3days', 20, false, 'analysis'),

-- SEMANAIS
(NULL, 'S01', 'Relatório de Performance', 'CPC, CPM, CTR, CPA por criativo + ROAS', 'weekly', 60, true, 'analysis'),
(NULL, 'S02', 'Análise de Funil', 'Impressão → Clique → Conversa → Venda', 'weekly', 30, false, 'analysis'),
(NULL, 'S03', 'Identificar Vencedores/Perdedores', 'Ranking de criativos por performance', 'weekly', 20, false, 'analysis'),
(NULL, 'S04', 'Reunião/Update com Cliente', 'Pontos positivos, alertas, recomendações', 'weekly', 30, true, 'communication'),
(NULL, 'S05', 'Planejamento Criativo', 'Definir criativos da próxima semana', 'weekly', 60, false, 'optimization'),
(NULL, 'S06', 'Pauta de Conteúdo', 'Criar/revisar calendário de posts', 'weekly', 30, false, 'optimization'),
(NULL, 'S07', 'Atualizar Google Meu Negócio', 'Fotos, posts, promoções novas', 'weekly', 30, false, 'optimization'),
(NULL, 'S08', 'Testar 1 Público Novo', 'Criar novo público para teste', 'weekly', 30, false, 'optimization'),

-- QUINZENAIS
(NULL, 'Q01', 'Deep Analysis CAC/LTV', 'Análise profunda de custo de aquisição e lifetime value', 'biweekly', 60, true, 'analysis'),
(NULL, 'Q02', 'Análise de Recorrência', 'Frequência de compra/visita dos clientes', 'biweekly', 45, false, 'analysis'),
(NULL, 'Q03', 'Melhores Dias/Horários', 'Identificar padrões de performance', 'biweekly', 30, false, 'analysis'),
(NULL, 'Q04', 'Detectar Padrões', 'Identificar quedas ou saltos de performance', 'biweekly', 30, false, 'analysis'),
(NULL, 'Q05', 'Testes de Arquitetura', 'Testar CBO vs ABO, estruturas diferentes', 'biweekly', 60, false, 'optimization'),
(NULL, 'Q06', 'Testar Novas Abordagens', 'UGC, depoimentos, autoridade', 'biweekly', 60, false, 'optimization'),
(NULL, 'Q07', 'Testar Ofertas Fortes', 'Novas ofertas de alto impacto', 'biweekly', 45, false, 'optimization'),
(NULL, 'Q08', 'Criativos Premium', 'Criar criativos flagship de alta qualidade', 'biweekly', 120, false, 'optimization'),
(NULL, 'Q09', 'Vídeos Motion', 'Criar vídeos de impacto', 'biweekly', 120, false, 'optimization'),
(NULL, 'Q10', 'Análise Profunda de Concorrência', 'Pesquisar melhores campanhas, comparar, documentar', 'biweekly', 60, false, 'analysis'),

-- MENSAIS
(NULL, 'M01', 'Reunião Estratégica', 'Revisão completa, ROI, plano de ação 30 dias', 'monthly', 60, true, 'communication'),
(NULL, 'M02', 'Revisão de Metas', 'Avaliar metas de faturamento', 'monthly', 30, true, 'analysis'),
(NULL, 'M03', 'Reavaliação de Persona', 'Revisar público-alvo e mensagens-chave', 'monthly', 45, false, 'analysis'),
(NULL, 'M04', 'Calendário de Campanhas', 'Planejar campanhas do mês', 'monthly', 60, false, 'optimization'),
(NULL, 'M05', 'Definir Datas Promocionais', 'Mapear oportunidades sazonais', 'monthly', 30, false, 'optimization'),
(NULL, 'M06', 'Criar Campanhas Premium', 'Campanhas de alto impacto', 'monthly', 120, false, 'optimization'),
(NULL, 'M07', 'Auditoria Completa de Funil', 'WhatsApp → Atendimento → Fechamento → Pós-venda', 'monthly', 60, true, 'analysis'),
(NULL, 'M08', 'Análise de Churn', 'Pontos de retenção e cancelamento', 'monthly', 45, false, 'analysis'),
(NULL, 'M09', 'Atualizar Scripts', 'Revisar scripts de atendimento', 'monthly', 30, false, 'optimization'),
(NULL, 'M10', 'Auditoria de Marca', 'Padronização visual, tom de voz', 'monthly', 60, false, 'analysis'),
(NULL, 'M11', 'Relatório de Tendências', 'Tendências do setor, novas oportunidades', 'monthly', 60, false, 'analysis');
```

---

## 8. Componentes React

### 8.1 Estrutura de Pastas

```
src/components/
├── operational/
│   ├── OperationalTaskList.tsx      # Lista de tarefas operacionais
│   ├── OperationalTaskCard.tsx      # Card individual
│   ├── FrequencyFilter.tsx          # Filtro por periodicidade
│   ├── OperationalProgress.tsx      # Barra de progresso do dia
│   └── index.ts
│
├── checklists/
│   ├── ChecklistCard.tsx            # Card de checklist
│   ├── ChecklistModal.tsx           # Modal para preencher
│   ├── ChecklistItem.tsx            # Item individual
│   ├── ChecklistProgress.tsx        # Progresso visual
│   ├── ChecklistHistory.tsx         # Histórico de completudes
│   └── index.ts
│
├── audits/
│   ├── AuditCard.tsx                # Card de auditoria
│   ├── AuditForm.tsx                # Formulário genérico
│   ├── FunnelAuditForm.tsx          # Form específico funil
│   ├── CompetitorAuditForm.tsx      # Form específico concorrência
│   ├── MysteryShopperForm.tsx       # Form cliente oculto
│   ├── AuditResults.tsx             # Visualização de resultados
│   ├── AuditTimeline.tsx            # Timeline de auditorias
│   └── index.ts
│
├── health-score/
│   ├── HealthScoreCard.tsx          # Card com score
│   ├── HealthScoreGauge.tsx         # Indicador visual (gauge)
│   ├── HealthScoreBreakdown.tsx     # Detalhamento dos componentes
│   ├── HealthScoreHistory.tsx       # Histórico/evolução
│   ├── ChurnRiskBadge.tsx           # Badge de risco
│   └── index.ts
│
├── team/                            # 🆕 NOVO - Team Management
│   ├── TeamMemberCard.tsx           # Card de membro da equipe
│   ├── TeamMemberList.tsx           # Lista de membros
│   ├── InviteMemberModal.tsx        # Modal para convidar
│   ├── RoleCard.tsx                 # Card de função
│   ├── RoleList.tsx                 # Lista de funções
│   ├── RoleSelector.tsx             # Seletor de função (dropdown)
│   ├── MemberSelector.tsx           # Seletor de membro (dropdown)
│   ├── TaskAssignmentSelector.tsx   # Componente unificado de atribuição
│   ├── TeamStats.tsx                # Estatísticas da equipe
│   ├── CollaboratorDashboard.tsx    # Dashboard do colaborador (viewer)
│   ├── MyTasksList.tsx              # Lista de tarefas do colaborador
│   └── index.ts
│
├── bulletins/
│   ├── BulletinCard.tsx             # Card de boletim
│   ├── BulletinEditor.tsx           # Editor de boletim
│   ├── BulletinPreview.tsx          # Preview antes de enviar
│   ├── BulletinDeliveryStatus.tsx   # Status de envio
│   └── index.ts
│
└── video-reports/
    ├── VideoReportCard.tsx          # Card com thumbnail
    ├── VideoReportUploader.tsx      # Upload/link do vídeo
    ├── VideoReportPlayer.tsx        # Player embarcado
    └── index.ts
```

### 8.2 Componentes Principais

#### OperationalProgress (Dashboard Widget)

```tsx
/**
 * Widget que mostra o progresso das tarefas operacionais do dia
 */
export function OperationalProgress() {
  const { tasks, completedCount, totalCount } = useOperationalTasks('daily');
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          ⚡ Rotina do Dia
        </h3>
        <span className="text-2xl font-bold text-violet-400">
          {percentage}%
        </span>
      </div>
      
      {/* Barra de progresso */}
      <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Resumo por categoria */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-emerald-400 font-bold">5/6</div>
          <div className="text-zinc-500">Performance</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-blue-400 font-bold">2/3</div>
          <div className="text-zinc-500">Comunicação</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-amber-400 font-bold">1/2</div>
          <div className="text-zinc-500">Análise</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <div className="text-rose-400 font-bold">0/1</div>
          <div className="text-zinc-500">Crítico</div>
        </div>
      </div>
      
      {/* Próxima tarefa pendente */}
      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="text-xs text-amber-400 mb-1">Próxima pendente:</div>
        <div className="text-sm text-white">D06 - Responder Cliente</div>
        <div className="text-xs text-zinc-500">Estimado: 15min</div>
      </div>
    </GlassCard>
  );
}
```

#### HealthScoreGauge

```tsx
/**
 * Indicador visual circular do Health Score
 */
interface HealthScoreGaugeProps {
  score: number;
  status: 'excellent' | 'good' | 'attention' | 'critical';
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_COLORS = {
  excellent: { color: 'emerald', emoji: '🟢' },
  good: { color: 'blue', emoji: '🔵' },
  attention: { color: 'amber', emoji: '🟡' },
  critical: { color: 'rose', emoji: '🔴' },
};

export function HealthScoreGauge({ score, status, size = 'md' }: HealthScoreGaugeProps) {
  const { color, emoji } = STATUS_COLORS[status];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const sizes = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };
  
  return (
    <div className={`relative ${sizes[size]}`}>
      <svg className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-white/10"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`text-${color}-500 transition-all duration-500`}
        />
      </svg>
      
      {/* Score no centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-zinc-500">{emoji} {status}</span>
      </div>
    </div>
  );
}
```

---

## 9. API Routes

### 9.1 Estrutura

```
src/app/api/
├── operational/
│   ├── route.ts                     # GET (listar), POST (criar template custom)
│   ├── [id]/route.ts                # GET, PUT, DELETE template
│   └── apply/route.ts               # POST (aplicar templates ao cliente)
│
├── checklists/
│   ├── route.ts                     # GET, POST
│   ├── [id]/route.ts                # GET, PUT, DELETE
│   ├── complete/route.ts            # POST (marcar como completo)
│   └── history/[clientId]/route.ts  # GET histórico
│
├── audits/
│   ├── route.ts                     # GET, POST
│   ├── [id]/route.ts                # GET, PUT, DELETE
│   └── by-client/[clientId]/route.ts # GET auditorias do cliente
│
├── health-score/
│   ├── route.ts                     # GET (todos), POST (calcular)
│   ├── [clientId]/route.ts          # GET score do cliente
│   └── calculate/route.ts           # POST (forçar recálculo)
│
├── bulletins/
│   ├── route.ts                     # GET, POST
│   ├── [id]/route.ts                # GET, PUT, DELETE
│   ├── publish/route.ts             # POST (publicar)
│   └── send/route.ts                # POST (enviar para clientes)
│
├── video-reports/
│   ├── route.ts                     # GET, POST
│   ├── [id]/route.ts                # GET, PUT, DELETE
│   └── by-client/[clientId]/route.ts # GET vídeos do cliente
│
├── team/                            # 🆕 NOVO - Team Management
│   ├── members/
│   │   ├── route.ts                 # GET (listar), POST (convidar)
│   │   ├── [id]/route.ts            # GET, PUT, DELETE membro
│   │   └── accept-invite/route.ts   # POST (aceitar convite)
│   │
│   ├── roles/
│   │   ├── route.ts                 # GET (listar), POST (criar)
│   │   └── [id]/route.ts            # GET, PUT, DELETE função
│   │
│   └── notifications/
│       ├── route.ts                 # GET (listar notificações)
│       └── send/route.ts            # POST (enviar notificação)
│
└── tasks/
    └── assign/route.ts              # POST (atribuir tarefa a membro/função)
    └── claim/route.ts               # POST (colaborador pega tarefa)
    └── my-tasks/route.ts            # GET (tarefas do colaborador logado)
```

---

## 10. Prompt de Implementação

### Para colar no Claude Code:

```markdown
# IMPLEMENTAÇÃO: Pacote de Features Premium MARCOLA

Leia a documentação MARCOLA_FEATURES_PACK.md antes de começar.

## CONTEXTO

O MARCOLA já tem:
- ✅ Sistema de Tarefas (templates por nicho)
- ✅ Calendário de Conteúdo
- ✅ Client Intelligence
- ✅ Relatórios e Financeiro

Vamos adicionar:
- 🆕 Templates Operacionais (tarefas padrão do gestor)
- 🆕 Checklists de Rotina
- 🆕 Sistema de Auditorias
- 🆕 Health Score
- 🆕 Boletins de Oportunidades
- 🆕 Team Management & Task Assignment (atribuição de tarefas por função/pessoa)

---

## FASES DE IMPLEMENTAÇÃO

### FASE 1: Database (Migrations)

Criar todas as tabelas novas:
1. operational_templates
2. checklists + checklist_completions
3. audits
4. client_health_scores
5. opportunity_bulletins + bulletin_deliveries
6. video_reports
7. roles (funções da equipe)
8. team_members (membros da equipe)
9. task_notifications (notificações de tarefas)
10. ALTER TABLE tasks (campos de atribuição)

Incluir RLS policies e índices.

**Validar:** Testar no Supabase SQL Editor

### FASE 2: Seed de Templates Operacionais e Roles

Inserir os 40+ templates operacionais padrão (D01-D11, T01-T08, S01-S08, Q01-Q10, M01-M11).
Inserir roles padrão (traffic_manager, video_editor, designer, copywriter, social_media, videomaker, customer_service).

**Validar:** SELECT * FROM operational_templates; SELECT * FROM roles;

### FASE 3: Types TypeScript

Criar em src/types/:
- operational.ts (OperationalTemplate, etc)
- checklist.ts (Checklist, ChecklistItem, ChecklistCompletion)
- audit.ts (Audit, FunnelAudit, CompetitorAudit, MysteryShopperAudit)
- health-score.ts (ClientHealthScore, HealthComponents)
- bulletin.ts (OpportunityBulletin, BulletinDelivery)
- video-report.ts (VideoReport)
- team.ts (Role, TeamMember, TaskAssignment, TaskNotification)

**Validar:** npm run type-check

### FASE 4: API Routes - Operational

Criar rotas para templates operacionais:
- GET /api/operational (listar por frequência)
- POST /api/operational/apply (aplicar ao cliente)

**Validar:** npm run build + testar endpoints

### FASE 5: API Routes - Checklists

Criar rotas para checklists:
- CRUD completo
- POST /api/checklists/complete

**Validar:** npm run build

### FASE 6: API Routes - Audits

Criar rotas para auditorias:
- CRUD completo
- GET por cliente

**Validar:** npm run build

### FASE 7: API Routes - Health Score

Criar rotas:
- GET /api/health-score (todos os clientes)
- GET /api/health-score/[clientId]
- POST /api/health-score/calculate

Implementar lógica de cálculo do score.

**Validar:** npm run build

### FASE 8: Hooks

Criar hooks:
- useOperationalTasks
- useChecklists
- useAudits
- useHealthScore
- useBulletins
- useTeamMembers
- useRoles
- useTaskAssignment
- useMyTasks (para colaboradores)

**Validar:** npm run type-check

### FASE 9: Componentes - Operational

Criar:
- OperationalTaskList
- OperationalTaskCard
- OperationalProgress (widget dashboard)
- FrequencyFilter

**Validar:** npm run build

### FASE 10: Componentes - Checklists

Criar:
- ChecklistCard
- ChecklistModal
- ChecklistItem
- ChecklistProgress

**Validar:** npm run build

### FASE 11: Componentes - Audits

Criar:
- AuditCard
- FunnelAuditForm
- CompetitorAuditForm
- MysteryShopperForm
- AuditResults

**Validar:** npm run build

### FASE 12: Componentes - Health Score

Criar:
- HealthScoreCard
- HealthScoreGauge
- HealthScoreBreakdown
- ChurnRiskBadge

**Validar:** npm run build

### FASE 13: Integração no Dashboard

Adicionar widgets:
- OperationalProgress (rotina do dia)
- HealthScoreOverview (visão geral dos clientes)

**Validar:** npm run build + testar visualmente

### FASE 14: Integração no Cliente

Adicionar novas abas/seções:
- Checklists
- Auditorias
- Health Score

**Validar:** npm run build + testar visualmente

### FASE 15: Página de Gestão Operacional

Criar página /operational com:
- Visão geral de todas as tarefas do dia
- Filtros por frequência
- Seletor de cliente
- Progresso global

**Validar:** npm run build + testar

### FASE 16: API Routes - Team Management

Criar rotas para equipe:
- GET/POST /api/team/members (listar, convidar)
- GET/PUT/DELETE /api/team/members/[id]
- POST /api/team/members/accept-invite
- GET/POST /api/team/roles
- GET/PUT/DELETE /api/team/roles/[id]

**Validar:** npm run build

### FASE 17: Componentes - Team Management

Criar:
- TeamMemberCard
- TeamMemberList
- InviteMemberModal
- RoleCard
- RoleSelector
- MemberSelector
- TaskAssignmentSelector (componente unificado)

**Validar:** npm run build

### FASE 18: Integração - Atribuição de Tarefas

Atualizar formulário de tarefas:
- Adicionar seletor de atribuição (por função ou pessoa)
- Adicionar notificações ao criar/atribuir

**Validar:** npm run build + testar criação de tarefa com atribuição

### FASE 19: Dashboard do Colaborador

Criar:
- Página /my-tasks (tarefas do colaborador logado)
- CollaboratorDashboard (versão simplificada)
- MyTasksList (lista com ações limitadas)
- Lógica de permissões (viewer só atualiza status)

**Validar:** npm run build + testar com usuário viewer

### FASE 20: Página de Gestão de Equipe

Criar página /team com:
- Lista de membros
- Lista de funções
- Estatísticas da equipe
- Modal de convite

**Validar:** npm run build + testar

---

## REGRAS CRÍTICAS

1. SEMPRE validar: npm run type-check && npm run lint && npm run build
2. NUNCA usar `any`
3. SEMPRE tratamento de erros com try-catch
4. SEMPRE seguir visual glassmorphism do DESIGN_SYSTEM.md
5. NUNCA entregar código que não compila
6. Usar a fonte LT Superior (já configurada)
7. Manter padrão de cores do MetricCard (accent prop)

---

## FORMATO DE RESPOSTA

Após cada fase:

✅ FASE X Concluída: [Nome]

### Arquivos Criados:
- path/to/file.ts - Descrição

### Validações:
- ✅ TypeScript: OK
- ✅ Build: OK

### Próxima Fase:
[Nome]

---

## COMECE AGORA

1. Confirme que leu MARCOLA_FEATURES_PACK.md
2. Inicie pela FASE 1: Database
3. Aguardo confirmação
```

---

## 📦 Resumo do Pacote

| Feature | Componentes | Tabelas | Status |
|---------|-------------|---------|--------|
| Templates Operacionais | 4 | 1 | 🆕 Novo |
| Checklists | 5 | 2 | 🆕 Novo |
| Auditorias | 6 | 1 | 🆕 Novo |
| Health Score | 5 | 1 | 🆕 Novo |
| Boletins | 4 | 2 | 🆕 Novo |
| Video Reports | 4 | 1 | 🆕 Novo |
| **Team Management** | **11** | **3** | 🆕 Novo |

**Total: 39 componentes, 11 tabelas, 20 fases de implementação**

---

*Documentação gerada em Dezembro 2025 para o projeto MARCOLA Gestor de Tráfegos*
