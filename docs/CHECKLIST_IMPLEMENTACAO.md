# ✅ MARCOLA TOOLS AVANÇADOS - CHECKLIST DE IMPLEMENTAÇÃO

> Use este checklist para acompanhar o progresso da implementação.
> Marque cada item conforme for completando.

---

## 📁 FASE 1: INFRAESTRUTURA
**Tempo estimado: 1-2 horas**

### Task 1.1: Criar estrutura de pastas
```bash
mkdir -p src/lib/assistant/tools-advanced
mkdir -p src/components/assistant/cards
```
- [ ] Pasta `tools-advanced/` criada
- [ ] Pasta `cards/` criada

### Task 1.2: Criar tipos avançados
**Arquivo:** `src/lib/assistant/types-advanced.ts`

- [ ] Interface `BatchActionResult`
- [ ] Interface `BatchItemResult`
- [ ] Interface `BatchCobrancaData`
- [ ] Interface `BatchConfirmacaoReuniaoData`
- [ ] Interface `BatchFollowupData`
- [ ] Interface `GerarFaturasData`
- [ ] Interface `SugestaoAcao`
- [ ] Interface `SugestoesDoDia`
- [ ] Interface `DiagnosticoCliente`
- [ ] Interface `ClienteRisco`
- [ ] Interface `RelatorioClientesRisco`
- [ ] Interface `PrevisaoFaturamento`
- [ ] Interface `BriefingReuniao`
- [ ] Interface `RegistroPosReuniao`
- [ ] Interface `AgendamentoRecorrente`
- [ ] Interface `RelatorioCliente`
- [ ] Interface `RotinaMatinal`
- [ ] Interface `EncerramentoDia`
- [ ] Interface `OnboardingCliente`
- [ ] Interface `HealthCheckGeral`
- [ ] Type `ConfirmationTypeAdvanced`

### Task 1.3: Criar index de exports
**Arquivo:** `src/lib/assistant/tools-advanced/index.ts`

- [ ] Exportar todas as definições de tools
- [ ] Exportar todos os executors
- [ ] Criar `ALL_ADVANCED_TOOLS`
- [ ] Criar `TOOLS_REQUIRING_CONFIRMATION`
- [ ] Criar função `requiresConfirmation()`

---

## 🧠 FASE 2: TOOLS DE INTELIGÊNCIA
**Tempo estimado: 3-4 horas**

### Task 2.1: Definições dos tools
**Arquivo:** `src/lib/assistant/tools-advanced/intelligence.ts`

- [ ] Tool `sugerir_acoes_dia` definido
- [ ] Tool `diagnosticar_cliente` definido
- [ ] Tool `identificar_clientes_risco` definido
- [ ] Tool `prever_faturamento` definido

### Task 2.2: Implementar executor
**Arquivo:** `src/lib/assistant/tools-advanced/intelligence-executor.ts`

#### sugerirAcoesDia()
- [ ] Buscar reuniões do dia no Supabase
- [ ] Buscar tarefas urgentes e atrasadas
- [ ] Buscar pagamentos vencidos
- [ ] Buscar pagamentos que vencem hoje
- [ ] Verificar reuniões de amanhã sem confirmação
- [ ] Calcular métricas
- [ ] Ordenar sugestões por prioridade
- [ ] Gerar resumo executivo
- [ ] Retornar `SugestoesDoDia`

#### diagnosticarCliente()
- [ ] Buscar cliente por ID ou nome
- [ ] Calcular análise financeira (pagamentos, inadimplência)
- [ ] Calcular análise de engajamento (último contato, reuniões)
- [ ] Calcular análise de tarefas (pendentes, atrasadas)
- [ ] Calcular health score (0-100)
- [ ] Gerar recomendações acionáveis
- [ ] Montar timeline recente
- [ ] Identificar pontos fortes e fracos
- [ ] Gerar resumo executivo
- [ ] Retornar `DiagnosticoCliente`

#### identificarClientesRisco()
- [ ] Buscar todos os clientes ativos
- [ ] Para cada cliente, calcular indicadores de risco
- [ ] Calcular score de risco (0-100)
- [ ] Classificar nível (crítico, alto, médio, baixo)
- [ ] Ordenar por score
- [ ] Gerar ações prioritárias
- [ ] Calcular valor total em risco
- [ ] Retornar `RelatorioClientesRisco`

#### preverFaturamento()
- [ ] Determinar mês de análise
- [ ] Buscar pagamentos do mês
- [ ] Classificar: recebidos, a vencer, vencidos
- [ ] Calcular valores por status
- [ ] Buscar mês anterior para comparativo
- [ ] Calcular probabilidades de recebimento
- [ ] Calcular previsões (otimista, pessimista, realista)
- [ ] Gerar alertas
- [ ] Retornar `PrevisaoFaturamento`

