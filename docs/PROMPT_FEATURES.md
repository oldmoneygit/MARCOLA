# PROMPT - Implementação das Novas Features

Cole este prompt no Claude Code para implementar as novas features do TrafficHub.

---

## 🚀 PROMPT PARA COLAR:

```
Você vai implementar 2 novas features no TrafficHub. Leia as documentações antes de começar:

1. Leia TASKS.md - Sistema de Tarefas e Onboarding por Nicho
2. Leia CALENDAR.md - Cronograma de Conteúdo e Produção

---

## FEATURES A IMPLEMENTAR

### Feature 1: Sistema de Tasks + Onboarding por Nicho

**O que faz:**
- Templates de tarefas padrão por segmento (Fitness, Delivery, E-commerce, etc)
- Ao cadastrar cliente, sugere tarefas do nicho dele
- Tarefas com prioridade (Urgente, Alta, Média, Baixa)
- Tarefas recorrentes (Diária, Semanal, Quinzenal, Mensal)
- Widget "Tarefas de Hoje" no dashboard
- Follow-up automático via WhatsApp ao concluir tarefa
- Notas/anotações por cliente

**Tabelas:**
- task_templates (templates por nicho)
- tasks (tarefas do cliente)
- client_notes (notas de follow-up)

### Feature 2: Cronograma de Conteúdo

**O que faz:**
- Calendário visual por cliente
- Planejamento de posts, vídeos, campanhas, promoções
- Status de produção (Planejado → Criando → Revisão → Aprovado → Publicado)
- Múltiplas plataformas (Instagram, Facebook, TikTok, etc)
- Widget "Próximos Conteúdos" no dashboard

**Tabelas:**
- content_calendar (eventos do calendário)
- calendar_templates (templates recorrentes)

---

## FASES DE IMPLEMENTAÇÃO

### FASE 1: Database (Migrations)

1. Criar migration para task_templates
2. Criar migration para tasks
3. Criar migration para client_notes
4. Criar migration para content_calendar
5. Configurar RLS policies
6. Criar seed com templates padrão por nicho

**Validar:** Testar queries no Supabase

### FASE 2: Types TypeScript

1. Criar src/types/task.ts com todos os types de tasks
2. Criar src/types/calendar.ts com todos os types do calendário
3. Atualizar src/types/index.ts com exports

**Validar:** npm run type-check

### FASE 3: API Routes - Tasks

Criar em src/app/api/:

```
tasks/
├── route.ts              # GET, POST
├── [id]/route.ts         # GET, PUT, DELETE
├── today/route.ts        # GET (tarefas de hoje)
└── apply-templates/route.ts  # POST

templates/
├── route.ts              # GET, POST
├── [id]/route.ts         # PUT, DELETE
└── by-segment/[segment]/route.ts  # GET

