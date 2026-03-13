# Meridian — FuelEU Maritime Compliance Platform

A modern, full-stack SaaS application for monitoring and managing **FuelEU Maritime Regulation (EU) 2023/1805** compliance across shipping fleets.

## Architecture

Both frontend and backend follow **Hexagonal Architecture (Ports & Adapters)**, ensuring clean separation of concerns:
```
┌─────────────────────────────────────────────────────────────┐
│                          CORE                               │
│                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│   │   Domain      │   │  Application │   │    Ports      │   │
│   │   Entities    │──▶│  Use Cases   │──▶│  Interfaces   │   │
│   │   Services    │   │  (App Logic) │   │  (Contracts)  │   │
│   └──────────────┘   └──────────────┘   └──────┬───────┘   │
│                                                 │           │
│            ⚠ No framework dependencies          │           │
└─────────────────────────────────────────────────┼───────────┘
                                                  │
                      ┌───────────────────────────┼───────────────────────────┐
                      │                     ADAPTERS                          │
                      │                                                       │
                      │  ┌─────────────────────┐   ┌───────────────────────┐  │
                      │  │  📥 Inbound          │   │  📤 Outbound          │  │
                      │  │  HTTP Controllers    │   │  PostgreSQL Repos     │  │
                      │  │  (Express Routes)    │   │  (Prisma ORM)         │  │
                      │  └─────────────────────┘   └───────────────────────┘  │
                      │  ┌─────────────────────┐   ┌───────────────────────┐  │
                      │  │  🖥️ UI Adapter       │   │  🌐 API Adapter       │  │
                      │  │  React Components   │   │  REST API Clients     │  │
                      │  │  Hooks & Pages       │   │  (fetch / axios)      │  │
                      │  └─────────────────────┘   └───────────────────────┘  │
                      └───────────────────────────────────────────────────────┘
                                                  │
                      ┌───────────────────────────┼───────────────────────────┐
                      │                   INFRASTRUCTURE                      │
                      │                                                       │
                      │   Express Server  •  Prisma DB  •  Vite Bundler       │
                      │   PostgreSQL      •  React DOM  •  TailwindCSS        │
                      └───────────────────────────────────────────────────────┘

  Dependency Rule:  CORE ──▶ PORTS ◀── ADAPTERS ◀── INFRASTRUCTURE
                    (Core never imports frameworks or external libraries)
```
**Key principle**: Core layer has ZERO framework dependencies. Domain services are pure TypeScript functions.

## Tech Stack

### Frontend
- React 18 + TypeScript (strict mode)
- Vite for bundling
- TailwindCSS with custom maritime theme
- Recharts for data visualization
- TanStack React Query for server state
- Zustand for client state
- React Router v6

### Backend
- Node.js + TypeScript + Express
- PostgreSQL + Prisma ORM
- Vitest for testing
- Zod for validation

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Fleet KPIs, compliance gauges, fuel distribution, emission trends |
| **Routes Management** | Filterable table with sorting, pagination, row expansion, baseline setting |
| **Route Comparison** | Baseline vs all routes with bar charts, % diff, compliance flags |
| **Banking (Art. 20)** | Timeline UI for banking/applying surplus CB, with validation |
| **Pooling (Art. 21)** | Interactive pool simulator with greedy allocation, animated transfers |
| **Analytics** | Stacked charts, radar plots, intensity distribution, health map |
| **AI Insights Panel** | Smart compliance recommendations based on fleet data |
| **Dark/Light Mode** | Full theme toggle with glassmorphism design |
| **Compliance Health Score** | 0-100 radial gauge per vessel |

## Setup & Run

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend

```bash
cd backend
npm install

# Set up database
cp .env.example .env  # Edit DATABASE_URL
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed

# Start server
npm run dev
# → http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Run Tests

```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm run test
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | List all routes (with filters) |
| POST | `/api/routes/:routeId/baseline` | Set baseline route |
| GET | `/api/routes/comparison` | Baseline vs others comparison |
| GET | `/api/compliance/cb` | Get compliance balance |
| GET | `/api/compliance/adjusted-cb` | Get CB after banking |
| GET | `/api/banking/records` | Get banking history |
| POST | `/api/banking/bank` | Bank surplus CB |
| POST | `/api/banking/apply` | Apply banked credits |
| POST | `/api/pools` | Create pool |
| POST | `/api/pools/simulate` | Simulate pool allocation |
| GET | `/api/dashboard` | Full dashboard data |
| GET | `/api/dashboard/insights` | AI-style compliance insights |

## Core Formulas

- **Target Intensity (2025)**: 89.3368 gCO₂e/MJ (2% below 91.16 baseline)
- **Energy**: fuelConsumption × 41,000 MJ/t
- **Compliance Balance**: (Target − Actual) × Energy
- **Positive CB** = Surplus | **Negative CB** = Deficit
- **Penalty**: ~€2,400 per tonne VLSFO equivalent

## Screenshots

The UI features a maritime-themed glassmorphism design with:
- Animated radial compliance gauges
- Real-time insight panel
- Interactive pool simulator with transfer flow visualization
- Banking timeline with surplus/deficit indicators
- Responsive dark/light mode with gradient mesh backgrounds
