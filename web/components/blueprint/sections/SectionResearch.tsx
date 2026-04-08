'use client'

import { motion } from 'framer-motion'
import { RESEARCH_PAPERS, PLATFORM_EVIDENCE } from '@/lib/blueprint-data'
import { SECTION_PROSE } from '@/lib/blueprint-prose'
import { ProseBlock, CalloutBlock, Subsection } from '@/components/blueprint/BlueprintSection'

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status.toLowerCase().includes('pending') || status.toLowerCase().includes('strengthened')
  return (
    <span
      className="text-[10px] font-mono px-2 py-0.5 rounded-full"
      style={{
        fontFamily: 'var(--font-jetbrains)',
        background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(34,211,238,0.15)',
        color: isActive ? '#F59E0B' : '#22D3EE',
      }}
    >
      {status}
    </span>
  )
}

export const SectionResearch = () => {
  const prose = SECTION_PROSE.research

  return (
    <div className="space-y-10">
      {/* Intro prose */}
      {prose && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <ProseBlock paragraphs={prose.intro} />
        </motion.div>
      )}

      {/* Subsection A: Academic Strategy */}
      {prose?.subsections[0] && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Subsection heading={prose.subsections[0].heading}>
            <ProseBlock paragraphs={prose.subsections[0].body} />
            {prose.subsections[0].callout && (
              <CalloutBlock
                type={prose.subsections[0].callout.type}
                title={prose.subsections[0].callout.title}
                text={prose.subsections[0].callout.text}
              />
            )}
          </Subsection>
        </motion.div>
      )}

      {/* Platform Evidence Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { label: 'Passing Tests', value: PLATFORM_EVIDENCE.tests.toLocaleString(), color: '#22D3EE' },
          { label: 'Quantum Entropy', value: PLATFORM_EVIDENCE.quantumEntropy, color: '#F59E0B' },
          { label: 'Prior Art Searches', value: String(PLATFORM_EVIDENCE.priorArtSearches), color: '#34D399' },
          { label: 'Prior Art Found', value: String(PLATFORM_EVIDENCE.priorArtResults), color: '#ef4444' },
          { label: 'Total Claims', value: String(PLATFORM_EVIDENCE.totalClaims), color: '#A78BFA' },
          { label: 'Platforms', value: String(PLATFORM_EVIDENCE.platforms), color: '#FB7185' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="rounded-xl p-4 text-center border"
            style={{
              background: `linear-gradient(135deg, ${item.color}06, ${item.color}02)`,
              borderColor: `${item.color}20`,
            }}
          >
            <p className="text-2xl font-bold" style={{ color: item.color, fontFamily: 'var(--font-jetbrains)' }}>
              {item.value}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Paper Cards interleaved with prose subsections B, C, D */}
      <div className="space-y-8">
        {RESEARCH_PAPERS.map((paper, i) => {
          // Map paper index to prose subsection: paper 0 -> subsection 1 (B), paper 1 -> subsection 2 (C), paper 2 -> subsection 3 (D)
          const proseSub = prose?.subsections[i + 1]

          return (
            <div key={paper.id} className="space-y-6">
              {/* Paper Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-xl p-6 border"
                style={{
                  background: 'rgba(15,23,42,0.5)',
                  borderColor: `${paper.color}20`,
                  borderLeftWidth: '4px',
                  borderLeftColor: paper.color,
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                        style={{
                          background: `${paper.color}20`,
                          color: paper.color,
                          fontFamily: 'var(--font-jetbrains)',
                        }}
                      >
                        {paper.patent}
                      </span>
                      <StatusBadge status={paper.status} />
                    </div>

                    <h4 className="text-base font-semibold text-slate-100 mb-2" style={{ fontFamily: 'var(--font-fraunces)' }}>
                      {paper.title}
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      <div>
                        <span className="text-slate-500">ePrint</span>
                        <p className="text-slate-200 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>{paper.eprintId}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Target</span>
                        <p className="text-slate-200">{paper.targetVenue}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Deadline</span>
                        <p className="text-slate-200 font-mono" style={{ fontFamily: 'var(--font-jetbrains)' }}>{paper.deadline}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">GitHub</span>
                        <p className="text-slate-200 font-mono text-[11px]" style={{ fontFamily: 'var(--font-jetbrains)' }}>{paper.github}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {paper.keyContributions.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] text-slate-400 px-2 py-1 rounded-md"
                          style={{ background: 'rgba(255,255,255,0.04)', fontFamily: 'var(--font-dm-sans)' }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Prose subsection for this paper */}
              {proseSub && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Subsection heading={proseSub.heading}>
                    <ProseBlock paragraphs={proseSub.body} />
                    {proseSub.callout && (
                      <CalloutBlock
                        type={proseSub.callout.type}
                        title={proseSub.callout.title}
                        text={proseSub.callout.text}
                      />
                    )}
                  </Subsection>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Subsection E: Venue Strategy */}
      {prose?.subsections[4] && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Subsection heading={prose.subsections[4].heading}>
            <ProseBlock paragraphs={prose.subsections[4].body} />
            {prose.subsections[4].callout && (
              <CalloutBlock
                type={prose.subsections[4].callout.type}
                title={prose.subsections[4].callout.title}
                text={prose.subsections[4].callout.text}
              />
            )}
          </Subsection>
        </motion.div>
      )}

      {/* Subsection F: Academic Validators */}
      {prose?.subsections[5] && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Subsection heading={prose.subsections[5].heading}>
            <ProseBlock paragraphs={prose.subsections[5].body} />
            {prose.subsections[5].callout && (
              <CalloutBlock
                type={prose.subsections[5].callout.type}
                title={prose.subsections[5].callout.title}
                text={prose.subsections[5].callout.text}
              />
            )}
          </Subsection>
        </motion.div>
      )}

      {/* Quantum Source Callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl p-6 border"
        style={{
          background: 'rgba(34,211,238,0.04)',
          borderColor: 'rgba(34,211,238,0.15)',
        }}
      >
        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-jetbrains)' }}>
          Quantum Entropy Provenance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <p className="text-lg font-bold text-cyan-300" style={{ fontFamily: 'var(--font-jetbrains)' }}>6.8 MB</p>
            <p className="text-xs text-slate-400">Real quantum entropy</p>
            <p className="text-[10px] text-slate-500 mt-1">35 IBM jobs, ibm_kingston 156 qubits</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <p className="text-lg font-bold text-amber-400" style={{ fontFamily: 'var(--font-jetbrains)' }}>9 KB</p>
            <p className="text-xs text-slate-400">CSI WiFi entropy</p>
            <p className="text-[10px] text-slate-500 mt-1">Real wireless channel measurements</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
            <p className="text-lg font-bold text-emerald-400" style={{ fontFamily: 'var(--font-jetbrains)' }}>15 MB</p>
            <p className="text-xs text-slate-400">OS entropy pool</p>
            <p className="text-[10px] text-slate-500 mt-1">os.urandom, provenance-separated</p>
          </div>
        </div>
      </motion.div>

      {/* Conclusion prose */}
      {prose?.conclusion && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <ProseBlock paragraphs={prose.conclusion} />
        </motion.div>
      )}
    </div>
  )
}
