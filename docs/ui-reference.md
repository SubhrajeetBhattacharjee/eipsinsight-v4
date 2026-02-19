# EIPsInsight — UI Reference

Design tokens, typography, colors, and component patterns used across the app.

---

## Typography

### Font Families

| Token | Font | Weights | Usage |
|-------|------|---------|-------|
| `--font-space-grotesk` | Space Grotesk (Google Font) | 300, 400, 500, 600, 700 | Body, UI, nav |
| `--font-libre-baskerville` | Libre Baskerville (Google Font) | 400, 700 | Titles, headings (`.dec-title`) |

**Default body:** `font-family: var(--font-space-grotesk)`

**Decorative titles:** Add `.dec-title` for Libre Baskerville with `line-height: 1.15`.

### Typography Hierarchy

Sizes should flow hierarchically. Avoid jumps that look odd (e.g. `text-4xl` next to `text-[10px]`). Use consistent steps.

| Level | Class | Size | Usage |
|-------|-------|------|-------|
| **H1 — Main page title** | `dec-title bg-linear-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl` | 30–36px | Page headers (EIPs, Dashboard) |
| **H1 subtitle** | `mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400` | 14px | One line under main title |
| **H2 — Section title** | `dec-title text-xl font-semibold tracking-tight text-slate-200 sm:text-2xl` | 20–24px | Section headers (Protocol Bento, etc.) |
| **H2 subtitle** | `mt-0.5 text-sm text-slate-500` | 14px | Section descriptions |
| **H3 — Card/subsection** | `text-xs font-semibold uppercase tracking-wider text-slate-500` | 12px | DashCard titles, table headers |
| **Body** | `text-sm` | 14px | Default body copy |
| **Small** | `text-xs` | 12px | Labels, badges |
| **Tiny** | `text-[10px]`–`text-[11px]` | 10–11px | Table cells, micro labels |

### Main Header Pattern

Use this pattern for primary page headers (e.g. `/`, `/dashboard`):

```tsx
<motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
  <h1 className="dec-title bg-linear-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
    Page Title
  </h1>
  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
    Description. Powered by <span className="text-slate-300">EIPsInsight</span>.
  </p>
</motion.header>
```

### Font Sizes (Reference)

| Class | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Tiny labels, table cells |
| `text-[11px]` | 11px | Section labels, uppercase |
| `text-xs` | 12px | Small labels, badges |
| `text-sm` | 14px | Body, nav items, buttons |
| `text-base` | 16px | Default body, search input |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Section headings |
| `text-2xl` | 24px | Large section titles |
| `text-3xl` | 30px | Page titles |
| `text-4xl` | 36px | Hero / large display |

### Font Weights

| Class | Weight |
|-------|--------|
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

---

## Colors

### Primary Palette (Dark Theme)

App uses a dark theme with cyan/emerald accents.

| Role | Tailwind | Hex (approx) | Usage |
|------|----------|--------------|-------|
| **Background** | `slate-950`, `slate-900` | `#020617`, `#0f172a` | Page bg, cards |
| **Foreground** | `white`, `slate-100`, `slate-200` | — | Primary text |
| **Muted** | `slate-400`, `slate-500` | — | Secondary text |
| **Accent** | `cyan-300`–`cyan-500` | `#22d3ee` | Links, active states, borders |
| **Secondary accent** | `emerald-300`–`emerald-500` | `#34d399` | Highlights, CTAs |
| **Border** | `slate-700/50`, `cyan-400/20` | — | Dividers, card borders |

### Gradient Accents

```
from-emerald-500/10 via-cyan-500/10 to-blue-500/10   — Card hover, CTA bg
from-emerald-500 to-cyan-500                         — Primary CTA button
from-emerald-300 via-cyan-300 to-emerald-300         — Text gradient (bg-clip-text)
```

### Status / Semantic Colors

| Status | Tailwind | Hex (charts) | Usage |
|--------|----------|--------------|-------|
| Draft | `slate-500/20`, `text-slate-300` | `#64748b` | EIP status |
| Review | `amber-500/20`, `text-amber-300` | `#f59e0b` | EIP status |
| Last Call | `orange-500/20`, `text-orange-300` | `#f97316` | EIP status |
| Final | `emerald-500/20`, `text-emerald-300` | `#10b981` | EIP status |
| Living | `cyan-500/20`, `text-cyan-300` | `#22d3ee` | EIP status |
| Stagnant | `gray-500/20`, `text-gray-400` | `#6b7280` | EIP status |
| Withdrawn | `red-500/20`, `text-red-300` | `#ef4444` | EIP status |
| Error / Destructive | `rose-400`, `red-500` | — | Errors, delete |

