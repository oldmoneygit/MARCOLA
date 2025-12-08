# 🚀 MARCOLA ASSISTANT - Tools Avançados v2.0

## PARTE 6: Integração Final e Instruções

---

## 📁 ESTRUTURA FINAL DE ARQUIVOS

```
src/
├── lib/
│   └── assistant/
│       ├── types.ts                        # Tipos base (já existe)
│       ├── types-advanced.ts               # NOVO - Tipos avançados (Parte 1)
│       ├── tools.ts                        # Tools base (já existe)
│       │
│       ├── tools-advanced/                 # NOVA PASTA
│       │   ├── index.ts                    # Export central
│       │   ├── batch-actions.ts            # Definições (Parte 2)
│       │   ├── batch-actions-executor.ts   # Executor (Parte 2)
│       │   ├── intelligence.ts             # Definições (Parte 3)
│       │   ├── intelligence-executor.ts    # Executor (Parte 3)
│       │   ├── communication.ts            # Definições (Parte 4)
│       │   ├── communication-executor.ts   # Executor (Parte 4)
│       │   ├── meta-actions.ts             # Definições (Parte 5)
│       │   └── meta-actions-executor.ts    # Executor (Parte 5)
│       │
│       └── tool-executor.ts                # ATUALIZAR (abaixo)
│
├── components/
│   └── assistant/
│       ├── ConfirmationCard.tsx            # ATUALIZAR (abaixo)
│       └── cards/                          # NOVA PASTA
│           ├── BatchCobrancaCard.tsx
│           ├── BatchConfirmacaoCard.tsx
│           ├── BatchFollowupCard.tsx
│           ├── GerarFaturasCard.tsx
│           ├── PosReuniaoCard.tsx
│           ├── AgendamentoRecorrenteCard.tsx
│           └── OnboardingCard.tsx
```

---

## 🔗 ARQUIVO INDEX PARA TOOLS AVANÇADOS

### Arquivo: `src/lib/assistant/tools-advanced/index.ts`

```typescript
// ============================================================
// MARCOLA ASSISTANT - TOOLS AVANÇADOS - INDEX
// ============================================================

// Definições de Tools
export { BATCH_ACTION_TOOLS } from './batch-actions';
export { INTELLIGENCE_TOOLS } from './intelligence';
export { COMMUNICATION_TOOLS } from './communication';
export { META_ACTION_TOOLS } from './meta-actions';

// Executors
export { BatchActionsExecutor } from './batch-actions-executor';
export { IntelligenceExecutor } from './intelligence-executor';
export { CommunicationExecutor } from './communication-executor';
export { MetaActionsExecutor } from './meta-actions-executor';

// Todos os tools avançados combinados
import { BATCH_ACTION_TOOLS } from './batch-actions';
import { INTELLIGENCE_TOOLS } from './intelligence';
import { COMMUNICATION_TOOLS } from './communication';
import { META_ACTION_TOOLS } from './meta-actions';

export const ALL_ADVANCED_TOOLS = [
  ...BATCH_ACTION_TOOLS,
  ...INTELLIGENCE_TOOLS,
  ...COMMUNICATION_TOOLS,
  ...META_ACTION_TOOLS
];

// Lista de tools que requerem confirmação
export const TOOLS_REQUIRING_CONFIRMATION = [
  'cobrar_todos_vencidos',
  'confirmar_reunioes_amanha',
  'gerar_faturas_mes',
  'enviar_followup_lote',
  'registrar_pos_reuniao',
  'agendar_recorrente',
  'onboarding_cliente'
];

// Helper para verificar se tool requer confirmação
export function requiresConfirmation(toolName: string): boolean {
  return TOOLS_REQUIRING_CONFIRMATION.includes(toolName);
}
```

---

## ⚙️ ATUALIZAÇÃO DO TOOL EXECUTOR

### Arquivo: `src/lib/assistant/tool-executor.ts` (ATUALIZAR)

