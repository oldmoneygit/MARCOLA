# TrafficHub 🚀

Sistema de gestão para agências de tráfego pago.

![Dashboard Preview](docs/assets/dashboard-preview.png)

## ✨ Features

- 📊 **Dashboard** - Visão geral de métricas e alertas
- 👥 **Clientes** - Gestão completa de clientes
- 📈 **Relatórios** - Importação de CSV e visualização de performance
- 🧠 **Análise** - Sugestões inteligentes baseadas no algoritmo Andromeda
- 💰 **Financeiro** - Controle de cobranças com templates de WhatsApp

## 🛠 Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS + DaisyUI + Glassmorphism
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/user/traffichub.git
cd traffichub

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                # Next.js App Router
│   ├── (auth)/        # Auth routes
│   ├── (dashboard)/   # Dashboard routes
│   └── api/           # API routes
├── components/
│   ├── ui/            # Base components
│   ├── clients/       # Client components
│   ├── reports/       # Report components
│   ├── analysis/      # Analysis components
│   ├── financial/     # Financial components
│   └── layout/        # Layout components
├── hooks/             # Custom hooks
├── lib/               # Utils, Supabase client
├── stores/            # Zustand stores
├── types/             # TypeScript types
└── styles/            # Global styles
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Rules for Claude Code |
| [PROJECT.md](PROJECT.md) | Project overview |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Components documentation |
| [docs/API.md](docs/API.md) | API documentation |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Design system |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Development workflow |

## 🔧 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript check
npm run validate     # Full validation
npm run format       # Format with Prettier
```

## 🎨 Design

- Dark mode only
- Glassmorphism effects
- Purple/violet accent colors
- DaisyUI components

## 📄 License

Private - All rights reserved.

---

Built with ❤️ using Next.js and Supabase