---

## 🔄 FASE 3: TOOLS DE AÇÕES EM LOTE
**Tempo estimado: 4-5 horas**

### Task 3.1: Definições dos tools
**Arquivo:** `src/lib/assistant/tools-advanced/batch-actions.ts`

- [ ] Tool `cobrar_todos_vencidos` definido (requiresConfirmation: true)
- [ ] Tool `confirmar_reunioes_amanha` definido (requiresConfirmation: true)
- [ ] Tool `gerar_faturas_mes` definido (requiresConfirmation: true)
- [ ] Tool `enviar_followup_lote` definido (requiresConfirmation: true)

### Task 3.2: Implementar executor
**Arquivo:** `src/lib/assistant/tools-advanced/batch-actions-executor.ts`

#### cobrar_todos_vencidos
- [ ] `prepararCobrancaLote()` - busca vencidos, agrupa, gera template
- [ ] `executarCobrancaLote()` - envia mensagens via WhatsApp
- [ ] Implementar delay entre envios (2s)
- [ ] Retornar `BatchActionResult`

#### confirmar_reunioes_amanha
- [ ] `prepararConfirmacaoReunioes()` - busca reuniões de amanhã
- [ ] `executarConfirmacaoReunioes()` - envia confirmações
- [ ] Retornar `BatchActionResult`

#### gerar_faturas_mes
- [ ] `prepararGeracaoFaturas()` - lista clientes, calcula vencimentos
- [ ] `executarGeracaoFaturas()` - cria payments no banco
- [ ] Verificar se já existe fatura no mês
- [ ] Retornar `BatchActionResult`

#### enviar_followup_lote
- [ ] `prepararFollowupLote()` - identifica clientes sem contato
- [ ] `executarFollowupLote()` - envia follow-ups
- [ ] Retornar `BatchActionResult`

#### Helpers
- [ ] `gerarTemplateMensagem()` - templates por tipo
- [ ] `gerarTemplateConfirmacao()` - template de confirmação
- [ ] `personalizarMensagem()` - substituir placeholders

### Task 3.3: Cards de confirmação
**Pasta:** `src/components/assistant/cards/`

- [ ] `BatchCobrancaCard.tsx` criado e funcionando
- [ ] `BatchConfirmacaoCard.tsx` criado e funcionando
- [ ] `BatchFollowupCard.tsx` criado e funcionando
- [ ] `GerarFaturasCard.tsx` criado e funcionando

**Checklist para cada card:**
- [ ] Header com ícone e título
- [ ] Resumo dos itens afetados
- [ ] Lista expansível com detalhes
- [ ] Preview da mensagem (se aplicável)
- [ ] Botão Confirmar com loading
- [ ] Botão Cancelar
- [ ] Tratamento de estado isExecuting

---

## ⚡ FASE 4: TOOLS DE META-AÇÃO
**Tempo estimado: 4-5 horas**

### Task 4.1: Definições dos tools
**Arquivo:** `src/lib/assistant/tools-advanced/meta-actions.ts`

- [ ] Tool `executar_rotina_matinal` definido
- [ ] Tool `encerrar_dia` definido
- [ ] Tool `onboarding_cliente` definido (requiresConfirmation: true)
- [ ] Tool `health_check_geral` definido

### Task 4.2: Implementar executor
**Arquivo:** `src/lib/assistant/tools-advanced/meta-actions-executor.ts`

#### executarRotinaMatinal()
- [ ] Gerar saudação por horário (bom dia/tarde/noite)
- [ ] Buscar reuniões do dia
- [ ] Buscar tarefas (urgentes, atrasadas, do dia)
- [ ] Buscar pagamentos que vencem hoje
- [ ] Buscar pagamentos vencidos
- [ ] Gerar alertas categorizados
- [ ] Gerar sugestões prioritárias
- [ ] Calcular métricas gerais
- [ ] Gerar resumo do dia
- [ ] Retornar `RotinaMatinal`

#### encerrarDia()
- [ ] Contar reuniões realizadas vs total
- [ ] Contar tarefas concluídas hoje
- [ ] Contar mensagens enviadas
- [ ] Somar pagamentos recebidos
- [ ] Listar pendências (reuniões não feitas, tarefas não concluídas)
- [ ] Buscar preview de amanhã
- [ ] Calcular score de produtividade
- [ ] Gerar destaques do dia
- [ ] Gerar mensagem final
- [ ] Retornar `EncerramentoDia`

#### onboarding_cliente
- [ ] `prepararOnboarding()`:
  - [ ] Buscar cliente
  - [ ] Gerar tarefas iniciais padrão
  - [ ] Sugerir primeira reunião
  - [ ] Calcular primeira cobrança
  - [ ] Criar lembretes
  - [ ] Montar checklist de informações
  - [ ] Retornar `ConfirmationData`
