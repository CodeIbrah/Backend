# Frontend Design System

## Color Palette
```
Background:    #0a0a0f (darkest), #12121a (surface), #1a1a2e (elevated)
Border:        #2a2a3e (subtle), #3a3a52 (medium)
Text:          #ffffff (primary), #a0a0b8 (secondary), #6a6a82 (muted)

Primary:       #6366f1 (indigo-500), #818cf8 (indigo-400), #4f46e5 (indigo-600)
Success:       #22c55e (green-500), #4ade80 (green-400)
Warning:       #f59e0b (amber-500), #fbbf24 (amber-400)
Error:         #ef4444 (red-500), #f87171 (red-400)
Info:          #3b82f6 (blue-500), #60a5fa (blue-400)
```

## Typography
```
Font: Inter, system-ui, -apple-system, sans-serif
Sizes: xs(12px), sm(14px), base(16px), lg(18px), xl(20px), 2xl(24px), 3xl(30px)
Weights: normal(400), medium(500), semibold(600), bold(700)
```

## Spacing Scale
```
0.5 = 2px, 1 = 4px, 1.5 = 6px, 2 = 8px, 2.5 = 10px, 3 = 12px
4 = 16px, 5 = 20px, 6 = 24px, 8 = 32px, 10 = 40px, 12 = 48px
16 = 64px, 20 = 80px, 24 = 96px
```

## Border Radius
```
sm: 6px, md: 8px, lg: 12px, xl: 16px, 2xl: 20px, full: 9999px
```

## Shadows
```
sm: 0 1px 2px rgba(0,0,0,0.3)
md: 0 4px 6px rgba(0,0,0,0.3)
lg: 0 10px 15px rgba(0,0,0,0.3)
xl: 0 20px 25px rgba(0,0,0,0.3)
```

## Component Patterns

### Card
```
bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6
hover:border-[#3a3a52] transition-colors
```

### Button Primary
```
bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg
font-medium transition-all duration-200 flex items-center gap-2
focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]
```

### Button Secondary
```
bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white px-4 py-2.5 rounded-lg
font-medium border border-[#2a2a3e] transition-all duration-200
```

### Input
```
bg-[#12121a] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white
placeholder:text-[#6a6a82] focus:outline-none focus:ring-2 focus:ring-indigo-500
focus:border-transparent transition-all duration-200 w-full
```

### Badge
```
inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
Success: bg-green-500/10 text-green-400 border border-green-500/20
Warning: bg-amber-500/10 text-amber-400 border border-amber-500/20
Error: bg-red-500/10 text-red-400 border border-red-500/20
Info: bg-blue-500/10 text-blue-400 border border-blue-500/20
```

### Table
```
w-full border-collapse
Header: bg-[#12121a] text-[#6a6a82] text-xs font-medium uppercase tracking-wider
Row: border-b border-[#2a2a3e]/50 hover:bg-[#1a1a2e]/50 transition-colors
Cell: px-4 py-3 text-sm
```

### Sidebar
```
width: 260px (expanded), 72px (collapsed)
bg-[#0a0a0f] border-r border-[#2a2a3e]
Active item: bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500
Inactive: text-[#6a6a82] hover:bg-[#1a1a2e] hover:text-white
```

## Layout
```
Main container: flex h-screen bg-[#0a0a0f]
Sidebar: fixed left, full height
Header: sticky top, full width minus sidebar
Content: flex-1 overflow-auto p-6
```

## Animations
```
Fade in: opacity 0→1, duration 200ms
Slide in: translateX -10px→0, duration 200ms
Scale: scale 0.95→1, duration 150ms
Spinner: rotate 360deg, duration 1000ms, linear infinite
```

## Responsive Breakpoints
```
sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
```

## Icon Library
Lucide React - all icons at 20px (nav), 16px (buttons), 24px (cards)
