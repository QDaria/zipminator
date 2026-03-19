'use client';

import React from 'react';

interface SlideWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'split';
}

export const SlideWrapper: React.FC<SlideWrapperProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-y-auto overflow-x-hidden ${className}`}
      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
    >
      {/* Grid overlay — boosted opacity for visibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.06,
        }}
      />
      {/* Radial glow top-right — boosted */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
        }}
      />
      {/* Radial glow bottom-left — boosted */}
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};

interface SlideTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accentColor?: string;
}

export const SlideTitle: React.FC<SlideTitleProps> = ({
  eyebrow,
  title,
  subtitle,
  accentColor = '#22D3EE',
}) => (
  <div className="mb-6">
    {eyebrow && (
      <p
        className="text-sm font-mono tracking-widest uppercase mb-3 opacity-80"
        style={{ color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {eyebrow}
      </p>
    )}
    <h2
      className="text-3xl lg:text-4xl font-semibold text-slate-50 leading-tight mb-3"
      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
    >
      {title}
    </h2>
    {subtitle && (
      <p
        className="text-slate-300 text-base leading-relaxed max-w-3xl"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {subtitle}
      </p>
    )}
    <div
      className="mt-4 h-px w-20"
      style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
    />
  </div>
);
