/**
 * ZipMail -- PQC-encrypted email client component for Zipminator mobile.
 *
 * Dual-mode UI (novice / expert) following the SecureMessenger.tsx pattern.
 * Integrates PiiScannerService, KmsService, and EmailCryptoService via
 * the ZipMailService orchestration layer.
 *
 * Platform security stubs:
 *   - Android: FLAG_SECURE on Activity (prevents screenshots in email reader)
 *     TODO: NativeModules.ZipMailSecurity.enableSecureFlag()
 *   - iOS: UIApplicationUserDidTakeScreenshotNotification listener
 *     TODO: NativeModules.ZipMailSecurity.registerScreenshotListener()
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useExpertise } from '../context/ExpertiseContext';
import { zipMailService } from '../services/ZipMailService';
import type {
    EmailMessage,
    ComposeState,
    PiiWarning,
    MailView,
} from '../types/email';
import { INITIAL_COMPOSE } from './mail/mailViewProps';
import NoviceMailView from './mail/NoviceMailView';
import ExpertMailView from './mail/ExpertMailView';

// ── Component ───────────────────────────────────────────────────────────────

export default function ZipMail() {
    const { mode } = useExpertise();

    // Navigation state
    const [currentView, setCurrentView] = useState<MailView>('inbox');
    const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
    const [decryptedBody, setDecryptedBody] = useState<string | null>(null);
    const [remainingTtl, setRemainingTtl] = useState<number>(-1);

    // Inbox state
    const [inbox, setInbox] = useState<EmailMessage[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Compose state
    const [compose, setCompose] = useState<ComposeState>(INITIAL_COMPOSE);
    const [sendStatus, setSendStatus] = useState<string | null>(null);

    // ── Service events ──────────────────────────────────────────────────────

    useEffect(() => {
        const onPiiScan = (evt: { warnings: PiiWarning[] }) => {
            setCompose((prev) => ({ ...prev, piiWarnings: evt.warnings }));
        };

        const onProgress = (evt: { stage: string }) => {
            setSendStatus(evt.stage);
        };

        const onSendComplete = () => {
            setSendStatus(null);
            setCompose(INITIAL_COMPOSE);
            setCurrentView('inbox');
            loadInbox();
        };

        const onSendError = (evt: { error: string }) => {
            setSendStatus(`Error: ${evt.error}`);
            setCompose((prev) => ({ ...prev, isSending: false }));
        };

        const onInboxRefresh = (evt: { messages: EmailMessage[] }) => {
            setInbox(evt.messages);
        };

        zipMailService.on('pii_scan', onPiiScan);
        zipMailService.on('send_progress', onProgress);
        zipMailService.on('send_complete', onSendComplete);
        zipMailService.on('send_error', onSendError);
        zipMailService.on('inbox_refresh', onInboxRefresh);

        // Initial load
        loadInbox();

        return () => {
            zipMailService.off('pii_scan', onPiiScan);
            zipMailService.off('send_progress', onProgress);
            zipMailService.off('send_complete', onSendComplete);
            zipMailService.off('send_error', onSendError);
            zipMailService.off('inbox_refresh', onInboxRefresh);
        };
    }, []);

    // ── Actions ─────────────────────────────────────────────────────────────

    const loadInbox = useCallback(async () => {
        setRefreshing(true);
        try {
            await zipMailService.getInbox();
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleSend = useCallback(async () => {
        setCompose((prev) => ({ ...prev, isSending: true }));
        try {
            await zipMailService.sendEmail(compose);
        } catch {
            // Error is handled via event
        }
    }, [compose]);

    const handleOpenEmail = useCallback(async (email: EmailMessage) => {
        setSelectedEmail(email);
        setDecryptedBody(null);
        setCurrentView('read');

        // Platform security: prevent screenshots while reading sensitive email
        // Android: NativeModules.ZipMailSecurity?.enableSecureFlag();
        // iOS: NativeModules.ZipMailSecurity?.registerScreenshotListener();

        try {
            const result = await zipMailService.openEmail(email);
            setDecryptedBody(result.body);
            setRemainingTtl(result.remainingTtl);
        } catch (err) {
            setDecryptedBody(`[Error: ${err instanceof Error ? err.message : 'Failed to decrypt'}]`);
        }
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        await zipMailService.deleteEmail(id);
        if (selectedEmail?.id === id) {
            setCurrentView('inbox');
            setSelectedEmail(null);
        }
    }, [selectedEmail]);

    const handleBodyChange = useCallback((text: string) => {
        setCompose((prev) => ({ ...prev, body: text }));
        zipMailService.scanForPii(text);
    }, []);

    const handleRedactPii = useCallback((warning: PiiWarning) => {
        setCompose((prev) => {
            const before = prev.body.substring(0, warning.startOffset);
            const after = prev.body.substring(warning.endOffset);
            const redacted = '[REDACTED]';
            const newBody = before + redacted + after;

            // Re-scan after redaction
            zipMailService.scanForPii(newBody);

            return {
                ...prev,
                body: newBody,
                piiWarnings: prev.piiWarnings.filter((w) => w.patternId !== warning.patternId),
            };
        });
    }, []);

    const handleRedactAll = useCallback(() => {
        setCompose((prev) => {
            // Sort warnings by offset descending so replacements don't shift positions
            const sorted = [...prev.piiWarnings].sort((a, b) => b.startOffset - a.startOffset);
            let newBody = prev.body;
            for (const w of sorted) {
                newBody = newBody.substring(0, w.startOffset) + '[REDACTED]' + newBody.substring(w.endOffset);
            }
            zipMailService.scanForPii(newBody);
            return { ...prev, body: newBody, piiWarnings: [] };
        });
    }, []);

    const handleExpired = useCallback(() => {
        if (selectedEmail) {
            setDecryptedBody('[This message has self-destructed]');
        }
    }, [selectedEmail]);

    // ── Render ──────────────────────────────────────────────────────────────

    const viewProps = {
        currentView,
        setCurrentView,
        inbox,
        refreshing,
        loadInbox,
        compose,
        setCompose,
        sendStatus,
        selectedEmail,
        decryptedBody,
        remainingTtl,
        onSend: handleSend,
        onOpenEmail: handleOpenEmail,
        onDelete: handleDelete,
        onBodyChange: handleBodyChange,
        onRedactPii: handleRedactPii,
        onRedactAll: handleRedactAll,
        onExpired: handleExpired,
    };

    if (mode === 'novice') {
        return <NoviceMailView {...viewProps} />;
    }

    return <ExpertMailView {...viewProps} />;
}
