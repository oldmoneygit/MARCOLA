# COMPONENTS.md - Documentação de Componentes

---

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Componentes UI Base](#componentes-ui-base)
3. [Componentes de Layout](#componentes-de-layout)
4. [Componentes de Clientes](#componentes-de-clientes)
5. [Componentes de Relatórios](#componentes-de-relatórios)
6. [Componentes de Análise](#componentes-de-análise)
7. [Componentes Financeiros](#componentes-financeiros)
8. [Componentes do Dashboard](#componentes-do-dashboard)

---

## 🎯 Visão Geral

Todos os componentes seguem estas regras:

1. **Localização**: `src/components/{categoria}/{NomeComponente}.tsx`
2. **Tipagem**: Props sempre tipadas com interface
3. **Documentação**: Header comment obrigatório
4. **Export**: Named export + re-export via index.ts

### Estrutura Padrão de Componente

```typescript
/**
 * @file NomeComponente.tsx
 * @description Descrição breve do componente
 * @module components/categoria
 */

'use client'; // Se necessário

import React from 'react';
// ... outros imports

// Types
interface NomeComponenteProps {
  prop1: string;
  prop2?: number;
  onAction?: () => void;
}

// Component
export function NomeComponente({ prop1, prop2 = 0, onAction }: NomeComponenteProps) {
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## 🧱 Componentes UI Base

### GlassCard

Card com efeito glassmorphism.

```typescript
/**
 * @file GlassCard.tsx
 * @description Card base com efeito glassmorphism para toda a aplicação
 * @module components/ui
 */

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;       // Se true, aplica efeito hover
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

// Uso
<GlassCard hover padding="md">
  Conteúdo aqui
</GlassCard>

// Classes geradas
// Base: backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl
// Hover: hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300
// Padding: p-4 | p-5 | p-6
```

### MetricCard

Card para exibição de métricas.

```typescript
/**
 * @file MetricCard.tsx
 * @description Card para exibição de métricas com ícone e variação
 * @module components/ui
 */

interface MetricCardProps {
  icon: string;           // Emoji ou ícone
  label: string;          // Label da métrica
  value: string | number; // Valor principal
  change?: string;        // Texto de variação (ex: "↑ 8%")
  changeType?: 'up' | 'down' | 'neutral';
}

// Uso
<MetricCard
  icon="💰"
  label="Investimento Total"
  value="R$ 12.4k"
  change="8% vs semana passada"
  changeType="up"
/>
```

### StatusBadge

Badge de status.

```typescript
/**
 * @file StatusBadge.tsx
 * @description Badge para exibição de status com cores semânticas
 * @module components/ui
 */

type StatusType = 
  | 'active' | 'paused' | 'inactive'   // Client status
  | 'paid' | 'pending' | 'overdue'     // Payment status
  | 'winner' | 'fatigue' | 'pause';    // Ad status

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

// Uso
<StatusBadge status="active" />
<StatusBadge status="overdue" size="sm" />

// Mapeamento de cores
// active/paid/winner: bg-emerald-500/20 text-emerald-400
// paused/pending/fatigue: bg-amber-500/20 text-amber-400
// inactive/overdue/pause: bg-red-500/20 text-red-400
```

### AlertCard

Card de alerta/notificação.

```typescript
/**
 * @file AlertCard.tsx
 * @description Card para exibição de alertas e notificações
 * @module components/ui
 */

type AlertType = 'success' | 'warning' | 'danger' | 'info';

interface AlertCardProps {
  type: AlertType;
  icon: string;
  title: string;
  description: string;
  action?: string;          // Texto do botão de ação
  onAction?: () => void;
}

// Uso
<AlertCard
  type="warning"
  icon="📉"
  title="Fadiga Criativa Detectada"
  description="Cliente: Academia FitMax — CTR caiu 24%"
  action="Ver sugestões"
  onAction={() => navigate('/analysis')}
/>
```

### Button

Botão estilizado.

```typescript
/**
 * @file Button.tsx
 * @description Botão com variantes e estados
 * @module components/ui
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}

// Uso
<Button variant="primary" size="sm" leftIcon={<PlusIcon />}>
  Novo Cliente
</Button>

<Button variant="danger" loading={isDeleting}>
  Excluir
</Button>
```

### Input

Campo de input.

```typescript
/**
 * @file Input.tsx
 * @description Input com label, erro e variantes
 * @module components/ui
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Uso
<Input
  label="Nome do Cliente"
  placeholder="Ex: Academia FitMax"
  error={errors.name?.message}
/>

// Com ícone
<Input
  label="WhatsApp"
  leftIcon={<PhoneIcon />}
  placeholder="+55 11 99999-9999"
/>
```

### Select

Campo de seleção.

```typescript
/**
 * @file Select.tsx
 * @description Select dropdown com opções
 * @module components/ui
 */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
}

// Uso
<Select
  label="Segmento"
  options={[
    { value: 'fitness', label: 'Academia / Fitness' },
    { value: 'delivery', label: 'Delivery / Restaurante' },
  ]}
  value={segment}
  onChange={setSegment}
/>
```

### Modal

Modal dialog.

```typescript
/**
 * @file Modal.tsx
 * @description Modal com backdrop blur e glassmorphism
 * @module components/ui
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

// Uso
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Novo Cliente"
  size="md"
>
  <ClientForm onSubmit={handleSubmit} />
</Modal>
```

### Table

Tabela de dados.

```typescript
/**
 * @file Table.tsx
 * @description Tabela com headers e rows estilizados
 * @module components/ui
 */

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

// Uso
<Table
  columns={[
    { key: 'name', header: 'Nome' },
    { key: 'segment', header: 'Segmento' },
    { 
      key: 'status', 
      header: 'Status',
      render: (client) => <StatusBadge status={client.status} />
    },
  ]}
  data={clients}
  onRowClick={(client) => navigate(`/clients/${client.id}`)}
/>
```

### Chart

Wrapper para gráficos Recharts.

```typescript
/**
 * @file Chart.tsx
 * @description Wrapper para gráficos com tema dark
 * @module components/ui
 */

type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'doughnut';

interface ChartProps {
  type: ChartType;
  data: any[];
  dataKey: string;
  xAxisKey?: string;
  height?: number;
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
}

// Uso
<Chart
  type="area"
  data={weeklyData}
  dataKey="conversions"
  xAxisKey="day"
  height={200}
  colors={['#8b5cf6']}
/>
```

---

## 📐 Componentes de Layout

### Sidebar

Menu lateral.

```typescript
/**
 * @file Sidebar.tsx
 * @description Sidebar com navegação e informações do usuário
 * @module components/layout
 */

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

// Seções disponíveis
const sections = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { id: 'clients', icon: '👥', label: 'Clientes', path: '/clients' },
  { id: 'reports', icon: '📈', label: 'Relatórios', path: '/reports' },
  { id: 'analysis', icon: '🧠', label: 'Análise', path: '/analysis' },
  { id: 'financial', icon: '💰', label: 'Financeiro', path: '/financial' },
];

// Estrutura
<aside className="sidebar-glass w-64 min-h-screen fixed">
  <Logo />
  <Navigation />
  <QuickActions />
  <UserInfo />
</aside>
```

### Header

Cabeçalho da página.

```typescript
/**
 * @file Header.tsx
 * @description Header com título, descrição e ações
 * @module components/layout
 */

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

// Uso
<Header
  title="Dashboard"
  description="Visão geral da operação"
  actions={
    <Button variant="primary" leftIcon="🔄">
      Atualizar
    </Button>
  }
/>
```

---

## 👥 Componentes de Clientes

### ClientCard

Card de cliente.

```typescript
/**
 * @file ClientCard.tsx
 * @description Card com informações resumidas do cliente
 * @module components/clients
 */

interface ClientCardProps {
  client: Client;
  onClick?: () => void;
}

// Estrutura
<GlassCard>
  <Header>
    <Avatar icon={client.icon} gradient={client.gradient} />
    <Info name={client.name} segment={client.segment} />
    <StatusBadge status={client.status} />
  </Header>
  
  <Metrics>
    <Metric label="Mensalidade" value={formatCurrency(client.monthly_value)} />
    <Metric label="Vencimento" value={`Dia ${client.due_day}`} />
  </Metrics>
  
  <Performance>
    <Metric label="CPA atual" value={formatCurrency(client.cpa)} />
    <Metric label="Leads/mês" value={client.leads} />
  </Performance>
  
  {client.alert && <Alert {...client.alert} />}
</GlassCard>
```

### ClientForm

Formulário de cliente.

```typescript
/**
 * @file ClientForm.tsx
 * @description Formulário para criação/edição de cliente
 * @module components/clients
 */

interface ClientFormProps {
  client?: Client;           // Se presente, modo edição
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel?: () => void;
}

// Campos
const fields = [
  { name: 'name', label: 'Nome do Cliente', required: true },
  { name: 'segment', label: 'Segmento', type: 'select', required: true },
  { name: 'monthly_value', label: 'Mensalidade (R$)', type: 'number', required: true },
  { name: 'due_day', label: 'Dia de Vencimento', type: 'number', min: 1, max: 31 },
  { name: 'contact_phone', label: 'WhatsApp' },
  { name: 'contact_email', label: 'Email' },
  { name: 'ads_account_url', label: 'Link da Conta de Anúncios' },
];

// Validação (Zod)
const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  segment: z.string().min(1, 'Selecione um segmento'),
  monthly_value: z.number().positive('Valor deve ser positivo'),
  due_day: z.number().min(1).max(31),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  ads_account_url: z.string().url().optional().or(z.literal('')),
});
```

### ClientList

Lista de clientes.

```typescript
/**
 * @file ClientList.tsx
 * @description Grid de cards de clientes com filtros
 * @module components/clients
 */

interface ClientListProps {
  clients: Client[];
  loading?: boolean;
  onClientClick?: (client: Client) => void;
  filters?: {
    status?: string;
    segment?: string;
    search?: string;
  };
}

// Uso
<ClientList
  clients={clients}
  loading={isLoading}
  onClientClick={(client) => router.push(`/clients/${client.id}`)}
  filters={{ status: 'active' }}
/>
```

---

## 📈 Componentes de Relatórios

### CSVImporter

Importador de CSV.

```typescript
/**
 * @file CSVImporter.tsx
 * @description Modal para importação de CSV do Ads Manager
 * @module components/reports
 */

interface CSVImporterProps {
  clientId: string;
  onImport: (data: ReportData) => Promise<void>;
  onClose: () => void;
}

// Funcionalidades
// - Drag & drop de arquivo
// - Preview dos dados
// - Mapeamento de colunas
// - Validação
// - Importação com feedback

// Colunas esperadas do CSV
const expectedColumns = [
  'Campaign name',
  'Ad set name',
  'Ad name',
  'Amount spent (BRL)',
  'Impressions',
  'Link clicks',
  'Results', // Conversões
];
```

### MetricsGrid

Grid de métricas de performance.

```typescript
/**
 * @file MetricsGrid.tsx
 * @description Grid de métricas de performance do cliente
 * @module components/reports
 */

interface MetricsGridProps {
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cpa: number;
  };
  previousMetrics?: typeof metrics; // Para cálculo de variação
}

// Uso
<MetricsGrid
  metrics={currentReport.metrics}
  previousMetrics={previousReport?.metrics}
/>

// Exibe: Gasto, Impressões, Cliques, CTR, Conversões, CPA
// Com variação percentual quando previousMetrics é fornecido
```

### AdsTable

Tabela de anúncios.

```typescript
/**
 * @file AdsTable.tsx
 * @description Tabela de performance por anúncio
 * @module components/reports
 */

interface AdsTableProps {
  ads: Ad[];
  onStatusChange?: (adId: string, status: AdStatus) => void;
}

// Colunas
// - Nome do anúncio (com ícone de status)
// - Gasto
// - Impressões
// - Cliques
// - CTR (colorido por performance)
// - Conversões
// - CPA (colorido por performance)
// - Status badge

// Lógica de cores
// CTR: >= 3% (verde), >= 2% (amarelo), < 2% (vermelho)
// CPA: <= meta (verde), até 20% acima (amarelo), > 20% (vermelho)
```

### PerformanceChart

Gráficos de performance.

```typescript
/**
 * @file PerformanceChart.tsx
 * @description Gráficos de evolução de métricas
 * @module components/reports
 */

interface PerformanceChartProps {
  data: DailyMetrics[];
  metric: 'ctr' | 'cpa' | 'spend' | 'conversions';
  type?: 'line' | 'bar' | 'area';
  height?: number;
}

// Uso
<PerformanceChart
  data={dailyData}
  metric="ctr"
  type="area"
  height={180}
/>
```

---

## 🧠 Componentes de Análise

### AndromedaAlert

Alerta do princípio Andromeda.

```typescript
/**
 * @file AndromedaAlert.tsx
 * @description Card informativo sobre diversidade criativa
 * @module components/analysis
 */

interface AndromedaAlertProps {
  clients: {
    id: string;
    name: string;
    creativeCount: number;
    recommendedCount: number;
  }[];
}

// Exibe:
// - Explicação do princípio Andromeda
// - Status de cada cliente (quantidade de criativos)
// - Recomendação (8-15 criativos)
// - Indicador visual (verde se ok, amarelo se abaixo)
```

### SuggestionCard

Card de sugestão.

```typescript
/**
 * @file SuggestionCard.tsx
 * @description Card para exibição de sugestão de otimização
 * @module components/analysis
 */

type SuggestionSeverity = 'urgent' | 'warning' | 'info';

interface SuggestionCardProps {
  suggestion: {
    id: string;
    type: string;
    severity: SuggestionSeverity;
    clientName: string;
    title: string;
    description: string;
    actions?: string[];
    projection?: {
      label: string;
      value: string;
      highlight?: boolean;
    }[];
  };
  onAction?: (suggestionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
}

// Estrutura
<GlassCard>
  <Icon type={severity} />
  <Content>
    <Badges severity={severity} client={clientName} />
    <Title>{title}</Title>
    <Description>{description}</Description>
    {actions && <ActionsList actions={actions} />}
    {projection && <ProjectionGrid items={projection} />}
  </Content>
  <ActionButton severity={severity} onClick={onAction} />
</GlassCard>
```

### SuggestionList

Lista de sugestões.

```typescript
/**
 * @file SuggestionList.tsx
 * @description Lista filtrada de sugestões
 * @module components/analysis
 */

interface SuggestionListProps {
  suggestions: Suggestion[];
  filter?: {
    clientId?: string;
    severity?: SuggestionSeverity;
    type?: string;
  };
  onAction?: (suggestionId: string) => void;
}

// Ordenação: urgent > warning > info
// Agrupa por cliente ou tipo
```

---

## 💰 Componentes Financeiros

### FinancialOverview

Visão geral financeira.

```typescript
/**
 * @file FinancialOverview.tsx
 * @description Cards de resumo financeiro do mês
 * @module components/financial
 */

interface FinancialOverviewProps {
  data: {
    totalRevenue: number;
    received: number;
    pending: number;
    overdue: number;
    clientCount: number;
  };
  month?: string; // Ex: "2025-12"
}

// 4 MetricCards:
// - Faturamento Mês (verde)
// - Recebido
// - Pendente (amarelo)
// - Atrasado (vermelho)
```

### PaymentsTable

Tabela de pagamentos.

```typescript
/**
 * @file PaymentsTable.tsx
 * @description Tabela de status de pagamentos
 * @module components/financial
 */

interface PaymentsTableProps {
  payments: Payment[];
  onMarkPaid?: (paymentId: string) => void;
  onSendReminder?: (payment: Payment) => void;
}

// Colunas:
// - Cliente (avatar + nome)
// - Valor
// - Vencimento
// - Status (badge)
// - Ações (botões)

// Destaque visual para linhas com status 'overdue'
```

### MessageTemplates

Templates de mensagem.

```typescript
/**
 * @file MessageTemplates.tsx
 * @description Cards com templates de mensagem para WhatsApp
 * @module components/financial
 */

interface MessageTemplatesProps {
  templates: {
    id: string;
    title: string;
    message: string;
  }[];
  onCopy?: (message: string) => void;
  onUse?: (template: Template, client: Client) => void;
}

// Templates padrão:
// - Lembrete pré-vencimento
// - Cobrança atrasada
// - Confirmação de pagamento
// - Agradecimento

// Suporta variáveis: [NOME], [DATA], [VALOR], [MES]
```

### ReminderModal

Modal de envio de lembrete.

```typescript
/**
 * @file ReminderModal.tsx
 * @description Modal para enviar lembrete de pagamento
 * @module components/financial
 */

interface ReminderModalProps {
  payment: Payment;
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

// Funcionalidades:
// - Exibe info do cliente e pagamento
// - Textarea com mensagem pré-preenchida
// - Botão "Abrir no WhatsApp" (gera link wa.me)
// - Botão "Copiar"
```

---

## 📊 Componentes do Dashboard

### AlertsList

Lista de alertas.

```typescript
/**
 * @file AlertsList.tsx
 * @description Lista de alertas importantes do dashboard
 * @module components/dashboard
 */

interface AlertsListProps {
  alerts: Alert[];
  maxItems?: number;
  onAlertClick?: (alert: Alert) => void;
}

// Tipos de alerta:
// - Fadiga criativa (warning)
// - Pagamento atrasado (danger)
// - Ad vencedor (success)
// - Diversidade criativa (info)
```

### UpcomingPayments

Próximas cobranças.

```typescript
/**
 * @file UpcomingPayments.tsx
 * @description Lista de próximas cobranças
 * @module components/dashboard
 */

interface UpcomingPaymentsProps {
  payments: Payment[];
  maxItems?: number;
}

// Exibe:
// - Próximos 3-5 pagamentos
// - Ordenados por data
// - Destaque para atrasados
// - Link para financeiro
```

### WeeklyChart

Gráfico semanal.

```typescript
/**
 * @file WeeklyChart.tsx
 * @description Gráfico de performance semanal
 * @module components/dashboard
 */

interface WeeklyChartProps {
  data: {
    day: string;
    conversions: number;
    spend: number;
  }[];
  metric?: 'conversions' | 'spend';
}

// Área chart com gradiente
// 7 dias (Seg-Dom)
// Tooltip com valores
```

### ClientsDistribution

Distribuição por cliente.

```typescript
/**
 * @file ClientsDistribution.tsx
 * @description Gráfico de distribuição de investimento por cliente
 * @module components/dashboard
 */

interface ClientsDistributionProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

// Doughnut chart
// Legenda com cores
// Tooltip com valores
```

---

## 📁 Index Files

Cada pasta de componentes tem um `index.ts` para re-exports:

```typescript
// components/ui/index.ts
export { GlassCard } from './GlassCard';
export { MetricCard } from './MetricCard';
export { StatusBadge } from './StatusBadge';
export { AlertCard } from './AlertCard';
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export { Modal } from './Modal';
export { Table } from './Table';
export { Chart } from './Chart';

// Uso
import { GlassCard, Button, Modal } from '@/components/ui';
```

---

*Este documento deve ser atualizado sempre que novos componentes forem criados.*