- [ ] `executarOnboarding()`:
  - [ ] Criar tarefas no banco
  - [ ] Criar reunião no banco
  - [ ] Criar cobrança no banco
  - [ ] Criar lembretes no banco
  - [ ] Retornar resultado

#### executarHealthCheck()
- [ ] Calcular visão geral de clientes (ativos, pausados, inativos)
- [ ] Calcular saúde financeira:
  - [ ] Faturamento do mês
  - [ ] Recebido vs previsto
  - [ ] Taxa de inadimplência
  - [ ] Ticket médio
  - [ ] MRR
  - [ ] Top clientes
  - [ ] Concentração de risco
- [ ] Calcular saúde operacional:
  - [ ] Taxa de conclusão de tarefas
  - [ ] Taxa de realização de reuniões
- [ ] Gerar distribuição de clientes por saúde
- [ ] Gerar top alertas
- [ ] Comparar com período anterior
- [ ] Gerar recomendações estratégicas
- [ ] Calcular score geral
- [ ] Retornar `HealthCheckGeral`

### Task 4.3: Cards especiais

- [ ] `OnboardingCard.tsx` criado e funcionando
- [ ] `RotinaMatinalCard.tsx` criado (card de exibição)

---

## 💬 FASE 5: TOOLS DE COMUNICAÇÃO
**Tempo estimado: 3-4 horas**

### Task 5.1: Definições dos tools
**Arquivo:** `src/lib/assistant/tools-advanced/communication.ts`

- [ ] Tool `preparar_reuniao` definido
- [ ] Tool `registrar_pos_reuniao` definido (requiresConfirmation: true)
- [ ] Tool `agendar_recorrente` definido (requiresConfirmation: true)
- [ ] Tool `gerar_relatorio_cliente` definido

### Task 5.2: Implementar executor
**Arquivo:** `src/lib/assistant/tools-advanced/communication-executor.ts`

#### prepararReuniao()
- [ ] Buscar reunião (por ID ou próxima)
- [ ] Buscar dados do cliente
- [ ] Analisar situação financeira
- [ ] Analisar tarefas pendentes
- [ ] Buscar histórico recente
- [ ] Gerar pauta sugerida
- [ ] Gerar pontos de atenção
- [ ] Gerar perguntas sugeridas
- [ ] Retornar `BriefingReuniao`

#### registrar_pos_reuniao
- [ ] `prepararPosReuniao()` - formatar dados
- [ ] `executarPosReuniao()`:
  - [ ] Atualizar reunião como completed
  - [ ] Criar tarefas para próximos passos
  - [ ] Agendar próxima reunião (opcional)
  - [ ] Retornar resultado

#### agendar_recorrente
- [ ] `prepararAgendamentoRecorrente()`:
  - [ ] Calcular próximas ocorrências
  - [ ] Gerar preview
  - [ ] Retornar `ConfirmationData`
- [ ] `executarAgendamentoRecorrente()`:
  - [ ] Criar itens no banco (reunião/tarefa/lembrete)
  - [ ] Retornar resultado
- [ ] Implementar `calcularProximasOcorrencias()` helper

#### gerarRelatorioCliente()
- [ ] Determinar período
- [ ] Buscar atividades realizadas
- [ ] Gerar destaques
- [ ] Gerar pontos de melhoria
- [ ] Gerar plano próximo período
- [ ] Gerar mensagem para WhatsApp
- [ ] Retornar `RelatorioCliente`

### Task 5.3: Cards de comunicação

- [ ] `PosReuniaoCard.tsx` criado e funcionando
- [ ] `AgendamentoRecorrenteCard.tsx` criado e funcionando

---

## 🔗 FASE 6: INTEGRAÇÃO
**Tempo estimado: 2-3 horas**

### Task 6.1: Atualizar tool-executor.ts

- [ ] Importar `BatchActionsExecutor`
- [ ] Importar `IntelligenceExecutor`
- [ ] Importar `CommunicationExecutor`
- [ ] Importar `MetaActionsExecutor`
- [ ] Importar `requiresConfirmation`
- [ ] Inicializar executors no constructor
- [ ] Implementar `prepareConfirmation()` com switch para cada tool
- [ ] Adicionar cases em `executeToolByName()`:
  - [ ] `cobrar_todos_vencidos`
  - [ ] `confirmar_reunioes_amanha`
  - [ ] `gerar_faturas_mes`
  - [ ] `enviar_followup_lote`
  - [ ] `sugerir_acoes_dia`
  - [ ] `diagnosticar_cliente`
  - [ ] `identificar_clientes_risco`
  - [ ] `prever_faturamento`
  - [ ] `preparar_reuniao`
  - [ ] `registrar_pos_reuniao`
  - [ ] `agendar_recorrente`
  - [ ] `gerar_relatorio_cliente`
  - [ ] `executar_rotina_matinal`
  - [ ] `encerrar_dia`
  - [ ] `onboarding_cliente`
  - [ ] `health_check_geral`

