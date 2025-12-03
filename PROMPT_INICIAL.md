# PROMPT INICIAL - TrafficHub

Cole este prompt no Claude Code para iniciar o desenvolvimento do projeto.

---

## 🚀 PROMPT PARA COLAR:

```
Você é o desenvolvedor principal do projeto TrafficHub. Antes de começar qualquer implementação, você DEVE:

1. LER TODAS AS DOCUMENTAÇÕES na raiz do projeto:
   - CLAUDE.md (regras obrigatórias - LEIA PRIMEIRO)
   - PROJECT.md (visão geral)
   - ARCHITECTURE.md (arquitetura técnica)
   - DATABASE.md (schema do banco)
   - COMPONENTS.md (documentação de componentes)
   - DESIGN_SYSTEM.md (sistema visual)
   - API.md (endpoints)
   - WORKFLOW.md (fluxo de trabalho)

2. ANALISAR os arquivos de referência visual:
   - traffichub-dashboard-daisyui.html (protótipo visual completo)
   - TrafficHubDashboard.jsx (componente React de referência)

3. SEGUIR RIGOROSAMENTE as regras do CLAUDE.md em TODAS as etapas.

---

## OBJETIVO

Implementar o TrafficHub do zero - um sistema de gestão para agências de tráfego pago com:
- Dashboard com métricas consolidadas
- Gestão de clientes (CRUD)
- Relatórios de performance (importação CSV)
- Análise com sugestões inteligentes
- Controle financeiro e cobranças

---

## STACK OBRIGATÓRIA

- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + DaisyUI
- Supabase (PostgreSQL + Auth)
- Recharts (gráficos)
- Zustand (estado global)
- React Hook Form + Zod (formulários)

---

## FASES DE IMPLEMENTAÇÃO

Execute as fases NA ORDEM. Não pule etapas. Valide após cada fase.

### FASE 1: Setup Inicial
1. Criar estrutura de pastas conforme ARCHITECTURE.md
2. Configurar Tailwind com tema dark e variáveis do DESIGN_SYSTEM.md
3. Configurar DaisyUI com tema customizado
4. Criar arquivo de tipos base (src/types/index.ts)
5. Criar utilitários base (src/lib/utils.ts, constants.ts)
6. Criar cliente Supabase (src/lib/supabase/client.ts, server.ts)

**Validar:** npm run type-check && npm run lint && npm run build

### FASE 2: Componentes UI Base
1. Criar todos os componentes de src/components/ui/ conforme COMPONENTS.md:
   - GlassCard, MetricCard, StatusBadge, AlertCard
   - Button, Input, Select, Modal, Table, Chart
2. Criar index.ts com re-exports
3. Seguir EXATAMENTE o visual do protótipo HTML

**Validar:** npm run build

### FASE 3: Layout
1. Criar Sidebar com navegação (conforme protótipo)
2. Criar Header de página
3. Criar layout do dashboard (src/app/(dashboard)/layout.tsx)
4. Implementar navegação entre seções

**Validar:** npm run build + testar navegação visual

### FASE 4: Autenticação
1. Configurar Supabase Auth
2. Criar páginas de login/register
3. Criar middleware de proteção de rotas
4. Criar hook useAuth
5. Criar contexto de usuário

**Validar:** npm run build + testar fluxo de login

### FASE 5: Database
1. Criar migrations SQL conforme DATABASE.md
2. Configurar RLS policies
3. Gerar types do Supabase
4. Criar seed com dados de exemplo

**Validar:** Testar queries no Supabase

### FASE 6: Módulo Clientes
1. Criar types (Client, CreateClientDTO, etc)
2. Criar hook useClients
3. Criar API routes (/api/clients)
4. Criar componentes (ClientCard, ClientForm, ClientList)
5. Criar página /clients

**Validar:** npm run build + testar CRUD completo

### FASE 7: Módulo Dashboard
1. Criar API routes para métricas
2. Criar componentes (AlertsList, UpcomingPayments, WeeklyChart, ClientsDistribution)
3. Criar página /dashboard com todos os elementos do protótipo

**Validar:** npm run build + comparar com protótipo

### FASE 8: Módulo Relatórios
1. Criar parser de CSV
2. Criar types (Report, Ad, etc)
3. Criar hook useReports
4. Criar API routes
5. Criar componentes (CSVImporter, MetricsGrid, AdsTable, PerformanceChart)
6. Criar página /reports

**Validar:** npm run build + testar importação CSV

### FASE 9: Módulo Análise
1. Implementar lógica de detecção de fadiga criativa
2. Implementar verificação Andromeda (diversidade criativa)
3. Criar types (Suggestion, etc)
4. Criar componentes (AndromedaAlert, SuggestionCard, SuggestionList)
5. Criar página /analysis

**Validar:** npm run build

### FASE 10: Módulo Financeiro
1. Criar types (Payment, etc)
2. Criar hook useFinancial
3. Criar API routes
4. Criar componentes (FinancialOverview, PaymentsTable, MessageTemplates, ReminderModal)
5. Criar página /financial
6. Implementar geração de link WhatsApp

**Validar:** npm run build + testar fluxo completo

### FASE 11: Polimento Final
1. Revisar responsividade
2. Implementar loading states em todas as páginas
3. Implementar empty states
4. Revisar tratamento de erros
5. Otimizar performance (memoização)
6. Testar fluxo completo end-to-end

**Validar:** npm run build + teste manual completo

---

## REGRAS CRÍTICAS (do CLAUDE.md)

1. **SEMPRE** execute validações após cada modificação:
   ```bash
   npm run type-check && npm run lint && npm run build
   ```

2. **NUNCA** use `any` - sempre defina tipos específicos

3. **NUNCA** deixe console.log no código (apenas console.error para erros)

4. **SEMPRE** implemente tratamento de erros com try-catch

5. **SEMPRE** siga a ordem de imports definida no CLAUDE.md

6. **SEMPRE** adicione header comments nos arquivos

7. **SEMPRE** use o visual EXATO do protótipo HTML (cores, espaçamentos, glassmorphism)

8. **NUNCA** entregue código que não compila

---

## FORMATO DE RESPOSTA

Após completar cada fase, responda neste formato:

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

Inicie pela FASE 1: Setup Inicial.

1. Primeiro, confirme que leu e entendeu todas as documentações
2. Liste brevemente o que cada documentação contém
3. Então comece a criar a estrutura de pastas

Aguardo sua confirmação antes de prosseguir.
```

