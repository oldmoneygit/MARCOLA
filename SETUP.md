# SETUP.md - Guia de Setup Rápido

---

## ⚡ Setup em 5 Minutos

### 1. Criar Pasta do Projeto

```bash
mkdir traffichub
cd traffichub
```

### 2. Copiar Documentação

Copie todos os arquivos de documentação para a pasta:

```
traffichub/
├── CLAUDE.md              # Regras para Claude Code
├── PROJECT.md             # Visão geral
├── PROMPT_INICIAL.md      # Prompt para começar
├── SETUP.md               # Este arquivo
├── docs/
│   ├── ARCHITECTURE.md    # Arquitetura
│   ├── DATABASE.md        # Banco de dados
│   ├── COMPONENTS.md      # Componentes
│   ├── DESIGN_SYSTEM.md   # Design system
│   ├── API.md             # API
│   └── WORKFLOW.md        # Workflow
└── reference/
    └── traffichub-dashboard-daisyui.html  # Design de referência
```

### 3. Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e a ANON KEY

### 4. Iniciar Claude Code

```bash
# Na pasta do projeto
claude
```

### 5. Colar o Prompt Inicial

Copie o conteúdo do `PROMPT_INICIAL.md` e cole no Claude Code.

### 6. Acompanhar o Desenvolvimento

O Claude Code vai:
1. Ler toda a documentação
2. Criar o projeto Next.js
3. Instalar dependências
4. Criar estrutura de pastas
5. Implementar componentes
6. Criar páginas
7. Configurar Supabase
8. Validar tudo

---

## 📋 Checklist de Arquivos

Antes de iniciar, confirme que você tem:

- [ ] `CLAUDE.md`
- [ ] `PROJECT.md`
- [ ] `PROMPT_INICIAL.md`
- [ ] `docs/ARCHITECTURE.md`
- [ ] `docs/DATABASE.md`
- [ ] `docs/COMPONENTS.md`
- [ ] `docs/DESIGN_SYSTEM.md`
- [ ] `docs/API.md`
- [ ] `docs/WORKFLOW.md`
- [ ] `traffichub-dashboard-daisyui.html` (referência visual)

---

## 🔧 Variáveis de Ambiente Necessárias

Prepare estas informações do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## 📊 Ordem de Desenvolvimento

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE 1: SETUP                            │
│  Next.js → Dependências → Estrutura → Configs              │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 FASE 2: COMPONENTES UI                      │
│  GlassCard → MetricCard → StatusBadge → Button → etc       │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASE 3: LAYOUT                           │
│  Sidebar → Header → Layouts das páginas                    │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  FASE 4: TYPES & HOOKS                      │
│  Types → Hooks → Stores                                    │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FASE 5: PÁGINAS                          │
│  Dashboard → Clientes → Relatórios → Análise → Financeiro  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FASE 6: API ROUTES                        │
│  Auth → Clients → Reports → Analysis → Financial           │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FASE 7: SUPABASE                          │
│  Migrations → RLS → Conexão → Auth                         │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FASE 8: POLIMENTO                         │
│  Revisão → Responsividade → Performance → Deploy           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Tempo Estimado

| Fase | Tempo |
|------|-------|
| Setup | 15 min |
| Componentes UI | 1-2 horas |
| Layout | 30 min |
| Types & Hooks | 1 hora |
| Páginas | 2-3 horas |
| API Routes | 1 hora |
| Supabase | 1 hora |
| Polimento | 1-2 horas |
| **Total** | **8-12 horas** |

---

## 🆘 Troubleshooting

### Claude Code não está lendo os arquivos

```
Por favor, leia o arquivo CLAUDE.md na pasta atual.
```

### Erro de build

```
Execute `npm run build` e mostre o erro completo.
Corrija seguindo as regras do CLAUDE.md.
```

### Código não segue o design

```
O componente [X] não está seguindo o DESIGN_SYSTEM.md.
Corrija para usar glassmorphism conforme documentado.
```

### Precisa pausar e continuar depois

```
Salve o estado atual e liste os próximos passos.
Quando retornar, usarei o prompt de continuação.
```

---

## 📚 Documentação Rápida

| Preciso de... | Consulte... |
|---------------|-------------|
| Regras gerais | `CLAUDE.md` |
| Visão do projeto | `PROJECT.md` |
| Estrutura de pastas | `docs/ARCHITECTURE.md` |
| Schema do banco | `docs/DATABASE.md` |
| Como criar componente | `docs/COMPONENTS.md` |
| Cores e estilos | `docs/DESIGN_SYSTEM.md` |
| Endpoints | `docs/API.md` |
| Git e validação | `docs/WORKFLOW.md` |

---

## ✅ Pronto para Começar

1. ✅ Pasta criada
2. ✅ Documentação copiada
3. ✅ Supabase configurado
4. ✅ Claude Code iniciado
5. ✅ Prompt inicial colado

**Agora é só acompanhar o Claude Code construir o projeto!** 🚀
