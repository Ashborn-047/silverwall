# SilverWall Design System — AMG Pit Standard

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Purpose**: Engineering-grade Formula 1 telemetry design language

---

## 🧊 Design Philosophy

SilperWall maintains a **cold, precise, elite aesthetic** inspired by:
- Mercedes-AMG pit wall engineering displays
- Bloomberg Terminal data density
- F1 timing screens surgical precision

### Core Principles
1. **Surgical Engineering** — No gaming aesthetics, no marketing hype
2. **Data First** — Typography weight over glow effects
3. **Tactical Clarity** — High legibility, minimal decoration
4. **Exclusive Access** — Feels like restricted engineering software

### Design Psychology Keywords
- Surgical
- Tactical
- Analytical
- Elite
- Carbon-fiber precision

---

## 🎨 Color Palette (Tokens)

### Background Layers
| Token | Hex | Usage |
|-------|-----|-------|
| `SW-BG-Carbon-100` | `#050608` | Primary background (deepest) |
| `SW-BG-Carbon-200` | `#0A0C10` | Panel backgrounds (header, sidebar) |
| `SW-BG-Carbon-300` | `#1A1C20` | Elevated surfaces (cards, modals) |

### Primary Accent
| Token | Value | Usage |
|-------|-------|-------|
| `SW-Primary-Teal` | `#00D2BE` | Active data, highlights, CTAs |
| `SW-Primary-Teal-Dim` | `rgba(0, 210, 190, 0.5)` | Hover states, secondary emphasis |
| `SW-Primary-Teal-Glow` | `rgba(0, 210, 190, 0.15)` | Subtle backgrounds, borders |

### Text Hierarchy
| Token | Hex | Usage |
|-------|-----|-------|
| `SW-Text-High` | `#E0E0E0` | Primary text, driver names |
| `SW-Text-Mid` | `#9CA3AF` | Secondary text, labels |
| `SW-Text-Dim` | `#555555` | Tertiary text, metadata |
| `SW-Text-Dark` | `#333333` | Disabled text, separators |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `SW-Border-Weak` | `rgba(0, 210, 190, 0.15)` | Panel dividers, subtle lines |
| `SW-Border-Medium` | `rgba(0, 210, 190, 0.3)` | Focused elements, highlights |
| `SW-Border-Strong` | `rgba(0, 210, 190, 0.5)` | Active borders, emphasis |

### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `SW-Alert-Red` | `#FF3B30` | Errors, brake telemetry |
| `SW-Success-Green` | `#10B981` | Success states, DRS open |
| `SW-Warning-Amber` | `#F59E0B` | Warnings, yellow flags |
| `SW-Info-Blue` | `#3B82F6` | Information, blue flags |

### Sector Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `SW-Sector-Purple` | `#D042FF` | Sector 1 timing |
| `SW-Sector-Green` | `#00D2BE` | Sector 2 timing (personal best) |
| `SW-Sector-Yellow` | `#FFD700` | Sector 3 timing (overall best) |

### Team Colors
| Team | Hex |
|------|-----|
| Mercedes | `#00D2BE` |
| Red Bull Racing | `#3671C6` |
| Ferrari | `#DC0000` |
| McLaren | `#FF8700` |
| Aston Martin | `#006F62` |
| Alpine | `#0090FF` |
| Williams | `#005AFF` |
| AlphaTauri | `#2B4562` |
| Alfa Romeo | `#900000` |
| Haas | `#FFFFFF` |

---

## 🔠 Typography Scale

### Font Families
**SANS**: Inter (UI elements, headers, body text)  
**DATA**: JetBrains Mono (telemetry, lap times, tabular data)

### Type Specimens

#### T-XLHEAD
- **Size**: 42px
- **Weight**: Semibold (600)
- **Line Height**: 1.1
- **Letter Spacing**: +2%
- **Family**: Inter
- **Usage**: Hero headlines, main titles

#### T-HEAD
- **Size**: 24px
- **Weight**: Semibold (600)
- **Line Height**: 1.2
- **Letter Spacing**: +2%
- **Family**: Inter
- **Usage**: Section headers, panel titles

#### T-SUBHEAD
- **Size**: 18px
- **Weight**: Medium (500)
- **Line Height**: 1.3
- **Letter Spacing**: +1%
- **Family**: Inter
- **Usage**: Subsection headers

#### T-BODY
- **Size**: 14px
- **Weight**: Regular (400)
- **Line Height**: 1.5
- **Letter Spacing**: 0%
- **Family**: Inter
- **Usage**: Body text, descriptions

