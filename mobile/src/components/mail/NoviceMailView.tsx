import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Switch,
} from 'react-native';
import type {
    EmailMessage,
    ComposeState,
    PiiWarning,
} from '../../types/email';
import type { MailViewProps } from './mailViewProps';
import { INITIAL_COMPOSE, timeAgo, senderName, previewText } from './mailViewProps';
import PiiWarningPanel from './PiiWarningPanel';
import SelfDestructSelector from './SelfDestructSelector';
import CountdownTimer from './CountdownTimer';
import EncryptionIndicator from './EncryptionIndicator';

// ═══════════════════════════════════════════════════════════════════════════
// NOVICE MODE
// ═══════════════════════════════════════════════════════════════════════════

export default function NoviceMailView(props: MailViewProps) {
    const {
        currentView, setCurrentView, inbox, refreshing, loadInbox,
        compose, setCompose, sendStatus, selectedEmail, decryptedBody,
        remainingTtl, onSend, onOpenEmail, onDelete, onBodyChange,
        onRedactPii, onRedactAll, onExpired,
    } = props;

    return (
        <View className="flex-1 w-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden mt-6 mb-10">
            {/* Header */}
            <View className="bg-quantum-600/30 p-4 border-b border-white/10 flex-row items-center justify-between">
                <View>
                    <Text className="text-white font-bold text-lg">ZipMail</Text>
                    <Text className="text-gray-400 text-[10px]">Post-Quantum Encrypted Email</Text>
                </View>
                <View className="flex-row">
                    {currentView !== 'inbox' && (
                        <TouchableOpacity
                            onPress={() => setCurrentView('inbox')}
                            className="bg-white/10 px-3 py-1 rounded-full mr-2"
                        >
                            <Text className="text-white text-xs">Inbox</Text>
                        </TouchableOpacity>
                    )}
                    {currentView !== 'compose' && (
                        <TouchableOpacity
                            onPress={() => { setCompose(INITIAL_COMPOSE); setCurrentView('compose'); }}
                            className="bg-quantum-500/30 px-3 py-1 rounded-full"
                        >
                            <Text className="text-quantum-400 text-xs font-bold">Compose</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Views */}
            {currentView === 'inbox' && (
                <NoviceInbox
                    inbox={inbox}
                    refreshing={refreshing}
                    loadInbox={loadInbox}
                    onOpenEmail={onOpenEmail}
                />
            )}
            {currentView === 'compose' && (
                <NoviceCompose
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
                <NoviceReader
                    email={selectedEmail}
                    decryptedBody={decryptedBody}
                    remainingTtl={remainingTtl}
                    onExpired={onExpired}
                    onDelete={onDelete}
                />
            )}
        </View>
    );
}

// ── Novice Inbox ────────────────────────────────────────────────────────────

function NoviceInbox({
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
            {inbox.length === 0 && (
                <Text className="text-gray-500 text-center py-8">No messages yet</Text>
            )}

            {inbox.map((email) => (
                <TouchableOpacity
                    key={email.id}
                    onPress={() => onOpenEmail(email)}
                    className={`px-4 py-3 border-b border-white/5 ${
                        !email.isRead ? 'bg-quantum-600/5' : ''
                    }`}
                >
                    <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center flex-1">
                            {email.encryption === 'pqc' && (
                                <Text className="text-green-400 mr-1.5 text-sm">{'\u{1F512}'}</Text>
                            )}
                            <Text
                                className={`text-sm flex-1 ${
                                    !email.isRead ? 'text-white font-bold' : 'text-gray-300'
                                }`}
                                numberOfLines={1}
                            >
                                {senderName(email.from)}
                            </Text>
                        </View>
                        <Text className="text-gray-500 text-[10px] ml-2">{timeAgo(email.timestamp)}</Text>
                    </View>

                    <Text className={`text-xs mb-0.5 ${!email.isRead ? 'text-white' : 'text-gray-400'}`} numberOfLines={1}>
                        {email.subject}
                    </Text>
                    <Text className="text-gray-500 text-[10px]" numberOfLines={1}>
                        {previewText(email.body)}
                    </Text>

                    {/* Badges */}
                    <View className="flex-row mt-1">
                        {email.encryption === 'pqc' && (
                            <View className="bg-green-500/20 px-2 py-0.5 rounded-full mr-1">
                                <Text className="text-green-400 text-[9px] font-bold">Secure</Text>
                            </View>
                        )}
                        {email.selfDestruct && email.selfDestruct.mode !== 'none' && email.selfDestruct.expiresAt && (
                            <View className="bg-orange-500/20 px-2 py-0.5 rounded-full mr-1">
                                <CountdownTimer
                                    expiresAt={email.selfDestruct.expiresAt}
                                    onExpired={() => {}}
                                    compact
                                />
                            </View>
                        )}
                        {email.selfDestruct?.mode === 'read_once' && (
                            <View className="bg-red-500/20 px-2 py-0.5 rounded-full mr-1">
                                <Text className="text-red-400 text-[9px] font-bold">View Once</Text>
                            </View>
                        )}
                        {email.legalHold && (
                            <View className="bg-blue-500/20 px-2 py-0.5 rounded-full">
                                <Text className="text-blue-400 text-[9px] font-bold">Held</Text>
                            </View>
                        )}
                        {email.hasAttachments && (
                            <Text className="text-gray-500 text-[10px] ml-1">{'\u{1F4CE}'}</Text>
                        )}
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

// ── Novice Compose ──────────────────────────────────────────────────────────

function NoviceCompose({
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
    return (
        <ScrollView className="flex-1 p-4">
            {/* To field */}
            <Text className="text-gray-400 text-xs mb-1">To</Text>
            <TextInput
                value={compose.to}
                onChangeText={(t) => setCompose((p) => ({ ...p, to: t }))}
                placeholder="recipient@email.com"
                placeholderTextColor="#6b7280"
                className="bg-black/50 text-white rounded-lg px-3 py-2 text-sm border border-white/10 mb-3"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            {/* Subject */}
            <Text className="text-gray-400 text-xs mb-1">Subject</Text>
            <TextInput
                value={compose.subject}
                onChangeText={(t) => setCompose((p) => ({ ...p, subject: t }))}
                placeholder="Email subject"
                placeholderTextColor="#6b7280"
                className="bg-black/50 text-white rounded-lg px-3 py-2 text-sm border border-white/10 mb-3"
            />

            {/* Body */}
            <Text className="text-gray-400 text-xs mb-1">Message</Text>
            <TextInput
                value={compose.body}
                onChangeText={onBodyChange}
                placeholder="Write your message..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-black/50 text-white rounded-lg px-3 py-3 text-sm border border-white/10 min-h-[120px]"
            />

            {/* PII warnings */}
            <PiiWarningPanel
                warnings={compose.piiWarnings}
                onRedact={onRedactPii}
                onRedactAll={onRedactAll}
            />

            {/* Encryption toggle */}
            <View className="flex-row items-center justify-between mt-4">
                <Text className="text-gray-400 text-xs">Quantum Encryption</Text>
                <Switch
                    value={compose.encryption === 'pqc'}
                    onValueChange={(v) =>
                        setCompose((p) => ({ ...p, encryption: v ? 'pqc' : 'tls' }))
                    }
                    trackColor={{ false: '#374151', true: '#7c3aed' }}
                    thumbColor={compose.encryption === 'pqc' ? '#a78bfa' : '#9ca3af'}
                />
            </View>

            {/* Self-destruct */}
            <SelfDestructSelector
                mode={compose.selfDestructMode}
                ttlSeconds={compose.selfDestructTtl}
                onModeChange={(m) => setCompose((p) => ({ ...p, selfDestructMode: m }))}
                onTtlChange={(s) => setCompose((p) => ({ ...p, selfDestructTtl: s }))}
            />

            {/* Send button */}
            <TouchableOpacity
                onPress={onSend}
                disabled={compose.isSending || !compose.to || !compose.body}
                className={`mt-4 rounded-xl py-3 items-center ${
                    compose.isSending || !compose.to || !compose.body
                        ? 'bg-gray-700'
                        : 'bg-quantum-500'
                }`}
            >
                <Text className={`font-bold ${
                    compose.isSending ? 'text-gray-400' : 'text-white'
                }`}>
                    {compose.isSending ? sendStatus ?? 'Sending...' : 'Send Secure Email'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ── Novice Reader ───────────────────────────────────────────────────────────

function NoviceReader({
    email, decryptedBody, remainingTtl, onExpired, onDelete,
}: {
    email: EmailMessage;
    decryptedBody: string | null;
    remainingTtl: number;
    onExpired: () => void;
    onDelete: (id: string) => void;
}) {
    return (
        <ScrollView className="flex-1 p-4">
            {/* Encryption badge */}
            <EncryptionIndicator level={email.encryption} fingerprint={email.fingerprint} />

            {/* Email header */}
            <View className="mt-3 mb-2">
                <Text className="text-white font-bold text-lg">{email.subject}</Text>
                <Text className="text-gray-400 text-xs mt-1">
                    From: {email.from}
                </Text>
                <Text className="text-gray-500 text-[10px]">
                    {new Date(email.timestamp).toLocaleString()}
                </Text>
            </View>

            {/* Self-destruct timer */}
            {email.selfDestruct && email.selfDestruct.mode !== 'none' && remainingTtl > 0 && (
                <View className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-3">
                    <Text className="text-orange-400 text-xs mb-1">This message will self-destruct</Text>
                    <CountdownTimer
                        expiresAt={Date.now() + remainingTtl * 1000}
                        onExpired={onExpired}
                    />
                </View>
            )}

            {email.selfDestruct?.mode === 'read_once' && (
                <View className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-3">
                    <Text className="text-red-400 text-xs text-center">
                        This is a view-once message. It will be deleted after you leave.
                    </Text>
                </View>
            )}

            {email.legalHold && (
                <View className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 mb-3">
                    <Text className="text-blue-400 text-xs text-center">
                        This message is under legal hold and cannot be deleted.
                    </Text>
                </View>
            )}

            {/* Body */}
            <View className="bg-black/30 rounded-lg p-4 border border-white/5 min-h-[100px]">
                {decryptedBody === null ? (
                    <Text className="text-gray-500 text-sm">Decrypting...</Text>
                ) : (
                    <Text className="text-white text-sm leading-5">{decryptedBody}</Text>
                )}
            </View>

            {/* Actions */}
            {!email.legalHold && (
                <TouchableOpacity
                    onPress={() => onDelete(email.id)}
                    className="mt-4 bg-red-500/20 rounded-lg py-2 items-center"
                >
                    <Text className="text-red-400 text-xs font-bold">Delete Message</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}
