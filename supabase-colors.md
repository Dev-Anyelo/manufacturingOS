@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/*
 * ── MANUFACTURINGOS Brand Identity — Supabase-Inspired ──────────────
 * Dual light/dark SaaS for mechanic workshops (Panama / LATAM)
 * Brand: #34B27B (green)
 */

@theme inline {
  /* ── MANUFACTURINGOS Brand Colors ───────────────────────── */
  --color-brand: #34b27b;
  --color-brand-dark: #28906a;
  --color-brand-light: #4ecda4;

  /* ── Semantic Colors ───────────────────────────── */
  --color-success: #34b27b;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-critical: #dc2626;
  --color-info: #3b82f6;

  /* ── Typography ────────────────────────────────── */
  --font-display: var(--font-space-grotesk), sans-serif;
  --font-sans: var(--font-plus-jakarta), sans-serif;

  /* ── Font Sizes ────────────────────────────────── */
  --font-size-hero: 64px;
  --font-size-hero--line-height: 0.95;
  --font-size-hero--letter-spacing: -0.03em;

  --font-size-h1: 48px;
  --font-size-h1--line-height: 1;
  --font-size-h1--letter-spacing: -0.02em;

  --font-size-h2: 32px;
  --font-size-h2--line-height: 1.1;
  --font-size-h2--letter-spacing: -0.02em;

  --font-size-h3: 20px;
  --font-size-h3--line-height: 1.3;

  /* ── Border Radius ─────────────────────────────── */
  --radius: 0.5rem;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: calc(0.5rem + 4px);
  --radius-2xl: calc(0.5rem + 8px);
  --radius-3xl: calc(0.5rem + 12px);
  --radius-4xl: calc(0.5rem + 16px);

  /* ── Animations ────────────────────────────────── */
  --animate-fade-up: fade-up 0.4s ease both;
  --animate-fade-in: fade-in 0.3s ease both;
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

/*
 * Dynamic semantic tokens — use @theme (NOT inline) so Tailwind
 * generates var(--color-*) references that can be overridden at runtime.
 * Defaults = DARK mode.
 */
@theme {
  /* ── ShadCN semantic tokens (dark defaults) ──────── */
  --color-background: #171717;
  --color-foreground: #ededed;
  --color-card: #1c1c1c;
  --color-card-foreground: #ededed;
  --color-popover: #1c1c1c;
  --color-popover-foreground: #ededed;
  --color-primary: #34b27b;
  --color-primary-foreground: #ffffff;
  --color-secondary: #262626;
  --color-secondary-foreground: #ededed;
  --color-muted: #262626;
  --color-muted-foreground: #a1a1a1;
  --color-accent: #262626;
  --color-accent-foreground: #ededed;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-border: #2e2e2e;
  --color-input: #2e2e2e;
  --color-ring: #34b27b;

  /* ── Sidebar ShadCN tokens ─────────────────────── */
  --color-sidebar: #1c1c1c;
  --color-sidebar-foreground: #ededed;
  --color-sidebar-primary: #34b27b;
  --color-sidebar-primary-foreground: #ffffff;
  --color-sidebar-accent: #262626;
  --color-sidebar-accent-foreground: #ededed;
  --color-sidebar-border: #2e2e2e;
  --color-sidebar-ring: #34b27b;

  /* ── Shadows (Premium Multi-layered) ───────────── */
  --shadow-brand-glow: 0 0 40px rgba(52, 178, 123, 0.12);
  --shadow-card: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-elevated:
    0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
  --shadow-float:
    0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5);
}

/*
 * ── Light mode overrides ───────────────────────────
 * Applied when html does NOT have class="dark"
 */
:root:not(.dark) {
  --color-background: #f8f9fa;
  --color-foreground: #171717;
  --color-card: #ffffff;
  --color-card-foreground: #171717;
  --color-popover: #ffffff;
  --color-popover-foreground: #171717;
  --color-primary: #34b27b;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f1f3f5;
  --color-secondary-foreground: #171717;
  --color-muted: #f1f3f5;
  --color-muted-foreground: #6b7280;
  --color-accent: #f1f3f5;
  --color-accent-foreground: #171717;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-border: #e5e7eb;
  --color-input: #e5e7eb;
  --color-ring: #34b27b;

  /* Sidebar — light */
  --color-sidebar: #ffffff;
  --color-sidebar-foreground: #171717;
  --color-sidebar-primary: #34b27b;
  --color-sidebar-primary-foreground: #ffffff;
  --color-sidebar-accent: #f1f3f5;
  --color-sidebar-accent-foreground: #171717;
  --color-sidebar-border: #e5e7eb;
  --color-sidebar-ring: #34b27b;

  --shadow-brand-glow: 0 0 40px rgba(52, 178, 123, 0.08);
  --shadow-card: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* very subtle */
  --shadow-elevated:
    0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-float:
    0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}