#### T-LABEL
- **Size**: 12px
- **Weight**: Medium (500)
- **Line Height**: 1.4
- **Letter Spacing**: +4%
- **Family**: Inter
- **Text Transform**: UPPERCASE
- **Usage**: Field labels, metadata tags

#### T-DATA
- **Size**: 14px
- **Weight**: Regular (400)
- **Line Height**: 1.5
- **Letter Spacing**: 0%
- **Family**: JetBrains Mono
- **Font Variant**: Tabular Numerals
- **Usage**: Telemetry values, lap times

#### T-DATA-LARGE
- **Size**: 28px
- **Weight**: Bold (700)
- **Line Height**: 1.2
- **Letter Spacing**: 0%
- **Family**: JetBrains Mono
- **Font Variant**: Tabular Numerals
- **Usage**: Large telemetry displays (speed, gear)

#### T-TINY
- **Size**: 10px
- **Weight**: Medium (500)
- **Line Height**: 1.4
- **Letter Spacing**: +4%
- **Family**: JetBrains Mono
- **Opacity**: 65%
- **Text Transform**: UPPERCASE
- **Usage**: Micro labels, status indicators

---

## 📏 Spacing & Layout Tokens

### Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| `SP-XS` | 4px | Minimal gaps, icon spacing |
| `SP-S` | 8px | Compact padding, small gaps |
| `SP-M` | 16px | Default padding, standard gaps |
| `SP-L` | 24px | Large padding, section spacing |
| `SP-XL` | 40px | Extra large spacing, hero sections |
| `SP-XXL` | 64px | Maximum spacing, page margins |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `RADIUS-NONE` | 0px | Sharp corners (default) |
| `RADIUS-SM` | 2px | Telemetry bars, small elements |
| `RADIUS-DEFAULT` | 4px | Buttons, cards, panels |
| `RADIUS-MD` | 6px | Larger cards |
| `RADIUS-LG` | 8px | Modals, overlays |

### Layout Dimensions
| Token | Value | Usage |
|-------|-------|-------|
| `LEADERBOARD-WIDTH` | 280px | Left panel width |
| `TELEMETRY-PANEL-WIDTH` | 320px | Right panel width |
| `HEADER-HEIGHT` | 64px | Top navigation height |
| `FOOTER-HEIGHT` | 48px | Bottom telemetry bar height |
| `MAX-CONTENT-WIDTH` | 1920px | Maximum content container |

---

## 🏎 Track Visualization Specification

### Track Stroke Style
```css
stroke: #00D2BE;
stroke-width: 14px;
stroke-linecap: round;
stroke-linejoin: round;
opacity: 0.65; /* inactive sections */
opacity: 1.0;  /* active sections */
```

### Track States
- **Inactive**: `opacity: 0.65`, `stroke: #333333`
- **Active**: `opacity: 1.0`, `stroke: #00D2BE`
- **Highlighted**: `opacity: 1.0`, `stroke: #00D2BE`, `drop-shadow: 0 0 12px rgba(0,210,190,0.4)`

### DRS Zone Markers
```css
stroke: #9CA3AF;
stroke-width: 2px;
stroke-dasharray: 4 3;
opacity: 0.3;
```

---

## 🚗 Car Dot & Label Rules

### Car Marker Specifications
| Property | Value |
|----------|-------|
| Dot Radius | 11px (leader), 5px (others) |
| Stroke Width | 3px |
| Fill Color | Team color (from tokens) |
| Label Offset | 18–26px from dot center |
| Label Font | JetBrains Mono, 12px, Bold |

### Car Trail Effect
| Property | Value |
|----------|-------|
| Trail Length | 30–40px |
| Trail Width | 1.5px |
| Trail Color | Team color |
| Trail Opacity | 0.4 |
| Trail Linecap | round |

### Car States
- **Leader**: Larger dot (11px), pulsing animation
- **Standard**: 5px radius, static
- **Selected**: Glow effect, `drop-shadow: 0 0 8px [team-color]`

---

## 📊 Telemetry Bar Specification

### Horizontal Bar (Speed, Throttle, Brake)
| Property | Value |
|----------|-------|
| Height | 10px |
| Corner Radius | 2px |
| Background | `#333333` (opacity 30%) |
| Fill Color | `#00D2BE` (throttle), `#FF3B30` (brake) |
| Transition | 300ms cubic-bezier(0.4, 0, 0.2, 1) |

