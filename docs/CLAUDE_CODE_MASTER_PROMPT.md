# 🤖 CLAUDE CODE - IMPLEMENTAÇÃO MARCOLA TOOLS AVANÇADOS

## CONTEXTO DO PROJETO

Você está trabalhando no **MARCOLA Assistant**, um assistente de IA com voz para gestores de tráfego pago. O projeto já tem uma versão v1.0 funcionando com 16 tools básicos. Agora vamos implementar a **v2.0 com 16 tools avançados** que transformam o assistente de reativo para proativo.

**Stack do projeto:**
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Tailwind CSS
- shadcn/ui
- Claude API (Anthropic)
- Z-API (WhatsApp)

**Estrutura atual do projeto:**
```
traffichub/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assistant/
│   │   │   ├── whatsapp/
│   │   │   └── ...
│   │   └── (dashboard)/
│   ├── components/
│   │   └── assistant/
│   └── lib/
│       ├── assistant/
│       │   ├── types.ts
│       │   ├── tools.ts
│       │   └── tool-executor.ts
│       └── supabase/
```

---

## 📋 ESPECIFICAÇÕES A LER

Antes de começar, leia TODAS as especificações dos tools avançados:

1. **PROMPT_TOOLS_AVANCADOS_P1.md** - Visão geral e tipos TypeScript
2. **PROMPT_TOOLS_AVANCADOS_P2.md** - Tools de Ações em Lote (4 tools)
3. **PROMPT_TOOLS_AVANCADOS_P3.md** - Tools de Inteligência (4 tools)
4. **PROMPT_TOOLS_AVANCADOS_P4.md** - Tools de Comunicação (4 tools)
5. **PROMPT_TOOLS_AVANCADOS_P5.md** - Tools de Meta-Ação (4 tools)
6. **PROMPT_TOOLS_AVANCADOS_P6.md** - Integração final e instruções

---

## 🎯 OBJETIVO

Implementar 16 tools avançados organizados em 4 categorias:

| Categoria | Tools | Requer Confirmação |
|-----------|-------|-------------------|
| **Batch Actions** | cobrar_todos_vencidos, confirmar_reunioes_amanha, gerar_faturas_mes, enviar_followup_lote | ✅ Todos |
| **Intelligence** | sugerir_acoes_dia, diagnosticar_cliente, identificar_clientes_risco, prever_faturamento | ❌ Nenhum |
| **Communication** | preparar_reuniao, registrar_pos_reuniao, agendar_recorrente, gerar_relatorio_cliente | ✅ 2 de 4 |
| **Meta-Actions** | executar_rotina_matinal, encerrar_dia, onboarding_cliente, health_check_geral | ✅ 1 de 4 |

---

## 📝 PLANO DE IMPLEMENTAÇÃO

### FASE 1: SETUP DA INFRAESTRUTURA

```
□ Task 1.1: Criar estrutura de pastas
  - Criar pasta src/lib/assistant/tools-advanced/
  - Criar pasta src/components/assistant/cards/

□ Task 1.2: Criar arquivo de tipos avançados
  - Criar src/lib/assistant/types-advanced.ts
  - Copiar TODOS os tipos da Parte 1 do prompt
  - Incluir: BatchActionResult, BatchCobrancaData, SugestaoAcao, 
    DiagnosticoCliente, ClienteRisco, PrevisaoFaturamento,
    BriefingReuniao, RotinaMatinal, EncerramentoDia, etc.

□ Task 1.3: Criar arquivo index de exports
  - Criar src/lib/assistant/tools-advanced/index.ts
  - Exportar todos os tools e executors
  - Criar helper requiresConfirmation()
```

### FASE 2: TOOLS DE INTELIGÊNCIA (Prioridade Alta)

