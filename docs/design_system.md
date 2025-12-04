# SilverWall Design System

> **Mercedes-AMG Petronas "Surgical Engineering" Design Language**  
> Elite pit wall interface — precision, clarity, zero compromise

---

## Design Philosophy

### Core Principles

1. **Surgical Precision**: Every pixel serves a purpose
2. **Information Density**: Maximum data, minimum chrome
3. **Cold Engineering**: Technical, not playful
4. **Elite Performance**: Pit wall, not gamer overlay

### What SilverWall Is NOT

❌ Gamer UI with neon lights  
❌ Glassmorphism or heavy gradients  
❌ Playful animations or bounce effects  
❌ Low information density  

### What SilverWall IS

✅ Matte carbon fiber aesthetic  
✅ Surgical lines and technical readability  
✅ High-contrast data visualization  
✅ Professional F1 pit wall interface  

---

## Color System

### Surface Tokens

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `surface-0` | `#050608` | `5, 6, 8` | Main background (matte carbon) |
| `surface-1` | `#121418` | `18, 20, 24` | Panel backgrounds |
| `surface-2` | `#1A1D23` | `26, 29, 35` | Elevated panels, hover states |
| `surface-3` | `#242831` | `36, 40, 49` | Active states, selected items |

### Border Tokens

| Token | Hex | RGBA | Usage |
|-------|-----|------|-------|
| `border-subtle` | `#2A2E35` | `rgba(42, 46, 53, 1.0)` | Default panel borders |
| `border-teal` | - | `rgba(0, 210, 190, 0.25)` | Teal-tinted borders |
| `border-teal-strong` | - | `rgba(0, 210, 190, 0.65)` | Active/focused borders |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `amg-teal` | `#00D2BE` | Primary highlight, track outline, active states |
| `amg-teal-dim` | `#008B7E` | Dimmed teal for secondary elements |
| `alert` | `#FF3B30` | Critical warnings, red flags |
| `sector-purple` | `#D042FF` | Purple sector highlights |
| `sector-green` | `#00FF88` | Green sector highlights |
| `sector-yellow` | `#FFD700` | Yellow sector highlights |

### Text Tokens

| Token | Hex | Opacity | Usage |
|-------|-----|---------|-------|
| `text-high` | `#E0E0E0` | 92% | Primary values, headings |
| `text-mid` | `#9CA3AF` | 70% | Labels, secondary text |
| `text-low` | `#6B7280` | 50% | Disabled, tertiary text |
| `text-teal` | `#00D2BE` | 100% | Highlighted values, links |

### Team Colors

| Team | Primary | Usage |
|------|---------|-------|
| Mercedes | `#00D2BE` | Car dot ring, team highlights |
| Red Bull | `#1E41FF` | Car dot ring |
| Ferrari | `#DC0000` | Car dot ring |
| McLaren | `#FF8700` | Car dot ring |
| Alpine | `#0090FF` | Car dot ring |
| Aston Martin | `#006F62` | Car dot ring |
| Williams | `#005AFF` | Car dot ring |
| Alfa Romeo | `#900000` | Car dot ring |
| Haas | `#FFFFFF` | Car dot ring (white) |
| AlphaTauri | `#2B4562` | Car dot ring |

---

## Typography

### Font Families

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace;
```

### Type Scale

| Element | Font | Weight | Size | Line Height | Transform |
|---------|------|--------|------|-------------|-----------|
| **H1 (Section)** | Inter | 600 | 18px | 24px | UPPERCASE, 0.08em |
| **H2 (Panel Title)** | Inter | 600 | 14px | 20px | UPPERCASE, 0.05em |
| **H3 (Subsection)** | Inter | 500 | 12px | 18px | UPPERCASE, 0.08em |
| **Body** | Inter | 400 | 13px | 20px | - |
| **Body Small** | Inter | 400 | 11px | 16px | - |
| **Label** | Inter | 500 | 11px | 16px | UPPERCASE, 0.08em |
| **Number Large** | JetBrains Mono | 500 | 24px | 32px | Tabular numerals |
| **Number Medium** | JetBrains Mono | 500 | 16px | 24px | Tabular numerals |
| **Number Small** | JetBrains Mono | 400 | 13px | 20px | Tabular numerals |
| **Code** | JetBrains Mono | 400 | 12px | 18px | - |

### OpenType Features

```css
font-feature-settings: 'tnum' 1; /* Tabular numerals for alignment */
font-variant-numeric: tabular-nums;
```

---

## Spacing System

### Grid Base: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing, icon padding |
| `space-2` | 8px | Default gap between elements |
| `space-3` | 12px | Panel padding (small) |
| `space-4` | 16px | Panel padding (medium) |
| `space-5` | 20px | Section spacing |
| `space-6` | 24px | Large section gaps |
| `space-8` | 32px | Extra large gaps |

---

## Component Styling

### Panels

```css
.panel {
  background: #121418; /* surface-1 */
  border: 1px solid rgba(0, 210, 190, 0.25); /* border-teal */
  border-radius: 8px;
  padding: 16px;
}

