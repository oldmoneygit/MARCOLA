# PROJECT_STATUS.md - Status Atual do Projeto MARCOLA

> **Documento vivo** - Atualizado sempre que novas features são implementadas ou decisões técnicas importantes são tomadas. Use este documento para contextualizar o Claude Chat sobre o estado atual do projeto.

**Última atualização:** 2024-12-04 (v0.6.0)

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
| Equipe | ✅ Completo | Membros, convites por email, permissões granulares |
| **WhatsApp** | ✅ Completo | Integração Z-API, templates, histórico, envio direto |

### Módulos Pendentes

| Módulo | Status | Prioridade |
|--------|--------|------------|
| Integrações Externas | 🔴 Não iniciado | Alta |
| Dashboard Analytics Avançado | 🟡 Parcial | Média |
| Notificações Push | 🔴 Não iniciado | Baixa |
| App Mobile (PWA) | 🔴 Não iniciado | Baixa |

---

## 🆕 Atualizações Recentes

### v0.6.0 - Integração WhatsApp via Z-API (2024-12-04)

#### 1. Integração Completa com Z-API

Sistema completo de envio de mensagens WhatsApp usando a plataforma Z-API.

**Funcionalidades:**

- Envio de mensagens de texto para clientes
- 6 templates pré-definidos (pagamento, tarefas, relatórios)
- Mensagens personalizadas (custom)
- Modal com fluxo intuitivo (Selecionar → Compor → Enviar)
- Edição de telefone inline com salvamento no banco
- Histórico de mensagens enviadas (tabela `whatsapp_logs`)
- Verificação de status da conexão

**Arquivos criados:**

- `src/app/api/whatsapp/send/route.ts` - API de envio
- `src/app/api/whatsapp/status/route.ts` - Status da conexão
- `src/app/api/whatsapp/templates/route.ts` - Listar templates
- `src/app/api/whatsapp/history/route.ts` - Histórico de mensagens
- `src/app/api/whatsapp/webhook/route.ts` - Receber webhooks
- `src/components/whatsapp/SendWhatsAppModal.tsx` - Modal de envio
- `src/components/whatsapp/index.ts` - Exports
- `src/hooks/useWhatsApp.ts` - Hook para operações
- `src/lib/whatsapp/zapi-service.ts` - Classe de serviço Z-API
- `src/lib/whatsapp/message-templates.ts` - Templates de mensagem
- `src/lib/whatsapp/index.ts` - Exports
- `src/types/whatsapp.ts` - Tipos TypeScript
- `docs/WHATSAPP_ZAPI_INTEGRATION.md` - Documentação completa

**Arquivos modificados:**

- `src/components/clients/ClientCard.tsx` - Botão WhatsApp + Modal integrado
- `.env.local` - Variáveis de ambiente Z-API

**Configuração necessária:**

```env
ZAPI_INSTANCE_ID=seu_instance_id
ZAPI_TOKEN=seu_token
ZAPI_CLIENT_TOKEN=seu_client_token
```

#### 2. Templates de Mensagem

6 templates pré-definidos para diferentes cenários:

| Template | Uso |
|----------|-----|
| `payment_reminder` | Lembrete de pagamento próximo |
| `payment_overdue` | Pagamento em atraso |
| `task_completed` | Notificar tarefa concluída |
| `task_assigned` | Nova tarefa atribuída |
| `report_ready` | Relatório disponível |
| `custom` | Mensagem personalizada |

#### 3. Modal com Portal

O modal de WhatsApp usa `createPortal` para renderizar fora da hierarquia DOM, evitando problemas de z-index e overflow.

**Características:**

- Renderiza no `document.body`
- Z-index 9999
- Backdrop com blur
- Fluxo em etapas: select → compose → success
- Validação de variáveis obrigatórias

#### 4. Migrações de Banco de Dados

**Tabela criada:**

- `whatsapp_logs` - Histórico de mensagens enviadas

**Campos:**

- `id`, `user_id`, `client_id`, `phone`, `message`, `template_type`
- `zapi_message_id`, `status`, `error`, `sent_at`, `delivered_at`, `read_at`

