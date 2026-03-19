'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Navigation } from './pitch-ui/SB1Navigation';
import { SlideWrapper } from './pitch-ui/SB1SlideWrapper';
import { SlideTitle as SlideTitleSlide } from './sb1-slides/SlideTitle';
import { SlideThreat } from './sb1-slides/SlideThreat';
import { SlideDORA } from './sb1-slides/SlideDORA';
import { SlideGlobalBanks } from './sb1-slides/SlideGlobalBanks';
import { SlideZipminator } from './sb1-slides/SlideZipminator';
import {
  SlidePortfolio,
  SlideRiskModeling,
  SlideFraudDetection,
  SlideQRNG,
} from './sb1-slides/SlideBusinessCases';
import {
  SlideMarketSize,
  SlideQDaria,
  SlideNextSteps,
} from './sb1-slides/SlideMarketAndStrategy';

interface SlideConfig {
  id: number;
  title: string;
  component: React.ComponentType;
}

const SLIDES: SlideConfig[] = [
  { id: 0, title: 'QDaria × SpareBank 1', component: SlideTitleSlide },
  { id: 1, title: 'Trusselbilde · HNDL', component: SlideThreat },
  { id: 2, title: 'DORA Compliance', component: SlideDORA },
  { id: 3, title: 'Globale banker i gang', component: SlideGlobalBanks },
  { id: 4, title: 'BC 01 · Zipminator', component: SlideZipminator },
  { id: 5, title: 'BC 02 · Portefølje', component: SlidePortfolio },
  { id: 6, title: 'BC 03 · Risikomodellering', component: SlideRiskModeling },
  { id: 7, title: 'BC 04 · Svindeldeteksjon', component: SlideFraudDetection },
  { id: 8, title: 'BC 05 · QRNG', component: SlideQRNG },
  { id: 9, title: 'Markedsstørrelse', component: SlideMarketSize },
  { id: 10, title: 'QDaria-posisjon', component: SlideQDaria },
  { id: 11, title: 'Neste steg', component: SlideNextSteps },
];

export const SB1PitchDeck: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (index === current || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setIsTransitioning(false);
    }, 150);
  }, [current, isTransitioning]);

  const next = useCallback(() => {
    if (current < SLIDES.length - 1) goTo(current + 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev]);

  const CurrentSlide = SLIDES[current].component;

  return (
    <div
      className="flex flex-col"
      style={{
        width: '100%',
        height: '100vh',
        background: '#020817',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Slide area */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        >
          <SlideWrapper>
            <CurrentSlide />
          </SlideWrapper>
        </div>
      </div>

      {/* Navigation bar */}
      <Navigation
        current={current}
        total={SLIDES.length}
        onPrev={prev}
        onNext={next}
        onGoTo={goTo}
        slideTitle={SLIDES[current].title}
      />
    </div>
  );
};