/* ── Base layer ───────────────────────────────────── */
@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1,
  h2,
  h3 {
    font-family: var(--font-display);
  }

  /* Selection */
  ::selection {
    background-color: var(--color-brand);
    color: white;
  }

  /* Focus ring */
  :focus-visible {
    outline: 2px solid var(--color-ring);
    outline-offset: 2px;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 9999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-muted-foreground);
  }
}

/* ── Component layer ──────────────────────────────── */
@layer components {
  /* ── MANUFACTURINGOS status badges ─────────────────────── */
  .badge-pending {
    @apply bg-muted text-muted-foreground border border-border text-xs font-medium font-sans px-2.5 py-0.5 rounded-full;
  }
  .badge-in-progress {
    @apply bg-warning/10 text-warning border border-warning/20 text-xs font-medium font-sans px-2.5 py-0.5 rounded-full;
  }
  .badge-done {
    @apply bg-brand/10 text-brand border border-brand/20 text-xs font-medium font-sans px-2.5 py-0.5 rounded-full;
  }
  .badge-delivered {
    @apply bg-brand/5 text-brand-dark border border-brand/15 text-xs font-medium font-sans px-2.5 py-0.5 rounded-full;
  }
  .badge-cancelled {
    @apply bg-muted text-muted-foreground/60 border border-border text-xs font-medium font-sans px-2.5 py-0.5 rounded-full;
  }

  /* ── Page header eyebrow ──────────────────────── */
  .eyebrow {
    @apply text-[11px] font-medium tracking-[0.2em] uppercase text-brand font-sans;
  }

  /* ── Stagger delays ────────────────────────────── */
  .stagger-1 {
    animation-delay: 50ms;
  }
  .stagger-2 {
    animation-delay: 100ms;
  }
  .stagger-3 {
    animation-delay: 150ms;
  }
  .stagger-4 {
    animation-delay: 200ms;
  }
  .stagger-5 {
    animation-delay: 250ms;
  }
  .stagger-6 {
    animation-delay: 300ms;
  }
  .stagger-7 {
    animation-delay: 350ms;
  }
  .stagger-8 {
    animation-delay: 400ms;
  }

  /* ── Spinning animation ─────────────────────── */
  .animate-spin-slow {
    animation: spin 1s linear infinite;
  }

  /* ── Glass card effect ─────────────────────── */
  .glass-card {
    @apply bg-card/80 backdrop-blur-sm border-border;
  }

  /* ── Toolbar container ─────────────────────── */
  .toolbar {
    @apply flex flex-wrap items-center gap-3 p-3 bg-card rounded-lg border border-border;
  }

  /* ── Section container ─────────────────────── */
  .section-container {
    @apply bg-card rounded-xl border border-border overflow-hidden;
  }

  /* ── Stat card ─────────────────────────────── */
  .stat-card {
    @apply bg-card rounded-xl border border-border p-5 md:p-6;
  }

  /* ── Metric value ──────────────────────────── */
  .metric-value {
    @apply font-display font-bold text-2xl text-foreground tabular-nums tracking-tight;
  }

  /* ── Subtle divider ────────────────────────── */
  .divider {
    @apply border-t border-border;
  }

  /* ── Interactive row ───────────────────────── */
  .interactive-row {
    @apply transition-colors hover:bg-muted/50 cursor-pointer;
  }

  /* ── Kbd ────────────────────────────────────── */
  .kbd {
    @apply inline-flex items-center justify-center h-5 px-1.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground;
  }

  /* ── Shadow utilities ───────────────────────── */
  .shadow-card {
    box-shadow: var(--shadow-card);
  }
  .shadow-elevated {
    box-shadow: var(--shadow-elevated);
  }

  /* ── Animation utilities ────────────────────── */
  .animate-fade-in {
    animation: fade-in 0.3s ease-out both;
  }
  .animate-fade-up {
    animation: fade-up 0.4s ease-out both;
  }
}