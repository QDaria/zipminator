# Stack Rules — Next.js 16 + shadcn/ui CLI v4 + Tailwind v4

## Next.js 16 (Turbopack default)
- Caching is EXPLICIT: use `"use cache"` directive, not implicit fetch caching
- `params` and `searchParams` are async — always `await props.params`
- Use `proxy.ts` for middleware (not `middleware.ts` which is deprecated)
- `next typegen` for type-safe route params — run after adding new routes
- Never use `experimental.ppr` — use `cacheComponents: true` in next.config.ts
- React Compiler is stable: `reactCompiler: true` in next.config.ts — enables auto-memoization
- Node.js 20.9+ required

## shadcn/ui CLI v4
- Components live in src/components/ui/ — never move them
- Import: `import { Button } from "@/components/ui/button"` (not from shadcn directly)
- Add components: `npx shadcn@latest add <component>` (not pnpm dlx for one-offs)
- After Tailwind v4 migration: use `npx shadcn@latest migrate radix`
- New 2026 components available: Spinner, Kbd, Field, Item, Empty, Input Group
- Use Field component for ALL form fields (replaces custom form wrappers)

## Tailwind v4
- Config is CSS-first via `@theme` directive in globals.css — NO tailwind.config.js
- Colors use OKLCH: `oklch(0.7 0.2 240)` not hex/HSL in theme
- `tw-animate-css` replaces `tailwindcss-animate`
- Custom variant for dark mode: `@custom-variant dark (&:is(.dark *))`
- No `forwardRef` — React 19 uses `React.ComponentProps<"div">` pattern

## QDaria Design System (Zipminator)
```css
/* Quantum color tokens */
--quantum-cyan:    oklch(0.82 0.15 200);   /* #22D3EE */
--quantum-amber:   oklch(0.77 0.18 85);    /* #F59E0B */
--quantum-rose:    oklch(0.72 0.19 10);    /* #FB7185 */
--quantum-emerald: oklch(0.79 0.17 155);   /* #34D399 */
--quantum-violet:  oklch(0.72 0.17 290);   /* #A78BFA */
--bg-primary:      oklch(0.10 0.02 250);   /* #020817 */
```

- Display font: Fraunces (serif, optical-size aware)
- Code font: JetBrains Mono
- Body font: DM Sans
- NEVER use: Inter, Roboto, Arial, purple gradients, centered everything layouts

## TypeScript
- Strict mode always (`"strict": true` in tsconfig)
- No `any` — use `unknown` + type narrowing
- Interface over type for objects with methods
- Type over interface for unions/primitives/mapped types
- Zod for runtime validation at API boundaries

## Component Patterns
```tsx
// Named export, not default
export const MyComponent = ({ prop }: MyComponentProps) => { ... }

// Props interface
interface MyComponentProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Async Server Component
export default async function Page(props: PageProps<'/quantum/[id]'>) {
  const { id } = await props.params;
  ...
}
```
