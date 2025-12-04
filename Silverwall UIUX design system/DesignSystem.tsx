import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Download } from 'lucide-react';
import designTokens from '../design-tokens';

// ============================================================================
// 🎨 SILVERWALL DESIGN SYSTEM VIEWER
// Interactive exploration of AMG Pit Standard design tokens
// ============================================================================

export default function DesignSystem({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'track' | 'telemetry'>('colors');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const downloadTokens = () => {
    const dataStr = JSON.stringify(designTokens, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'silverwall-design-tokens.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-[#050608] text-[#E0E0E0] font-sans">
      {/* Header */}
      <header className="border-b border-[#00D2BE]/10 bg-[#0A0C10] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#00D2BE] transition-colors text-xs uppercase tracking-wider font-mono"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[#00D2BE]" />
              <div>
                <h1 className="font-bold tracking-widest uppercase text-sm">
                  SILVER<span className="text-[#00D2BE]">WALL</span> Design System
                </h1>
                <p className="text-[10px] text-[#555] uppercase tracking-wider font-mono">
                  AMG Pit Standard — v1.0.0
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={downloadTokens}
            className="flex items-center gap-2 px-4 py-2 bg-[#00D2BE]/10 border border-[#00D2BE]/20 rounded text-[#00D2BE] hover:bg-[#00D2BE]/20 transition-colors text-xs font-mono uppercase tracking-wider"
          >
            <Download size={14} />
            Export JSON
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-[#00D2BE]/10 bg-[#0A0C10] px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {(['colors', 'typography', 'spacing', 'track', 'telemetry'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-3 font-mono text-xs uppercase tracking-wider transition-colors
                ${activeTab === tab
                  ? 'text-[#00D2BE] border-b-2 border-[#00D2BE] bg-[#00D2BE]/5'
                  : 'text-[#9CA3AF] hover:text-[#E0E0E0] hover:bg-[#00D2BE]/5'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'colors' && <ColorsSection copyToClipboard={copyToClipboard} copiedToken={copiedToken} />}
        {activeTab === 'typography' && <TypographySection />}
        {activeTab === 'spacing' && <SpacingSection copyToClipboard={copyToClipboard} copiedToken={copiedToken} />}
        {activeTab === 'track' && <TrackSection copyToClipboard={copyToClipboard} copiedToken={copiedToken} />}
        {activeTab === 'telemetry' && <TelemetrySection copyToClipboard={copyToClipboard} copiedToken={copiedToken} />}
      </main>
    </div>
  );
}

// ============================================================================
// COLOR SECTION
// ============================================================================
const ColorsSection = ({ copyToClipboard, copiedToken }: { copyToClipboard: (v: string, l: string) => void; copiedToken: string | null }) => {
  const colorGroups = [
    { title: 'Background', colors: designTokens.color.background },
    { title: 'Primary', colors: designTokens.color.primary },
    { title: 'Text', colors: designTokens.color.text },
    { title: 'Border', colors: designTokens.color.border },
    { title: 'Status', colors: designTokens.color.status },
    { title: 'Sector', colors: designTokens.color.sector },
    { title: 'Teams', colors: designTokens.color.teams },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Color Palette</h2>
        <p className="text-[#9CA3AF] text-sm">Surgical engineering color tokens for AMG pit aesthetics</p>
      </div>

      {colorGroups.map((group) => (
        <section key={group.title}>
          <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
            {group.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(group.colors).map(([name, value]) => (
              <ColorToken
                key={name}
                name={name}
                value={value as string}
                copyToClipboard={copyToClipboard}
                isCopied={copiedToken === name}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const ColorToken = ({ name, value, copyToClipboard, isCopied }: { name: string; value: string; copyToClipboard: (v: string, l: string) => void; isCopied: boolean }) => {
  return (
    <button
      onClick={() => copyToClipboard(value, name)}
      className="group flex items-center gap-3 p-3 bg-[#0A0C10] border border-[#00D2BE]/10 rounded hover:border-[#00D2BE]/30 transition-all"
    >
      <div
        className="w-12 h-12 rounded border border-[#00D2BE]/20"
        style={{ backgroundColor: value }}
      />
      <div className="flex-1 text-left">
        <div className="font-mono text-xs text-[#E0E0E0]">{name}</div>
        <div className="font-mono text-[10px] text-[#555] mt-1">{value}</div>
      </div>
      {isCopied ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} className="text-[#555] group-hover:text-[#00D2BE] transition-colors" />
      )}
    </button>
  );
};

// ============================================================================
// TYPOGRAPHY SECTION
// ============================================================================
const TypographySection = () => {
  const typeScale = designTokens.typography.scale;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Typography</h2>
        <p className="text-[#9CA3AF] text-sm">2 font families: Inter (UI) + JetBrains Mono (Data)</p>
      </div>

      {/* Font Families */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Font Families
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#0A0C10] border border-[#00D2BE]/10 rounded">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2 font-mono">SANS</div>
            <div className="text-xl" style={{ fontFamily: 'Inter' }}>Inter — ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
            <div className="text-[10px] text-[#9CA3AF] mt-2 font-mono">UI elements, headers, body text</div>
          </div>
          <div className="p-4 bg-[#0A0C10] border border-[#00D2BE]/10 rounded">
            <div className="text-xs text-[#555] uppercase tracking-wider mb-2 font-mono">DATA</div>
            <div className="text-xl font-mono">JetBrains Mono — 0123456789</div>
            <div className="text-[10px] text-[#9CA3AF] mt-2 font-mono">Telemetry, lap times, tabular data</div>
          </div>
        </div>
      </section>

      {/* Type Scale */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Type Scale
        </h3>
        <div className="space-y-6">
          {Object.entries(typeScale).map(([name, spec]) => (
            <TypeSpecimen key={name} name={name} spec={spec} />
          ))}
        </div>
      </section>
    </div>
  );
};

const TypeSpecimen = ({ name, spec }: { name: string; spec: any }) => {
  return (
    <div className="p-4 bg-[#0A0C10] border border-[#00D2BE]/10 rounded">
      <div className="flex items-start justify-between mb-3">
        <div className="font-mono text-xs text-[#00D2BE] uppercase tracking-wider">{name}</div>
        <div className="text-[10px] text-[#555] font-mono space-x-4">
          <span>{spec.size}</span>
          <span>·</span>
          <span>Weight {spec.weight}</span>
          <span>·</span>
          <span>{spec.family === 'mono' ? 'JetBrains Mono' : 'Inter'}</span>
        </div>
      </div>
      <div
        style={{
          fontSize: spec.size,
          fontWeight: spec.weight,
          lineHeight: spec.lineHeight,
          letterSpacing: spec.letterSpacing,
          fontFamily: spec.family === 'mono' ? "'JetBrains Mono', monospace" : 'Inter, sans-serif',
          textTransform: spec.textTransform || 'none',
          fontVariantNumeric: spec.fontVariantNumeric || 'normal',
        }}
      >
        {spec.family === 'mono' ? '310 km/h · LAP 15/58 · +0.542s' : 'The quick brown fox jumps over'}
      </div>
    </div>
  );
};

// ============================================================================
// SPACING SECTION
// ============================================================================
const SpacingSection = ({ copyToClipboard, copiedToken }: { copyToClipboard: (v: string, l: string) => void; copiedToken: string | null }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Spacing & Layout</h2>
        <p className="text-[#9CA3AF] text-sm">Consistent spacing scale and border radius tokens</p>
      </div>

      {/* Spacing Scale */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Spacing Scale
        </h3>
        <div className="space-y-3">
          {Object.entries(designTokens.spacing).map(([name, value]) => (
            <SpacingToken key={name} name={name} value={value} copyToClipboard={copyToClipboard} isCopied={copiedToken === name} />
          ))}
        </div>
      </section>

      {/* Border Radius */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Border Radius
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(designTokens.radius).map(([name, value]) => (
            <div key={name} className="p-4 bg-[#0A0C10] border border-[#00D2BE]/10 rounded text-center">
              <div
                className="w-16 h-16 mx-auto mb-3 bg-[#00D2BE]"
                style={{ borderRadius: value }}
              />
              <div className="font-mono text-xs text-[#E0E0E0]">{name}</div>
              <div className="font-mono text-[10px] text-[#555] mt-1">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Layout Dimensions */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Layout Dimensions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(designTokens.layout).map(([name, value]) => (
            <button
              key={name}
              onClick={() => copyToClipboard(value, name)}
              className="group flex items-center justify-between p-3 bg-[#0A0C10] border border-[#00D2BE]/10 rounded hover:border-[#00D2BE]/30 transition-all"
            >
              <div>
                <div className="font-mono text-xs text-[#E0E0E0]">{name}</div>
                <div className="font-mono text-[10px] text-[#555] mt-1">{value}</div>
              </div>
              {copiedToken === name ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-[#555] group-hover:text-[#00D2BE]" />
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const SpacingToken = ({ name, value, copyToClipboard, isCopied }: { name: string; value: string; copyToClipboard: (v: string, l: string) => void; isCopied: boolean }) => {
  return (
    <button
      onClick={() => copyToClipboard(value, name)}
      className="group flex items-center justify-between p-3 bg-[#0A0C10] border border-[#00D2BE]/10 rounded hover:border-[#00D2BE]/30 transition-all"
    >
      <div className="flex items-center gap-4">
        <div
          className="h-8 bg-[#00D2BE]"
          style={{ width: value }}
        />
        <div>
          <div className="font-mono text-xs text-[#E0E0E0]">{name}</div>
          <div className="font-mono text-[10px] text-[#555] mt-1">{value}</div>
        </div>
      </div>
      {isCopied ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} className="text-[#555] group-hover:text-[#00D2BE]" />
      )}
    </button>
  );
};

// ============================================================================
// TRACK SECTION
// ============================================================================
const TrackSection = ({ copyToClipboard, copiedToken }: { copyToClipboard: (v: string, l: string) => void; copiedToken: string | null }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Track Visualization</h2>
        <p className="text-[#9CA3AF] text-sm">Circuit rendering specifications and car marker standards</p>
      </div>

      {/* Track Tokens */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Track Style Tokens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(designTokens.track).map(([name, value]) => (
            <button
              key={name}
              onClick={() => copyToClipboard(String(value), name)}
              className="group flex items-center justify-between p-3 bg-[#0A0C10] border border-[#00D2BE]/10 rounded hover:border-[#00D2BE]/30 transition-all"
            >
              <div>
                <div className="font-mono text-xs text-[#E0E0E0]">{name}</div>
                <div className="font-mono text-[10px] text-[#555] mt-1">{String(value)}</div>
              </div>
              {copiedToken === name ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-[#555] group-hover:text-[#00D2BE]" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Track Example */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Track Example
        </h3>
        <div className="p-8 bg-[#0A0C10] border border-[#00D2BE]/10 rounded">
          <svg viewBox="0 0 200 100" className="w-full h-auto">
            {/* Simple track example */}
            <path
              d="M 20 50 L 80 50 L 90 40 L 100 30 L 110 40 L 120 50 L 180 50"
              fill="none"
              stroke="#00D2BE"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Car dot */}
            <circle cx="90" cy="40" r="11" fill="#DC0000" />
            {/* Car trail */}
            <line x1="90" y1="40" x2="82" y2="44" stroke="#DC0000" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* Car Tokens */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Car Marker Tokens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(designTokens.car).map(([name, value]) => (
            <button
              key={name}
              onClick={() => copyToClipboard(String(value), name)}
              className="group flex items-center justify-between p-3 bg-[#0A0C10] border border-[#00D2BE]/10 rounded hover:border-[#00D2BE]/30 transition-all"
            >
              <div>
                <div className="font-mono text-xs text-[#E0E0E0]">{name}</div>
                <div className="font-mono text-[10px] text-[#555] mt-1">{String(value)}</div>
              </div>
              {copiedToken === name ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-[#555] group-hover:text-[#00D2BE]" />
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// TELEMETRY SECTION
// ============================================================================
const TelemetrySection = ({ copyToClipboard, copiedToken }: { copyToClipboard: (v: string, l: string) => void; copiedToken: string | null }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Telemetry Components</h2>
        <p className="text-[#9CA3AF] text-sm">Engineering-style telemetry bar specifications</p>
      </div>

      {/* Telemetry Tokens */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Telemetry Tokens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(designTokens.telemetry).map(([name, value]) => (
            <button
              key={name}
              onClick={() => copyToClipboard(String(value), name)}
              className="group flex items-center justify-between p-3 bg-[#0A0C10] border border-[#00D2BE]/10 rounded hover:border-[#00D2BE]/30 transition-all"
            >
              <div>
                <div className="font-mono text-xs text-[#E0E0E0]">{name}</div>
                <div className="font-mono text-[10px] text-[#555] mt-1">{String(value)}</div>
              </div>
              {copiedToken === name ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-[#555] group-hover:text-[#00D2BE]" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Horizontal Bar Example */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Horizontal Bar Example (Throttle/Brake)
        </h3>
        <div className="p-6 bg-[#0A0C10] border border-[#00D2BE]/10 rounded space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#555] uppercase font-mono">Throttle</span>
              <span className="text-sm font-mono text-[#E0E0E0]">98<span className="text-[10px] text-[#9CA3AF] ml-1">%</span></span>
            </div>
            <div className="w-full h-[10px] bg-[#333]/30 rounded-sm overflow-hidden">
              <div className="h-full bg-[#00D2BE] transition-all" style={{ width: '98%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#555] uppercase font-mono">Brake</span>
              <span className="text-sm font-mono text-[#E0E0E0]">45<span className="text-[10px] text-[#9CA3AF] ml-1">%</span></span>
            </div>
            <div className="w-full h-[10px] bg-[#333]/30 rounded-sm overflow-hidden">
              <div className="h-full bg-[#FF3B30] transition-all" style={{ width: '45%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Bar Example */}
      <section>
        <h3 className="text-sm font-mono uppercase tracking-wider text-[#00D2BE] mb-4 border-b border-[#00D2BE]/10 pb-2">
          Bottom Bar Example (Multi-driver)
        </h3>
        <div className="p-6 bg-[#0A0C10] border border-[#00D2BE]/10 rounded">
          <div className="flex items-center gap-6">
            {[
              { code: 'HAM', throttle: 98, color: '#00D2BE' },
              { code: 'VER', throttle: 98, color: '#3671C6' },
              { code: 'LEC', throttle: 65, color: '#DC0000' },
            ].map((driver) => {
              const filledBars = Math.round((driver.throttle / 100) * 10);
              return (
                <div key={driver.code} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: driver.color }} />
                  <span className="font-mono text-[11px] text-[#9CA3AF] w-8">{driver.code}</span>
                  <span className="text-[#333]">|</span>
                  <div className="flex items-center gap-[2px]">
                    {Array.from({ length: 10 }).map((_, index) => (
                      <div
                        key={index}
                        className={`w-[3px] h-2.5 ${index < filledBars ? 'bg-[#00D2BE]' : 'bg-[#333]/50'}`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-[#00D2BE] w-8 text-right tabular-nums">{driver.throttle}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};