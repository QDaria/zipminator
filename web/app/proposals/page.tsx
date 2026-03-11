"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ────────────────────────────────────────────
   Color conversion helpers
   ──────────────────────────────────────────── */

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/* ────────────────────────────────────────────
   SaturationBrightness picker component
   ──────────────────────────────────────────── */

function SBPicker({
  hue,
  sat,
  val,
  onChange,
}: {
  hue: number;
  sat: number;
  val: number;
  onChange: (s: number, v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
      onChange(s, v);
    },
    [onChange]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) update(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [update]);

  const [hr, hg, hb] = hsvToRgb(hue, 1, 1);

  return (
    <div
      ref={ref}
      className="relative w-full h-40 rounded-lg cursor-crosshair select-none"
      style={{
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgb(${hr},${hg},${hb}))`,
      }}
      onMouseDown={(e) => {
        dragging.current = true;
        update(e);
      }}
    >
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${sat * 100}%`,
          top: `${(1 - val) * 100}%`,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Hue slider
   ──────────────────────────────────────────── */

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  return (
    <div className="relative mt-2">
      <input
        type="range"
        min={0}
        max={360}
        value={hue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Full color picker component
   ──────────────────────────────────────────── */

function ColorPicker({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (hex: string) => void;
}) {
  const [r, g, b] = hexToRgb(color);
  const [h, s, v] = rgbToHsv(r, g, b);
  const [hexInput, setHexInput] = useState(color);

  // Sync hex input when color changes externally
  useEffect(() => {
    setHexInput(color);
  }, [color]);

  const setFromHsv = (hue: number, sat: number, val: number) => {
    const [nr, ng, nb] = hsvToRgb(hue, sat, val);
    onChange(rgbToHex(nr, ng, nb));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-5 h-5 rounded border border-zinc-600"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      </div>

      <SBPicker
        hue={h}
        sat={s}
        val={v}
        onChange={(ns, nv) => setFromHsv(h, ns, nv)}
      />
      <HueSlider hue={h} onChange={(nh) => setFromHsv(nh, s, v)} />

      <div className="flex gap-2 mt-2">
        <div className="flex-1">
          <label className="text-[10px] text-zinc-500 uppercase">Hex</label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value);
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v.toUpperCase());
            }}
            onBlur={() => setHexInput(color)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
          />
        </div>
        {[
          { label: "R", value: r, i: 0 },
          { label: "G", value: g, i: 1 },
          { label: "B", value: b, i: 2 },
        ].map(({ label: l, value: val, i }) => (
          <div key={l} className="w-12">
            <label className="text-[10px] text-zinc-500 uppercase">{l}</label>
            <input
              type="number"
              min={0}
              max={255}
              value={val}
              onChange={(e) => {
                const rgb: [number, number, number] = [r, g, b];
                rgb[i] = Math.max(0, Math.min(255, Number(e.target.value)));
                onChange(rgbToHex(...rgb));
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-1 py-1 text-xs text-white text-center font-mono"
            />
          </div>
        ))}
      </div>

      {/* Native picker fallback */}
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="w-full h-6 rounded cursor-pointer bg-transparent"
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Inline SVG logo with dynamic colors
   ──────────────────────────────────────────── */

function LogoSVG({ bracesColor, zColor, size = 144 }: { bracesColor: string; zColor: string; size?: number }) {
  const scale = size / 239;
  const h = Math.round(144 * scale);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={h}
      viewBox="0 0 239 144"
    >
      <defs>
        <g>
          <g id="g0">
            <path d="M 40.609375 -88.515625 C 40.609375 -94.265625 44.328125 -103.4375 59.96875 -104.453125 C 60.6875 -104.59375 61.265625 -105.15625 61.265625 -106.03125 C 61.265625 -107.609375 60.109375 -107.609375 58.53125 -107.609375 C 44.1875 -107.609375 31.125 -100.28125 30.984375 -89.671875 L 30.984375 -56.953125 C 30.984375 -51.359375 30.984375 -46.765625 25.25 -42.03125 C 20.234375 -37.875 14.78125 -37.59375 11.625 -37.453125 C 10.90625 -37.296875 10.328125 -36.734375 10.328125 -35.875 C 10.328125 -34.4375 11.1875 -34.4375 12.625 -34.28125 C 22.09375 -33.71875 28.984375 -28.546875 30.5625 -21.515625 C 30.984375 -19.9375 30.984375 -19.65625 30.984375 -14.484375 L 30.984375 13.921875 C 30.984375 19.9375 30.984375 24.53125 37.875 29.984375 C 43.46875 34.28125 52.9375 35.875 58.53125 35.875 C 60.109375 35.875 61.265625 35.875 61.265625 34.28125 C 61.265625 32.859375 60.40625 32.859375 58.96875 32.703125 C 49.921875 32.140625 42.890625 27.546875 41.03125 20.234375 C 40.609375 18.9375 40.609375 18.65625 40.609375 13.484375 L 40.609375 -16.640625 C 40.609375 -23.234375 39.453125 -25.6875 34.859375 -30.265625 C 31.84375 -33.28125 27.6875 -34.71875 23.671875 -35.875 C 35.4375 -39.171875 40.609375 -45.765625 40.609375 -54.09375 Z" />
          </g>
          <g id="g1">
            <path d="M 67.140625 -50.359375 C 72.875 -50.21875 75.609375 -49.640625 76.46875 -48.921875 C 76.609375 -48.78125 76.75 -48.203125 76.90625 -47.921875 C 76.90625 -46.484375 78.046875 -46.484375 78.765625 -46.484375 C 81.0625 -46.484375 85.5 -48.921875 85.5 -51.9375 C 85.5 -55.515625 79.484375 -56.234375 76.1875 -56.390625 C 75.890625 -56.390625 73.890625 -56.53125 73.890625 -56.671875 C 73.890625 -56.953125 76.1875 -59.109375 77.328125 -60.40625 C 90.953125 -74.03125 110.046875 -95.546875 110.046875 -96.984375 C 110.046875 -97.421875 109.890625 -97.984375 108.890625 -97.984375 C 107.890625 -97.984375 104.15625 -97.125 100 -93.96875 C 97.421875 -93.96875 93.828125 -93.96875 85.5 -95.546875 C 77.609375 -96.984375 72.453125 -97.984375 66.859375 -97.984375 C 57.671875 -97.984375 49.0625 -94.6875 41.46875 -90.09375 C 28.546875 -81.921875 27.40625 -73.59375 27.40625 -73.453125 C 27.40625 -73.03125 27.546875 -72.3125 28.6875 -72.3125 C 31.421875 -72.3125 40.03125 -76.46875 41.3125 -80.34375 C 43.1875 -85.9375 45.046875 -89.09375 54.8125 -89.09375 C 56.09375 -89.09375 60.109375 -89.09375 68.71875 -87.515625 C 75.890625 -86.21875 81.78125 -85.078125 86.9375 -85.078125 C 88.65625 -85.078125 90.390625 -85.078125 91.96875 -85.5 C 84.359375 -76.609375 77.765625 -69.296875 65.28125 -56.53125 L 50.9375 -56.53125 C 43.328125 -56.53125 42.03125 -52.21875 42.03125 -51.65625 C 42.03125 -50.359375 43.328125 -50.359375 45.765625 -50.359375 L 58.828125 -50.359375 C 57.8125 -49.203125 51.078125 -42.46875 32.421875 -25.6875 C 32.140625 -25.390625 21.8125 -16.0625 9.90625 -6.03125 C 8.03125 -4.453125 5.3125 -2.015625 5.3125 -1 C 5.3125 -0.578125 5.453125 0 6.453125 0 C 8.328125 0 11.328125 -1.4375 13.203125 -2.578125 C 15.78125 -4.015625 18.21875 -4.015625 20.515625 -4.015625 C 26.96875 -4.015625 36.296875 -2.875 42.890625 -2.15625 C 49.78125 -1.140625 59.390625 0 66.421875 0 C 76.90625 0 85.359375 -5.875 89.953125 -10.046875 C 98.703125 -17.796875 101.28125 -27.96875 101.28125 -28.84375 C 101.28125 -29.703125 100.71875 -29.84375 100 -29.84375 C 97.265625 -29.84375 88.65625 -25.6875 87.375 -21.515625 C 86.515625 -18.796875 85.078125 -13.921875 80.625 -8.890625 C 76.328125 -8.890625 71.296875 -8.890625 58.109375 -10.609375 C 50.9375 -11.484375 40.171875 -12.90625 32.5625 -12.90625 C 31.703125 -12.90625 28.265625 -12.90625 25.53125 -12.34375 Z" />
          </g>
          <g id="g2">
            <path d="M 30.984375 16.78125 C 30.984375 22.53125 27.265625 31.703125 11.625 32.703125 C 10.90625 32.859375 10.328125 33.421875 10.328125 34.28125 C 10.328125 35.875 11.90625 35.875 13.203125 35.875 C 27.109375 35.875 40.453125 28.84375 40.609375 17.9375 L 40.609375 -14.78125 C 40.609375 -20.375 40.609375 -24.96875 46.34375 -29.703125 C 51.359375 -33.859375 56.8125 -34.140625 59.96875 -34.28125 C 60.6875 -34.4375 61.265625 -35 61.265625 -35.875 C 61.265625 -37.296875 60.40625 -37.296875 58.96875 -37.453125 C 49.5 -38.015625 42.609375 -43.1875 41.03125 -50.21875 C 40.609375 -51.796875 40.609375 -52.078125 40.609375 -57.25 L 40.609375 -85.65625 C 40.609375 -91.671875 40.609375 -96.265625 33.71875 -101.71875 C 27.96875 -106.171875 18.078125 -107.609375 13.203125 -107.609375 C 11.90625 -107.609375 10.328125 -107.609375 10.328125 -106.03125 C 10.328125 -104.59375 11.1875 -104.59375 12.625 -104.453125 C 21.65625 -103.875 28.6875 -99.28125 30.5625 -91.96875 C 30.984375 -90.671875 30.984375 -90.390625 30.984375 -85.21875 L 30.984375 -55.09375 C 30.984375 -48.5 32.140625 -46.046875 36.734375 -41.46875 C 39.734375 -38.453125 43.90625 -37.015625 47.921875 -35.875 C 36.15625 -32.5625 30.984375 -25.96875 30.984375 -17.640625 Z" />
          </g>
        </g>
      </defs>
      <g fill={bracesColor}>
        <use href="#g0" x="-10.2032" y="107.787" />
      </g>
      <g fill={zColor}>
        <use href="#g1" x="61.52752" y="107.787" />
      </g>
      <g fill={bracesColor}>
        <use href="#g2" x="176.970941" y="107.787" />
      </g>
    </svg>
  );
}

/* ────────────────────────────────────────────
   Presets data
   ──────────────────────────────────────────── */

const presets = [
  { id: 1, name: "Brand Quantum", braces: "#FFFFFF", z: "#06BA63", from: "#6366F1", to: "#4338CA" },
  { id: 2, name: "Deep Quantum", braces: "#6366F1", z: "#06BA63", from: "#1E1B4B", to: "#312E81" },
  { id: 3, name: "Green Energy", braces: "#FFFFFF", z: "#FF6600", from: "#06BA63", to: "#059650" },
  { id: 4, name: "Royal Quantum", braces: "#FFD700", z: "#06BA63", from: "#1A0B2E", to: "#312E81" },
  { id: 5, name: "White Z on Dark", braces: "#FF6600", z: "#FFFFFF", from: "#1E1B4B", to: "#312E81" },
  { id: 6, name: "Midnight Fire", braces: "#A5BBFC", z: "#FF6600", from: "#0F0F1A", to: "#1A1A2E" },
  { id: 7, name: "Inverted Green", braces: "#06BA63", z: "#FFFFFF", from: "#FF6600", to: "#CC5200" },
  { id: 8, name: "Warm on Green", braces: "#FFD700", z: "#FF6600", from: "#06BA63", to: "#048A42" },
  { id: 9, name: "Quantum on Fire", braces: "#FFFFFF", z: "#6366F1", from: "#FF6600", to: "#CC5200" },
  { id: 10, name: "Tech Slate", braces: "#06BA63", z: "#6366F1", from: "#0F172A", to: "#1E293B" },
  { id: 11, name: "Neon Pop", braces: "#F472B6", z: "#FACC15", from: "#0F172A", to: "#1E293B" },
  { id: 12, name: "Cyber Violet", braces: "#22D3EE", z: "#FF6600", from: "#7C3AED", to: "#5B21B6" },
  { id: 13, name: "Red Alert", braces: "#FACC15", z: "#FFFFFF", from: "#DC2626", to: "#991B1B" },
  { id: 14, name: "Matrix", braces: "#A78BFA", z: "#22D3EE", from: "#065F46", to: "#064E3B" },
  { id: 15, name: "Minimal Dark", braces: "#FB923C", z: "#6366F1", from: "#18181B", to: "#27272A" },
  { id: 16, name: "Sky Gold", braces: "#FFFFFF", z: "#FACC15", from: "#0EA5E9", to: "#0284C7" },
  { id: 17, name: "Synthwave", braces: "#34D399", z: "#F472B6", from: "#1E1B4B", to: "#312E81" },
  { id: 18, name: "Void Contrast", braces: "#FF6600", z: "#22D3EE", from: "#000000", to: "#18181B" },
  { id: 19, name: "Purple Reign", braces: "#FBBF24", z: "#06BA63", from: "#9333EA", to: "#7E22CE" },
  { id: 20, name: "Ocean Fire", braces: "#E2E8F0", z: "#FF6600", from: "#0F766E", to: "#115E59" },
];

/* ────────────────────────────────────────────
   Main page
   ──────────────────────────────────────────── */

export default function ProposalsPage() {
  const [bracesColor, setBracesColor] = useState("#FFFFFF");
  const [zColor, setZColor] = useState("#06BA63");
  const [bgFrom, setBgFrom] = useState("#6366F1");
  const [bgTo, setBgTo] = useState("#4338CA");
  const [useGradient, setUseGradient] = useState(true);
  const [gradAngle, setGradAngle] = useState(135);
  const [activePreset, setActivePreset] = useState<number | null>(1);
  const [copied, setCopied] = useState(false);

  const bgStyle = useGradient
    ? `linear-gradient(${gradAngle}deg, ${bgFrom}, ${bgTo})`
    : bgFrom;

  const loadPreset = (p: (typeof presets)[0]) => {
    setBracesColor(p.braces);
    setZColor(p.z);
    setBgFrom(p.from);
    setBgTo(p.to);
    setActivePreset(p.id);
    setUseGradient(true);
  };

  const cssOutput = useGradient
    ? `/* Button */\nbackground: linear-gradient(${gradAngle}deg, ${bgFrom}, ${bgTo});\n\n/* SVG braces { } */\nfill: ${bracesColor};\n\n/* SVG center Z */\nfill: ${zColor};`
    : `/* Button */\nbackground: ${bgFrom};\n\n/* SVG braces { } */\nfill: ${bracesColor};\n\n/* SVG center Z */\nfill: ${zColor};`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <h1 className="text-xl font-bold">Logo Color Studio</h1>
        <p className="text-zinc-500 text-sm">
          Interactive color picker for the {"{Z}"} button
        </p>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* ── Left: Preview + Presets ── */}
        <div className="space-y-8">
          {/* Live preview */}
          <div className="flex flex-col items-center gap-4 py-12 rounded-2xl border border-zinc-800 bg-zinc-900/30">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Live Preview
            </p>

            {/* Large preview */}
            <div
              className="w-56 h-32 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-200"
              style={{ background: bgStyle }}
            >
              <LogoSVG bracesColor={bracesColor} zColor={zColor} size={180} />
            </div>

            {/* Small preview (actual button size) */}
            <div className="flex items-center gap-4 mt-4">
              <div className="text-center">
                <p className="text-[10px] text-zinc-600 mb-1">w-44 h-[6.5rem]</p>
                <div
                  className="w-44 h-[6.5rem] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200"
                  style={{ background: bgStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} size={144} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-zinc-600 mb-1">w-40 h-24 (old)</p>
                <div
                  className="w-40 h-24 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200"
                  style={{ background: bgStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} size={128} />
                </div>
              </div>
            </div>

            {/* Dark / light backdrop comparison */}
            <div className="flex items-center gap-4 mt-4">
              <div className="bg-zinc-950 p-4 rounded-xl">
                <p className="text-[10px] text-zinc-600 mb-1 text-center">
                  On dark
                </p>
                <div
                  className="w-44 h-[6.5rem] rounded-2xl flex items-center justify-center"
                  style={{ background: bgStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <p className="text-[10px] text-zinc-400 mb-1 text-center">
                  On light
                </p>
                <div
                  className="w-44 h-[6.5rem] rounded-2xl flex items-center justify-center"
                  style={{ background: bgStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} />
                </div>
              </div>
            </div>
          </div>

          {/* Presets grid */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">
              Presets (click to load)
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  className={`relative group rounded-lg overflow-hidden transition-all ${
                    activePreset === p.id
                      ? "ring-2 ring-white scale-105"
                      : "ring-1 ring-zinc-800 hover:ring-zinc-600"
                  }`}
                  title={`#${p.id}: ${p.name}`}
                >
                  <div
                    className="w-full aspect-[1.66] flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                    }}
                  >
                    <LogoSVG bracesColor={p.braces} zColor={p.z} size={48} />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <span className="absolute bottom-0.5 left-0 right-0 text-[8px] text-center text-white/70">
                    {p.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CSS output */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50">
              <span className="text-xs font-semibold text-zinc-400">
                CSS Output
              </span>
              <button
                onClick={copyToClipboard}
                className="text-xs px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 transition-colors"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
            <pre className="px-4 py-3 text-xs text-emerald-400 font-mono whitespace-pre-wrap">
              {cssOutput}
            </pre>
          </div>
        </div>

        {/* ── Right: Color controls ── */}
        <div className="space-y-6">
          {/* Button background */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Button Background</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-zinc-500">Gradient</span>
                <button
                  onClick={() => setUseGradient(!useGradient)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    useGradient ? "bg-indigo-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      useGradient ? "left-5.5 translate-x-[1px]" : "left-0.5"
                    }`}
                    style={{ left: useGradient ? "22px" : "2px" }}
                  />
                </button>
              </label>
            </div>

            {/* Gradient bar preview */}
            <div
              className="w-full h-8 rounded-lg"
              style={{ background: bgStyle }}
            />

            {useGradient && (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase">
                  Angle: {gradAngle}deg
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={gradAngle}
                  onChange={(e) => setGradAngle(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-zinc-700 cursor-pointer"
                />
              </div>
            )}

            <div className={useGradient ? "grid grid-cols-2 gap-4" : ""}>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase mb-1 block">
                  {useGradient ? "From" : "Solid color"}
                </label>
                <ColorPicker
                  label={useGradient ? "Gradient start" : "Background"}
                  color={bgFrom}
                  onChange={(c) => {
                    setBgFrom(c);
                    setActivePreset(null);
                  }}
                />
              </div>
              {useGradient && (
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase mb-1 block">
                    To
                  </label>
                  <ColorPicker
                    label="Gradient end"
                    color={bgTo}
                    onChange={(c) => {
                      setBgTo(c);
                      setActivePreset(null);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Braces { } color */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-semibold mb-3">
              Braces {"{ }"} — Elements 1 &amp; 3
            </h3>
            <ColorPicker
              label="Brace color"
              color={bracesColor}
              onChange={(c) => {
                setBracesColor(c);
                setActivePreset(null);
              }}
            />
          </div>

          {/* Z color */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-semibold mb-3">
              Center Z — Element 2
            </h3>
            <ColorPicker
              label="Z color"
              color={zColor}
              onChange={(c) => {
                setZColor(c);
                setActivePreset(null);
              }}
            />
          </div>

          {/* Quick swap */}
          <button
            onClick={() => {
              const tmp = bracesColor;
              setBracesColor(zColor);
              setZColor(tmp);
              setActivePreset(null);
            }}
            className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
          >
            Swap braces and Z colors
          </button>
        </div>
      </div>
    </div>
  );
}
