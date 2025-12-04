# SilverWall Design System — Quick Start

## 📦 What's Included

Your comprehensive design system package contains:

```
/design-tokens.json         ← Design tokens (JSON format)
/tokens.css                 ← Design tokens (CSS variables)
/DESIGN_SYSTEM.md          ← Full design system documentation
/pages/DesignSystem.tsx     ← Interactive design system viewer
```

---

## 🚀 Quick Integration Guide

### **Option 1: JSON Tokens** (Recommended for Build Tools)

Import the JSON file into your project:

```javascript
import designTokens from './design-tokens.json';

// Access tokens programmatically
const primaryColor = designTokens.color.primary['SW-Primary-Teal'];
const spacingMedium = designTokens.spacing['SP-M'];
```

**Use with:**
- Figma Tokens Studio plugin
- Style Dictionary
- Tailwind config
- CSS-in-JS libraries

---

### **Option 2: CSS Variables**

Import the CSS file to use tokens as CSS custom properties:

```css
@import './tokens.css';

.my-component {
  background-color: var(--sw-bg-carbon-100);
  color: var(--sw-primary-teal);
  padding: var(--sp-m);
  border-radius: var(--radius-default);
}
```

**Use with:**
- Vanilla CSS
- SCSS/SASS
- PostCSS
- Any CSS framework

---

### **Option 3: Interactive Viewer**

Access the live design system viewer:

1. Navigate to the landing page
2. Click "Design System" button in footer
3. Browse all tokens with copy-to-clipboard
4. Export JSON tokens via "Export JSON" button

**Features:**
- ✅ Color palette with live previews
- ✅ Typography specimens
- ✅ Spacing visualizations
- ✅ Track & telemetry examples
- ✅ One-click copy to clipboard
- ✅ JSON export functionality

---

## 📋 Token Categories

### **Colors**
```json
{
  "background": { "SW-BG-Carbon-100": "#050608", ... },
  "primary": { "SW-Primary-Teal": "#00D2BE", ... },
  "text": { "SW-Text-High": "#E0E0E0", ... },
  "border": { "SW-Border-Weak": "rgba(...)", ... },
  "status": { "SW-Alert-Red": "#FF3B30", ... },
  "sector": { "SW-Sector-Purple": "#D042FF", ... },
  "teams": { "Mercedes": "#00D2BE", ... }
}
```

### **Typography**
```json
{
  "family": { "sans": "Inter", "mono": "JetBrains Mono" },
  "scale": {
    "T-XLHEAD": { "size": "42px", "weight": 600, ... },
    "T-DATA": { "size": "14px", "family": "mono", ... }
  }
}
```

### **Spacing**
```json
{ "SP-XS": "4px", "SP-M": "16px", "SP-XL": "40px", ... }
```

### **Track & Car**
```json
{
  "track": { "STROKE-TRACK": "14px", "TRACK-COLOR": "#00D2BE", ... },
  "car": { "DOT-RADIUS": "11px", "TRAIL-LENGTH": "40px", ... }
}
```

### **Telemetry**
```json
{
  "telemetry": { "BAR-HEIGHT": "10px", "DOT-RADIUS": "4px", ... }
}
```

---

## 🎨 Usage Examples

### **Tailwind CSS Integration**

```javascript
// tailwind.config.js
const tokens = require('./design-tokens.json');

module.exports = {
  theme: {
    extend: {
      colors: {
        'sw-carbon': tokens.color.background['SW-BG-Carbon-100'],
        'sw-teal': tokens.color.primary['SW-Primary-Teal'],
      },
      spacing: {
        'sp-xs': tokens.spacing['SP-XS'],
        'sp-m': tokens.spacing['SP-M'],
      },
      fontFamily: {
        sans: tokens.typography.family.sans.split(','),
        mono: tokens.typography.family.mono.split(','),
      }
    }
  }
}
```

### **SCSS Variables**