### Bottom Telemetry Bar (Multi-driver)
| Property | Value |
|----------|-------|
| Bar Height | 6px (small variant) |
| Bar Width | 3px each (10 bars total) |
| Bar Gap | 2px between bars |
| Dot Radius | 1.5px (driver color indicator) |
| Spacing | 10px between driver sections |

### Format Example
```
● HAM | ███████░░░  98%
  ^     ^         ^
  |     |         percentage (T-TINY)
  |     bars (10 segments)
  team-colored dot
```

---

## 🎬 Animation Tokens

### Duration
| Token | Value | Usage |
|-------|-------|-------|
| `DURATION-FAST` | 150ms | Hover states, quick transitions |
| `DURATION-DEFAULT` | 300ms | Standard transitions |
| `DURATION-SLOW` | 500ms | Page transitions, complex animations |

### Easing
| Token | Value | Usage |
|-------|-------|-------|
| `EASING-DEFAULT` | cubic-bezier(0.4, 0, 0.2, 1) | Standard easing |
| `EASING-SMOOTH` | cubic-bezier(0.4, 0, 0.6, 1) | Smooth, gradual |

---

## 🧩 Component Patterns

### Leaderboard Row
- **Height**: Condensed (32px padding: `py-2`)
- **Gap Highlight**: ≤ 0.6s gets `ring-1 ring-[#00D2BE]/30`
- **Typography**: JetBrains Mono, 13px (driver), 11px (gap)
- **Team Bar**: 3px width, 20px height
- **Hover**: `bg-[#00D2BE]/5`

### Telemetry Panel
- **Background**: `SW-BG-Carbon-200`
- **Border**: `SW-Border-Weak` (left/right)
- **Padding**: `SP-M` (16px)
- **Gap Between Items**: `SP-L` (24px)

### Top Header Bar
- **Height**: 64px
- **Background**: `SW-BG-Carbon-200`
- **Border Bottom**: `SW-Border-Weak`
- **Padding**: `SP-M` horizontal
- **Typography**: T-LABEL for labels, T-DATA for values

### Status Badges
- **Height**: 24px
- **Padding**: `SP-S` horizontal
- **Border**: 1px solid (20% opacity of status color)
- **Background**: Status color at 10% opacity
- **Typography**: T-TINY
- **Border Radius**: `RADIUS-SM`

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 768px | Stack panels vertically |
| Tablet | 768px – 1024px | 2-column (hide leaderboard) |
| Laptop | 1024px – 1440px | 3-column full layout |
| Desktop | > 1440px | 3-column with max-width constraint |

---

## 🚫 Anti-Patterns (DO NOT USE)

### Forbidden Styles
- ❌ Gradients on text or backgrounds
- ❌ Glowing neon effects (except subtle track glow)
- ❌ Rounded pill buttons
- ❌ Thick borders (> 2px)
- ❌ Bright saturated colors outside team colors
- ❌ Comic Sans, Papyrus, or decorative fonts
- ❌ Emoji in data displays
- ❌ Animated background patterns

### Forbidden Design Language
- ❌ "Gaming" aesthetics (RGB glow, neon)
- ❌ "Broadcast TV" graphics (flashy animations)
- ❌ "Marketing" hype (exclamation marks, ALL CAPS everywhere)
- ❌ Fan-focused branding (team logos everywhere)

---

## 🔗 Integration Notes

### CSS Variables
All tokens can be imported as CSS custom properties:
```css
:root {
  --sw-bg-carbon-100: #050608;
  --sw-primary-teal: #00D2BE;
  --sp-m: 16px;
}
```

### Tailwind Integration
Map tokens to Tailwind config:
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'sw-carbon': '#050608',
        'sw-teal': '#00D2BE',
      },
      spacing: {
        'sp-xs': '4px',
        'sp-m': '16px',
      }
    }
  }
}
```

### Figma Plugin Support
Import `/design-tokens.json` using:
- **Tokens Studio** (recommended)
- **Design Tokens** plugin
- **Style Dictionary**

---

## 📄 Version History

**v1.0.0** (December 2024)
- Initial design system specification
- Full token library
- Component patterns documented
- Track and telemetry specifications

---

## 📞 Design System Governance

**Owned by**: SilverWall Engineering Team  
**Review Cycle**: Quarterly  
**Change Requests**: Submit via GitHub issues  
**Breaking Changes**: Require major version bump

---

**END OF DESIGN SYSTEM DOCUMENTATION**
