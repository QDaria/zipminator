'use client'

import { motion } from 'framer-motion'
import SlideWrapper from '../SlideWrapper'
import { RISK_MATRIX } from '@/lib/pitch-data'
import type { Scenario } from '@/lib/pitch-data'
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Leaf } from 'lucide-react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'

import { fadeUpInView as fadeUp } from '../slide-utils'

const LEVEL_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-500' },
  medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  low: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-500' },
}

function Badge({ level, label }: { level: string; label: string }) {
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.low
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  )
}

function severityScore(impact: string, probability: string): { label: string; color: string } {
  const scores: Record<string, number> = { high: 3, medium: 2, low: 1 }
  const score = (scores[impact] ?? 1) * (scores[probability] ?? 1)
  if (score >= 6) return { label: 'Critical', color: 'text-red-400' }
  if (score >= 4) return { label: 'Elevated', color: 'text-yellow-400' }
  return { label: 'Manageable', color: 'text-green-400' }
}

// Opportunity reframing for each risk
const OPPORTUNITY_MAP: Record<string, string> = {
  'Quantum timeline accelerates faster than expected':
    'Validates our approach; increases urgency for customers to adopt PQC now',
  'Big tech enters PQC consumer market':
    'Market validation; expands total addressable market; we differentiate on super-app integration',
  'NIST algorithm vulnerabilities discovered':
    'Crypto-agile architecture becomes premium differentiator; competitors locked into single algorithms',
  'Key person dependency':
    'Forces documentation-first culture that scales better long-term',
  'Regulatory changes':
    'Compliance mandates accelerate enterprise adoption; NIST-native positioning is an advantage',
  'Open source sustainability':
    'Community contributions reduce engineering cost; builds trust and adoption',
  'User adoption challenges':
    'Freemium model builds network effects; each user strengthens the platform',
  'Climate & sustainability regulation tightens':
    'Norwegian 98% renewable infrastructure is a competitive moat; PQC is inherently energy-efficient',
}

// 8th risk added inline
const EXTRA_RISK = {
  risk: 'Climate & sustainability regulation tightens',
  impact: 'medium' as const,
  probability: 'high' as const,
  mitigation: 'Norwegian 98% renewable infrastructure; PQC inherently ~1000x more energy-efficient than RSA; carbon-neutral data centers (Green Mountain, Digiplex)',
}

const ALL_RISKS = [...RISK_MATRIX, EXTRA_RISK]

