// Blueprint prose content — expanded IP valuation document text
// Each section key matches the id used in SECTION_LIST and the page.tsx routing

export interface ProseCallout {
  type: 'insight' | 'equation' | 'warning' | 'citation'
  title: string
  text: string
}

export interface ProseSubsection {
  id: string
  heading: string
  body: string[]
  callout?: ProseCallout
}

export interface SectionProse {
  intro: string[]
  subsections: ProseSubsection[]
  conclusion?: string[]
}

// Placeholder structure — agents will populate each section
export const SECTION_PROSE: Record<string, SectionProse> = {}
