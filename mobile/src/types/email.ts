/**
 * Email type definitions for the ZipMail component.
 *
 * Shared between novice and expert UIs, the ZipMailService orchestration
 * layer, and the self-destruct / PII subsystems.
 */

// ── Enumerations ────────────────────────────────────────────────────────────

export type SelfDestructMode = 'after_send' | 'after_read' | 'read_once' | 'none';

export type EncryptionLevel = 'none' | 'tls' | 'pqc';

export type PiiSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// ── Email message ───────────────────────────────────────────────────────────

export interface SelfDestructConfig {
    mode: SelfDestructMode;
    /** Unix-ms timestamp when the message expires (absolute). */
    expiresAt?: number;
    /** Seconds after read before destruction (for after_read / read_once). */
    postReadTtl?: number;
}

export interface EmailMessage {
    id: string;
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
    /** Unix-ms timestamp. */
    timestamp: number;
    encryption: EncryptionLevel;
    selfDestruct?: SelfDestructConfig;
    isRead: boolean;
    hasAttachments: boolean;
    /** Hex-encoded composite key fingerprint. */
    fingerprint?: string;
    /** Whether this message is under legal/compliance hold (prevents destruction). */
    legalHold?: boolean;
}

// ── PII warnings ────────────────────────────────────────────────────────────

export interface PiiWarning {
    patternId: string;
    patternName: string;
    severity: PiiSeverity;
    matchedText: string;
    startOffset: number;
    endOffset: number;
    /** Human-readable suggestion for remediation. */
    suggestion: string;
}

// ── Compose state ───────────────────────────────────────────────────────────

export interface ComposeState {
    to: string;
    cc: string;
    subject: string;
    body: string;
    encryption: EncryptionLevel;
    selfDestructMode: SelfDestructMode;
    /** TTL in seconds for self-destruct timer. */
    selfDestructTtl: number;
    piiWarnings: PiiWarning[];
    isSending: boolean;
}

// ── View navigation ─────────────────────────────────────────────────────────

export type MailView = 'inbox' | 'compose' | 'read' | 'keys';