```scss
// Import CSS tokens
@import './tokens.css';

// Use in SCSS
.telemetry-panel {
  background: var(--sw-bg-carbon-200);
  border: 1px solid var(--sw-border-weak);
  padding: var(--sp-m);
  
  .title {
    font-size: var(--text-head);
    color: var(--sw-primary-teal);
  }
}
```

### **Styled Components**

```javascript
import styled from 'styled-components';
import tokens from './design-tokens.json';

const Panel = styled.div`
  background: ${tokens.color.background['SW-BG-Carbon-100']};
  color: ${tokens.color.text['SW-Text-High']};
  padding: ${tokens.spacing['SP-M']};
  border-radius: ${tokens.radius['RADIUS-DEFAULT']};
`;
```

---

## 🔗 Figma Integration

### **Using Tokens Studio Plugin**

1. Install [Tokens Studio for Figma](https://www.figma.com/community/plugin/843461159747178978)
2. Load `/design-tokens.json` into the plugin
3. Sync tokens with your Figma file
4. Apply tokens to your designs

### **Manual Import**

Create Figma color/text styles manually using values from:
- `/DESIGN_SYSTEM.md` (full documentation)
- `/pages/DesignSystem.tsx` (interactive viewer for reference)

---

## 📖 Full Documentation

For complete design system guidelines, see:
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — Comprehensive docs with:
  - Design philosophy
  - Component patterns
  - Anti-patterns (what NOT to do)
  - Responsive breakpoints
  - Version history

---

## 🛠️ Development Workflow

### **1. Reference the Design System**
```bash
# View interactive documentation
# Navigate to: Landing Page → Footer → "Design System" button
```

### **2. Copy Tokens**
- Use the interactive viewer to browse and copy tokens
- Click any token to copy its value to clipboard
- Export all tokens via "Export JSON" button

### **3. Apply in Code**
```javascript
// Import tokens
import tokens from './design-tokens.json';

// Use programmatically
const leaderboardWidth = tokens.layout['LEADERBOARD-WIDTH'];
const tealColor = tokens.color.primary['SW-Primary-Teal'];
```

---

## 📏 Design Principles Reminder

✅ **DO:**
- Use matte carbon backgrounds (`#050608`)
- Apply AMG teal (`#00D2BE`) for active data only
- Use JetBrains Mono for tabular data
- Keep borders extremely subtle (`rgba(0,210,190,0.15)`)
- Emphasize through typography weight, not glow

❌ **DON'T:**
- Use gradients on text/backgrounds
- Add glowing neon effects (except subtle track glow)
- Apply thick borders (> 2px)
- Use gaming/esports aesthetics
- Add decorative fonts or emojis

---

## 🎯 Token Naming Convention

All tokens follow this pattern:
```
[CATEGORY]-[DESCRIPTOR]-[VARIANT]

Examples:
SW-BG-Carbon-100          ← Color token
T-XLHEAD                  ← Typography token
SP-M                      ← Spacing token
STROKE-TRACK              ← Track token
BAR-HEIGHT                ← Telemetry token
```

---

## 📦 Export Options

### **JSON Export**
```javascript
// Already included: /design-tokens.json
// Ready for: Figma plugins, build tools, CI/CD
```

### **CSS Export**
```css
/* Already included: /tokens.css */
/* Ready for: browsers, preprocessors, frameworks */
```

### **TypeScript Types** (Optional)
```typescript
// Generate types from JSON:
type DesignTokens = typeof import('./design-tokens.json');
type ColorTokens = DesignTokens['color'];
type SpacingTokens = DesignTokens['spacing'];
```

---

## 🚨 Support

For questions about the design system:
1. Review `/DESIGN_SYSTEM.md` for full guidelines
2. Use the interactive viewer for token reference
3. Check anti-patterns section for what to avoid

---

## 📌 Version

**Current Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatibility**: React + TypeScript + Tailwind CSS

---

**END OF QUICK START GUIDE**
