# PROJECT_STATUS.md - Status Atual do Projeto MARCOLA

> **Documento vivo** - Atualizado sempre que novas features são implementadas ou decisões técnicas importantes são tomadas. Use este documento para contextualizar o Claude Chat sobre o estado atual do projeto.

**Última atualização:** 2024-12-04

---

## 📋 Sumário

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Estado Atual](#estado-atual)
3. [Atualizações Recentes](#atualizações-recentes)
4. [Decisões Técnicas](#decisões-técnicas)
5. [Roadmap de Integrações](#roadmap-de-integrações)
6. [Próximos Passos](#próximos-passos)
7. [Débitos Técnicos](#débitos-técnicos)

---

## 🎯 Visão Geral do Projeto

**MARCOLA Gestor de Tráfegos** (anteriormente TrafficHub) é um sistema de gestão interna para agências de tráfego pago. O sistema permite:

- Gerenciar clientes e suas informações completas (briefing, credenciais, contatos)
- Importar e visualizar relatórios de performance de anúncios (CSV Meta Ads)
- Gerar sugestões inteligentes baseadas em dados usando IA (OpenRouter)
- Controlar cobranças e financeiro com lembretes via WhatsApp
- Gerenciar calendário de conteúdo e tarefas recorrentes
- Sistema de inteligência de cliente com IA (Knowledge Base, Sugestões, Ofertas Sazonais)

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, DaisyUI, Glassmorphism Design System |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| AI | OpenRouter API (GPT-4o-mini, Claude) |
| Deploy | Vercel |

---

## 📊 Estado Atual

### Módulos Implementados

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Autenticação | ✅ Completo | Login, registro, sessões persistentes |
| Clientes | ✅ Completo | CRUD, briefing dinâmico, credenciais, avatar |
| Tarefas | ✅ Completo | Templates por segmento, recorrência, notas |
| Calendário | ✅ Completo | Eventos, tipos de conteúdo, status, plataformas |
| Relatórios | ✅ Completo | Import CSV, métricas, visualização |
| Análise/Sugestões | ✅ Completo | Detecção de fadiga, oportunidades, IA |
| Financeiro | ✅ Completo | Pagamentos, lembretes WhatsApp |
| Inteligência | ✅ Completo | Knowledge Base, sugestões personalizadas, ofertas sazonais |

### Módulos Pendentes

| Módulo | Status | Prioridade |
|--------|--------|------------|
| Integrações Externas | 🔴 Não iniciado | Alta |
| Dashboard Analytics Avançado | 🟡 Parcial | Média |
| Notificações Push | 🔴 Não iniciado | Baixa |
| App Mobile (PWA) | 🔴 Não iniciado | Baixa |

---

## 🆕 Atualizações Recentes

### v0.3.0 - Rebranding & UI Refinements (2024-12-04)

#### 1. Rebranding Completo
- **Nome:** TrafficHub → **MARCOLA Gestor de Tráfegos**
- **Tipografia:** Inter → **LT Superior** (5 pesos: Light, Regular, Medium, SemiBold, Bold)
- **Arquivos afetados:**
  - `src/app/layout.tsx` - Metadata atualizada
  - `src/lib/constants.ts` - APP_NAME, APP_FULL_NAME
  - `package.json` - Nome do projeto
  - `src/app/globals.css` - @font-face declarations

#### 2. Campo Google Ads Account URL
- Novo campo `google_ads_account_url` na tabela `clients`
- Diferenciação visual no formulário:
  - Meta Ads: Borda azul (`blue-500`)
  - Google Ads: Borda âmbar (`amber-500`)
- **Arquivos afetados:**
  - `src/types/client.ts` - Interface Client, CreateClientDTO
  - `src/components/clients/ClientFormStepper.tsx` - Step 4 (Links & Recursos)
  - Migration SQL aplicada no Supabase

#### 3. Botão "Novo Cliente" Redesenhado
- Design unificado com gradiente violeta
- Dropdown integrado no mesmo layer
- Opções: "Cliente em Branco" e "Importar CSV"
- **Arquivo:** `src/components/clients/ClientsPageContent.tsx`

#### 4. Diferenciação Visual de Tarefas Recorrentes
- Borda violeta à direita para tarefas recorrentes
- Badge com tipo de recorrência (Diária, Semanal, Quinzenal, Mensal)
- Contador de tarefas recorrentes no card colapsado
- **Arquivo:** `src/components/clients/ClientCard.tsx`

#### 5. Dashboard Refatorado
- **Nova ordem de prioridade:**
  1. Métricas (topo) - com cores distintas
  2. Tarefas de Hoje + Próximos Conteúdos (rotina do gestor)
  3. Alertas & Sugestões + Clientes com Atenção (secundário)
- **MetricCard com cores e borda 3D:**
  - Investimento Total: Verde (`emerald`)
  - Clientes Ativos: Azul (`blue`)
  - CPA Médio: Violeta (`violet`)
  - Alertas Pendentes: Âmbar (`amber`)
- **Arquivos afetados:**
  - `src/components/ui/MetricCard.tsx` - Prop `accent` + ACCENT_COLORS
  - `src/components/dashboard/DashboardPageContent.tsx` - Layout reordenado

#### 6. Página de Comparação de Fontes
- Nova página `/fonts` para testes de tipografia
- Comparação lado a lado de 4 fontes candidatas
- Preview de hierarquia tipográfica, métricas, badges
- **Arquivo:** `src/app/(dashboard)/fonts/page.tsx`

---

### v0.2.0 - Client Intelligence System (2024-12-03)

#### Sistema de Inteligência do Cliente
- **Knowledge Base:** Perfil estruturado em JSON com todos os dados do cliente
- **Executive Summary:** Resumo executivo da estratégia
- **Content Suggestions:** Sugestões de conteúdo PERSONALIZADAS (não genéricas)
- **Seasonal Offers:** Ofertas sazonais com cálculo de margem de lucro

#### Arquivos Criados
- `src/types/intelligence.ts` - Interfaces completas
- `src/lib/intelligence/prompt-builder.ts` - Construção de prompts
- `src/lib/intelligence/generation-service.ts` - Chamadas à API de IA
- `src/app/api/intelligence/...` - API Routes (CRUD + regenerate)
- `src/hooks/useClientIntelligence.ts` - Hook customizado
- `src/components/intelligence/...` - Componentes de visualização

---

### v0.1.0 - Initial Release (2024-12-02)

- Setup inicial do projeto
- Módulos core implementados
- Design system glassmorphism
- Integração com Supabase

---

## 🔧 Decisões Técnicas

### Tipografia: LT Superior
**Decisão:** Substituir Inter por LT Superior como fonte principal.

**Motivo:**
- Melhor legibilidade em tamanhos pequenos
- Personalidade mais moderna e premium
- Excelente suporte a números (importante para métricas)
- 5 pesos disponíveis para hierarquia

**Implementação:**
- @font-face em `globals.css`
- Font-family em `tailwind.config.ts`
- Fallback para system-ui

### MetricCard com Accent Colors
**Decisão:** Adicionar prop `accent` para cores distintas em cada card.

**Motivo:**
- Facilita identificação visual rápida
- Melhora hierarquia de informação
- Feedback visual mais rico
- Consistência com design system

**Cores definidas:**
- `violet`, `emerald`, `amber`, `rose`, `blue`, `cyan`

### Dashboard Layout Priority
**Decisão:** Tarefas de Hoje devem aparecer antes de Alertas.

**Motivo:**
- Para gestores de tráfego, a rotina diária é mais importante
- Alertas são importantes mas não urgentes
- Bater o olho e ver as tarefas do dia é prioridade

---

## 🔌 Roadmap de Integrações

### Prioridade Alta

#### 1. Facebook/Meta Ads API
**Objetivo:** Eliminar importação manual de CSV

**Funcionalidades:**
- OAuth2 login com Facebook Business
- Sync automático de campanhas e métricas
- Atualização em tempo real (ou agendada)
- Histórico de performance

**Complexidade:** Alta
**Dependências:** Facebook Business API, OAuth2 flow

#### 2. Google Calendar Integration
**Objetivo:** Sincronizar eventos e reuniões

**Funcionalidades:**
- OAuth2 login com Google
- Criar eventos no Google Calendar a partir do sistema
- Importar eventos do Google Calendar
- Notificações de reuniões

**Complexidade:** Média
**Dependências:** Google Calendar API, OAuth2 flow

### Prioridade Média

#### 3. Google Ads API
**Objetivo:** Relatórios de Google Ads automáticos

**Funcionalidades:**
- OAuth2 login com Google
- Sync de campanhas e métricas
- Comparação Meta vs Google

**Complexidade:** Alta
**Dependências:** Google Ads API, OAuth2 flow

#### 4. Calendly Integration
**Objetivo:** Agendamento de reuniões

**Funcionalidades:**
- Embed de Calendly ou API
- Criar links de agendamento por cliente
- Webhook para novos agendamentos

**Complexidade:** Baixa
**Dependências:** Calendly API ou Embed

#### 5. WhatsApp Business API
**Objetivo:** Envio automatizado de mensagens

**Funcionalidades:**
- Lembretes de pagamento automáticos
- Notificações de tarefas
- Templates de mensagem

**Complexidade:** Alta
**Dependências:** WhatsApp Business API, Templates aprovados

### Prioridade Baixa

#### 6. Notion Integration
**Objetivo:** Sync de documentos e bases

**Funcionalidades:**
- Importar/exportar briefings
- Sync de tarefas

**Complexidade:** Média

#### 7. Slack/Discord Notifications
**Objetivo:** Alertas em canais de equipe

**Funcionalidades:**
- Webhooks para alertas
- Resumos diários

**Complexidade:** Baixa

---

## 🚀 Próximos Passos

### Imediato (Sprint Atual)
1. [ ] Documentar arquitetura de integrações
2. [ ] Planejar fluxo OAuth2 genérico
3. [ ] Definir estrutura de tabelas para tokens de integração
4. [ ] Criar componente de configuração de integrações

### Curto Prazo (2-3 Sprints)
1. [ ] Implementar integração Google Calendar
2. [ ] Implementar integração Calendly
3. [ ] Criar página de configurações de integrações

### Médio Prazo (4-6 Sprints)
1. [ ] Implementar Facebook/Meta Ads API
2. [ ] Implementar Google Ads API
3. [ ] Dashboard comparativo Meta vs Google

### Longo Prazo
1. [ ] WhatsApp Business API
2. [ ] App Mobile (PWA)
3. [ ] Notificações Push

---

## ⚠️ Débitos Técnicos

### Alta Prioridade
1. **Atualizar docs antigos:** `ARCHITECTURE.md` ainda referencia "TrafficHub"
2. **Testes unitários:** Cobertura baixa, especialmente em hooks
3. **Error boundaries:** Faltam em alguns componentes

### Média Prioridade
1. **Lazy loading:** Componentes pesados não estão sendo lazy loaded
2. **Skeleton states:** Alguns componentes não têm loading states
3. **Accessibility:** Falta audit de acessibilidade

### Baixa Prioridade
1. **Storybook:** Não configurado para componentes UI
2. **CI/CD:** Pipeline básico, falta testes automatizados
3. **Analytics:** Sem tracking de uso

---

## 📝 Notas para Claude Chat

Ao receber este documento, o Claude Chat deve:

1. **Entender o contexto:** MARCOLA é uma plataforma de gestão para agências de tráfego pago
2. **Respeitar decisões:** As decisões técnicas documentadas foram tomadas com propósito
3. **Priorizar integrações:** O próximo grande foco é a parte de integrações externas
4. **Manter consistência:** Seguir o design system glassmorphism e padrões estabelecidos
5. **Documentar sempre:** Novas features importantes devem atualizar este documento

### Perguntas úteis para próximos passos:
- "Qual integração devemos priorizar primeiro?"
- "Como estruturar o fluxo OAuth2 de forma reutilizável?"
- "Qual a melhor arquitetura para sync de dados externos?"
- "Como implementar rate limiting para APIs externas?"

---

*Este documento deve ser atualizado sempre que features significativas forem implementadas.*
