import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
} from 'react-native';
import type {
    EmailMessage,
    ComposeState,
    PiiWarning,
    EncryptionLevel,
} from '../../types/email';
import type { MailViewProps } from './mailViewProps';
import { INITIAL_COMPOSE, timeAgo } from './mailViewProps';
import { zipMailService } from '../../services/ZipMailService';
import PiiWarningPanel from './PiiWarningPanel';
import SelfDestructSelector from './SelfDestructSelector';
import CountdownTimer from './CountdownTimer';
import EncryptionIndicator from './EncryptionIndicator';

// ═══════════════════════════════════════════════════════════════════════════
// EXPERT MODE (CYBERPUNK)
// ═══════════════════════════════════════════════════════════════════════════

export default function ExpertMailView(props: MailViewProps) {
    const {
        currentView, setCurrentView, inbox, refreshing, loadInbox,
        compose, setCompose, sendStatus, selectedEmail, decryptedBody,
        remainingTtl, onSend, onOpenEmail, onDelete, onBodyChange,
        onRedactPii, onRedactAll, onExpired,
    } = props;

    return (
        <View className="flex-1 w-full bg-black/60 rounded-2xl border border-quantum-500/30 overflow-hidden mt-6 mb-10">
            {/* Expert Header */}
            <View className="bg-black p-4 border-b border-white/10">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-quantum-400 font-mono text-sm font-bold">
                        ZIPMAIL PQC TERMINAL
                    </Text>
                    <View className="flex-row">
                        {currentView !== 'inbox' && (
                            <TouchableOpacity onPress={() => setCurrentView('inbox')} className="mr-2">
                                <Text className="text-gray-500 font-mono text-[10px] underline">[INBOX]</Text>
                            </TouchableOpacity>
                        )}
                        {currentView !== 'compose' && (
                            <TouchableOpacity onPress={() => { setCompose(INITIAL_COMPOSE); setCurrentView('compose'); }} className="mr-2">
                                <Text className="text-green-400 font-mono text-[10px] underline">[NEW]</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setCurrentView('keys')}>
                            <Text className="text-yellow-400 font-mono text-[10px] underline">[KEYS]</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text className="text-gray-600 font-mono text-[9px]">
                    MODE: {currentView.toUpperCase()} | ENC: ML-KEM-768+X25519+Ed25519 | INBOX: {inbox.length}
                </Text>
            </View>

            {/* Views */}
            {currentView === 'inbox' && (
                <ExpertInbox inbox={inbox} refreshing={refreshing} loadInbox={loadInbox} onOpenEmail={onOpenEmail} />
            )}
            {currentView === 'compose' && (
                <ExpertCompose
                    compose={compose}
                    setCompose={setCompose}
                    sendStatus={sendStatus}
                    onSend={onSend}
                    onBodyChange={onBodyChange}
                    onRedactPii={onRedactPii}
                    onRedactAll={onRedactAll}
                />
            )}
            {currentView === 'read' && selectedEmail && (
                <ExpertReader
                    email={selectedEmail}
                    decryptedBody={decryptedBody}
                    remainingTtl={remainingTtl}
                    onExpired={onExpired}
                    onDelete={onDelete}
                />
            )}
            {currentView === 'keys' && <ExpertKeyManager />}
        </View>
    );
}

// ── Expert Inbox ────────────────────────────────────────────────────────────

function ExpertInbox({
    inbox, refreshing, loadInbox, onOpenEmail,
}: {
    inbox: EmailMessage[];
    refreshing: boolean;
    loadInbox: () => void;
    onOpenEmail: (e: EmailMessage) => void;
}) {
    return (
        <ScrollView
            className="flex-1"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInbox} />}
        >
            {/* Column headers */}
            <View className="flex-row px-2 py-1 border-b border-white/10 bg-black/40">
                <Text className="text-gray-600 font-mono text-[8px] w-6">ST</Text>
                <Text className="text-gray-600 font-mono text-[8px] flex-1">FROM</Text>
                <Text className="text-gray-600 font-mono text-[8px] w-20">ENC</Text>
                <Text className="text-gray-600 font-mono text-[8px] w-16">TTL</Text>
                <Text className="text-gray-600 font-mono text-[8px] w-12">AGE</Text>
            </View>

            {inbox.map((email) => (
                <TouchableOpacity
                    key={email.id}
                    onPress={() => onOpenEmail(email)}
                    className={`flex-row px-2 py-2 border-b border-white/5 ${
                        !email.isRead ? 'bg-quantum-900/10' : ''
                    }`}
                >
                    <Text className="text-gray-500 font-mono text-[9px] w-6">
                        {!email.isRead ? '>' : ' '}
                        {email.legalHold ? 'H' : ' '}
                    </Text>

                    <View className="flex-1 mr-1">
                        <Text className={`font-mono text-[9px] ${!email.isRead ? 'text-white' : 'text-gray-400'}`} numberOfLines={1}>
                            {email.from}
                        </Text>
                        <Text className="text-gray-600 font-mono text-[8px]" numberOfLines={1}>
                            {email.subject}
                        </Text>
                    </View>

                    <Text className={`font-mono text-[8px] w-20 ${
                        email.encryption === 'pqc' ? 'text-green-400' : email.encryption === 'tls' ? 'text-blue-400' : 'text-gray-600'
                    }`}>
                        {email.encryption === 'pqc' ? 'ML-KEM-768' : email.encryption === 'tls' ? 'TLS1.3' : 'PLAIN'}
                    </Text>

                    <Text className="text-orange-400 font-mono text-[8px] w-16">
                        {email.selfDestruct && email.selfDestruct.mode !== 'none' && email.selfDestruct.expiresAt
                            ? <CountdownTimer expiresAt={email.selfDestruct.expiresAt} onExpired={() => {}} compact />
                            : email.selfDestruct?.mode === 'read_once'
                            ? 'ONCE'
                            : '--'
                        }
                    </Text>

                    <Text className="text-gray-600 font-mono text-[8px] w-12">
                        {timeAgo(email.timestamp)}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

// ── Expert Compose ──────────────────────────────────────────────────────────

function ExpertCompose({
    compose, setCompose, sendStatus, onSend, onBodyChange, onRedactPii, onRedactAll,
}: {
    compose: ComposeState;
    setCompose: React.Dispatch<React.SetStateAction<ComposeState>>;
    sendStatus: string | null;
    onSend: () => void;
    onBodyChange: (text: string) => void;
    onRedactPii: (w: PiiWarning) => void;
    onRedactAll: () => void;
}) {
    const [showRawEnvelope, setShowRawEnvelope] = useState(false);

    return (
        <ScrollView className="flex-1 p-2">
            {/* Fields */}
            <View className="mb-1">
                <Text className="text-gray-600 font-mono text-[9px]">TO:</Text>
                <TextInput
                    value={compose.to}
                    onChangeText={(t) => setCompose((p) => ({ ...p, to: t }))}
                    placeholder="RECIPIENT@DOMAIN"
                    placeholderTextColor="#4b5563"
                    className="bg-black text-quantum-100 font-mono text-[10px] border-b border-white/20 py-1 px-1"
                    autoCapitalize="none"
                />
            </View>

            <View className="mb-1">
                <Text className="text-gray-600 font-mono text-[9px]">CC:</Text>
                <TextInput
                    value={compose.cc}
                    onChangeText={(t) => setCompose((p) => ({ ...p, cc: t }))}
                    placeholder="CC_RECIPIENTS"
                    placeholderTextColor="#4b5563"
                    className="bg-black text-quantum-100 font-mono text-[10px] border-b border-white/20 py-1 px-1"
                    autoCapitalize="none"
                />
            </View>

            <View className="mb-1">
                <Text className="text-gray-600 font-mono text-[9px]">SUBJECT:</Text>
                <TextInput
                    value={compose.subject}
                    onChangeText={(t) => setCompose((p) => ({ ...p, subject: t }))}
                    placeholder="MESSAGE_SUBJECT"
                    placeholderTextColor="#4b5563"
                    className="bg-black text-quantum-100 font-mono text-[10px] border-b border-white/20 py-1 px-1"
                />
            </View>

            {/* Encryption selector */}
            <View className="flex-row mt-2 mb-1">
                <Text className="text-gray-600 font-mono text-[9px] mr-2">ENC_LEVEL:</Text>
                {(['pqc', 'tls', 'none'] as EncryptionLevel[]).map((lvl) => (
                    <TouchableOpacity
                        key={lvl}
                        onPress={() => setCompose((p) => ({ ...p, encryption: lvl }))}
                        className={`px-2 py-0.5 border mr-1 ${
                            compose.encryption === lvl
                                ? 'border-quantum-400 bg-quantum-900/30'
                                : 'border-gray-700'
                        }`}
                    >
                        <Text className={`font-mono text-[9px] ${
                            compose.encryption === lvl ? 'text-quantum-400' : 'text-gray-600'
                        }`}>
                            {lvl.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Body */}
            <Text className="text-gray-600 font-mono text-[9px] mt-2">BODY:</Text>
            <TextInput
                value={compose.body}
                onChangeText={onBodyChange}
                placeholder="COMPOSE_BODY..."
                placeholderTextColor="#4b5563"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                className="bg-black text-quantum-100 font-mono text-[10px] border border-white/20 p-2 min-h-[100px]"
            />

            {/* PII scan results */}
            <PiiWarningPanel
                warnings={compose.piiWarnings}
                onRedact={onRedactPii}
                onRedactAll={onRedactAll}
            />

            {/* Self-destruct config */}
            <SelfDestructSelector
                mode={compose.selfDestructMode}
                ttlSeconds={compose.selfDestructTtl}
                onModeChange={(m) => setCompose((p) => ({ ...p, selfDestructMode: m }))}
                onTtlChange={(s) => setCompose((p) => ({ ...p, selfDestructTtl: s }))}
            />

            {/* Manual re-key */}
            <TouchableOpacity
                onPress={() => {
                    // TODO: Trigger recipient key refresh
                    // zipMailService.refreshRecipientKey(compose.to);
                }}
                className="mt-2 border border-yellow-500/30 py-1 items-center"
            >
                <Text className="text-yellow-400 font-mono text-[9px]">RE-KEY RECIPIENT PK</Text>
            </TouchableOpacity>

            {/* Raw envelope toggle */}
            <TouchableOpacity
                onPress={() => setShowRawEnvelope(!showRawEnvelope)}
                className="mt-1 border border-gray-700 py-1 items-center"
            >
                <Text className="text-gray-500 font-mono text-[9px]">
                    {showRawEnvelope ? 'HIDE' : 'SHOW'} RAW ENVELOPE (BASE64)
                </Text>
            </TouchableOpacity>

            {showRawEnvelope && (
                <View className="bg-black border border-gray-800 p-2 mt-1">
                    <Text className="text-gray-600 font-mono text-[8px]" selectable>
                        {compose.body ? btoa(compose.body) : '(empty)'}
                    </Text>
                </View>
            )}

            {/* Send */}
            <TouchableOpacity
                onPress={onSend}
                disabled={compose.isSending || !compose.to || !compose.body}
                className={`mt-3 py-2 items-center border ${
                    compose.isSending || !compose.to || !compose.body
                        ? 'border-gray-700 bg-gray-900'
                        : 'border-quantum-400 bg-quantum-600'
                }`}
            >
                <Text className={`font-mono font-bold text-sm ${
                    compose.isSending ? 'text-gray-600' : 'text-white'
                }`}>
                    {compose.isSending ? (sendStatus ?? 'SENDING...') : 'ENCRYPT_AND_SEND()'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ── Expert Reader ───────────────────────────────────────────────────────────

function ExpertReader({
    email, decryptedBody, remainingTtl, onExpired, onDelete,
}: {
    email: EmailMessage;
    decryptedBody: string | null;
    remainingTtl: number;
    onExpired: () => void;
    onDelete: (id: string) => void;
}) {
    const [showRaw, setShowRaw] = useState(false);

    return (
        <ScrollView className="flex-1 p-2">
            {/* Encryption indicator */}
            <EncryptionIndicator level={email.encryption} fingerprint={email.fingerprint} />

            {/* Metadata */}
            <View className="mt-2 border border-white/10 bg-black/40 p-2">
                <Text className="text-gray-500 font-mono text-[9px]">MSG_ID: {email.id}</Text>
                <Text className="text-gray-500 font-mono text-[9px]">FROM: {email.from}</Text>
                <Text className="text-gray-500 font-mono text-[9px]">TO: {email.to.join(', ')}</Text>
                {email.cc && email.cc.length > 0 && (
                    <Text className="text-gray-500 font-mono text-[9px]">CC: {email.cc.join(', ')}</Text>
                )}
                <Text className="text-gray-500 font-mono text-[9px]">SUBJECT: {email.subject}</Text>
                <Text className="text-gray-600 font-mono text-[8px]">
                    TIMESTAMP: {new Date(email.timestamp).toISOString()}
                </Text>
                {email.legalHold && (
                    <Text className="text-blue-400 font-mono text-[9px] font-bold mt-1">
                        LEGAL_HOLD: ACTIVE -- DELETION BLOCKED
                    </Text>
                )}
            </View>

            {/* Self-destruct timer */}
            {email.selfDestruct && email.selfDestruct.mode !== 'none' && remainingTtl > 0 && (
                <View className="mt-2 border border-red-500/30 bg-red-900/10 p-2">
                    <Text className="text-red-400 font-mono text-[9px] font-bold mb-1">
                        SELF-DESTRUCT: {email.selfDestruct.mode.toUpperCase()} | REMAINING:
                    </Text>
                    <CountdownTimer
                        expiresAt={Date.now() + remainingTtl * 1000}
                        onExpired={onExpired}
                    />
                </View>
            )}

            {/* Decrypted body */}
            <View className="mt-2 border border-white/10 bg-black p-2 min-h-[100px]">
                <Text className="text-gray-600 font-mono text-[8px] mb-1">DECRYPTED_PAYLOAD:</Text>
                {decryptedBody === null ? (
                    <Text className="text-gray-500 font-mono text-sm">DECRYPTING...</Text>
                ) : (
                    <Text className="text-white font-mono text-sm">{decryptedBody}</Text>
                )}
            </View>

            {/* Raw envelope toggle */}
            <TouchableOpacity
                onPress={() => setShowRaw(!showRaw)}
                className="mt-1 border border-gray-700 py-1 items-center"
            >
                <Text className="text-gray-500 font-mono text-[9px]">
                    {showRaw ? 'HIDE' : 'SHOW'} RAW_ENVELOPE (BASE64)
                </Text>
            </TouchableOpacity>

            {showRaw && (
                <View className="bg-black border border-gray-800 p-2 mt-1">
                    <Text className="text-gray-600 font-mono text-[8px]" selectable>
                        {email.body}
                    </Text>
                </View>
            )}

            {/* Actions */}
            {!email.legalHold && (
                <TouchableOpacity
                    onPress={() => onDelete(email.id)}
                    className="mt-3 border border-red-500/40 bg-red-900/20 py-1 items-center"
                >
                    <Text className="text-red-400 font-mono text-[9px] font-bold">
                        CRYPTO_SHRED_AND_DELETE()
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

// ── Expert Key Manager ──────────────────────────────────────────────────────

function ExpertKeyManager() {
    const [localKey, setLocalKey] = useState<{
        fingerprint: string;
        mlkemPk: string;
        x25519Pk: string;
        ed25519Pk: string;
    } | null>(null);
    const [generating, setGenerating] = useState(false);
    const [lookupEmail, setLookupEmail] = useState('');
    const [lookupResult, setLookupResult] = useState<string | null>(null);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const key = await zipMailService.generateLocalKeypair();
            setLocalKey(key);
        } catch {
            setLocalKey(null);
        } finally {
            setGenerating(false);
        }
    };

    const handleLookup = async () => {
        if (!lookupEmail) return;
        try {
            const key = await zipMailService.refreshRecipientKey(lookupEmail);
            setLookupResult(key ? `FP: ${key.fingerprint}` : 'NO_KEY_FOUND');
        } catch (err) {
            setLookupResult(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    return (
        <ScrollView className="flex-1 p-2">
            <Text className="text-quantum-400 font-mono text-[10px] font-bold mb-3">
                COMPOSITE KEY MANAGEMENT
            </Text>

            {/* Generate keypair */}
            <View className="border border-white/10 bg-black/40 p-2 mb-3">
                <Text className="text-gray-500 font-mono text-[9px] mb-1">LOCAL KEYPAIR</Text>
                <TouchableOpacity
                    onPress={handleGenerate}
                    disabled={generating}
                    className="border border-quantum-400/50 py-1 items-center mb-1"
                >
                    <Text className="text-quantum-400 font-mono text-[9px]">
                        {generating ? 'GENERATING...' : 'GENERATE_COMPOSITE_KEYPAIR()'}
                    </Text>
                </TouchableOpacity>

                {localKey && (
                    <View className="mt-1">
                        <Text className="text-green-400 font-mono text-[8px]">
                            FP: {localKey.fingerprint}
                        </Text>
                        <Text className="text-gray-600 font-mono text-[8px]">
                            ML-KEM-768_PK: {localKey.mlkemPk.substring(0, 32)}...
                        </Text>
                        <Text className="text-gray-600 font-mono text-[8px]">
                            X25519_PK: {localKey.x25519Pk.substring(0, 32)}...
                        </Text>
                        <Text className="text-gray-600 font-mono text-[8px]">
                            Ed25519_PK: {localKey.ed25519Pk.substring(0, 32)}...
                        </Text>
                    </View>
                )}
            </View>

            {/* Key lookup */}
            <View className="border border-white/10 bg-black/40 p-2">
                <Text className="text-gray-500 font-mono text-[9px] mb-1">RECIPIENT KEY LOOKUP</Text>
                <TextInput
                    value={lookupEmail}
                    onChangeText={setLookupEmail}
                    placeholder="EMAIL_ADDRESS"
                    placeholderTextColor="#4b5563"
                    className="bg-black text-quantum-100 font-mono text-[10px] border-b border-white/20 py-1 px-1 mb-1"
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    onPress={handleLookup}
                    className="border border-yellow-500/30 py-1 items-center"
                >
                    <Text className="text-yellow-400 font-mono text-[9px]">LOOKUP_KEY()</Text>
                </TouchableOpacity>

                {lookupResult && (
                    <Text className="text-gray-400 font-mono text-[8px] mt-1">{lookupResult}</Text>
                )}
            </View>
        </ScrollView>
    );
}