```typescript
// ============================================================
// MARCOLA ASSISTANT - TOOL EXECUTOR COMPLETO
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { ToolCall, ToolResult, ConfirmationData } from './types';

// Importar executors avançados
import {
  BatchActionsExecutor,
  IntelligenceExecutor,
  CommunicationExecutor,
  MetaActionsExecutor,
  requiresConfirmation
} from './tools-advanced';

export class ToolExecutor {
  private supabase;
  private userId: string;
  
  // Executors avançados
  private batchExecutor: BatchActionsExecutor;
  private intelligenceExecutor: IntelligenceExecutor;
  private communicationExecutor: CommunicationExecutor;
  private metaExecutor: MetaActionsExecutor;

  constructor(userId: string) {
    this.supabase = createClient();
    this.userId = userId;
    
    // Inicializar executors avançados
    this.batchExecutor = new BatchActionsExecutor(userId);
    this.intelligenceExecutor = new IntelligenceExecutor(userId);
    this.communicationExecutor = new CommunicationExecutor(userId);
    this.metaExecutor = new MetaActionsExecutor(userId);
  }

  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const { name, parameters } = toolCall;

    try {
      // Verificar se requer confirmação
      if (requiresConfirmation(name) && !parameters._confirmed) {
        return await this.prepareConfirmation(name, parameters);
      }

      // Executar tool
      const result = await this.executeToolByName(name, parameters);

      return {
        id: toolCall.id,
        success: true,
        data: result,
        toolName: name
      };
    } catch (error: any) {
      return {
        id: toolCall.id,
        success: false,
        error: error.message,
        toolName: name
      };
    }
  }

  private async prepareConfirmation(
    toolName: string, 
    parameters: any
  ): Promise<ToolResult> {
    let confirmation: ConfirmationData;

    switch (toolName) {
      // === BATCH ACTIONS ===
      case 'cobrar_todos_vencidos':
        const cobrancaResult = await this.batchExecutor.prepararCobrancaLote(parameters);
        confirmation = cobrancaResult.confirmation;
        break;

      case 'confirmar_reunioes_amanha':
        const confirmacaoResult = await this.batchExecutor.prepararConfirmacaoReunioes(parameters);
        confirmation = confirmacaoResult.confirmation;
        break;

      case 'gerar_faturas_mes':
        const faturasResult = await this.batchExecutor.prepararGeracaoFaturas(parameters);
        confirmation = faturasResult.confirmation;
        break;

      case 'enviar_followup_lote':
        const followupResult = await this.batchExecutor.prepararFollowupLote(parameters);
        confirmation = followupResult.confirmation;
        break;

      // === COMMUNICATION ===
      case 'registrar_pos_reuniao':
        const posReuniaoResult = await this.communicationExecutor.prepararPosReuniao(parameters);
        confirmation = posReuniaoResult.confirmation;
        break;

      case 'agendar_recorrente':
        const recorrenteResult = await this.communicationExecutor.prepararAgendamentoRecorrente(parameters);
        confirmation = recorrenteResult.confirmation;
        break;

      // === META ACTIONS ===
      case 'onboarding_cliente':
        const onboardingResult = await this.metaExecutor.prepararOnboarding(parameters);
        confirmation = onboardingResult.confirmation;
        break;

      default:
        throw new Error(`Tool ${toolName} não configurada para confirmação.`);
    }

    return {
      id: `pending_${Date.now()}`,
      success: true,
      requiresConfirmation: true,
      confirmation,
      toolName
    };
  }

  private async executeToolByName(name: string, parameters: any): Promise<any> {
    switch (name) {
      // ============================================
      // TOOLS BÁSICOS (já existentes)
      // ============================================
      case 'buscar_cliente':
        return this.buscarCliente(parameters);
      case 'listar_clientes':
        return this.listarClientes(parameters);
      case 'criar_reuniao':
        return this.criarReuniao(parameters);
      case 'listar_reunioes':
        return this.listarReunioes(parameters);
      case 'excluir_reuniao':
        return this.excluirReuniao(parameters);
      case 'atualizar_reuniao':
        return this.atualizarReuniao(parameters);
      case 'criar_tarefa':
        return this.criarTarefa(parameters);
      case 'listar_tarefas':
        return this.listarTarefas(parameters);
      case 'concluir_tarefa':
        return this.concluirTarefa(parameters);
      case 'criar_cobranca':
        return this.criarCobranca(parameters);
      case 'listar_pagamentos':
        return this.listarPagamentos(parameters);
      case 'marcar_pago':
        return this.marcarPago(parameters);
      case 'enviar_whatsapp':
        return this.enviarWhatsapp(parameters);
      case 'gerar_mensagem':
        return this.gerarMensagem(parameters);
      case 'criar_lembrete':
        return this.criarLembrete(parameters);
      case 'resumo_dia':
        return this.resumoDia(parameters);
      case 'resumo_cliente':
        return this.resumoCliente(parameters);
      case 'analisar_performance':
        return this.analisarPerformance(parameters);

      // ============================================
      // TOOLS AVANÇADOS - BATCH ACTIONS
      // ============================================
      case 'cobrar_todos_vencidos':
        return this.batchExecutor.executarCobrancaLote(parameters._confirmationData);
      case 'confirmar_reunioes_amanha':
        return this.batchExecutor.executarConfirmacaoReunioes(parameters._confirmationData);
      case 'gerar_faturas_mes':
        return this.batchExecutor.executarGeracaoFaturas(parameters._confirmationData);
      case 'enviar_followup_lote':
        return this.batchExecutor.executarFollowupLote(parameters._confirmationData);

      // ============================================
      // TOOLS AVANÇADOS - INTELLIGENCE
      // ============================================
      case 'sugerir_acoes_dia':
        return this.intelligenceExecutor.sugerirAcoesDia(parameters);
      case 'diagnosticar_cliente':
        return this.intelligenceExecutor.diagnosticarCliente(parameters);
      case 'identificar_clientes_risco':
        return this.intelligenceExecutor.identificarClientesRisco(parameters);
      case 'prever_faturamento':
        return this.intelligenceExecutor.preverFaturamento(parameters);

      // ============================================
      // TOOLS AVANÇADOS - COMMUNICATION
      // ============================================
      case 'preparar_reuniao':
        return this.communicationExecutor.prepararReuniao(parameters);
      case 'registrar_pos_reuniao':
        return this.communicationExecutor.executarPosReuniao(parameters._confirmationData);
      case 'agendar_recorrente':
        return this.communicationExecutor.executarAgendamentoRecorrente(parameters._confirmationData);
      case 'gerar_relatorio_cliente':
        return this.communicationExecutor.gerarRelatorioCliente(parameters);

      // ============================================
      // TOOLS AVANÇADOS - META ACTIONS
      // ============================================
      case 'executar_rotina_matinal':
        return this.metaExecutor.executarRotinaMatinal(parameters);
      case 'encerrar_dia':
        return this.metaExecutor.encerrarDia(parameters);
      case 'onboarding_cliente':
        return this.metaExecutor.executarOnboarding(parameters._confirmationData);
      case 'health_check_geral':
        return this.metaExecutor.executarHealthCheck(parameters);

      default:
        throw new Error(`Tool "${name}" não encontrada.`);
    }
  }

  // ============================================
  // MÉTODOS DOS TOOLS BÁSICOS
  // (manter os métodos existentes aqui)
  // ============================================

  private async buscarCliente(params: any) {
    // Implementação existente...
  }

  private async listarClientes(params: any) {
    // Implementação existente...
  }

  // ... demais métodos básicos ...
}

export default ToolExecutor;
```

