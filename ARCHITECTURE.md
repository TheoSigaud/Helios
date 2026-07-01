# Helios Architecture

## Overview
Helios is a modern financial and stock tracking web application. It allows users to monitor stocks, sectors, and custom watchlists, leveraging a high-performance technology stack for seamless interactions and real-time data visualization.

## Technology Stack
- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Component System:** [shadcn/ui](https://ui.shadcn.com/) & [Base UI](https://base-ui.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charting:** [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) (for advanced financial charts) and [Recharts](https://recharts.org/) (for simpler data visualizations)

## Directory Structure
The source code is primarily located in the `src` directory, utilizing Next.js path aliases (`@/` maps to `src/`).

```
src/
├── app/               # Next.js App Router (Pages & API routes)
│   ├── api/           # Backend API routes
│   ├── dashboard/     # Main dashboard view
│   ├── sectors/       # Market sectors view
│   ├── stock/         # Individual stock details
│   └── watchlist/     # User watchlists
├── components/        # React components (organized by feature/domain)
│   ├── charts/        # Reusable chart components
│   ├── dashboard/     # Dashboard-specific UI
│   ├── layout/        # App shell, navigation, headers
│   ├── stock/         # Stock-specific UI components
│   ├── ui/            # Generic/Reusable UI components (shadcn/base-ui)
│   └── watchlist/     # Watchlist-specific UI components
├── hooks/             # Custom React Hooks
│   └── use-stocks.ts  # Example: Data fetching and state management for stocks
└── lib/               # Utility functions and shared logic
    ├── analysis/      # Financial analysis and calculation helpers
    ├── api/           # API clients / fetch wrappers
    ├── data/          # Mock data or data transformation logic
    └── utils.ts       # General utilities (e.g., Tailwind class merging)
```

## Architectural Conventions

### 1. App Router & React Server Components
- By default, Next.js components are **Server Components**. Use them to fetch data directly, access backend resources, and reduce client-side bundle size.
- Use the `"use client"` directive only when necessary (e.g., for interactivity, hooks, or event listeners).
- Data fetching should ideally happen at the page level in `page.tsx` and be passed down to Client Components if needed.

### 2. Styling & Theming
- Tailwind CSS v4 is used for all utility-first styling.
- The `src/lib/utils.ts` typically exports a `cn` (classnames) function combining `clsx` and `tailwind-merge` to resolve Tailwind class conflicts.
- Dark mode is supported via `next-themes` and a custom theme provider (`theme-provider.tsx`).

### 3. Component Design
- Feature components belong in their respective feature folders (e.g., `src/components/stock/`).
- Generic, reusable components (like buttons, dialogs, inputs) go into `src/components/ui/` and are generally built with `shadcn/ui` primitives.

### 4. Data Visualization
- **Lightweight Charts** is preferred for candlestick charts, price history, and advanced financial charts where high performance on large datasets is required.
- **Recharts** is used for simpler data representations like bar charts, pie charts, and basic line charts.

## 5. Business Rules & Domain Logic

- **Financial Data Integration**: The application must explicitly integrate free APIs (e.g., Marketstack, Twelve Data, or Alpha Vantage) to fetch real-time and historical stock prices and trading volumes.
- **Stan Weinstein's Method**: The core analysis relies on technical indicators derived from Stan Weinstein's system:
  - **Phases**: Identification of market phases (1, 2, 3, 4).
  - **Moving Averages (MA)**: Calculation and display of 30, 50, and 200-period moving averages.
  - **Support & Resistance**: Automatic plotting of key support and resistance levels.
  - **Volume Analysis**: Consideration of trading volume spikes and trends.
  - **Relative Strength**: Calculation of the Mansfield Relative Strength (RS) index.
- **Dashboards & Rankings**:
  - **Top Promising Stocks**: A dashboard ranking the top ~50 stocks based on an "opportunity score" (number of satisfied Weinstein criteria).
  - **Top Sectors**: A similar ranking dashboard grouping and scoring by sector.
- **Stock Detailed View**: Each listed stock must display its current price, MAs, volume, Mansfield RS, and a mini historical chart mapping price and volume.
- **Filtering**: The application must provide filters for:
  - Investment Horizon (Short / Medium / Long term).
  - Moving Average Breakouts.
  - Sectors.
- **UI/UX Design**: The design should be clean, modern, responsive, and built upon accessible UI components.
