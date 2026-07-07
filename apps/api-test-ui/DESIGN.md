# API Test UI — Design System

## Brand
Developer tool for API testing (like Postman but lightweight, in-browser). Dark-first, monospace-heavy, data-dense.

## Colors
- Background: `surface-950 (#020617)` / panels `surface-900 (#0f172a)`
- Cards/inputs: `surface-800 (#1e293b)`
- Borders: `surface-700 (#334155)` / hover `surface-600 (#475569)`
- Text: primary `surface-100 (#f1f5f9)`, secondary `surface-400 (#94a3b8)`
- Brand accent: `brand-500 (#6366f1)`
- Method badges: get `#22c55e`, post `#3b82f6`, patch/put `#f59e0b`, delete `#ef4444`
- Success: `#22c55e`, Warning: `#f59e0b`, Error: `#ef4444`

## Typography
- UI: Inter (400/500/600/700)
- Code: JetBrains Mono (400/500) — used for request/response bodies, JSON, URLs

## Spacing
- 4px base unit. Layout uses 16/24/32px gaps.
- Panel padding: 16px (p-4), Section headers 12px (p-3)

## Components
- Sidebar: 280px, collapsible, endpoint tree with method badges
- Request panel: top section, method selector + URL + tabs (Params/Headers/Body/Auth)
- Response panel: bottom section, status badge + size + time + tabs (Body/Headers/Cookies)
- LogsViewer: full-width panel, streaming log lines
- DocsViewer: MDX rendered with Mermaid diagrams
- Buttons: brand-500 filled primary, ghost secondary, danger for delete

## Icons
Lucide React icon set only. No emojis as icons.

## Motion
- Transitions: 150ms ease
- Sidebar collapse: width transition
- Tab changes: no animation
- Log lines: fade-in 200ms