---

### v0.5.0 - Sistema de Equipe e Permissões (2024-12-04)

#### 1. Sistema de Gestão de Equipe Completo

Novo módulo que permite ao owner adicionar membros à sua equipe com diferentes níveis de acesso.

**Funcionalidades:**

- CRUD completo de membros da equipe
- Funções (roles): Admin, Manager, Member, Viewer
- Especialidades configuráveis (criativos, copywriting, gestão de campanhas, etc.)
- Avatar com iniciais e cor personalizada
- Ativação/desativação de membros

**Arquivos criados:**

- `src/app/(dashboard)/team/page.tsx` - Página de equipe
- `src/app/api/team/route.ts` - API CRUD de membros
- `src/components/team/TeamPageContent.tsx` - Conteúdo principal
- `src/components/team/TeamMemberCard.tsx` - Card de membro
- `src/components/team/TeamMemberModal.tsx` - Modal criar/editar
- `src/components/team/TeamMemberAvatar.tsx` - Avatar
- `src/hooks/useTeam.ts` - Hook de gestão
- `src/types/team.ts` - Tipos e constantes

#### 2. Sistema de Convites por Email

Sistema completo de convites que permite membros criarem conta e acessarem a plataforma.

**Funcionalidades:**

- Geração de token único por convite
- Envio de email via Resend
- Página de aceite de convite
- Criação automática de conta
- Vinculação de user_id ao team_member
- Reenvio de convites expirados

**Fluxo:**

```text
Owner cria membro → Envia convite → Email com link →
Membro acessa link → Cria senha → Conta ativada
```

**Arquivos criados:**

- `src/app/invite/[token]/page.tsx` - Página de convite
- `src/app/api/invitations/route.ts` - Lista/cria convites
- `src/app/api/invitations/[token]/route.ts` - Busca/cancela
- `src/app/api/invitations/resend/route.ts` - Reenvia convite
- `src/app/api/invitations/accept/route.ts` - Aceita convite
- `src/components/invite/AcceptInvitePage.tsx` - UI de aceite
- `src/lib/email.ts` - Serviço de email (Resend)

**Configuração necessária:**

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=convites@seudominio.com
```

#### 3. Sistema de Permissões Granulares

Controle de acesso baseado em permissões que filtra automaticamente a navegação.

**Permissões disponíveis:**

| Permissão | Descrição |
|-----------|-----------|
| `can_view_clients` | Ver lista de clientes |
| `can_edit_clients` | Editar dados de clientes |
| `can_view_reports` | Ver relatórios |
| `can_edit_reports` | Editar/importar relatórios |
| `can_view_financial` | Ver dados financeiros |
| `can_manage_tasks` | Gerenciar tarefas |
| `can_assign_tasks` | Atribuir tarefas a outros |

**Hook `useCurrentUser`:**

Novo hook que identifica se o usuário é owner ou team member e fornece suas permissões.

```typescript
const { data, hasPermission, canAccessRoute } = useCurrentUser();