```
□ Task 2.1: Criar definições dos tools de inteligência
  - Criar src/lib/assistant/tools-advanced/intelligence.ts
  - Definir: sugerir_acoes_dia, diagnosticar_cliente, 
    identificar_clientes_risco, prever_faturamento
  - Seguir estrutura ToolDefinition com name, description, parameters

□ Task 2.2: Implementar IntelligenceExecutor
  - Criar src/lib/assistant/tools-advanced/intelligence-executor.ts
  - Implementar sugerirAcoesDia():
    * Buscar reuniões do dia
    * Buscar tarefas urgentes/atrasadas
    * Buscar pagamentos vencidos/vencendo
    * Calcular prioridades
    * Gerar resumo executivo
  
  - Implementar diagnosticarCliente():
    * Buscar cliente por ID ou nome
    * Analisar financeiro (pagamentos, inadimplência)
    * Analisar engajamento (último contato, reuniões)
    * Analisar tarefas (pendentes, atrasadas)
    * Calcular health score (0-100)
    * Gerar recomendações acionáveis
  
  - Implementar identificarClientesRisco():
    * Analisar todos os clientes ativos
    * Calcular score de risco por indicadores
    * Classificar: crítico, alto, médio, baixo
    * Ordenar por score
    * Gerar ações prioritárias
  
  - Implementar preverFaturamento():
    * Buscar pagamentos do mês
    * Calcular: previsto, recebido, a receber, vencido
    * Comparar com mês anterior
    * Calcular probabilidades de recebimento
```

### FASE 3: TOOLS DE AÇÕES EM LOTE

```
□ Task 3.1: Criar definições dos tools de batch
  - Criar src/lib/assistant/tools-advanced/batch-actions.ts
  - Definir: cobrar_todos_vencidos, confirmar_reunioes_amanha,
    gerar_faturas_mes, enviar_followup_lote
  - Marcar todos com requiresConfirmation: true

□ Task 3.2: Implementar BatchActionsExecutor
  - Criar src/lib/assistant/tools-advanced/batch-actions-executor.ts
  
  - Implementar prepararCobrancaLote():
    * Buscar pagamentos vencidos
    * Agrupar por cliente
    * Gerar template de mensagem
    * Retornar ConfirmationData
  
  - Implementar executarCobrancaLote():
    * Iterar clientes
    * Personalizar mensagem
    * Enviar via WhatsApp
    * Aguardar delay entre envios
    * Retornar BatchActionResult
  
  - Implementar prepararConfirmacaoReunioes():
    * Buscar reuniões de amanhã
    * Gerar template de confirmação
    * Retornar ConfirmationData
  
  - Implementar executarConfirmacaoReunioes():
    * Enviar confirmações via WhatsApp
    * Retornar resultado
  
  - Implementar prepararGeracaoFaturas():
    * Buscar clientes ativos com monthly_value
    * Verificar faturas existentes no mês
    * Calcular datas de vencimento
    * Retornar ConfirmationData
  
  - Implementar executarGeracaoFaturas():
    * Criar pagamentos no banco
    * Retornar resultado
  
  - Implementar prepararFollowupLote():
    * Identificar clientes sem contato há X dias
    * Gerar template de follow-up
    * Retornar ConfirmationData
  
  - Implementar executarFollowupLote():
    * Enviar mensagens via WhatsApp
    * Retornar resultado

□ Task 3.3: Criar cards de confirmação para batch
  - Criar src/components/assistant/cards/BatchCobrancaCard.tsx
  - Criar src/components/assistant/cards/BatchConfirmacaoCard.tsx
  - Criar src/components/assistant/cards/BatchFollowupCard.tsx
  - Criar src/components/assistant/cards/GerarFaturasCard.tsx
  - Cada card deve:
    * Mostrar lista de itens que serão afetados
    * Ter botão expandir/colapsar
    * Ter botões Confirmar e Cancelar
    * Mostrar estado de loading durante execução
```

### FASE 4: TOOLS DE META-AÇÃO

