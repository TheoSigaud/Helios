<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Helios Codebase Guidelines

When working on the **Helios** codebase, AI agents must adhere to the following rules:

1. **Architecture Context**: Always refer to `ARCHITECTURE.md` to understand the project structure, tech stack, and responsibilities of each directory.
2. **Next.js App Router**: Use `src/app` for all routing. Default to React Server Components (RSC) unless client-side interactivity (`"use client"`) is explicitly required (e.g. for hooks or event handlers).
3. **Path Aliases**: Use `@/` imports for everything inside the `src` directory (e.g., `import { cn } from "@/lib/utils"`). Do not use relative paths like `../../lib/utils`.
4. **UI & Styling**: 
   - Use Tailwind CSS v4 for all styling.
   - Use existing `shadcn/ui` or Base UI components from `src/components/ui/` before creating custom ones.
   - Use `lucide-react` for all icons.
5. **Data Visualization**:
   - Use `lightweight-charts` for complex financial graphs (candlestick, volume).
   - Use `recharts` for simpler, standard charts (bar, pie).
6. **Code Organization**:
   - Place domain-specific components in their respective folders under `src/components/` (e.g., `dashboard/`, `stock/`).
   - Extract complex data logic to `src/lib/` or custom hooks in `src/hooks/`.
7. **Business Rules**:
   - Strictly follow the financial logic, API integration rules, and dashboard specifications detailed in the **Business Rules & Domain Logic** section of `ARCHITECTURE.md`.
