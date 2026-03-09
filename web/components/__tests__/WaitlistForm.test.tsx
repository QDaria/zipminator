import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WaitlistForm from '../WaitlistForm'

// Mock next-auth/react
const mockUseSession = vi.fn()
const mockSignIn = vi.fn()

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('WaitlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders sign-in card when unauthenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<WaitlistForm />)

    expect(screen.getByText('Sign in to join')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()
    expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument()
  })

  it('shows loading spinner during auth check', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })

    const { container } = render(<WaitlistForm />)

    // Loader2 renders as an SVG with animate-spin class
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders form with auto-filled fields when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Jane Smith', email: 'jane@acme.com' },
      },
      status: 'authenticated',
    })

    render(<WaitlistForm />)

    expect(screen.getByText('Signed in as jane@acme.com')).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement
    expect(nameInput.value).toBe('Jane Smith')
    expect(nameInput.readOnly).toBe(true)

    const emailInput = screen.getByLabelText(/Work Email/i) as HTMLInputElement
    expect(emailInput.value).toBe('jane@acme.com')
    expect(emailInput.readOnly).toBe(true)
  })

  it('calls signIn with provider and callbackUrl on OAuth button click', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    const user = userEvent.setup()

    render(<WaitlistForm />)

    await user.click(screen.getByText('Continue with Google'))
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/#waitlist' })
  })

  it('submits form with userId from session', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-42', name: 'Jane Smith', email: 'jane@acme.com' },
      },
      status: 'authenticated',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, submissionId: 'sub-1' }),
    })

    const user = userEvent.setup()
    render(<WaitlistForm />)

    // Fill required fields that aren't auto-filled
    await user.type(screen.getByLabelText(/Company/i), 'Acme Corp')
    await user.selectOptions(screen.getByLabelText(/Industry/i), 'banking')
    await user.selectOptions(screen.getByLabelText(/Expected Volume/i), '10k-100k')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({
        method: 'POST',
      }))
    })

    // Verify userId was included in the payload
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.userId).toBe('user-42')
    expect(callBody.email).toBe('jane@acme.com')
    expect(callBody.fullName).toBe('Jane Smith')
  })

  it('shows duplicate message on 409 response', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Jane', email: 'jane@acme.com' },
      },
      status: 'authenticated',
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Duplicate', code: 'DUPLICATE_EMAIL' }),
    })

    const user = userEvent.setup()
    render(<WaitlistForm />)

    await user.type(screen.getByLabelText(/Company/i), 'Acme')
    await user.selectOptions(screen.getByLabelText(/Industry/i), 'banking')
    await user.selectOptions(screen.getByLabelText(/Expected Volume/i), '<10k')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/already on the waitlist/i)).toBeInTheDocument()
    })
  })

  it('shows success state after successful submission', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'Jane', email: 'jane@acme.com' },
      },
      status: 'authenticated',
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const user = userEvent.setup()
    render(<WaitlistForm />)

    await user.type(screen.getByLabelText(/Company/i), 'Acme')
    await user.selectOptions(screen.getByLabelText(/Industry/i), 'banking')
    await user.selectOptions(screen.getByLabelText(/Expected Volume/i), '<10k')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Join the Beta Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/You're on the list!/i)).toBeInTheDocument()
    })
  })
})