---

## 🎨 CARDS DE CONFIRMAÇÃO

### Arquivo: `src/components/assistant/cards/OnboardingCard.tsx`

```tsx
'use client';

import { useState } from 'react';
import { 
  UserPlus, Check, X, Calendar, DollarSign, 
  ListTodo, Bell, ChevronDown, ChevronUp 
} from 'lucide-react';
import { OnboardingCliente } from '@/lib/assistant/types-advanced';
import { cn } from '@/lib/utils';

interface Props {
  data: OnboardingCliente;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export function OnboardingCard({ data, onConfirm, onCancel, isExecuting }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <UserPlus className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-purple-800 text-lg">
            Onboarding: {data.clientName}
          </h3>
          <p className="text-sm text-purple-600">
            {data.segment} • {data.dataOnboarding}
          </p>
        </div>
      </div>

      {/* Resumo do que será criado */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center gap-2 mb-1">
            <ListTodo className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Tarefas</span>
          </div>
          <p className="text-lg font-bold text-gray-800">
            {data.itensCriar.tarefasIniciais.length}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Reunião</span>
          </div>
          <p className="text-sm font-bold text-gray-800">
            {data.itensCriar.primeiraReuniao.criar ? 
              new Date(data.itensCriar.primeiraReuniao.sugestaoData).toLocaleDateString('pt-BR') : 
              'Não'}
          </p>
        </div>

        {data.itensCriar.primeiraCobranca && (
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Cobrança</span>
            </div>
            <p className="text-sm font-bold text-gray-800">
              R$ {data.itensCriar.primeiraCobranca.valor.toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg p-3 border">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">Lembretes</span>
          </div>
          <p className="text-lg font-bold text-gray-800">
            {data.itensCriar.lembretes.length}
          </p>
        </div>
      </div>

      {/* Detalhes expandidos */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 mb-3"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      </button>

      {expanded && (
        <div className="space-y-3 mb-4">
          {/* Tarefas */}
          <div className="bg-white rounded-lg p-3 border">
            <h4 className="font-medium text-gray-700 mb-2">Tarefas a criar:</h4>
            <ul className="space-y-1">
              {data.itensCriar.tarefasIniciais.map((t, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>{t.titulo} (até {t.prazo})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-lg p-3 border">
            <h4 className="font-medium text-gray-700 mb-2">Informações do cliente:</h4>
            <ul className="space-y-1">
              {data.checklistInfo.map((item, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  {item.preenchido ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                  <span className={item.preenchido ? 'text-gray-600' : 'text-red-600'}>
                    {item.item}: {item.valor || 'Não informado'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className={cn(
            'flex-1 py-2.5 rounded-md font-medium flex items-center justify-center gap-2',
            isExecuting 
              ? 'bg-purple-300 cursor-wait' 
              : 'bg-purple-500 text-white hover:bg-purple-600'
          )}
        >
          {isExecuting ? (
            <>Criando...</>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Iniciar Onboarding
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

### Arquivo: `src/components/assistant/cards/RotinaMatinalCard.tsx`

```tsx
'use client';

