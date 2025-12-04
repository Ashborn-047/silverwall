/**
 * SilverWall Design System — AMG Pit Standard
 * Design Tokens (TypeScript/JavaScript Export)
 * Version: 1.0.0
 */

export const designTokens = {
  color: {
    background: {
      "SW-BG-Carbon-100": "#050608",
      "SW-BG-Carbon-200": "#0A0C10",
      "SW-BG-Carbon-300": "#1A1C20"
    },
    primary: {
      "SW-Primary-Teal": "#00D2BE",
      "SW-Primary-Teal-Dim": "rgba(0, 210, 190, 0.5)",
      "SW-Primary-Teal-Glow": "rgba(0, 210, 190, 0.15)"
    },
    text: {
      "SW-Text-High": "#E0E0E0",
      "SW-Text-Mid": "#9CA3AF",
      "SW-Text-Dim": "#555555",
      "SW-Text-Dark": "#333333"
    },
    border: {
      "SW-Border-Weak": "rgba(0, 210, 190, 0.15)",
      "SW-Border-Medium": "rgba(0, 210, 190, 0.3)",
      "SW-Border-Strong": "rgba(0, 210, 190, 0.5)"
    },
    status: {
      "SW-Alert-Red": "#FF3B30",
      "SW-Success-Green": "#10B981",
      "SW-Warning-Amber": "#F59E0B",
      "SW-Info-Blue": "#3B82F6"
    },
    sector: {
      "SW-Sector-Purple": "#D042FF",
      "SW-Sector-Green": "#00D2BE",
      "SW-Sector-Yellow": "#FFD700"
    },
    teams: {
      "Mercedes": "#00D2BE",
      "Red Bull Racing": "#3671C6",
      "Ferrari": "#DC0000",
      "McLaren": "#FF8700",
      "Aston Martin": "#006F62",
      "Alpine": "#0090FF",
      "Williams": "#005AFF",
      "AlphaTauri": "#2B4562",
      "Alfa Romeo": "#900000",
      "Haas": "#FFFFFF"
    }
  },
  typography: {
    family: {
      sans: "Inter, system-ui, -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'Consolas', monospace"
    },
    scale: {
      "T-XLHEAD": {
        size: "42px",
        lineHeight: "1.1",
        weight: 600,
        letterSpacing: "0.02em",
        family: "sans"
      },
      "T-HEAD": {
        size: "24px",
        lineHeight: "1.2",
        weight: 600,
        letterSpacing: "0.02em",
        family: "sans"
      },
      "T-SUBHEAD": {
        size: "18px",
        lineHeight: "1.3",
        weight: 500,
        letterSpacing: "0.01em",
        family: "sans"
      },
      "T-BODY": {
        size: "14px",
        lineHeight: "1.5",
        weight: 400,
        letterSpacing: "0",
        family: "sans"
      },
      "T-LABEL": {
        size: "12px",
        lineHeight: "1.4",
        weight: 500,
        letterSpacing: "0.04em",
        family: "sans",
        textTransform: "uppercase"
      },
      "T-DATA": {
        size: "14px",
        lineHeight: "1.5",
        weight: 400,
        letterSpacing: "0",
        family: "mono",
        fontVariantNumeric: "tabular-nums"
      },
      "T-DATA-LARGE": {
        size: "28px",
        lineHeight: "1.2",
        weight: 700,
        letterSpacing: "0",
        family: "mono",
        fontVariantNumeric: "tabular-nums"
      },
      "T-TINY": {
        size: "10px",
        lineHeight: "1.4",
        weight: 500,
        letterSpacing: "0.04em",
        family: "mono",
        opacity: 0.65,
        textTransform: "uppercase"
      }
    }
  },
  spacing: {
    "SP-XS": "4px",
    "SP-S": "8px",
    "SP-M": "16px",
    "SP-L": "24px",
    "SP-XL": "40px",
    "SP-XXL": "64px"
  },
  radius: {
    "RADIUS-NONE": "0px",
    "RADIUS-SM": "2px",
    "RADIUS-DEFAULT": "4px",
    "RADIUS-MD": "6px",
    "RADIUS-LG": "8px"
  },
  track: {
    "STROKE-TRACK": "14px",
    "STROKE-TRACK-THIN": "3px",
    "STROKE-LINECAP": "round",
    "STROKE-LINEJOIN": "round",
    "OPACITY-INACTIVE": 0.65,
    "OPACITY-ACTIVE": 1.0,
    "TRACK-COLOR": "#00D2BE",
    "TRACK-BACKGROUND": "#333333"
  },
  car: {
    "DOT-RADIUS": "11px",
    "DOT-RADIUS-SMALL": "5px",
    "DOT-STROKE": "3px",
    "LABEL-OFFSET": "18px",
    "LABEL-OFFSET-EXTENDED": "26px",
    "LABEL-FONT-SIZE": "12px",
    "LABEL-FONT-FAMILY": "'JetBrains Mono', monospace",
    "TRAIL-LENGTH": "40px",
    "TRAIL-OPACITY": 0.4
  },
  telemetry: {
    "BAR-HEIGHT": "10px",
    "BAR-HEIGHT-SMALL": "6px",
    "BAR-CORNER-RADIUS": "2px",
    "BAR-SPACING": "10px",
    "BAR-GAP": "2px",
    "DOT-RADIUS": "4px",
    "DOT-RADIUS-SMALL": "1.5px"
  },
  animation: {
    "DURATION-FAST": "150ms",
    "DURATION-DEFAULT": "300ms",
    "DURATION-SLOW": "500ms",
    "EASING-DEFAULT": "cubic-bezier(0.4, 0, 0.2, 1)",
    "EASING-SMOOTH": "cubic-bezier(0.4, 0, 0.6, 1)"
  },
  layout: {
    "LEADERBOARD-WIDTH": "280px",
    "TELEMETRY-PANEL-WIDTH": "320px",
    "HEADER-HEIGHT": "64px",
    "FOOTER-HEIGHT": "48px",
    "MAX-CONTENT-WIDTH": "1920px"
  }
} as const;

export default designTokens;
