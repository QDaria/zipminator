"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";

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

const borderRadiusOptions = [
  { label: "Sharp", value: "0px", icon: "◻" },
  { label: "Slight", value: "8px", icon: "◻" },
  { label: "Rounded", value: "16px", icon: "▢" },
  { label: "Pill", value: "9999px", icon: "⬭" },
] as const;

export default function ProposalsPage() {
  const [bracesColor, setBracesColor] = useState("#FFFFFF");
  const [zColor, setZColor] = useState("#06BA63");
  const [bgFrom, setBgFrom] = useState("#6366F1");
  const [bgTo, setBgTo] = useState("#4338CA");
  const [useGradient, setUseGradient] = useState(true);
  const [gradAngle, setGradAngle] = useState(135);
  const [activePreset, setActivePreset] = useState<number | null>(1);
  const [copied, setCopied] = useState(false);

  // Border controls
  const [showBorder, setShowBorder] = useState(false);
  const [borderThickness, setBorderThickness] = useState(2);
  const [borderGlow, setBorderGlow] = useState(false);
  const [borderRadiusIdx, setBorderRadiusIdx] = useState(2); // default "Rounded"
  const [borderColor, setBorderColor] = useState("#FFFFFF");

  // Preview controls
  const [invertedPreview, setInvertedPreview] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [savedStates, setSavedStates] = useState<Array<{
    id: number;
    name: string;
    bracesColor: string;
    zColor: string;
    bgFrom: string;
    bgTo: string;
    useGradient: boolean;
    gradAngle: number;
    showBorder: boolean;
    borderThickness: number;
    borderGlow: boolean;
    borderRadiusIdx: number;
    borderColor: string;
  }>>([]);
  const [saveCounter, setSaveCounter] = useState(1);

  const bgStyle = useGradient
    ? `linear-gradient(${gradAngle}deg, ${bgFrom}, ${bgTo})`
    : bgFrom;

  const borderRadius = borderRadiusOptions[borderRadiusIdx].value;

  const borderStyle: React.CSSProperties = showBorder
    ? {
        border: `${borderThickness}px solid ${borderColor}`,
        boxShadow: borderGlow
          ? `0 0 ${borderThickness * 3}px ${borderColor}, 0 0 ${borderThickness * 6}px ${borderColor}40, inset 0 0 ${borderThickness * 2}px ${borderColor}20`
          : undefined,
      }
    : {};

  const saveCurrentState = () => {
    if (savedStates.length >= 20) return;
    setSavedStates((prev) => [
      ...prev,
      {
        id: saveCounter,
        name: `Save #${saveCounter}`,
        bracesColor,
        zColor,
        bgFrom,
        bgTo,
        useGradient,
        gradAngle,
        showBorder,
        borderThickness,
        borderGlow,
        borderRadiusIdx,
        borderColor,
      },
    ]);
    setSaveCounter((c) => c + 1);
  };

  const loadSavedState = (s: (typeof savedStates)[0]) => {
    setBracesColor(s.bracesColor);
    setZColor(s.zColor);
    setBgFrom(s.bgFrom);
    setBgTo(s.bgTo);
    setUseGradient(s.useGradient);
    setGradAngle(s.gradAngle);
    setShowBorder(s.showBorder);
    setBorderThickness(s.borderThickness);
    setBorderGlow(s.borderGlow);
    setBorderRadiusIdx(s.borderRadiusIdx);
    setBorderColor(s.borderColor);
    setActivePreset(null);
  };

  const deleteSavedState = (id: number) => {
    setSavedStates((prev) => prev.filter((s) => s.id !== id));
  };

  const loadPreset = (p: (typeof presets)[0]) => {
    setBracesColor(p.braces);
    setZColor(p.z);
    setBgFrom(p.from);
    setBgTo(p.to);
    setActivePreset(p.id);
    setUseGradient(true);
  };

  const borderCss = showBorder
    ? `\n\n/* Border */\nborder: ${borderThickness}px solid ${borderColor};\nborder-radius: ${borderRadius};${
        borderGlow
          ? `\nbox-shadow: 0 0 ${borderThickness * 3}px ${borderColor}, 0 0 ${borderThickness * 6}px ${borderColor}40;`
          : ""
      }`
    : `\nborder-radius: ${borderRadius};`;

  const cssOutput = (useGradient
    ? `/* Button */\nbackground: linear-gradient(${gradAngle}deg, ${bgFrom}, ${bgTo});`
    : `/* Button */\nbackground: ${bgFrom};`)
    + borderCss
    + `\n\n/* SVG braces { } */\nfill: ${bracesColor};\n\n/* SVG center Z */\nfill: ${zColor};`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const randomHex = () => "#" + Array.from({ length: 6 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");

  const randomize = () => {
    setBracesColor(randomHex());
    setZColor(randomHex());
    setBgFrom(randomHex());
    setBgTo(randomHex());
    setGradAngle(Math.floor(Math.random() * 361));
    setUseGradient(Math.random() < 0.7);
    setActivePreset(null);
  };

  /* ── Color theory: Inspire Me ── */

  const hslToHex = (h: number, s: number, l: number): string => {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(color * 255);
    };
    return rgbToHex(f(0), f(8), f(4));
  };

  const relativeLuminance = (hex: string): number => {
    const [r, g, b] = hexToRgb(hex).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const contrastRatio = (a: string, b: string): number => {
    const la = relativeLuminance(a), lb = relativeLuminance(b);
    const lighter = Math.max(la, lb), darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const ensureContrast = (fg: string, bgAvg: string, hue: number, sat: number): string => {
    let color = fg;
    const bgLum = relativeLuminance(bgAvg);
    // Try lightening or darkening to achieve 3:1 contrast
    for (let attempt = 0; attempt < 10; attempt++) {
      if (contrastRatio(color, bgAvg) >= 3) return color;
      // If bg is dark, push fg lighter; if bg is light, push fg darker
      const l = bgLum < 0.5 ? 0.6 + attempt * 0.04 : 0.3 - attempt * 0.03;
      color = hslToHex(hue, sat, Math.max(0.05, Math.min(0.95, l)));
    }
    return color;
  };

  type HarmonyStrategy = "complementary" | "analogous" | "triadic" | "split-complementary" | "monochromatic";
  const strategies: HarmonyStrategy[] = ["complementary", "analogous", "triadic", "split-complementary", "monochromatic"];

  const generateHarmoniousPalette = () => {
    const baseHue = Math.random() * 360;
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    let bracesH: number, zH: number, bgFromH: number, bgToH: number;
    let bracesSat: number, zSat: number;

    switch (strategy) {
      case "complementary":
        bracesH = baseHue;
        zH = (baseHue + 180) % 360;
        bgFromH = (baseHue + 210) % 360;
        bgToH = (baseHue + 240) % 360;
        bracesSat = 0.7 + Math.random() * 0.3;
        zSat = 0.7 + Math.random() * 0.3;
        break;
      case "analogous":
        bracesH = (baseHue + 330) % 360;
        zH = (baseHue + 30) % 360;
        bgFromH = baseHue;
        bgToH = (baseHue + 15) % 360;
        bracesSat = 0.6 + Math.random() * 0.3;
        zSat = 0.6 + Math.random() * 0.3;
        break;
      case "triadic":
        bracesH = baseHue;
        zH = (baseHue + 120) % 360;
        bgFromH = (baseHue + 240) % 360;
        bgToH = (baseHue + 260) % 360;
        bracesSat = 0.7 + Math.random() * 0.3;
        zSat = 0.7 + Math.random() * 0.3;
        break;
      case "split-complementary":
        bracesH = baseHue;
        zH = (baseHue + 150) % 360;
        bgFromH = (baseHue + 210) % 360;
        bgToH = (baseHue + 230) % 360;
        bracesSat = 0.65 + Math.random() * 0.3;
        zSat = 0.65 + Math.random() * 0.3;
        break;
      case "monochromatic":
      default:
        bracesH = baseHue;
        zH = baseHue;
        bgFromH = baseHue;
        bgToH = baseHue;
        bracesSat = 0.3 + Math.random() * 0.4;
        zSat = 0.8 + Math.random() * 0.2;
        break;
    }

    const bgFromColor = hslToHex(bgFromH, 0.6 + Math.random() * 0.3, 0.12 + Math.random() * 0.15);
    const bgToColor = hslToHex(bgToH, 0.5 + Math.random() * 0.3, 0.1 + Math.random() * 0.15);
    const bgAvg = bgFromColor; // Use bgFrom as proxy for contrast checks

    let bracesColorGen = hslToHex(bracesH, bracesSat, 0.7 + Math.random() * 0.25);
    let zColorGen = hslToHex(zH, zSat, 0.6 + Math.random() * 0.3);

    bracesColorGen = ensureContrast(bracesColorGen, bgAvg, bracesH, bracesSat);
    zColorGen = ensureContrast(zColorGen, bgAvg, zH, zSat);

    return {
      bracesColor: bracesColorGen,
      zColor: zColorGen,
      bgFrom: bgFromColor,
      bgTo: bgToColor,
      gradAngle: Math.floor(Math.random() * 361),
      useGradient: true,
    };
  };

  const inspireMe = () => {
    const palette = generateHarmoniousPalette();
    setBracesColor(palette.bracesColor);
    setZColor(palette.zColor);
    setBgFrom(palette.bgFrom);
    setBgTo(palette.bgTo);
    setGradAngle(palette.gradAngle);
    setUseGradient(palette.useGradient);
    setActivePreset(null);

    // Auto-save if under 20 cap
    if (savedStates.length < 20) {
      setSavedStates((prev) => [
        ...prev,
        {
          id: saveCounter,
          name: `Inspired #${saveCounter}`,
          bracesColor: palette.bracesColor,
          zColor: palette.zColor,
          bgFrom: palette.bgFrom,
          bgTo: palette.bgTo,
          useGradient: palette.useGradient,
          gradAngle: palette.gradAngle,
          showBorder,
          borderThickness,
          borderGlow,
          borderRadiusIdx,
          borderColor,
        },
      ]);
      setSaveCounter((c) => c + 1);
    }
  };

  const exportPng = async () => {
    if (!previewRef.current) return;
    const dataUrl = await toPng(previewRef.current, { pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "zipminator-logo.png";
    link.href = dataUrl;
    link.click();
  };

  const renameSavedState = (id: number, name: string) => {
    setSavedStates((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    setEditingId(null);
  };

  /* SVG path data for the logo glyphs */
  const g0Path = "M 40.609375 -88.515625 C 40.609375 -94.265625 44.328125 -103.4375 59.96875 -104.453125 C 60.6875 -104.59375 61.265625 -105.15625 61.265625 -106.03125 C 61.265625 -107.609375 60.109375 -107.609375 58.53125 -107.609375 C 44.1875 -107.609375 31.125 -100.28125 30.984375 -89.671875 L 30.984375 -56.953125 C 30.984375 -51.359375 30.984375 -46.765625 25.25 -42.03125 C 20.234375 -37.875 14.78125 -37.59375 11.625 -37.453125 C 10.90625 -37.296875 10.328125 -36.734375 10.328125 -35.875 C 10.328125 -34.4375 11.1875 -34.4375 12.625 -34.28125 C 22.09375 -33.71875 28.984375 -28.546875 30.5625 -21.515625 C 30.984375 -19.9375 30.984375 -19.65625 30.984375 -14.484375 L 30.984375 13.921875 C 30.984375 19.9375 30.984375 24.53125 37.875 29.984375 C 43.46875 34.28125 52.9375 35.875 58.53125 35.875 C 60.109375 35.875 61.265625 35.875 61.265625 34.28125 C 61.265625 32.859375 60.40625 32.859375 58.96875 32.703125 C 49.921875 32.140625 42.890625 27.546875 41.03125 20.234375 C 40.609375 18.9375 40.609375 18.65625 40.609375 13.484375 L 40.609375 -16.640625 C 40.609375 -23.234375 39.453125 -25.6875 34.859375 -30.265625 C 31.84375 -33.28125 27.6875 -34.71875 23.671875 -35.875 C 35.4375 -39.171875 40.609375 -45.765625 40.609375 -54.09375 Z";
  const g1Path = "M 67.140625 -50.359375 C 72.875 -50.21875 75.609375 -49.640625 76.46875 -48.921875 C 76.609375 -48.78125 76.75 -48.203125 76.90625 -47.921875 C 76.90625 -46.484375 78.046875 -46.484375 78.765625 -46.484375 C 81.0625 -46.484375 85.5 -48.921875 85.5 -51.9375 C 85.5 -55.515625 79.484375 -56.234375 76.1875 -56.390625 C 75.890625 -56.390625 73.890625 -56.53125 73.890625 -56.671875 C 73.890625 -56.953125 76.1875 -59.109375 77.328125 -60.40625 C 90.953125 -74.03125 110.046875 -95.546875 110.046875 -96.984375 C 110.046875 -97.421875 109.890625 -97.984375 108.890625 -97.984375 C 107.890625 -97.984375 104.15625 -97.125 100 -93.96875 C 97.421875 -93.96875 93.828125 -93.96875 85.5 -95.546875 C 77.609375 -96.984375 72.453125 -97.984375 66.859375 -97.984375 C 57.671875 -97.984375 49.0625 -94.6875 41.46875 -90.09375 C 28.546875 -81.921875 27.40625 -73.59375 27.40625 -73.453125 C 27.40625 -73.03125 27.546875 -72.3125 28.6875 -72.3125 C 31.421875 -72.3125 40.03125 -76.46875 41.3125 -80.34375 C 43.1875 -85.9375 45.046875 -89.09375 54.8125 -89.09375 C 56.09375 -89.09375 60.109375 -89.09375 68.71875 -87.515625 C 75.890625 -86.21875 81.78125 -85.078125 86.9375 -85.078125 C 88.65625 -85.078125 90.390625 -85.078125 91.96875 -85.5 C 84.359375 -76.609375 77.765625 -69.296875 65.28125 -56.53125 L 50.9375 -56.53125 C 43.328125 -56.53125 42.03125 -52.21875 42.03125 -51.65625 C 42.03125 -50.359375 43.328125 -50.359375 45.765625 -50.359375 L 58.828125 -50.359375 C 57.8125 -49.203125 51.078125 -42.46875 32.421875 -25.6875 C 32.140625 -25.390625 21.8125 -16.0625 9.90625 -6.03125 C 8.03125 -4.453125 5.3125 -2.015625 5.3125 -1 C 5.3125 -0.578125 5.453125 0 6.453125 0 C 8.328125 0 11.328125 -1.4375 13.203125 -2.578125 C 15.78125 -4.015625 18.21875 -4.015625 20.515625 -4.015625 C 26.96875 -4.015625 36.296875 -2.875 42.890625 -2.15625 C 49.78125 -1.140625 59.390625 0 66.421875 0 C 76.90625 0 85.359375 -5.875 89.953125 -10.046875 C 98.703125 -17.796875 101.28125 -27.96875 101.28125 -28.84375 C 101.28125 -29.703125 100.71875 -29.84375 100 -29.84375 C 97.265625 -29.84375 88.65625 -25.6875 87.375 -21.515625 C 86.515625 -18.796875 85.078125 -13.921875 80.625 -8.890625 C 76.328125 -8.890625 71.296875 -8.890625 58.109375 -10.609375 C 50.9375 -11.484375 40.171875 -12.90625 32.5625 -12.90625 C 31.703125 -12.90625 28.265625 -12.90625 25.53125 -12.34375 Z";
  const g2Path = "M 30.984375 16.78125 C 30.984375 22.53125 27.265625 31.703125 11.625 32.703125 C 10.90625 32.859375 10.328125 33.421875 10.328125 34.28125 C 10.328125 35.875 11.90625 35.875 13.203125 35.875 C 27.109375 35.875 40.453125 28.84375 40.609375 17.9375 L 40.609375 -14.78125 C 40.609375 -20.375 40.609375 -24.96875 46.34375 -29.703125 C 51.359375 -33.859375 56.8125 -34.140625 59.96875 -34.28125 C 60.6875 -34.4375 61.265625 -35 61.265625 -35.875 C 61.265625 -37.296875 60.40625 -37.296875 58.96875 -37.453125 C 49.5 -38.015625 42.609375 -43.1875 41.03125 -50.21875 C 40.609375 -51.796875 40.609375 -52.078125 40.609375 -57.25 L 40.609375 -85.65625 C 40.609375 -91.671875 40.609375 -96.265625 33.71875 -101.71875 C 27.96875 -106.171875 18.078125 -107.609375 13.203125 -107.609375 C 11.90625 -107.609375 10.328125 -107.609375 10.328125 -106.03125 C 10.328125 -104.59375 11.1875 -104.59375 12.625 -104.453125 C 21.65625 -103.875 28.6875 -99.28125 30.5625 -91.96875 C 30.984375 -90.671875 30.984375 -90.390625 30.984375 -85.21875 L 30.984375 -55.09375 C 30.984375 -48.5 32.140625 -46.046875 36.734375 -41.46875 C 39.734375 -38.453125 43.90625 -37.015625 47.921875 -35.875 C 36.15625 -32.5625 30.984375 -25.96875 30.984375 -17.640625 Z";

  /** Build a standalone SVG string (rectangular, matching the button shape) */
  const buildRectSvgString = () => {
    const w = 239, h = 144;
    const bgDef = useGradient
      ? `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bgFrom}"/><stop offset="100%" stop-color="${bgTo}"/></linearGradient></defs><rect width="${w}" height="${h}" rx="${parseInt(borderRadius)}" fill="url(#bg)"/>`
      : `<rect width="${w}" height="${h}" rx="${parseInt(borderRadius)}" fill="${bgFrom}"/>`;
    const borderEl = showBorder
      ? `<rect x="${borderThickness / 2}" y="${borderThickness / 2}" width="${w - borderThickness}" height="${h - borderThickness}" rx="${parseInt(borderRadius)}" fill="none" stroke="${borderColor}" stroke-width="${borderThickness}"/>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bgDef}${borderEl}<g fill="${bracesColor}"><path transform="translate(-10.2032,107.787)" d="${g0Path}"/></g><g fill="${zColor}"><path transform="translate(61.52752,107.787)" d="${g1Path}"/></g><g fill="${bracesColor}"><path transform="translate(176.970941,107.787)" d="${g2Path}"/></g></svg>`;
  };

  /** Build a square SVG (for favicons — logo centered on background) */
  const buildSquareSvgString = (size: number) => {
    const logoW = 239, logoH = 144;
    const pad = size * 0.08;
    const scaleX = (size - pad * 2) / logoW;
    const scaleY = (size - pad * 2) / logoH;
    const scale = Math.min(scaleX, scaleY);
    const sw = logoW * scale, sh = logoH * scale;
    const ox = (size - sw) / 2, oy = (size - sh) / 2;
    const rx = Math.min(parseInt(borderRadius), size * 0.15);
    const bgDef = useGradient
      ? `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bgFrom}"/><stop offset="100%" stop-color="${bgTo}"/></linearGradient></defs><rect width="${size}" height="${size}" rx="${rx}" fill="url(#bg)"/>`
      : `<rect width="${size}" height="${size}" rx="${rx}" fill="${bgFrom}"/>`;
    const borderEl = showBorder
      ? `<rect x="${borderThickness / 2}" y="${borderThickness / 2}" width="${size - borderThickness}" height="${size - borderThickness}" rx="${rx}" fill="none" stroke="${borderColor}" stroke-width="${borderThickness}"/>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bgDef}${borderEl}<g transform="translate(${ox},${oy}) scale(${scale})"><g fill="${bracesColor}"><path transform="translate(-10.2032,107.787)" d="${g0Path}"/></g><g fill="${zColor}"><path transform="translate(61.52752,107.787)" d="${g1Path}"/></g><g fill="${bracesColor}"><path transform="translate(176.970941,107.787)" d="${g2Path}"/></g></g></svg>`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSvg = () => {
    const svg = buildRectSvgString();
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "zipminator-logo.svg");
  };

  /** Render an SVG string to a PNG blob at given pixel size */
  const svgToPngBlob = (svgStr: string, w: number, h: number): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      };
      img.onerror = reject;
      img.src = "data:image/svg+xml;base64," + btoa(svgStr);
    });

  const exportFaviconPackage = async () => {
    const zip = new JSZip();
    const sizes = [16, 32, 48, 180, 192, 512];
    // Square PNGs at each size
    for (const s of sizes) {
      const svg = buildSquareSvgString(s);
      const blob = await svgToPngBlob(svg, s, s);
      const name = s === 180 ? "apple-touch-icon.png"
        : s === 192 ? "android-chrome-192x192.png"
        : s === 512 ? "android-chrome-512x512.png"
        : `favicon-${s}x${s}.png`;
      zip.file(name, blob);
    }
    // SVG favicon (scalable)
    zip.file("favicon.svg", buildSquareSvgString(512));
    // Rectangular logo SVG
    zip.file("logo.svg", buildRectSvgString());
    // Rectangular logo PNG (2x)
    const rectSvg = buildRectSvgString();
    zip.file("logo-478x288.png", await svgToPngBlob(rectSvg, 478, 288));
    // Web manifest
    zip.file("site.webmanifest", JSON.stringify({
      name: "Zipminator",
      short_name: "Zipminator",
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: bgFrom,
      background_color: bgFrom,
      display: "standalone",
    }, null, 2));
    // HTML snippet
    zip.file("favicon-links.html", [
      `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`,
      `<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">`,
      `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">`,
      `<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">`,
      `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`,
      `<link rel="manifest" href="/site.webmanifest">`,
    ].join("\n"));
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "zipminator-favicon-package.zip");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-16">
      {/* ── Header ── */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-16 z-40 px-6 py-4">
        <h1 className="text-xl font-bold">Logo Color Studio</h1>
        <p className="text-zinc-500 text-sm">
          Interactive color picker for the {"{Z}"} button
        </p>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_320px_280px] gap-6">
        {/* ── Col 1: Preview + Saved + Presets + CSS ── */}
        <div className="space-y-4">
          {/* Live preview */}
          <div className={`flex flex-col items-center gap-3 py-4 px-4 rounded-2xl border border-zinc-800 transition-colors duration-300 ${
            invertedPreview ? "bg-white" : "bg-zinc-900/30"
          }`}>
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className={`text-xs uppercase tracking-wider ${invertedPreview ? "text-zinc-400" : "text-zinc-500"}`}>
                Live Preview
              </p>
              <button
                onClick={exportPng}
                className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                  invertedPreview
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    : "bg-indigo-600/80 hover:bg-indigo-500 text-white"
                }`}
              >
                PNG
              </button>
              <button
                onClick={exportSvg}
                className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                  invertedPreview
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    : "bg-violet-600/80 hover:bg-violet-500 text-white"
                }`}
              >
                SVG
              </button>
              <button
                onClick={exportFaviconPackage}
                className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                  invertedPreview
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    : "bg-emerald-600/80 hover:bg-emerald-500 text-white"
                }`}
              >
                Favicon ZIP
              </button>
              <button
                onClick={() => setInvertedPreview(!invertedPreview)}
                className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                  invertedPreview
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-zinc-700 hover:bg-zinc-600 text-white"
                }`}
              >
                {invertedPreview ? "☀ Light" : "☾ Dark"}
              </button>
            </div>

            {/* Large preview */}
            <div
              ref={previewRef}
              className="w-48 h-28 flex items-center justify-center shadow-2xl transition-all duration-200"
              style={{ background: bgStyle, borderRadius, ...borderStyle }}
            >
              <LogoSVG bracesColor={bracesColor} zColor={zColor} size={156} />
            </div>

            {/* Size comparison row */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className={`text-[9px] mb-0.5 ${invertedPreview ? "text-zinc-400" : "text-zinc-600"}`}>w-44</p>
                <div
                  className="w-44 h-[6.5rem] flex items-center justify-center shadow-lg transition-all duration-200"
                  style={{ background: bgStyle, borderRadius, ...borderStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} size={144} />
                </div>
              </div>
              <div className="text-center">
                <p className={`text-[9px] mb-0.5 ${invertedPreview ? "text-zinc-400" : "text-zinc-600"}`}>w-40</p>
                <div
                  className="w-40 h-24 flex items-center justify-center shadow-lg transition-all duration-200"
                  style={{ background: bgStyle, borderRadius, ...borderStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} size={128} />
                </div>
              </div>
            </div>

            {/* Dark / light backdrop comparison */}
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${invertedPreview ? "bg-zinc-100" : "bg-zinc-950"}`}>
                <p className={`text-[9px] mb-0.5 text-center ${invertedPreview ? "text-zinc-400" : "text-zinc-600"}`}>
                  On {invertedPreview ? "light" : "dark"}
                </p>
                <div
                  className="w-36 h-20 flex items-center justify-center"
                  style={{ background: bgStyle, borderRadius, ...borderStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} size={112} />
                </div>
              </div>
              <div className={`p-3 rounded-xl ${invertedPreview ? "bg-zinc-900" : "bg-white"}`}>
                <p className={`text-[9px] mb-0.5 text-center ${invertedPreview ? "text-zinc-500" : "text-zinc-400"}`}>
                  On {invertedPreview ? "dark" : "light"}
                </p>
                <div
                  className="w-36 h-20 flex items-center justify-center"
                  style={{ background: bgStyle, borderRadius, ...borderStyle }}
                >
                  <LogoSVG bracesColor={bracesColor} zColor={zColor} size={112} />
                </div>
              </div>
            </div>
          </div>

          {/* Saved Designs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-400">Saved Designs</h3>
              <button
                onClick={saveCurrentState}
                disabled={savedStates.length >= 20}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                  savedStates.length >= 20
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-emerald-600/80 hover:bg-emerald-500 text-white"
                }`}
              >
                {savedStates.length >= 20 ? "Max 20" : "Save"}
              </button>
            </div>
            {savedStates.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-3">Click Save to store a design</p>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {savedStates.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSavedState(s)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingId(s.id);
                      setEditingName(s.name);
                    }}
                    className="relative group rounded-lg overflow-hidden ring-1 ring-zinc-800 hover:ring-zinc-600 transition-all"
                    title={`${s.name} (double-click to rename)`}
                  >
                    <div
                      className="w-full aspect-[1.66] flex items-center justify-center"
                      style={{
                        background: s.useGradient
                          ? `linear-gradient(135deg, ${s.bgFrom}, ${s.bgTo})`
                          : s.bgFrom,
                        borderRadius: borderRadiusOptions[s.borderRadiusIdx]?.value,
                        ...(s.showBorder ? { border: `${s.borderThickness}px solid ${s.borderColor}` } : {}),
                      }}
                    >
                      <LogoSVG bracesColor={s.bracesColor} zColor={s.zColor} size={48} />
                    </div>
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        onClick={(e) => { e.stopPropagation(); deleteSavedState(s.id); }}
                        className="text-[10px] text-white/0 group-hover:text-white/90 cursor-pointer hover:text-red-400 leading-none"
                      >
                        ✕
                      </span>
                    </div>
                    {editingId === s.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") renameSavedState(s.id, editingName); }}
                        onBlur={() => renameSavedState(s.id, editingName)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-white text-center px-0.5 py-0.5 border-none outline-none"
                      />
                    ) : (
                      <span className="absolute bottom-0.5 left-0 right-0 text-[8px] text-center text-white/70 truncate px-0.5">
                        {s.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Presets grid */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">
              Presets (click to load)
            </h3>
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

        {/* ── Col 2: Button Background + Border ── */}
        <div className="space-y-6">
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

            {/* Border controls */}
            <div className="border-t border-zinc-800 pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Border</span>
                <button
                  onClick={() => setShowBorder(!showBorder)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    showBorder ? "bg-indigo-600" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: showBorder ? "22px" : "2px" }}
                  />
                </button>
              </div>

              {showBorder && (
                <>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase">
                      Thickness: {borderThickness}px
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={borderThickness}
                      onChange={(e) => setBorderThickness(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-zinc-700 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Glow effect</span>
                    <button
                      onClick={() => setBorderGlow(!borderGlow)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        borderGlow ? "bg-cyan-500" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: borderGlow ? "22px" : "2px" }}
                      />
                    </button>
                  </div>

                  <ColorPicker label="Border color" color={borderColor} onChange={(c) => setBorderColor(c)} />
                </>
              )}

              <div>
                <label className="text-[10px] text-zinc-500 uppercase mb-2 block">
                  Corner Radius
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {borderRadiusOptions.map((opt, idx) => (
                    <button
                      key={opt.label}
                      onClick={() => setBorderRadiusIdx(idx)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors ${
                        borderRadiusIdx === idx
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Col 3: Braces + Z + actions ── */}
        <div className="space-y-6 lg:col-span-2 xl:col-span-1">
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

          {/* Randomize */}
          <button
            onClick={randomize}
            className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors"
          >
            Randomize all colors
          </button>

          {/* Inspire Me */}
          <button
            onClick={inspireMe}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30"
          >
            Inspire Me
          </button>
          {savedStates.length >= 20 && (
            <p className="text-[10px] text-zinc-500 text-center">Gallery full (20/20). Delete a design to add more.</p>
          )}
        </div>
      </div>
    </div>
  );
}