---

## 📝 NOTAS DE USO

### Como usar este prompt:

1. Copie TODO o conteúdo entre os ``` ``` acima
2. Cole no Claude Code
3. Aguarde ele confirmar que leu as documentações
4. Deixe ele seguir fase por fase

### Se ele travar ou errar:

Cole isto:
```
Pare. Releia o CLAUDE.md e as regras. Execute npm run build para ver o erro. Corrija o erro antes de continuar.
```

### Se ele pular etapas:

Cole isto:
```
Você pulou a validação. Execute: npm run type-check && npm run lint && npm run build
Mostre o resultado antes de continuar.
```

### Se o visual não estiver igual ao protótipo:

Cole isto:
```
O visual não está igual ao protótipo traffichub-dashboard-daisyui.html. 
Abra o arquivo HTML no navegador e compare. Ajuste as cores, espaçamentos e efeitos de glassmorphism para ficarem idênticos.
```

### Para continuar de onde parou:

Cole isto:
```
Continue do ponto onde paramos. Qual foi a última fase completa? 
Liste o status atual e continue para a próxima fase.
Lembre-se de validar com npm run build após cada etapa.
```

---

## 🎯 RESULTADO ESPERADO

Ao final das 11 fases, você terá:

- ✅ Projeto Next.js completo e funcional
- ✅ Autenticação com Supabase
- ✅ CRUD de clientes
- ✅ Dashboard com métricas e gráficos
- ✅ Importação de CSV
- ✅ Sistema de sugestões inteligentes
- ✅ Controle financeiro
- ✅ Visual idêntico ao protótipo
- ✅ Código tipado, documentado e sem erros