.panel-elevated {
  background: #1A1D23; /* surface-2 */
  border: 1px solid rgba(0, 210, 190, 0.35);
}
```

### Buttons

```css
.button-primary {
  background: #00D2BE; /* amg-teal */
  color: #050608;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 200ms ease;
}

.button-primary:hover {
  background: #00E6D0;
}

.button-ghost {
  background: transparent;
  color: #9CA3AF; /* text-mid */
  border: 1px solid #2A2E35; /* border-subtle */
  border-radius: 4px;
  padding: 8px 16px;
}

.button-ghost:hover {
  border-color: rgba(0, 210, 190, 0.5);
  color: #00D2BE;
}
```

### Tables / Leaderboard

```css
.table-row {
  border-bottom: 1px solid #2A2E35;
  padding: 8px 12px;
  transition: background 150ms ease;
}

.table-row:hover {
  background: rgba(0, 210, 190, 0.05);
}

.table-row.selected {
  background: rgba(0, 210, 190, 0.12);
  border-left: 2px solid #00D2BE;
}
```

### Progress Bars (Telemetry)

```css
.telemetry-bar {
  height: 24px;
  background: #1A1D23; /* surface-2 */
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.telemetry-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00D2BE 0%, #00A89A 100%);
  transition: width 100ms linear;
}

.telemetry-bar-brake {
  background: linear-gradient(90deg, #FF3B30 0%, #CC2F26 100%);
}
```

---

## Animation Guidelines

### Timing Functions

```css
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
```

### Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `duration-instant` | 100ms | Hover states, button feedback |
| `duration-fast` | 200ms | Panel transitions, fades |
| `duration-normal` | 300ms | Modal open/close |
| `duration-slow` | 500ms | Page transitions |

### Rules

1. **No Bounce**: Use linear or ease curves only
2. **No Overshoot**: Avoid spring animations
3. **Subtle Fades**: Opacity transitions for state changes
4. **Linear Motion**: Car interpolation uses linear lerp
5. **Instant Feedback**: Hover states respond in <100ms

---

## Layout Grid

### Main Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Header (64px)                                               │
├─────────────┬───────────────────────────────────┬───────────┤
│             │                                   │           │
│ Leaderboard │         Track Canvas              │  Driver   │
│  (280px)    │         (flex-grow)               │  Panel    │
│             │                                   │  (280px)  │
│             │                                   │           │
├─────────────┴───────────────────────────────────┴───────────┤
│  Telemetry Bars (120px)                                      │
├──────────────────────────────────────────────────────────────┤
│  Replay Controls (80px)                                      │
└──────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop | ≥1440px | 3-column grid |
| Tablet | 768px–1439px | Stack panels vertically |
| Mobile | <768px | Single column, simplified |

---

## Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        silverwall: {
          'surface-0': '#050608',
          'surface-1': '#121418',
          'surface-2': '#1A1D23',
          'surface-3': '#242831',
          'border': '#2A2E35',
          'teal': '#00D2BE',
          'teal-dim': '#008B7E',
          'text': '#E0E0E0',
          'text-mid': '#9CA3AF',
          'text-low': '#6B7280',
          'alert': '#FF3B30',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'panel': '8px',
      },
    },
  },
};
```

---

## Component Examples

### Panel Header

```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-silverwall-text-mid">
    Leaderboard
  </h2>
  <span className="text-[11px] font-mono text-silverwall-teal">
    LAP 23/53
  </span>
</div>
```

### Data Value

```tsx
<div className="flex flex-col gap-1">
  <span className="text-[11px] uppercase tracking-wide text-silverwall-text-mid">
    Speed
  </span>
  <span className="text-[24px] font-mono font-medium text-silverwall-text">
    312
  </span>
  <span className="text-[11px] text-silverwall-text-low">
    km/h
  </span>
</div>
```

### Status Badge

```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-silverwall-surface-2 border border-silverwall-teal/25">
  <div className="w-2 h-2 rounded-full bg-silverwall-teal animate-pulse" />
  <span className="text-[11px] font-medium uppercase tracking-wide text-silverwall-teal">
    Live
  </span>
</span>
```

---

## Accessibility

### Contrast Ratios

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| `text-high` on `surface-0` | 12.5:1 | AAA |
| `text-mid` on `surface-0` | 7.2:1 | AA |
| `amg-teal` on `surface-0` | 8.1:1 | AAA |

### Focus States

```css
.focusable:focus-visible {
  outline: 2px solid #00D2BE;
  outline-offset: 2px;
}
```

---

**SilverWall Design System** — *Precision engineering for the pit wall.*