if (data?.isOwner) { /* acesso total */ }
if (hasPermission('can_edit_clients')) { /* pode editar */ }
if (canAccessRoute('financial')) { /* pode ver /financial */ }
```

**Arquivos criados:**

- `src/hooks/useCurrentUser.ts` - Hook de identificação

**Arquivos modificados:**

- `src/components/layout/Sidebar.tsx` - Filtra navegação por permissões
- `src/components/team/TeamPageContent.tsx` - Usa DashboardLayout

#### 4. Migrações de Banco de Dados

**Tabelas criadas:**

- `team_members` - Membros da equipe
- `team_invitations` - Convites pendentes/aceitos

**Políticas RLS:**

- `team_members`: Owner gerencia, membro vê seus dados, público vê membros com convite pendente
- `team_invitations`: Owner gerencia, público pode ler por token

**Funções PostgreSQL:**

- `generate_invitation_token()` - Gera token único
- `accept_team_invitation()` - Processa aceite de convite

#### 5. Documentação

**Arquivo criado:**

- `docs/TEAM_SYSTEM.md` - Documentação completa do sistema de equipe

---

### v0.4.0 - Task Quick Actions & Health Score System (2024-12-04)

#### 1. Sistema de Ações Rápidas Contextuais (TaskQuickActions)

Novo sistema que detecta automaticamente o tipo de tarefa baseado em keywords no título e exibe botões de ação relevantes.

**Tipos detectados e ações:**

| Tipo | Ações Exibidas |
|------|----------------|
| criativos | Ads Manager, Google Drive |
| anuncios | Ads Manager, Google Ads |
| reuniao | Agendar (calendário), WhatsApp/Email |
| analise | Relatórios, Ads Manager |
| social | Instagram, Google Drive |
| financeiro | WhatsApp (lembrete), Email |

**Integrado em:**

- `TaskCard` - Exibe ações no corpo do card
- `TaskList` - Propaga dados do cliente
- `ClientCard` - Ações inline nas tarefas expandidas
- `TasksPageContent` - Suporte a múltiplos clientes via Map
- `ClientDetailContent` - Passa dados do cliente atual

**Arquivos criados:**

- `src/components/tasks/TaskQuickActions.tsx` - Componente principal + `detectTaskType()`

**Arquivos modificados:**

- `src/components/tasks/TaskCard.tsx` - Props: `clientData`, `showQuickActions`, `onCreateCalendarEvent`
- `src/components/tasks/TaskList.tsx` - Props: `clientData`, `clientsMap`, `showQuickActions`
- `src/components/tasks/TasksPageContent.tsx` - Mapa de clientes para ações rápidas
- `src/components/tasks/index.ts` - Exports atualizados
- `src/components/clients/ClientCard.tsx` - TaskQuickActions nas tarefas expandidas
- `src/components/clients/ClientDetailContent.tsx` - ClientData para TaskList

#### 2. Sistema de Health Score (Saúde do Cliente)

Sistema de pontuação que avalia a "saúde" da gestão de cada cliente baseado em múltiplos fatores.

**Fatores avaliados (0-100):**

- Tarefas concluídas vs pendentes
- Relatórios importados recentemente
- Dados do briefing preenchidos
- Frequência de atividade
- Alertas pendentes

**Arquivos criados:**

- `src/components/clients/HealthScoreCard.tsx` - Card visual com score e breakdown
- `src/hooks/useHealthScore.ts` - Hook para buscar/calcular score
- `src/lib/health-score/calculator.ts` - Lógica de cálculo
- `src/lib/health-score/index.ts` - Exports
- `src/app/api/clients/[id]/health-score/route.ts` - API endpoint

#### 3. Modal de Tarefa a partir de Template (AddTaskFromTemplateModal)

Modal que permite criar tarefas diretamente de templates existentes.

**Funcionalidades:**

- Lista templates operacionais e do segmento do cliente
- Pré-preenche campos do formulário
- Permite ajustes antes de criar
- Vincula tarefa ao template original

**Arquivo criado:**

- `src/components/tasks/AddTaskFromTemplateModal.tsx`

#### 4. Substituição de Emojis por Ícones Lucide

Refatoração visual para usar ícones SVG consistentes em vez de emojis.

**Componentes afetados:**

- `Icon.tsx` - Novo componente centralizado
- `StatusBadge.tsx` - Ícones em vez de emojis
- `ContentStatusBadge.tsx` - Atualizado
- `ContentTypeBadge.tsx` - Atualizado
- `PriorityBadge.tsx` - Atualizado
- `TaskStatusBadge.tsx` - Atualizado

**Benefícios:**

- Consistência visual
- Melhor renderização cross-platform
- Cores personalizáveis via CSS

---

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

#### 5. ~~WhatsApp Business API~~ ✅ IMPLEMENTADO (v0.6.0)

**Status:** Implementado via Z-API

**Funcionalidades entregues:**
- ✅ Envio de mensagens para clientes
- ✅ 6 templates pré-definidos
- ✅ Mensagens personalizadas
- ✅ Histórico de mensagens
- ✅ Modal integrado no ClientCard

**Documentação:** `docs/WHATSAPP_ZAPI_INTEGRATION.md`

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
