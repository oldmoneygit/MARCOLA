# PROJECT.md - Visão Geral do Projeto TrafficHub

---

## 📋 Sumário

1. [Sobre o Projeto](#sobre-o-projeto)
2. [Problema que Resolve](#problema-que-resolve)
3. [Funcionalidades](#funcionalidades)
4. [Stack Tecnológica](#stack-tecnológica)
5. [Requisitos](#requisitos)
6. [Instalação](#instalação)
7. [Estrutura de Módulos](#estrutura-de-módulos)
8. [Roadmap](#roadmap)

---

## 📖 Sobre o Projeto

**TrafficHub** é um sistema SaaS de gestão interna para agências e gestores de tráfego pago. O sistema centraliza todas as informações de clientes, relatórios de performance de anúncios, análises inteligentes e controle financeiro em uma única plataforma.

### Público-Alvo
- Gestores de tráfego pago freelancers
- Agências de marketing digital
- Profissionais que gerenciam múltiplas contas de anúncios

### Proposta de Valor
- Dashboard unificado para todos os clientes
- Importação simplificada de dados do Meta Ads
- Sugestões automáticas de otimização (baseadas no algoritmo Andromeda)
- Controle financeiro com alertas de cobrança
- Templates de mensagem para comunicação com clientes

---

## 🎯 Problema que Resolve

### Antes do TrafficHub
| Problema | Impacto |
|----------|---------|
| Dados espalhados em planilhas | Tempo perdido organizando |
| Relatórios manuais | Horas de trabalho repetitivo |
| Esquece de cobrar clientes | Perda de receita |
| Difícil passar operação para outro | Dependência de uma pessoa |
| Sem padrão para escalar | Limita crescimento |

### Com o TrafficHub
| Solução | Benefício |
|---------|-----------|
| Dashboard centralizado | Visão clara de tudo |
| Importa CSV → relatório pronto | Economia de tempo |
| Alertas automáticos | Nunca mais esquece cobrança |
| Sistema documentado | Qualquer um pode operar |
| Processo padronizado | Escalável |

---

## 🔧 Funcionalidades

### Módulo 1: Dashboard Principal
- Visão geral de métricas consolidadas
- Cards de resumo (clientes, investimento, CPA, conversões)
- Gráficos de performance semanal
- Distribuição de investimento por cliente
- Alertas importantes (fadiga criativa, cobranças, oportunidades)
- Próximas cobranças

### Módulo 2: Gestão de Clientes
- CRUD completo de clientes
- Ficha detalhada (nome, segmento, contato, valor, vencimento)
- Status visual (ativo, atenção, atrasado)
- Histórico de interações
- Links rápidos (conta de anúncio, site, drive)
- Métricas resumidas por cliente

### Módulo 3: Relatórios de Performance
- Importação de CSV do Ads Manager
- Dashboard por cliente
- Métricas: Gasto, Impressões, Cliques, CTR, CPA, ROAS
- Gráficos de evolução temporal
- Comparativo de períodos
- Tabela de performance por anúncio
- Status de anúncios (vencedor, fadiga, pausar)

### Módulo 4: Análise & Sugestões
- Detecção automática de fadiga criativa
- Alerta de diversidade criativa (Andromeda)
- Sugestões de otimização categorizadas:
  - 🔴 Urgente (ação imediata necessária)
  - 🟢 Oportunidade (potencial de melhoria)
  - 🔵 Sugestão (boas práticas)
- Ações recomendadas detalhadas
- Projeções de resultado

### Módulo 5: Financeiro
- Visão geral de faturamento mensal
- Status de pagamentos (pago, pendente, atrasado)
- Alertas de cobrança automáticos
- Histórico de pagamentos por cliente
- Templates de mensagem para WhatsApp
- Geração de lembretes

### Funcionalidades Transversais
- Autenticação (login/logout)
- Tema dark com glassmorphism
- Responsividade (desktop first, mobile adaptado)
- Modais para ações (importar CSV, novo cliente, enviar lembrete)

---

## 🛠 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14.x | Framework React com App Router |
| React | 18.x | Biblioteca UI |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 3.x | Estilização utility-first |
| DaisyUI | 4.x | Componentes UI |
| Recharts | 2.x | Gráficos |
| Zustand | 4.x | Gerenciamento de estado |
| React Hook Form | 7.x | Formulários |
| Zod | 3.x | Validação de schemas |

### Backend
| Tecnologia | Uso |
|------------|-----|
| Next.js API Routes | Endpoints REST |
| Supabase | Database + Auth + Storage |
| PostgreSQL | Banco de dados (via Supabase) |

### DevOps
| Tecnologia | Uso |
|------------|-----|
| Vercel | Deploy e hosting |
| GitHub Actions | CI/CD |
| ESLint | Linting |
| Prettier | Formatação |

---

## 📋 Requisitos

### Requisitos de Sistema
- Node.js 18.x ou superior
- npm 9.x ou superior (ou pnpm/yarn)
- Git

### Requisitos de Desenvolvimento
- VS Code (recomendado)
- Extensões: ESLint, Prettier, Tailwind CSS IntelliSense

### Contas Necessárias
- [Supabase](https://supabase.com) - Banco de dados
- [Vercel](https://vercel.com) - Deploy (opcional para dev)

---

## 🚀 Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/traffichub.git
cd traffichub
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure as Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_aqui

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure o Supabase
```bash
# Se usar Supabase CLI
supabase db push

# Ou execute as migrations manualmente no dashboard do Supabase
```

### 5. Rode o Projeto
```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## 📦 Estrutura de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                        TrafficHub                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Dashboard  │  │   Clientes   │  │  Relatórios  │       │
│  │              │  │              │  │              │       │
│  │ • Métricas   │  │ • CRUD       │  │ • Import CSV │       │
│  │ • Gráficos   │  │ • Status     │  │ • Métricas   │       │
│  │ • Alertas    │  │ • Histórico  │  │ • Gráficos   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Análise    │  │  Financeiro  │                         │
│  │              │  │              │                         │
│  │ • Sugestões  │  │ • Cobranças  │                         │
│  │ • Andromeda  │  │ • Templates  │                         │
│  │ • Ações      │  │ • Histórico  │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Camada de Serviços                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Supabase   │  │     Auth     │  │   Storage    │       │
│  │   (DB)       │  │   (Login)    │  │   (Arquivos) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗓 Roadmap

### Fase 1 - MVP (Atual)
- [x] Design do dashboard
- [ ] Setup do projeto Next.js
- [ ] Configuração Supabase
- [ ] Autenticação
- [ ] Dashboard principal
- [ ] CRUD de clientes
- [ ] Importação CSV básica
- [ ] Visualização de relatórios
- [ ] Controle financeiro básico

### Fase 2 - Melhorias
- [ ] Análise com sugestões automáticas
- [ ] Regras de detecção de fadiga criativa
- [ ] Integração WhatsApp (link direto)
- [ ] Notificações por email
- [ ] Multi-usuário por conta

### Fase 3 - Integrações
- [ ] API Meta Ads (conexão direta)
- [ ] API Google Ads
- [ ] Webhooks para automação
- [ ] Relatórios em PDF
- [ ] White-label

### Fase 4 - Escala
- [ ] Multi-tenant
- [ ] Planos e billing
- [ ] API pública
- [ ] Mobile app

---

## 📄 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [CLAUDE.md](./CLAUDE.md) | Regras para o Claude Code |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitetura técnica |
| [DATABASE.md](./docs/DATABASE.md) | Schema do banco de dados |
| [API.md](./docs/API.md) | Documentação da API |
| [COMPONENTS.md](./docs/COMPONENTS.md) | Documentação de componentes |
| [DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | Sistema de design |
| [WORKFLOW.md](./docs/WORKFLOW.md) | Workflow de desenvolvimento |

---

## 👥 Contribuição

1. Leia o `CLAUDE.md` antes de qualquer contribuição
2. Siga o padrão de commits semânticos
3. Valide o código antes de enviar
4. Documente novas features

---

## 📝 Licença

Projeto privado. Todos os direitos reservados.

---

*Última atualização: Dezembro 2025*