import { 
  Sun, Calendar, DollarSign, AlertTriangle, 
  CheckSquare, ArrowRight, Sparkles 
} from 'lucide-react';
import { RotinaMatinal, SugestaoAcao } from '@/lib/assistant/types-advanced';
import { cn } from '@/lib/utils';

interface Props {
  data: RotinaMatinal;
  onActionClick?: (action: SugestaoAcao) => void;
}

export function RotinaMatinalCard({ data, onActionClick }: Props) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
      {/* Header com saudação */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
          <Sun className="w-7 h-7 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-amber-800">{data.saudacao}</h2>
          <p className="text-sm text-amber-600">{data.dataFormatada}</p>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {/* Reuniões */}
        <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">Reuniões</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {data.agenda.totalReunioes}
          </p>
        </div>

        {/* Tarefas */}
        <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">Tarefas</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {data.agenda.totalTarefas}
            {data.agenda.tarefasUrgentes > 0 && (
              <span className="text-sm text-red-500 ml-1">
                ({data.agenda.tarefasUrgentes} urg)
              </span>
            )}
          </p>
        </div>

        {/* Vencimentos */}
        <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-500">Vence hoje</span>
          </div>
          <p className="text-lg font-bold text-gray-800">
            R$ {data.financeiro.valorVenceHoje.toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Vencidos */}
        {data.financeiro.totalVencido > 0 && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600">Vencido</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              R$ {data.financeiro.valorVencido.toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </div>

      {/* Reuniões do dia */}
      {data.agenda.reunioes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            📅 Reuniões de hoje
          </h3>
          <div className="space-y-2">
            {data.agenda.reunioes.map(r => (
              <div 
                key={r.id}
                className="bg-white/80 rounded-lg px-3 py-2 border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {r.horario}
                  </span>
                  <span className="text-gray-700">{r.clientName}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                    {r.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas */}
      {data.alertas.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            ⚠️ Alertas
          </h3>
          <div className="space-y-2">
            {data.alertas.map((alerta, i) => (
              <div 
                key={i}
                className={cn(
                  'rounded-lg px-3 py-2 border flex items-center gap-2',
                  alerta.tipo === 'critico' ? 'bg-red-50 border-red-200' :
                  alerta.tipo === 'atencao' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                )}
              >
                <span>{alerta.icone}</span>
                <span className="text-sm text-gray-700 flex-1">{alerta.mensagem}</span>
                {alerta.acao && (
                  <button
                    onClick={() => onActionClick?.(alerta.acao as any)}
                    className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-50"
                  >
                    {alerta.acao.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões prioritárias */}
      {data.sugestoesPrioritarias.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Ações sugeridas
          </h3>
          <div className="space-y-2">
            {data.sugestoesPrioritarias.slice(0, 3).map(sugestao => (
              <button
                key={sugestao.id}
                onClick={() => onActionClick?.(sugestao)}
                className="w-full bg-white/80 rounded-lg px-3 py-2 border hover:bg-white transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span>{sugestao.icone}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">{sugestao.titulo}</p>
                    <p className="text-xs text-gray-500">{sugestao.descricao}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🧠 ATUALIZAÇÃO DO SYSTEM PROMPT

### Adicionar ao system prompt do Claude:

```typescript
const ADVANCED_TOOLS_INSTRUCTIONS = `
## Tools Avançados

Você agora tem acesso a 16 tools avançados além dos básicos:

### Ações em Lote (use para múltiplos clientes de uma vez)
- \`cobrar_todos_vencidos\`: Cobra todos clientes com pagamento vencido
- \`confirmar_reunioes_amanha\`: Confirma reuniões de amanhã via WhatsApp
- \`gerar_faturas_mes\`: Gera cobranças mensais para todos os clientes
- \`enviar_followup_lote\`: Follow-up para clientes sem contato recente

### Inteligência (análise e sugestões)
- \`sugerir_acoes_dia\`: Sugere ações prioritárias para hoje
- \`diagnosticar_cliente\`: Diagnóstico completo de um cliente
- \`identificar_clientes_risco\`: Lista clientes em risco de churn
- \`prever_faturamento\`: Previsão de recebimentos do mês

### Comunicação (preparação e registro)
- \`preparar_reuniao\`: Briefing preparatório para reunião
- \`registrar_pos_reuniao\`: Registra anotações e cria tarefas
- \`agendar_recorrente\`: Agenda reuniões/tarefas recorrentes
- \`gerar_relatorio_cliente\`: Gera relatório para enviar ao cliente

### Meta-Ação (rotinas automatizadas)
- \`executar_rotina_matinal\`: Dashboard falado do dia (use quando disserem "bom dia")
- \`encerrar_dia\`: Resumo do dia e preview de amanhã
- \`onboarding_cliente\`: Setup completo de novo cliente
- \`health_check_geral\`: Análise de saúde da operação

## Comportamentos Especiais

1. **"Bom dia"**: Execute \`executar_rotina_matinal\` automaticamente
2. **"Boa noite" ou "fim de expediente"**: Execute \`encerrar_dia\`
3. **"Cobra todo mundo"**: Use \`cobrar_todos_vencidos\`
4. **"Novo cliente X"**: Use \`onboarding_cliente\`
5. **"Como tá minha operação?"**: Use \`health_check_geral\`
6. **"Prepara a reunião"**: Use \`preparar_reuniao\`
7. **"O que fazer hoje?"**: Use \`sugerir_acoes_dia\`
`;
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

```markdown
## Ordem de Implementação Recomendada

### Fase 1: Infraestrutura (1-2 dias)
- [ ] Criar pasta `tools-advanced/`
- [ ] Criar arquivo `types-advanced.ts` com todos os tipos
- [ ] Criar arquivo `index.ts` para exports

### Fase 2: Tools de Inteligência (2-3 dias)
- [ ] Implementar `sugerir_acoes_dia` ⭐ (mais impactante)
- [ ] Implementar `diagnosticar_cliente`
- [ ] Implementar `identificar_clientes_risco`
- [ ] Implementar `prever_faturamento`

### Fase 3: Tools de Batch (2-3 dias)
- [ ] Implementar `cobrar_todos_vencidos` ⭐
- [ ] Implementar `confirmar_reunioes_amanha`
- [ ] Implementar `gerar_faturas_mes`
- [ ] Implementar `enviar_followup_lote`
- [ ] Criar cards de confirmação

### Fase 4: Tools de Meta-Ação (2-3 dias)
- [ ] Implementar `executar_rotina_matinal` ⭐⭐ (wow factor)
- [ ] Implementar `encerrar_dia`
- [ ] Implementar `onboarding_cliente`
- [ ] Implementar `health_check_geral`

### Fase 5: Tools de Comunicação (2 dias)
- [ ] Implementar `preparar_reuniao`
- [ ] Implementar `registrar_pos_reuniao`
- [ ] Implementar `agendar_recorrente`
- [ ] Implementar `gerar_relatorio_cliente`

### Fase 6: Integração (1-2 dias)
- [ ] Atualizar `tool-executor.ts`
- [ ] Atualizar system prompt do Claude
- [ ] Criar todos os cards de confirmação
- [ ] Testar fluxo completo

### Fase 7: Refinamento (ongoing)
- [ ] Ajustar templates de mensagem
- [ ] Melhorar cálculos de score/risco
- [ ] Adicionar mais dados de performance de ads
- [ ] Otimizar queries de banco
```

---

## 🚀 COMANDOS DE TESTE

```bash
# Testar rotina matinal
"Bom dia Marcola"

# Testar sugestões
"O que devo fazer hoje?"

# Testar diagnóstico
"Como está o cliente Hamburgueria do João?"

# Testar cobrança em lote
"Cobra todo mundo que tá devendo"

# Testar confirmação de reuniões
"Confirma as reuniões de amanhã"

# Testar previsão
"Quanto vou receber esse mês?"

# Testar clientes em risco
"Quais clientes estão em risco?"

# Testar health check
"Faz um check-up da operação"

# Testar onboarding
"Novo cliente: Pizzaria do João"

# Testar encerramento
"Boa noite, fecha o dia"
```

---

## ✅ CONCLUSÃO

Este prompt contém a especificação completa de **16 tools avançados** para o MARCOLA Assistant:

| Categoria | Tools | Confirmação |
|-----------|-------|-------------|
| Ações em Lote | 4 | ✅ Todos |
| Inteligência | 4 | ❌ Nenhum |
| Comunicação | 4 | ✅ 2 de 4 |
| Meta-Ação | 4 | ✅ 1 de 4 |

**Total: 32 tools** (16 básicos + 16 avançados)

Com isso, o MARCOLA deixa de ser apenas um assistente reativo e se torna um **copiloto proativo** que:

1. 🌅 Inicia o dia com briefing completo
2. 💡 Sugere ações prioritárias
3. ⚡ Executa tarefas em lote
4. 🔍 Identifica problemas antes que aconteçam
5. 📊 Fornece inteligência de negócio
6. 🌙 Encerra o dia com resumo e preparação

**Boa implementação! 🚀**