```
□ Task 4.1: Criar definições dos tools de meta-ação
  - Criar src/lib/assistant/tools-advanced/meta-actions.ts
  - Definir: executar_rotina_matinal, encerrar_dia,
    onboarding_cliente, health_check_geral

□ Task 4.2: Implementar MetaActionsExecutor
  - Criar src/lib/assistant/tools-advanced/meta-actions-executor.ts
  
  - Implementar executarRotinaMatinal():
    * Gerar saudação por horário
    * Buscar reuniões do dia
    * Buscar tarefas urgentes
    * Buscar pagamentos (vencidos + vencendo)
    * Gerar alertas
    * Gerar sugestões prioritárias
    * Calcular métricas gerais
    * Retornar RotinaMatinal
  
  - Implementar encerrarDia():
    * Contar realizações do dia
    * Listar pendências
    * Buscar preview de amanhã
    * Calcular score de produtividade
    * Gerar mensagem final
    * Retornar EncerramentoDia
  
  - Implementar prepararOnboarding():
    * Gerar tarefas iniciais padrão
    * Sugerir primeira reunião
    * Calcular primeira cobrança
    * Criar lembretes
    * Retornar ConfirmationData
  
  - Implementar executarOnboarding():
    * Criar tarefas no banco
    * Criar reunião no banco
    * Criar cobrança no banco
    * Criar lembretes no banco
    * Retornar resultado
  
  - Implementar executarHealthCheck():
    * Analisar visão geral de clientes
    * Calcular saúde financeira (MRR, inadimplência, etc)
    * Calcular saúde operacional (tarefas, reuniões)
    * Gerar top alertas
    * Comparar com período anterior
    * Gerar recomendações estratégicas
    * Retornar HealthCheckGeral

□ Task 4.3: Criar cards especiais
  - Criar src/components/assistant/cards/OnboardingCard.tsx
  - Criar src/components/assistant/cards/RotinaMatinalCard.tsx
    (este é um card de exibição, não de confirmação)
```

### FASE 5: TOOLS DE COMUNICAÇÃO

```
□ Task 5.1: Criar definições dos tools de comunicação
  - Criar src/lib/assistant/tools-advanced/communication.ts
  - Definir: preparar_reuniao, registrar_pos_reuniao,
    agendar_recorrente, gerar_relatorio_cliente

□ Task 5.2: Implementar CommunicationExecutor
  - Criar src/lib/assistant/tools-advanced/communication-executor.ts
  
  - Implementar prepararReuniao():
    * Buscar dados da reunião
    * Buscar contexto do cliente
    * Analisar situação financeira
    * Analisar tarefas pendentes
    * Buscar histórico recente
    * Gerar pauta sugerida
    * Gerar pontos de atenção
    * Gerar perguntas sugeridas
    * Retornar BriefingReuniao
  
  - Implementar prepararPosReuniao():
    * Receber anotações, decisões, próximos passos
    * Formatar dados
    * Retornar ConfirmationData
  
  - Implementar executarPosReuniao():
    * Atualizar reunião como completed
    * Criar tarefas para próximos passos
    * Agendar próxima reunião (se solicitado)
    * Retornar resultado
  
  - Implementar prepararAgendamentoRecorrente():
    * Calcular próximas ocorrências
    * Gerar preview
    * Retornar ConfirmationData
  
  - Implementar executarAgendamentoRecorrente():
    * Criar reuniões/tarefas/lembretes no banco
    * Retornar resultado
  
  - Implementar gerarRelatorioCliente():
    * Calcular período
    * Buscar atividades realizadas
    * Gerar destaques
    * Gerar pontos de melhoria
    * Gerar plano próximo período
    * Gerar mensagem para WhatsApp
    * Retornar RelatorioCliente

□ Task 5.3: Criar cards de comunicação
  - Criar src/components/assistant/cards/PosReuniaoCard.tsx
  - Criar src/components/assistant/cards/AgendamentoRecorrenteCard.tsx
```

### FASE 6: INTEGRAÇÃO

```
□ Task 6.1: Atualizar tool-executor.ts
  - Importar todos os executors avançados
  - Inicializar executors no constructor
  - Adicionar switch cases para todos os novos tools
  - Implementar prepareConfirmation() para tools com confirmação
  - Implementar executeToolByName() com todos os tools

□ Task 6.2: Atualizar tools.ts
  - Importar ALL_ADVANCED_TOOLS do index
  - Combinar com tools básicos
  - Exportar lista completa de 32 tools

□ Task 6.3: Atualizar ConfirmationCard.tsx principal
  - Importar todos os novos cards
  - Adicionar switch cases para renderizar card correto
  - Tipos: batch_cobranca, batch_confirmacao_reuniao, 
    batch_followup, gerar_faturas, pos_reuniao,
    agendamento_recorrente, onboarding_cliente

□ Task 6.4: Atualizar system prompt do Claude
  - Adicionar instruções sobre novos tools
  - Definir triggers automáticos:
    * "Bom dia" → executar_rotina_matinal
    * "Boa noite" → encerrar_dia
    * "Cobra todo mundo" → cobrar_todos_vencidos
    * etc.
```

