# SilverWall UI Mockup Specification

> **Visual specification for Mercedes-AMG Petronas pit wall interface**

---

## Full Interface Layout (1920×1080)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  SILVERWALL │ MONZA GP │ LAP 23/53 │ 00:34:12                    ● LIVE          │ ← Header (64px)
│  #00D2BE      #9CA3AF    #E0E0E0     font-mono                   #00D2BE         │
├────────────────┬─────────────────────────────────────────┬───────────────────────┤
│                │                                         │                       │
│  LEADERBOARD   │           TRACK CANVAS                  │    DRIVER PANEL       │
│  280px width   │           flex-grow                     │    280px width        │
│                │                                         │                       │
│  P  NUM  GAP   │      ┌───────────────────────┐          │  #44 HAM              │
│  ─────────────│      │                       │          │  Mercedes             │
│  1  HAM  ---   │      │   ╔═══════════╗      │          │  ─────────────────    │
│  2  VER  +2.3s │      │   ║           ║      │          │                       │
│  3  LEC  +5.1s │      │   ║   MONZA   ║      │          │  SPEED                │
│  4  SAI  +8.7s │      │   ║           ║      │          │  312                  │
│  5  NOR +12.4s │      │   ╚═══════════╝      │          │  km/h                 │
│  6  PER +15.8s │      │                       │          │  (24px mono)          │
│  7  RUS +19.2s │      │   ●HAM  ●VER  ●LEC   │          │                       │
│  8  ALO +23.5s │      │                       │          │  GEAR: 7              │
│  9  OCO +27.1s │      │   ●SAI      ●NOR     │          │  DRS: ON (#00D2BE)    │
│ 10  GAS +31.4s │      │                       │          │  THROTTLE: 85%        │
│                │      │   ●PER  ●RUS          │          │  BRAKE: 0%            │
│  #121418 bg    │      │                       │          │                       │
│  1px teal/25%  │      └───────────────────────┘          │  #121418 bg           │
│                │      #00D2BE track outline              │  1px teal/25% border  │
├────────────────┴─────────────────────────────────────────┴───────────────────────┤
│  TELEMETRY BARS (120px height)                                                   │
│                                                                                   │
│  HAM  ████████████████████░░░░░░░░░░  85%    ░░░░░░░░░░░░░░░░░░░░  0%           │
│       #00D2BE gradient (throttle)             #FF3B30 gradient (brake)           │
│                                                                                   │
│  VER  ██████████████████░░░░░░░░░░░░  78%    ░░░░░░░░░░░░░░░░░░░░  0%           │
│  LEC  ███████████████░░░░░░░░░░░░░░░  72%    ███░░░░░░░░░░░░░░░░░ 15%           │
│  SAI  ████████████████████░░░░░░░░░░  82%    ░░░░░░░░░░░░░░░░░░░░  0%           │
│                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────┤
│  REPLAY CONTROLS (80px height)                                                   │
│                                                                                   │
│  ◄◄  ▶  ►►    [─────────────●──────────────────────]  34:12 / 1:24:35   1.0x    │
│  #9CA3AF      #00D2BE (active)  scrubber             font-mono          dropdown │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Header Bar (64px height)

**Background**: `#050608` (surface-0)  
**Border Bottom**: `1px solid #2A2E35`

| Element | Content | Font | Color | Position |
|---------|---------|------|-------|----------|
| Logo | "SILVERWALL" | Inter 600, 18px, UPPERCASE, 0.08em | `#00D2BE` | Left, 24px padding |
| Session | "MONZA GP" | Inter 400, 13px | `#9CA3AF` | Left, 120px offset |
| Lap | "LAP 23/53" | Inter 400, 13px | `#E0E0E0` | Left, 240px offset |
| Time | "00:34:12" | JetBrains Mono 500, 13px | `#E0E0E0` | Left, 360px offset |
| Status | ● "LIVE" | Inter 500, 11px, UPPERCASE | `#00D2BE` | Right, 24px padding |

---

### 2. Leaderboard Panel (280px width)

**Background**: `#121418` (surface-1)  
**Border**: `1px solid rgba(0, 210, 190, 0.25)`  
**Border Radius**: `8px`  
**Padding**: `16px`

#### Panel Header
```
LEADERBOARD          LAP 23/53
#9CA3AF, 11px        #00D2BE, 11px mono
```

#### Table Structure

| Column | Width | Alignment | Font |
|--------|-------|-----------|------|
| P (Position) | 40px | Right | JetBrains Mono 500, 16px |
| NUM (Car #) | 60px | Left | JetBrains Mono 500, 16px |
| GAP | 80px | Right | JetBrains Mono 400, 13px |

**Row Styling**:
- Height: `40px`
- Border Bottom: `1px solid #2A2E35`
- Hover: `background: rgba(0, 210, 190, 0.05)`
- Selected: `background: rgba(0, 210, 190, 0.12)`, `border-left: 2px solid #00D2BE`

**Example Rows**:
```
 P   NUM   GAP
────────────────
 1   HAM   ---
 2   VER   +2.3s
 3   LEC   +5.1s
 4   SAI   +8.7s
```

---

### 3. Track Canvas (Center, flex-grow)

**Background**: `#050608` (surface-0)  
**Border**: `1px solid rgba(0, 210, 190, 0.25)`  
**Border Radius**: `8px`  
**Padding**: `16px`

#### SVG Specifications

**ViewBox**: `0 0 1000 1000`  
**Aspect Ratio**: Maintain (responsive)

**Track Path** (Simplified Monza):
- Stroke: `#00D2BE`
- Stroke Width: `12px`
- Opacity: `0.5`
- Fill: `none`
- Style: Rounded corners (`stroke-linecap: round`, `stroke-linejoin: round`)

**Car Dots** (8 visible):

| Driver | Code | Team | Color | Position (x, y) |
|--------|------|------|-------|-----------------|
| Hamilton | HAM | Mercedes | `#00D2BE` | (0.25, 0.35) |
| Verstappen | VER | Red Bull | `#1E41FF` | (0.30, 0.38) |
| Leclerc | LEC | Ferrari | `#DC0000` | (0.35, 0.42) |
| Sainz | SAI | Ferrari | `#DC0000` | (0.40, 0.45) |
| Norris | NOR | McLaren | `#FF8700` | (0.50, 0.50) |
| Perez | PER | Red Bull | `#1E41FF` | (0.55, 0.55) |
| Russell | RUS | Mercedes | `#00D2BE` | (0.60, 0.58) |
| Alonso | ALO | Aston Martin | `#006F62` | (0.65, 0.62) |

**Dot Styling**:
- Outer Circle: `r=16px`, `fill=#0A1416`, `stroke={team_color}`, `stroke-width=3px`
- Text: Driver code (e.g., "HAM"), `fill=#E5E7EB`, `font-size=14px`, `font-weight=600`, centered

---

### 4. Driver Panel (280px width)

**Background**: `#121418` (surface-1)  
**Border**: `1px solid rgba(0, 210, 190, 0.25)`  
**Border Radius**: `8px`  
**Padding**: `16px`

#### Layout

```
┌─────────────────────────┐
│ #44 HAM                 │ ← 16px mono, #E0E0E0
│ Mercedes                │ ← 13px, #9CA3AF
├─────────────────────────┤
│                         │
│ SPEED        ← 11px label, #9CA3AF, UPPERCASE
│ 312          ← 24px mono, #E0E0E0
│ km/h         ← 11px, #6B7280
│                         │
│ GEAR: 7      ← 13px, #E0E0E0
│ DRS: ON      ← 13px, #00D2BE (if active)
│ THROTTLE: 85%
│ BRAKE: 0%
│                         │
└─────────────────────────┘
```

**Data Fields**:
- **Speed**: Large (24px mono), primary metric
- **Gear**: Medium (13px), inline label
- **DRS**: Teal when active (`#00D2BE`), gray when off (`#6B7280`)
- **Throttle/Brake**: Percentage values, 13px

---

### 5. Telemetry Bars (120px height)

**Background**: `#050608` (surface-0)  
**Padding**: `16px`

#### Bar Structure (per driver)

**Height**: `24px` per bar  
**Margin**: `8px` between bars  
**Layout**: Horizontal split (50% throttle, 50% brake)

```
HAM  ████████████████████░░░░░░░░░░  85%    ░░░░░░░░░░░░░░░░░░░░  0%
     ← Throttle (left half)                 ← Brake (right half)
```

**Throttle Bar**:
- Background: `#1A1D23` (surface-2)
- Fill: `linear-gradient(90deg, #00D2BE 0%, #00A89A 100%)`
- Width: `85%` of 50% container
- Transition: `width 100ms linear`

**Brake Bar**:
- Background: `#1A1D23` (surface-2)
- Fill: `linear-gradient(90deg, #FF3B30 0%, #CC2F26 100%)`
- Width: `0%` of 50% container
- Transition: `width 100ms linear`

**Label**:
- Driver Code: `13px mono`, `#E0E0E0`, left-aligned
- Percentage: `11px mono`, `#9CA3AF`, inline with bar

---

### 6. Replay Controls (80px height)

**Background**: `#121418` (surface-1)  
**Border Top**: `1px solid #2A2E35`  
**Padding**: `16px 24px`

#### Control Elements

```
◄◄  ▶  ►►    [─────────────●──────────────────────]  34:12 / 1:24:35   1.0x
```

| Element | Icon/Label | Size | Color | Function |
|---------|-----------|------|-------|----------|
| Rewind | ◄◄ | 20px | `#9CA3AF` | Seek -10s |
| Play/Pause | ▶ / ⏸ | 24px | `#00D2BE` | Toggle playback |
| Forward | ►► | 20px | `#9CA3AF` | Seek +10s |
| Scrubber | Progress bar | 400px | `#2A2E35` bg, `#00D2BE` fill | Seek to time |
| Time | "34:12 / 1:24:35" | 13px mono | `#E0E0E0` | Current / Total |
| Speed | "1.0x" | 13px | `#9CA3AF` | Playback speed |

**Scrubber Styling**:
- Track: `height: 4px`, `background: #2A2E35`, `border-radius: 2px`
- Fill: `background: #00D2BE`, `width: 40%` (progress)
- Thumb: `width: 12px`, `height: 12px`, `border-radius: 50%`, `background: #00D2BE`

---

## Color Reference

| Element | Color | Hex |
|---------|-------|-----|
| Main background | surface-0 | `#050608` |
| Panel background | surface-1 | `#121418` |
| Elevated panels | surface-2 | `#1A1D23` |
| Borders | border-subtle | `#2A2E35` |
| Teal borders | border-teal | `rgba(0, 210, 190, 0.25)` |
| Primary accent | amg-teal | `#00D2BE` |
| High contrast text | text-high | `#E0E0E0` |
| Medium contrast text | text-mid | `#9CA3AF` |
| Low contrast text | text-low | `#6B7280` |
| Alert/Brake | alert | `#FF3B30` |

---

## Typography Reference

| Element | Font | Weight | Size | Transform |
|---------|------|--------|------|-----------|
| Logo | Inter | 600 | 18px | UPPERCASE, 0.08em |
| Panel Headers | Inter | 600 | 14px | UPPERCASE, 0.05em |
| Labels | Inter | 500 | 11px | UPPERCASE, 0.08em |
| Body Text | Inter | 400 | 13px | - |
| Large Numbers | JetBrains Mono | 500 | 24px | Tabular |
| Medium Numbers | JetBrains Mono | 500 | 16px | Tabular |
| Small Numbers | JetBrains Mono | 400 | 13px | Tabular |

---

## Responsive Behavior

### Desktop (≥1440px)
- 3-column grid: `280px | flex-grow | 280px`
- All panels visible
- Track canvas: 60vh height

### Tablet (768px–1439px)
- Stack panels vertically
- Track canvas: 50vh height
- Leaderboard/Driver panel: full width

### Mobile (<768px)
- Single column
- Simplified leaderboard (top 5 only)
- Track canvas: 40vh height
- Hide telemetry bars (show on tap)

---

**SilverWall UI Mockup** — *Precision interface for the pit wall.*
