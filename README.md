# Trade Risk Engine

A trading account and risk-management dashboard built to track account performance, risk limits and position-level decision rules.

The project combines my interest in financial markets with full-stack software development and data-driven risk workflows.

## Core Features

- Trading account management
- Pre-funded and funded account tracking
- Trade journal and P&L history
- Daily loss-limit monitoring
- Dynamic risk-per-trade rules
- Account-level statistics
- Responsive dashboard
- Persistent data with Supabase/PostgreSQL

## Risk Model

### Pre-funded accounts

```text
Initial risk: 1.00%
After a win: 1.00%
After a loss: 0.75%
```

### Funded accounts

```text
Initial risk: 1.00%
Maximum risk: 1.25%
Win  -> +0.25%
Loss -> -0.25%
Minimum risk: 0.25%
```

Risk amount is derived from current account equity:

```text
Risk Amount = Current Balance × Risk Percentage
```

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion

### Data & State
- Supabase
- PostgreSQL
- TanStack React Query
- Zustand
- Zod
- React Hook Form

## Project Structure

```text
src/
├── components/      UI and domain components
├── lib/
│   ├── domain/      business rules
│   ├── engine/      risk logic
│   ├── repo/        data-access layer
│   └── validations/ validation schemas
├── pages/           application screens
├── store/           client state
└── hooks/           reusable hooks
```

## Development

```bash
npm install
npm run dev
```

For Supabase-backed functionality, configure the project environment variables locally.

## What I am exploring

This project is part of my work at the intersection of software engineering and trading: translating discretionary risk rules into explicit, testable software logic and building tools around trading workflows.

> Personal/educational software project. Not financial advice.