### FASE 7: TESTES

```
□ Task 7.1: Testar tools de inteligência
  - Testar "O que devo fazer hoje?"
  - Testar "Como está o cliente X?"
  - Testar "Quais clientes estão em risco?"
  - Testar "Quanto vou receber esse mês?"

□ Task 7.2: Testar tools de batch
  - Testar "Cobra todo mundo que tá devendo"
  - Testar "Confirma as reuniões de amanhã"
  - Testar "Gera as faturas do mês"
  - Testar "Manda follow-up pros clientes"

□ Task 7.3: Testar tools de meta-ação
  - Testar "Bom dia"
  - Testar "Boa noite, fecha o dia"
  - Testar "Faz o onboarding do cliente X"
  - Testar "Como está minha operação?"

□ Task 7.4: Testar tools de comunicação
  - Testar "Prepara a reunião das 14h"
  - Testar "Registra a reunião que acabou"
  - Testar "Agenda reunião semanal com João"
  - Testar "Gera relatório do cliente X"
```

---

## 🚀 INSTRUÇÕES DE EXECUÇÃO

### Passo 1: Ler todas as especificações
```
Leia os arquivos PROMPT_TOOLS_AVANCADOS_P1.md até P6.md para entender:
- Tipos TypeScript necessários
- Estrutura de cada tool
- Lógica de cada executor
- Cards de confirmação
```

### Passo 2: Verificar estrutura atual
```
Antes de criar novos arquivos, verifique:
- Estrutura atual de src/lib/assistant/
- Types existentes em types.ts
- Tools existentes em tools.ts
- Executor existente em tool-executor.ts
```

### Passo 3: Implementar na ordem
```
Siga a ordem das fases:
1. Infraestrutura (tipos e pastas)
2. Intelligence (mais impactante, sem confirmação)
3. Batch Actions (com confirmação)
4. Meta-Actions (rotina matinal é o "wow factor")
5. Communication (complementar)
6. Integração final
7. Testes
```

### Passo 4: Commits frequentes
```
Faça commits ao final de cada task:
- "feat(assistant): add advanced types"
- "feat(assistant): add intelligence tools"
- "feat(assistant): add batch actions tools"
- etc.
```

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Não quebrar funcionalidade existente**
   - Os 16 tools básicos devem continuar funcionando
   - Manter compatibilidade com tipos existentes

2. **Tratamento de erros**
   - Sempre usar try/catch nos executors
   - Retornar mensagens de erro amigáveis
   - Não deixar o app quebrar se uma query falhar

3. **Performance**
   - Evitar N+1 queries
   - Usar Promise.all quando possível
   - Limitar resultados com LIMIT nas queries

4. **UX dos Cards**
   - Cards devem ser claros sobre o que vai acontecer
   - Botão de cancelar sempre visível
   - Loading state durante execução
   - Feedback claro após execução

5. **Templates de mensagem**
   - Mensagens devem ser personalizáveis
   - Usar placeholders {nome}, {valor}, etc.
   - Tom profissional mas amigável

---

## 📊 MÉTRICAS DE SUCESSO

Ao final da implementação, o MARCOLA deve:

✅ Responder "Bom dia" com rotina matinal completa
✅ Sugerir ações prioritárias do dia
✅ Cobrar múltiplos clientes com um comando
✅ Confirmar reuniões de amanhã automaticamente
✅ Gerar faturas mensais em lote
✅ Identificar clientes em risco de churn
✅ Preparar briefings de reunião
✅ Fazer onboarding completo de novos clientes
✅ Gerar health check da operação

---

## 🎬 COMECE AGORA

1. Leia os arquivos de especificação
2. Verifique a estrutura atual do projeto
3. Comece pela Task 1.1 (criar estrutura de pastas)
4. Siga o plano task por task
5. Teste cada funcionalidade antes de avançar

**Boa implementação! 🚀**
