'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Navigation } from './pitch-ui/SB1Navigation';
import { SB1Sidebar } from './pitch-ui/SB1Sidebar';
import { SlideTitle as SlideTitleSlide } from './sb1-slides/SlideTitle';
import { SlideQDaria } from './sb1-slides/SlideQDaria';
import { SlideSpinoffs } from './sb1-slides/SlideSpinoffs';
import { SlideAgenticAI } from './sb1-slides/SlideAgenticAI';
import { SlideThreat } from './sb1-slides/SlideThreat';
import { SlideDORA } from './sb1-slides/SlideDORA';
import { SlideGlobalBanks } from './sb1-slides/SlideGlobalBanks';
import { SlideZipminator } from './sb1-slides/SlideZipminator';
import { SlidePortfolio } from './sb1-slides/SlidePortfolio';
import { SlideRiskModeling } from './sb1-slides/SlideRiskModeling';
import { SlideFraudDetection } from './sb1-slides/SlideFraudDetection';
import { SlideQRNG } from './sb1-slides/SlideQRNG';
import { SlideMarketSize } from './sb1-slides/SlideMarketAndStrategy';
import { SlideCostComparison } from './sb1-slides/SlideCostComparison';
import { SlideSmartHouse } from './sb1-slides/SlideSmartHouse';
import { SlideNextSteps } from './sb1-slides/SlideNextSteps';
import type { Scenario } from '@/lib/sb1-chart-data';

interface SlideConfig {
  id: number;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const SLIDES: SlideConfig[] = [
  { id: 0,  title: 'QDaria × SpareBank 1',      component: SlideTitleSlide },
  { id: 1,  title: 'QDaria — Selskap',           component: SlideQDaria },
  { id: 2,  title: 'Produktportefølje & Spinoffs', component: SlideSpinoffs },
  { id: 3,  title: 'Agentisk AI-plattform',      component: SlideAgenticAI },
  { id: 4,  title: 'Trusselbilde · HNDL',        component: SlideThreat },
  { id: 5,  title: 'DORA Compliance',             component: SlideDORA },
  { id: 6,  title: 'Globale banker i gang',       component: SlideGlobalBanks },
  { id: 7,  title: 'BC 01 · Zipminator',          component: SlideZipminator },
  { id: 8,  title: 'BC 02 · Portefølje',          component: SlidePortfolio },
  { id: 9,  title: 'BC 03 · Risikomodellering',   component: SlideRiskModeling },
  { id: 10, title: 'BC 04 · Svindeldeteksjon',    component: SlideFraudDetection },
  { id: 11, title: 'BC 05 · QRNG',                component: SlideQRNG },
  { id: 12, title: 'Markedsstørrelse',             component: SlideMarketSize },
  { id: 13, title: 'Kostnadsbilde',               component: SlideCostComparison },
  { id: 14, title: 'RuView Smart House',          component: SlideSmartHouse },
  { id: 15, title: 'Neste steg',                  component: SlideNextSteps },
];

export const SB1PitchDeck: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('base');

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
      className="flex"
      style={{
        width: '100%',
        height: '100vh',
        background: '#020817',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Sidebar */}
      <SB1Sidebar
        slides={SLIDES.map(s => ({ id: s.id, title: s.title }))}
        current={current}
        onGoTo={goTo}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-hidden relative">
          <div
            className="absolute inset-0 transition-opacity duration-150"
            style={{ opacity: isTransitioning ? 0 : 1 }}
          >
            {/* No outer SlideWrapper — each slide manages its own */}
            <CurrentSlide scenario={scenario} onScenarioChange={setScenario} />
          </div>
        </div>

        <Navigation
          current={current}
          total={SLIDES.length}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
          slideTitle={SLIDES[current].title}
        />
      </div>
    </div>
  );
};