notes/
├── route.ts              # GET, POST
└── [id]/route.ts         # PUT, DELETE
```

**Validar:** npm run build + testar endpoints

### FASE 4: API Routes - Calendar

Criar em src/app/api/:

```
calendar/
├── route.ts              # GET, POST
├── [id]/route.ts         # GET, PUT, DELETE
├── by-client/[clientId]/route.ts  # GET
└── by-month/route.ts     # GET
```

**Validar:** npm run build

### FASE 5: Hooks

1. Criar src/hooks/useTasks.ts
2. Criar src/hooks/useTemplates.ts
3. Criar src/hooks/useNotes.ts
4. Criar src/hooks/useCalendar.ts
5. Atualizar src/hooks/index.ts

**Validar:** npm run type-check

### FASE 6: Componentes Tasks

Criar em src/components/tasks/:

```
tasks/
├── TaskCard.tsx          # Card individual
├── TaskList.tsx          # Lista filtrada
├── TaskForm.tsx          # Form criar/editar
├── TaskModal.tsx         # Modal detalhes
├── TodayTasks.tsx        # Widget dashboard
├── PriorityBadge.tsx     # Badge prioridade
├── RecurrenceBadge.tsx   # Badge recorrência
├── TemplateSelector.tsx  # Seletor onboarding
├── TemplateManager.tsx   # Gerenciar templates
├── ClientNotes.tsx       # Seção notas
├── NoteCard.tsx          # Card nota
├── WhatsAppNotify.tsx    # Modal WhatsApp
└── index.ts
```

**Validar:** npm run build

### FASE 7: Componentes Calendar

Criar em src/components/calendar/:

```
calendar/
├── Calendar.tsx          # Componente principal
├── CalendarHeader.tsx    # Header navegação
├── CalendarGrid.tsx      # Grid de dias
├── CalendarDay.tsx       # Célula do dia
├── CalendarEvent.tsx     # Evento visual
├── EventModal.tsx        # Modal criar/editar
├── EventCard.tsx         # Card detalhado
├── EventTypeBadge.tsx    # Badge tipo
├── StatusBadge.tsx       # Badge status
├── PlatformIcons.tsx     # Ícones plataformas
├── ClientCalendar.tsx    # Calendário do cliente
├── UpcomingContent.tsx   # Widget dashboard
└── index.ts
```

**Validar:** npm run build

### FASE 8: Integração no Cliente

1. Adicionar aba "Tarefas" no card/página do cliente
2. Adicionar aba "Cronograma" no card/página do cliente
3. Adicionar aba "Notas" no card/página do cliente
4. Integrar TemplateSelector no formulário de criação de cliente

**Validar:** npm run build + testar visualmente

### FASE 9: Integração no Dashboard

1. Adicionar widget "Tarefas de Hoje" (TodayTasks)
2. Adicionar widget "Próximos Conteúdos" (UpcomingContent)
3. Ajustar layout do dashboard para acomodar novos widgets

**Validar:** npm run build + testar visualmente

### FASE 10: Páginas Dedicadas

1. Criar página /tasks (visão geral de todas as tarefas)
2. Criar página /calendar (calendário geral)
3. Criar página /templates (gerenciar templates)
4. Adicionar links no Sidebar

**Validar:** npm run build + testar navegação

### FASE 11: Seed de Templates

Inserir templates padrão para os nichos:
- Fitness / Academia
- Delivery / Restaurante
- E-commerce
- Clínica / Saúde
- Serviços Locais
- Imobiliário
- Educação / Cursos

**Validar:** Verificar no Supabase

---

## REGRAS CRÍTICAS

1. **SEMPRE** execute validações após cada fase:
   ```bash
   npm run type-check && npm run lint && npm run build
   ```

2. **NUNCA** use `any` - defina tipos específicos

3. **SEMPRE** implemente tratamento de erros com try-catch

4. **SEMPRE** siga o visual glassmorphism do DESIGN_SYSTEM.md

5. **SEMPRE** use os componentes UI base já existentes (GlassCard, Button, Input, Modal, etc)

6. **NUNCA** entregue código que não compila

---

## FORMATO DE RESPOSTA

Após completar cada fase:

```
## ✅ FASE X Concluída: [Nome]

### Arquivos Criados:
- path/to/file.tsx - Descrição

### Validações:
- ✅ TypeScript: OK
- ✅ ESLint: OK  
- ✅ Build: OK

### Próxima Fase:
[Nome da próxima fase]
```

---

## COMECE AGORA

1. Confirme que leu TASKS.md e CALENDAR.md
2. Liste o que cada documentação contém
3. Inicie pela FASE 1: Database (Migrations)

Aguardo sua confirmação antes de prosseguir.
```

---

## 📝 PROMPTS AUXILIARES

### Se precisar corrigir erro:

```
Pare. Execute npm run build e mostre o erro completo.
Corrija o erro antes de continuar.
```

### Para continuar de onde parou:

```
Continue a implementação das features Tasks e Calendar.
Qual foi a última fase completa?
Liste o status e continue para a próxima fase.
```

### Se o visual não estiver correto:

```
O visual deve seguir o DESIGN_SYSTEM.md:
- Glassmorphism: backdrop-blur-xl bg-white/[0.03] border border-white/[0.08]
- Hover: hover:bg-white/[0.06] hover:border-white/[0.15]
- Cores: violet para accent, emerald para sucesso, red para erro
- Border radius: rounded-2xl para cards, rounded-xl para botões
Ajuste os componentes para seguir esse padrão.
```

### Para testar uma feature específica:

```
Teste a feature de [Tasks/Calendar]:
1. Crie um registro de teste
2. Verifique se aparece na listagem
3. Edite o registro
4. Delete o registro
5. Confirme que tudo funciona
```

---

## 🎯 RESULTADO ESPERADO

Ao final das 11 fases, você terá:

### Sistema de Tasks:
- ✅ Templates de tarefas por nicho
- ✅ Onboarding que sugere tarefas ao cadastrar cliente
- ✅ Tarefas com prioridade visual (Urgente/Alta/Média/Baixa)
- ✅ Tarefas recorrentes que regeneram automaticamente
- ✅ Widget "Tarefas de Hoje" no dashboard
- ✅ Follow-up automático via WhatsApp
- ✅ Notas de acompanhamento por cliente

### Sistema de Calendário:
- ✅ Calendário visual mensal
- ✅ Eventos por tipo (Post, Vídeo, Reels, Promoção, Campanha)
- ✅ Status de produção (Planejado → Publicado)
- ✅ Múltiplas plataformas
- ✅ Widget "Próximos Conteúdos" no dashboard
- ✅ Calendário específico por cliente

### Integrações:
- ✅ Aba Tarefas no card do cliente
- ✅ Aba Cronograma no card do cliente
- ✅ Aba Notas no card do cliente
- ✅ Páginas dedicadas (/tasks, /calendar, /templates)
- ✅ Novos itens no Sidebar