### Task 6.2: Atualizar tools.ts

- [ ] Importar `ALL_ADVANCED_TOOLS`
- [ ] Combinar com tools básicos existentes
- [ ] Exportar array completo de 32 tools

### Task 6.3: Atualizar ConfirmationCard.tsx

- [ ] Importar todos os novos cards
- [ ] Adicionar switch cases:
  - [ ] `batch_cobranca` → BatchCobrancaCard
  - [ ] `batch_confirmacao_reuniao` → BatchConfirmacaoCard
  - [ ] `batch_followup` → BatchFollowupCard
  - [ ] `gerar_faturas` → GerarFaturasCard
  - [ ] `pos_reuniao` → PosReuniaoCard
  - [ ] `agendamento_recorrente` → AgendamentoRecorrenteCard
  - [ ] `onboarding_cliente` → OnboardingCard

### Task 6.4: Atualizar system prompt

- [ ] Adicionar descrição dos novos tools
- [ ] Definir triggers automáticos:
  - [ ] "Bom dia" → `executar_rotina_matinal`
  - [ ] "Boa noite" / "fim de expediente" → `encerrar_dia`
  - [ ] "Cobra todo mundo" → `cobrar_todos_vencidos`
  - [ ] "Confirma reuniões" → `confirmar_reunioes_amanha`
  - [ ] "Novo cliente" → `onboarding_cliente`
  - [ ] "Health check" / "como tá a operação" → `health_check_geral`

---

## 🧪 FASE 7: TESTES
**Tempo estimado: 2-3 horas**

### Task 7.1: Testar Intelligence

- [ ] "O que devo fazer hoje?" → sugerir_acoes_dia
- [ ] "Como está o cliente X?" → diagnosticar_cliente
- [ ] "Quais clientes estão em risco?" → identificar_clientes_risco
- [ ] "Quanto vou receber esse mês?" → prever_faturamento

### Task 7.2: Testar Batch Actions

- [ ] "Cobra todo mundo que tá devendo" → cobrar_todos_vencidos
  - [ ] Mostra card de confirmação?
  - [ ] Lista clientes corretamente?
  - [ ] Envia mensagens após confirmar?
- [ ] "Confirma as reuniões de amanhã" → confirmar_reunioes_amanha
- [ ] "Gera as faturas de janeiro" → gerar_faturas_mes
- [ ] "Manda follow-up pros clientes" → enviar_followup_lote

### Task 7.3: Testar Meta-Actions

- [ ] "Bom dia" → executar_rotina_matinal
  - [ ] Mostra saudação correta?
  - [ ] Lista reuniões do dia?
  - [ ] Mostra alertas?
  - [ ] Sugere ações?
- [ ] "Boa noite, fecha o dia" → encerrar_dia
- [ ] "Faz o onboarding do cliente X" → onboarding_cliente
- [ ] "Como está minha operação?" → health_check_geral

### Task 7.4: Testar Communication

- [ ] "Prepara a reunião das 14h" → preparar_reuniao
- [ ] "Registra a reunião: decidimos X, próximos passos Y" → registrar_pos_reuniao
- [ ] "Agenda reunião semanal com João às terças 14h" → agendar_recorrente
- [ ] "Gera relatório do cliente X" → gerar_relatorio_cliente

---

## 📊 RESUMO DE PROGRESSO

| Fase | Status | Tasks | Completas |
|------|--------|-------|-----------|
| 1. Infraestrutura | ⬜ | 3 | 0/3 |
| 2. Intelligence | ⬜ | 2 | 0/2 |
| 3. Batch Actions | ⬜ | 3 | 0/3 |
| 4. Meta-Actions | ⬜ | 3 | 0/3 |
| 5. Communication | ⬜ | 3 | 0/3 |
| 6. Integração | ⬜ | 4 | 0/4 |
| 7. Testes | ⬜ | 4 | 0/4 |
| **TOTAL** | **⬜** | **22** | **0/22** |

---

## 🎯 CRITÉRIOS DE CONCLUSÃO

A implementação está completa quando:

- [ ] Todos os 16 tools avançados funcionam
- [ ] Todos os cards de confirmação renderizam corretamente
- [ ] "Bom dia" dispara rotina matinal automaticamente
- [ ] Ações em lote funcionam com confirmação
- [ ] Health check retorna análise completa
- [ ] Onboarding cria todos os itens corretamente
- [ ] Nenhum erro no console
- [ ] Tools básicos continuam funcionando (regressão)

---

**Última atualização:** ___/___/______
**Responsável:** _________________
