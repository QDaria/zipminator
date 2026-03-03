/**
 * Shared props, types, and helpers for NoviceMailView and ExpertMailView.
 */

import type React from 'react';
import type {
    EmailMessage,
    ComposeState,
    PiiWarning,
    MailView,
} from '../../types/email';

// ── Shared props type ───────────────────────────────────────────────────────

export interface MailViewProps {
    currentView: MailView;
    setCurrentView: (v: MailView) => void;
    inbox: EmailMessage[];
    refreshing: boolean;
    loadInbox: () => void;
    compose: ComposeState;
    setCompose: React.Dispatch<React.SetStateAction<ComposeState>>;
    sendStatus: string | null;
    selectedEmail: EmailMessage | null;
    decryptedBody: string | null;
    remainingTtl: number;
    onSend: () => void;
    onOpenEmail: (email: EmailMessage) => void;
    onDelete: (id: string) => void;
    onBodyChange: (text: string) => void;
    onRedactPii: (warning: PiiWarning) => void;
    onRedactAll: () => void;
    onExpired: () => void;
}

// ── Shared constants ────────────────────────────────────────────────────────

export const INITIAL_COMPOSE: ComposeState = {
    to: '',
    cc: '',
    subject: '',
    body: '',
    encryption: 'pqc',
    selfDestructMode: 'none',
    selfDestructTtl: 86400,
    piiWarnings: [],
    isSending: false,
};

// ── Shared helpers ──────────────────────────────────────────────────────────

export function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 60_000) return 'just now';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return `${Math.floor(diff / 86400_000)}d ago`;
}

export function senderName(email: string): string {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/[._-]/g, ' ');
}

export function previewText(body: string, max: number = 60): string {
    const clean = body.replace(/\s+/g, ' ').trim();
    return clean.length > max ? clean.substring(0, max) + '...' : clean;
}