### Persona Colors

| Persona | Color | Tailwind |
|---------|-------|----------|
| Developer | Emerald | `emerald-500/20`, `text-emerald-400` |
| Editor | Blue | `blue-500/20`, `text-blue-400` |
| Researcher | Purple | `purple-500/20`, `text-purple-400` |
| Builder | Orange | `orange-500/20`, `text-orange-400` |
| Enterprise | Cyan | `cyan-500/20`, `text-cyan-400` |
| Newcomer | Pink | `pink-500/20`, `text-pink-400` |

---

## Spacing & Sizing

### Common Values

| Token | Value | Usage |
|-------|-------|-------|
| Navbar height | `h-14` (56px) | Header, sidebar header |
| Sidebar collapsed | `w-11` (44px) | Icon-only nav |
| Button default | `h-9` (36px) | Buttons |
| Button sm | `h-8` (32px) | Small buttons |
| Button lg | `h-10` (40px) | Large buttons |
| Icon default | `h-4 w-4`, `h-5 w-5` | 16px, 20px icons |
| Container | `max-w-7xl`, `px-4 sm:px-6` | Main content |

### Border Radius

| Class | Value |
|-------|-------|
| `rounded-md` | 6px (default for buttons, inputs) |
| `rounded-lg` | 8px (cards, nav items) |
| `rounded-xl` | 12px (large cards) |
| `--radius` | 0.625rem (10px) — CSS variable |

---

## Shadows & Effects

| Usage | Class / Value |
|-------|---------------|
| Active nav glow | `shadow-[0_0_12px_rgba(34,211,238,0.15)]` |
| Card hover | `shadow-[0_0_15px_rgba(34,211,238,0.1)]` |
| Strong active | `shadow-[0_0_20px_rgba(34,211,238,0.2)]` |
| Icon glow | `drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]` |
| Backdrop | `backdrop-blur-xl`, `backdrop-blur-sm` |

---

## Animation

| Token | Value |
|-------|-------|
| `--expo-in` | `cubic-bezier(0.95, 0.05, 0.795, 0.035)` |
| `--expo-out` | `cubic-bezier(0.19, 1, 0.22, 1)` |
| Transition | `transition-all duration-300` (common) |
| Hover translate | `hover:translate-x-0.5` |

---

## Component Patterns

### Buttons

- **Primary CTA:** `bg-linear-to-r from-emerald-500 to-cyan-500 text-black`
- **Secondary:** `bg-cyan-500/20 border border-cyan-500/40`
- **Ghost:** `text-slate-300 hover:text-white`

### Inputs

- **Default:** `h-9 rounded-md px-3 py-1 text-sm bg-slate-800/50 border-slate-700/50`
- **Focus:** `focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30`

### Cards

- **Default:** `rounded-xl border border-slate-700/50 bg-slate-900/40`
- **Hover:** `hover:border-cyan-500/40`

### Collapsible Page Header

For pages with an expandable info panel (e.g. `/`, `/upgrade`):

- H1: `dec-title bg-linear-to-br from-emerald-300 via-slate-100 to-cyan-200 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl`
- Subtitle: `mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400`
- Info button: rounded-lg border, cyan hover
- Collapsible panel: `rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/60 via-slate-900/50 to-slate-900/60`
- Info card titles: `text-sm font-semibold text-slate-200`
- Info card descriptions: `text-sm text-slate-400`

### FAQs Section

- Layout: two-column (sticky sidebar + accordion) on md+
- H2: `dec-title text-xl font-semibold tracking-tight text-slate-200 sm:text-2xl`
- H2 subtitle: `mt-0.5 text-sm text-slate-500`
- Accordion items: `rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/60 via-slate-900/50 to-slate-900/60`
- Trigger: icon + question in `text-base font-semibold text-slate-200`
- Content: `text-sm leading-relaxed text-slate-300`

### Lifecycle Funnel (Pie Chart)

- Use pie chart with status colors from Status / Semantic Colors (hex column)
- Donut style: `innerRadius={40}` `outerRadius={70}`
- Legend: status dot + name + count + percentage

### Scrollbar

- **Track:** `scrollbar-track-transparent` or `scrollbar-track-slate-900/50`
- **Thumb:** `scrollbar-thumb-cyan-500/20` or `scrollbar-thumb-cyan-500/30`

---

## CSS Variables (globals.css)

Theme tokens in `:root` and `.dark`:

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--input`, `--ring`
- `--destructive`
- `--radius`, `--radius-sm`, `--radius-md`, `--radius-lg`, etc.
- `--sidebar-*`, `--chart-1`–`--chart-5`
