/**
 * Tests for the AnonymizationPanel component.
 *
 * Covers:
 * - Rendering when no attachments are present (null)
 * - Rendering attachment names and file sizes
 * - Level slider expanding / collapsing per row
 * - Anonymize button calls onAnonymize with correct index + level
 * - "Anonymize all" button triggers all pending rows
 * - Success state shows CheckCircle and replaces button
 * - Error state renders error message
 * - Quantum badge shown for levels 7-10
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnonymizationPanel from '../AnonymizationPanel'

// ── Mocks ─────────────────────────────────────────────────────────────────────

// framer-motion: render children immediately without animation
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(name: string, sizeBytes = 1024): File {
  const blob = new Blob(['x'.repeat(sizeBytes)], { type: 'text/csv' })
  return new File([blob], name, { type: 'text/csv' })
}

const noop = vi.fn(() => Promise.resolve())

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AnonymizationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when attachments array is empty', () => {
    const { container } = render(
      <AnonymizationPanel attachments={[]} onAnonymize={noop} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders attachment file name', () => {
    const file = makeFile('report.csv')
    render(<AnonymizationPanel attachments={[file]} onAnonymize={noop} />)
    expect(screen.getByText('report.csv')).toBeInTheDocument()
  })

  it('renders file size in MB', () => {
    // 2048 bytes = 0.00 MB (rounded to 2dp)
    const file = makeFile('data.csv', 2048)
    render(<AnonymizationPanel attachments={[file]} onAnonymize={noop} />)
    expect(screen.getByText(/\d+\.\d{2} MB/)).toBeInTheDocument()
  })

  it('renders Anonymize button for each attachment', () => {
    const files = [makeFile('a.csv'), makeFile('b.csv')]
    render(<AnonymizationPanel attachments={files} onAnonymize={noop} />)
    const buttons = screen.getAllByRole('button', { name: /anonymize/i })
    // Each row has one "Anonymize" button; there may also be "Anonymize all"
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('shows "Anonymize all" button when multiple attachments present', () => {
    const files = [makeFile('a.csv'), makeFile('b.csv')]
    render(<AnonymizationPanel attachments={files} onAnonymize={noop} />)
    expect(screen.getByRole('button', { name: /anonymize all/i })).toBeInTheDocument()
  })

  it('does not show "Anonymize all" for a single attachment', () => {
    render(<AnonymizationPanel attachments={[makeFile('solo.csv')]} onAnonymize={noop} />)
    expect(screen.queryByRole('button', { name: /anonymize all/i })).toBeNull()
  })

  it('calls onAnonymize with correct fileIndex and default level 5', async () => {
    const onAnonymize = vi.fn(() => Promise.resolve())
    const files = [makeFile('report.csv')]
    render(<AnonymizationPanel attachments={files} onAnonymize={onAnonymize} />)

    const btn = screen.getByRole('button', { name: /^anonymize$/i })
    await userEvent.click(btn)

    await waitFor(() => {
      expect(onAnonymize).toHaveBeenCalledWith(0, 5)
    })
  })

  it('expands level controls when chevron is clicked', async () => {
    render(<AnonymizationPanel attachments={[makeFile('data.csv')]} onAnonymize={noop} />)
    // Initially, the slider section is collapsed
    expect(screen.queryByRole('slider')).toBeNull()

    const chevron = screen.getByRole('button', { name: '' }) // ChevronDown has no text
    // Find the toggle button — it's the one that is not "Anonymize"
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(
      (b) => !b.textContent?.toLowerCase().includes('anonymize')
    )!
    await userEvent.click(toggleBtn)

    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('level description updates when slider moves', async () => {
    render(<AnonymizationPanel attachments={[makeFile('data.csv')]} onAnonymize={noop} />)
    // Expand
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(
      (b) => !b.textContent?.toLowerCase().includes('anonymize')
    )!
    await userEvent.click(toggleBtn)

    const slider = screen.getByRole('slider')
    // Move to level 7
    fireEvent.change(slider, { target: { value: '7' } })
    expect(await screen.findByText(/quantum jitter/i)).toBeInTheDocument()
  })

  it('shows Robindra tier badge for levels 7-10', async () => {
    render(<AnonymizationPanel attachments={[makeFile('data.csv')]} onAnonymize={noop} />)
    // Expand
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(
      (b) => !b.textContent?.toLowerCase().includes('anonymize')
    )!
    await userEvent.click(toggleBtn)

    const slider = screen.getByRole('slider')
    for (const level of [7, 8, 9, 10]) {
      fireEvent.change(slider, { target: { value: String(level) } })
      expect(await screen.findByText(/robindra tier/i)).toBeInTheDocument()
    }
  })

  it('does not show Robindra badge for levels 1-6', async () => {
    render(<AnonymizationPanel attachments={[makeFile('data.csv')]} onAnonymize={noop} />)
    const allButtons = screen.getAllByRole('button')
    const toggleBtn = allButtons.find(
      (b) => !b.textContent?.toLowerCase().includes('anonymize')
    )!
    await userEvent.click(toggleBtn)

    const slider = screen.getByRole('slider')
    for (const level of [1, 2, 3, 4, 5, 6]) {
      fireEvent.change(slider, { target: { value: String(level) } })
      expect(screen.queryByText(/robindra tier/i)).toBeNull()
    }
  })

  it('shows success state after onAnonymize resolves', async () => {
    const onAnonymize = vi.fn(() => Promise.resolve())
    render(<AnonymizationPanel attachments={[makeFile('emp.csv')]} onAnonymize={onAnonymize} />)

    await userEvent.click(screen.getByRole('button', { name: /^anonymize$/i }))

    await waitFor(() => {
      expect(screen.getByText(/anonymized at L5/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^anonymize$/i })).toBeNull()
    })
  })

  it('shows error message when onAnonymize rejects', async () => {
    const onAnonymize = vi.fn(() => Promise.reject(new Error('Server error')))
    render(<AnonymizationPanel attachments={[makeFile('bad.csv')]} onAnonymize={onAnonymize} />)

    await userEvent.click(screen.getByRole('button', { name: /^anonymize$/i }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('shows "All secure" when every attachment is anonymized', async () => {
    const onAnonymize = vi.fn(() => Promise.resolve())
    const files = [makeFile('x.csv')]
    render(<AnonymizationPanel attachments={files} onAnonymize={onAnonymize} />)

    await userEvent.click(screen.getByRole('button', { name: /^anonymize$/i }))

    await waitFor(() => {
      expect(screen.getByText(/all secure/i)).toBeInTheDocument()
    })
  })

  it('"Anonymize all" calls onAnonymize for every attachment', async () => {
    const onAnonymize = vi.fn(() => Promise.resolve())
    const files = [makeFile('a.csv'), makeFile('b.csv'), makeFile('c.csv')]
    render(<AnonymizationPanel attachments={files} onAnonymize={onAnonymize} />)

    await userEvent.click(screen.getByRole('button', { name: /anonymize all/i }))

    await waitFor(() => {
      expect(onAnonymize).toHaveBeenCalledTimes(3)
      expect(onAnonymize).toHaveBeenCalledWith(0, 5)
      expect(onAnonymize).toHaveBeenCalledWith(1, 5)
      expect(onAnonymize).toHaveBeenCalledWith(2, 5)
    })
  })
})