export default function RiskSlide({ scenario: _scenario = 'base' }: { scenario?: Scenario }) {
  const highRisks = ALL_RISKS.filter((r) => r.impact === 'high').length
  const totalRisks = ALL_RISKS.length

  return (
    <SlideWrapper>
      {/* Header */}
      <motion.div {...fadeUp()} className="text-center mb-10">
        <p className="text-quantum-400 font-mono text-sm tracking-widest uppercase mb-3">
          Risk Analysis
        </p>
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-3">
          Risks, <span className="gradient-text">Mitigations &amp; Opportunities</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Every risk has a concrete mitigation plan and an opportunity reframing
        </p>
      </motion.div>

      {/* Summary Badges */}
      <motion.div {...fadeUp(0.05)} className="flex items-center justify-center gap-4 mb-6">
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-xl font-bold text-white font-mono">{highRisks}</p>
            <p className="text-xs text-gray-400">High-Impact</p>
          </div>
        </div>
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <ShieldAlert className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-xl font-bold text-white font-mono">{totalRisks}</p>
            <p className="text-xs text-gray-400">Risks Tracked</p>
          </div>
        </div>
        <div className="card-quantum flex items-center gap-3 px-5 py-3">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-xl font-bold text-white font-mono">{totalRisks}/{totalRisks}</p>
            <p className="text-xs text-gray-400">Mitigated</p>
          </div>
        </div>
      </motion.div>

      {/* Severity Heat Map Legend */}
      <motion.div {...fadeUp(0.07)} className="flex items-center justify-center gap-6 mb-8">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical (high x high/med)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Elevated (med x med)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span>Manageable (low probability)</span>
        </div>
      </motion.div>

      {/* Risk Matrix Scatter Plot */}
      <motion.div {...fadeUp(0.08)} className="card-quantum mb-8">
        <h4 className="text-sm font-semibold text-white mb-4">Risk Matrix</h4>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            {/* Heatmap background zones */}
            {/* Green zones (low) */}
            <ReferenceArea x1={0.5} x2={1.5} y1={0.5} y2={1.5} fill="rgba(34, 197, 94, 0.10)" fillOpacity={1} label={{ value: 'LOW', fill: 'rgba(34,197,94,0.3)', fontSize: 10, fontFamily: 'monospace', position: 'center' }} />
            <ReferenceArea x1={0.5} x2={1.5} y1={1.5} y2={2.5} fill="rgba(34, 197, 94, 0.10)" fillOpacity={1} />
            <ReferenceArea x1={0.5} x2={1.5} y1={2.5} y2={3.5} fill="rgba(234, 179, 8, 0.10)" fillOpacity={1} label={{ value: 'MED', fill: 'rgba(234,179,8,0.35)', fontSize: 10, fontFamily: 'monospace', position: 'center' }} />
            <ReferenceArea x1={1.5} x2={2.5} y1={0.5} y2={1.5} fill="rgba(34, 197, 94, 0.10)" fillOpacity={1} />
            <ReferenceArea x1={2.5} x2={3.5} y1={0.5} y2={1.5} fill="rgba(34, 197, 94, 0.10)" fillOpacity={1} />
            {/* Yellow zones */}
            <ReferenceArea x1={1.5} x2={2.5} y1={1.5} y2={2.5} fill="rgba(234, 179, 8, 0.10)" fillOpacity={1} label={{ value: 'MED', fill: 'rgba(234,179,8,0.35)', fontSize: 10, fontFamily: 'monospace', position: 'center' }} />
            <ReferenceArea x1={2.5} x2={3.5} y1={1.5} y2={2.5} fill="rgba(239, 68, 68, 0.12)" fillOpacity={1} label={{ value: 'HIGH', fill: 'rgba(239,68,68,0.35)', fontSize: 10, fontFamily: 'monospace', position: 'center' }} />
            {/* Red zones */}
            <ReferenceArea x1={1.5} x2={2.5} y1={2.5} y2={3.5} fill="rgba(239, 68, 68, 0.12)" fillOpacity={1} label={{ value: 'HIGH', fill: 'rgba(239,68,68,0.35)', fontSize: 10, fontFamily: 'monospace', position: 'center' }} />
            <ReferenceArea x1={2.5} x2={3.5} y1={2.5} y2={3.5} fill="rgba(239, 68, 68, 0.12)" fillOpacity={1} label={{ value: 'CRITICAL', fill: 'rgba(239,68,68,0.4)', fontSize: 9, fontFamily: 'monospace', position: 'center' }} />

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              type="number"
              dataKey="probability"
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(v: number) => v === 1 ? 'Low' : v === 2 ? 'Med' : 'High'}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              label={{ value: 'Probability', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' } }}
            />
            <YAxis
              type="number"
              dataKey="impact"
              domain={[0.5, 3.5]}
              ticks={[1, 2, 3]}
              tickFormatter={(v: number) => v === 1 ? 'Low' : v === 2 ? 'Med' : 'High'}
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              label={{ value: 'Impact', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#6b7280', fontSize: 11, fontFamily: 'monospace' } }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => {
                if (name === 'probability' || name === 'impact') {
                  return [value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High', String(name).charAt(0).toUpperCase() + String(name).slice(1)]
                }
                return [value, name]
              }}
              labelFormatter={() => ''}
            />
            <Scatter
              data={ALL_RISKS.map((r) => ({
                probability: r.probability === 'high' ? 3 : r.probability === 'medium' ? 2 : 1,
                impact: r.impact === 'high' ? 3 : r.impact === 'medium' ? 2 : 1,
                name: r.risk.split(' ').slice(0, 3).join(' ') + '...',
                z: r.impact === 'high' ? 200 : r.impact === 'medium' ? 150 : 100,
              }))}
              animationDuration={1500}
              shape={(props: { cx?: number; cy?: number; payload?: { z: number; name: string; impact: number } }) => {
                const { cx = 0, cy = 0, payload } = props
                const size = (payload?.impact ?? 1) === 3 ? 15 : (payload?.impact ?? 1) === 2 ? 12 : 9
                const color = (payload?.impact ?? 1) === 3 ? '#ef4444' : (payload?.impact ?? 1) === 2 ? '#eab308' : '#22c55e'
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={size} fill={color} fillOpacity={0.5} stroke={color} strokeWidth={1.5} />
                    <circle cx={cx} cy={cy} r={size * 0.4} fill={color} fillOpacity={0.9} />
                    <text x={cx} y={cy - size - 4} textAnchor="middle" fill="#d1d5db" fontSize={9} fontFamily="monospace">{payload?.name}</text>
                  </g>
                )
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {ALL_RISKS.map((item, i) => {
          const severity = severityScore(item.impact, item.probability)
          const opportunity = OPPORTUNITY_MAP[item.risk]
          const isClimate = item.risk.includes('Climate')

          return (
            <motion.div
              key={item.risk}
              {...fadeUp(0.1 + i * 0.04)}
              className="card-quantum"
            >
              <div className="flex flex-col gap-3">
                {/* Top row: risk + badges */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge level={item.impact} label={`Impact: ${item.impact}`} />
                      <Badge level={item.probability} label={`Prob: ${item.probability}`} />
                      <span className={`text-[11px] font-mono font-bold ${severity.color}`}>
                        {severity.label}
                      </span>
                      {isClimate && <Leaf className="w-3.5 h-3.5 text-green-400" />}
                    </div>
                    <h4 className="text-sm font-semibold text-white leading-snug">
                      {item.risk}
                    </h4>
                  </div>

                  {/* Mitigation */}
                  <div className="sm:w-[50%] shrink-0 rounded-lg bg-green-500/[0.06] border border-green-500/10 px-4 py-3">
                    <p className="text-xs font-mono text-green-400/80 uppercase tracking-wider mb-1">
                      Mitigation
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {item.mitigation}
                    </p>
                  </div>
                </div>

                {/* Opportunity reframing */}
                {opportunity && (
                  <div className="rounded-lg bg-quantum-500/[0.04] border border-quantum-500/10 px-4 py-2.5 flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-quantum-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-mono text-quantum-400/80 uppercase tracking-wider mb-0.5">
                        Opportunity
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {opportunity}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom Note */}
      <motion.p
        {...fadeUp(0.4)}
        className="text-center text-xs text-gray-500 mt-6 font-mono"
      >
        Risk matrix reviewed quarterly. Crypto-agile architecture is the primary systemic hedge.
      </motion.p>
    </SlideWrapper>
  )
}
