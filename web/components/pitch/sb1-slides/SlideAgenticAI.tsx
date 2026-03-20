'use client';

import React from 'react';
import { SlideWrapper, SlideTitle } from '../pitch-ui/SB1SlideWrapper';
import { MetricCard, Tag } from '../pitch-ui/MetricCard';
import { SpeakerNotes } from '../pitch-ui/SpeakerNotes';
import { type Scenario } from '@/lib/sb1-chart-data';
import { SPEAKER_NOTES } from '@/lib/sb1-speaker-notes';

interface SlideAgenticAIProps {
  scenario: Scenario;
}

const agentCategories = [
  {
    category: 'Kode & Utvikling',
    agents: ['coder', 'reviewer', 'tester', 'architect', 'debugger'],
    color: '#22D3EE',
    sb1Use: 'Automatisert kodegjennomgang, sikkerhetstesting',
  },
  {
    category: 'Forskning & Analyse',
    agents: ['researcher', 'analyst', 'data-scientist', 'risk-modeler'],
    color: '#F59E0B',
    sb1Use: 'Markedsanalyse, regulatorisk forskning, risikovurdering',
  },
  {
    category: 'Compliance & Sikkerhet',
    agents: ['security-auditor', 'compliance-scanner', 'pii-detector', 'fraud-analyst'],
    color: '#FB7185',
    sb1Use: 'DORA-sjekk, PII-skanning, svindelovervaking',
  },
  {
    category: 'Dokument & Kommunikasjon',
    agents: ['doc-writer', 'translator', 'report-generator', 'email-drafter'],
    color: '#34D399',
    sb1Use: 'Rapportgenerering, regulatorisk dokumentasjon',
  },
  {
    category: 'Orkestrasjon & Swarming',
    agents: ['queen-coordinator', 'mesh-coordinator', 'task-orchestrator', 'memory-manager'],
    color: '#A78BFA',
    sb1Use: 'Multi-agent oppgavesplitting, parallell prosessering',
  },
];

const dailyWorkflow = [
  { time: '08:00', task: 'Compliance-agent sjekker nye DORA-oppdateringer', agent: 'compliance-scanner' },
  { time: '09:00', task: 'Risiko-agent analyserer posisjonsendringer over natt', agent: 'risk-modeler' },
  { time: '10:00', task: 'Svindel-agent flagger uvanlige transaksjoner', agent: 'fraud-analyst' },
  { time: '14:00', task: 'Forsker-agent oppsummerer kvantenyheter for teamet', agent: 'researcher' },
  { time: '16:00', task: 'Rapport-agent genererer daglig styrenotat', agent: 'report-generator' },
];

export const SlideAgenticAI: React.FC<SlideAgenticAIProps> = () => {
  return (
    <SlideWrapper>
      <div className="flex flex-col h-full px-12 py-10">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-mono text-violet-400 tracking-wider uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            AI-infrastruktur
          </span>
          <Tag color="cyan">200+ Agenter · Personlig AI-assistent</Tag>
        </div>

        <SlideTitle
          eyebrow="Agentisk AI-plattform"
          title="200 spesialiserte AI-agenter. En personlig assistent per ansatt."
          subtitle="QDaria har bygget en enterprise-klar AI-orkestreringsplattform med 200+ spesialiserte agenter, skill-system og swarm-intelligens. Hver SB1-ansatt kan fa sin egen AI-assistent som hjelper med daglige oppgaver."
          accentColor="#A78BFA"
        />

        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left: Agent catalog */}
          <div className="col-span-7 flex flex-col gap-3">
            <p
              className="text-violet-400 text-xs font-mono tracking-wider uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Agentkatalog — utvalg av 200+
            </p>
            <div className="space-y-2">
              {agentCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="rounded-lg p-3"
                  style={{
                    background: `${cat.color}06`,
                    border: `1px solid ${cat.color}25`,
                    boxShadow: `0 0 12px ${cat.color}08`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: cat.color }}
                        />
                        <span
                          className="text-xs font-mono font-semibold"
                          style={{ color: cat.color, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {cat.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {cat.agents.map((a) => (
                          <span
                            key={a}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              color: '#94A3B8',
                              background: 'rgba(15,22,41,0.5)',
                              border: '1px solid rgba(148,163,184,0.15)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p
                      className="text-xs text-slate-400 leading-snug max-w-[200px] text-right"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {cat.sb1Use}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Daily workflow + metrics */}
          <div className="col-span-5 flex flex-col gap-3">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard value="200+" label="Spesialiserte agenter" sublabel="Kode, forskning, compliance, analyse" color="cyan" />
              <MetricCard value="1:1" label="Personlig AI-assistent" sublabel="Per SB1-ansatt" color="amber" />
            </div>

            {/* Daily workflow example */}
            <div
              className="rounded-lg overflow-hidden flex-1"
              style={{ border: '1px solid rgba(167,139,250,0.3)', boxShadow: '0 0 20px rgba(167,139,250,0.08)' }}
            >
              <div
                className="px-4 py-2.5 border-b"
                style={{ background: 'rgba(167,139,250,0.06)', borderColor: 'rgba(167,139,250,0.15)' }}
              >
                <span
                  className="text-violet-400 text-xs font-mono tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  En dag med AI-assistenten (SB1-eksempel)
                </span>
              </div>
              <div className="p-3 space-y-2">
                {dailyWorkflow.map((w) => (
                  <div key={w.time} className="flex gap-3 items-start">
                    <span
                      className="text-cyan-400 text-xs font-mono shrink-0 w-10"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {w.time}
                    </span>
                    <div className="flex-1">
                      <p
                        className="text-slate-300 text-xs leading-snug"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {w.task}
                      </p>
                      <span
                        className="text-[10px] font-mono text-slate-500"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        agent: {w.agent}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div
              className="rounded-lg p-3"
              style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)' }}
            >
              <p
                className="text-cyan-400 text-xs font-mono tracking-wider uppercase mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Teknisk plattform
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Ruflo Orkestrasjon', 'Claude Opus 4', 'Swarm Intelligence', 'Skills System', 'MCP Protocol', 'AgentDB'].map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2 py-1 rounded"
                    style={{
                      color: '#22D3EE',
                      background: 'rgba(34,211,238,0.08)',
                      border: '1px solid rgba(34,211,238,0.2)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpeakerNotes notes={SPEAKER_NOTES[101]} />
    </SlideWrapper>
  );
};
