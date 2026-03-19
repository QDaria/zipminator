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
  variant = 'default',
}) => {
  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden ${className}`}
      style={{ fontFamily: "'Fraunces', Georgia, serif" }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow top-right */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
        }}
      />
      {/* Radial glow bottom-left */}
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
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
  <div className="mb-8">
    {eyebrow && (
      <p
        className="text-xs font-mono tracking-widest uppercase mb-3 opacity-70"
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
        className="text-slate-400 text-base leading-relaxed max-w-2xl"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {subtitle}
      </p>
    )}
    <div
      className="mt-4 h-px w-16"
      style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
    />
  </div>
);
