import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';
import { pqcMessenger } from '../services/PqcMessengerService';
import { signalingService } from '../services/SignalingService';
import type {
    ConnectionState,
    RatchetState,
    MessageEntry,
} from '../types/crypto';

// ─── Connection state helpers ─────────────────────────────────────────────────

function noviceStatusLabel(state: ConnectionState): string {
    switch (state) {
        case 'disconnected':
            return 'Disconnected';
        case 'connecting':
            return 'Connecting...';
        case 'connected':
            return 'Connected';
        case 'handshaking':
            return 'Securing your chat...';
        case 'secure':
            return 'Chat is secure';
        case 'error':
            return 'Connection failed';
        default:
            return '';
    }
}

function expertStatusLabel(state: ConnectionState): string {
    switch (state) {
        case 'disconnected':
            return 'LINK: DOWN';
        case 'connecting':
            return 'LINK: CONNECTING...';
        case 'connected':
            return 'LINK: UP | HANDSHAKE: PENDING';
        case 'handshaking':
            return 'HANDSHAKE: ML-KEM-768 IN PROGRESS';
        case 'secure':
            return 'SECURE: ML-KEM-768 + AES-256-GCM';
        case 'error':
            return 'LINK: ERROR — RE-KEY REQUIRED';
        default:
            return '';
    }
}

function expertStatusColor(state: ConnectionState): string {
    switch (state) {
        case 'secure':
            return '#4ade80';  // green-400
        case 'error':
            return '#f87171';  // red-400
        case 'handshaking':
            return '#facc15';  // yellow-400
        default:
            return '#6b7280';  // gray-500
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SecureMessenger() {
    const { mode } = useExpertise();
    const [messages, setMessages] = useState<MessageEntry[]>([]);
    const [inputText, setInputText] = useState('');
    const [sendError, setSendError] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [ratchetState, setRatchetState] = useState<RatchetState>({
        epoch: 0,
        messagesSent: 0,
        messagesReceived: 0,
        isSecure: false,
    });

    const [myId] = useState(`user_${Math.floor(Math.random() * 10000)}`);
    const [targetId] = useState('user_target');

    // Track next message id
    const nextId = useRef(1);

    useEffect(() => {
        // Connect signaling and initialise the messenger
        signalingService.connect(myId);
        pqcMessenger.initialize(targetId);

        // ── PqcMessengerService events ────────────────────────────────────────

        const onStateChange = (state: ConnectionState, ratchet: RatchetState) => {
            setConnectionState(state);
            setRatchetState(ratchet);
        };

        const onIncomingMessage = (text: string, sender: string) => {
            const entry: MessageEntry = {
                id: nextId.current++,
                text,
                sender,
                encrypted: true,
                error: false,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, entry]);
        };

        const onCryptoError = (code: string) => {
            setSendError(`Crypto error: ${code}`);
            setTimeout(() => setSendError(null), 4000);

            // Add an error bubble to the message list
            const entry: MessageEntry = {
                id: nextId.current++,
                text: `[${code}]`,
                sender: 'system',
                encrypted: false,
                error: true,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, entry]);
        };

        pqcMessenger.on('state_change', onStateChange);
        pqcMessenger.on('incoming_message', onIncomingMessage);
        pqcMessenger.on('error', onCryptoError);

        return () => {
            pqcMessenger.off('state_change', onStateChange);
            pqcMessenger.off('incoming_message', onIncomingMessage);
            pqcMessenger.off('error', onCryptoError);
            signalingService.disconnect();
            pqcMessenger.destroy();
        };
    }, []);

    const startHandshake = () => {
        pqcMessenger.startHandshake();
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;
        if (connectionState !== 'secure') return;

        const draft = inputText;
        setInputText('');
        setSendError(null);

        // Optimistically show the outgoing message
        const optimistic: MessageEntry = {
            id: nextId.current++,
            text: draft,
            sender: 'user',
            encrypted: true,
            error: false,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            const encrypted = await pqcMessenger.encryptMessage(draft);

            // Send via signaling service as a structured EncryptedMessage payload
            signalingService.send({
                target: targetId,
                type: 'chat_message',
                payload: encrypted,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setSendError(`Send failed: ${msg}`);

            // Mark the optimistic message as errored
            setMessages(prev =>
                prev.map(m =>
                    m.id === optimistic.id ? { ...m, error: true } : m
                )
            );
        }
    };

    // ─── Novice UI ────────────────────────────────────────────────────────────

    if (mode === 'novice') {
        const statusLabel = noviceStatusLabel(connectionState);
        const isSecure = connectionState === 'secure';

        return (
            <View className="flex-1 w-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden mt-6 mb-10 h-96">
                {/* Header */}
                <View className="bg-quantum-600/30 p-4 border-b border-white/10 flex-row items-center justify-between">
                    <View>
                        <Text className="text-white font-bold text-lg">Secure Chat</Text>
                        <Text className="text-gray-400 text-[10px]">{statusLabel}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={startHandshake}
                        className="bg-green-500/20 px-3 py-1 rounded-full"
                    >
                        <Text className="text-green-400 font-bold text-xs">
                            {isSecure ? 'Re-Verify' : 'Verify Security'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Message List */}
                <ScrollView className="flex-1 p-4">
                    <Text className="text-gray-400 text-center mb-4 text-xs">
                        Every message you send is scrambled using true quantum randomness.
                    </Text>

                    {messages.map(msg => (
                        <View
                            key={msg.id}
                            className={`mb-4 max-w-[80%] rounded-2xl px-4 py-3 ${
                                msg.error
                                    ? 'bg-red-900/30 border border-red-500/30 self-center'
                                    : msg.sender === 'user'
                                    ? 'bg-quantum-600 self-end rounded-tr-sm'
                                    : 'bg-gray-800 self-start rounded-tl-sm'
                            }`}
                        >
                            <Text className={msg.error ? 'text-red-400 text-xs' : 'text-white'}>
                                {msg.text}
                            </Text>
                        </View>
                    ))}

                    {sendError && (
                        <Text className="text-red-400 text-center text-xs mt-2">{sendError}</Text>
                    )}
                </ScrollView>

                {/* Input Area */}
                <View className="p-4 border-t border-white/10 flex-row items-center">
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={isSecure ? 'Type a secure message...' : 'Waiting for secure channel...'}
                        placeholderTextColor="#6b7280"
                        editable={isSecure}
                        className="flex-1 bg-black/50 text-white rounded-full px-4 py-3 mr-2 border border-white/10"
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={!isSecure}
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                            isSecure ? 'bg-quantum-500' : 'bg-gray-700'
                        }`}
                    >
                        <Text className={`font-bold text-lg ${isSecure ? 'text-black' : 'text-gray-500'}`}>
                            ↑
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─── Expert UI (Cyberpunk) ────────────────────────────────────────────────

    const statusLine = expertStatusLabel(connectionState);
    const statusColor = expertStatusColor(connectionState);
    const isSecure = connectionState === 'secure';

    return (
        <View className="flex-1 w-full bg-black/60 rounded-2xl border border-quantum-500/30 overflow-hidden mt-6 mb-10 h-96">

            {/* Expert Header */}
            <View className="bg-black p-4 border-b border-white/10">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-quantum-400 font-mono text-sm font-bold">
                        PQC DOUBLE-RATCHET MESSENGER
                    </Text>
                    <TouchableOpacity onPress={startHandshake}>
                        <Text className="text-green-400 font-mono text-xs underline">
                            RE-KEY HANDSHAKE
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text className="text-gray-500 font-mono text-[10px]">
                    MY_UID: {myId} | PEER: {targetId}
                </Text>

                <Text style={{ color: statusColor }} className="font-mono text-[10px] mt-1">
                    {statusLine}
                </Text>

                {/* Ratchet state panel — only shown when session is secure */}
                {isSecure && (
                    <Text className="text-gray-500 font-mono text-[10px] mt-1">
                        RATCHET EPOCH: {ratchetState.epoch} | TX={ratchetState.messagesSent} RX={ratchetState.messagesReceived}
                    </Text>
                )}
            </View>

            {/* Message List */}
            <ScrollView className="flex-1 p-4">
                {messages.map(msg => (
                    <View key={msg.id} className="mb-4">
                        {msg.error ? (
                            <View className="p-3 border border-red-500/40 bg-red-900/20 self-center">
                                <Text className="text-red-400 font-mono text-xs">{msg.text}</Text>
                            </View>
                        ) : (
                            <>
                                <View
                                    className={`flex-row justify-between mb-1 ${
                                        msg.sender === 'user' ? 'flex-row-reverse' : ''
                                    }`}
                                >
                                    <Text className="text-gray-500 font-mono text-[10px]">
                                        {msg.sender.toUpperCase()}@[LOCAL]
                                    </Text>
                                    <Text className="text-gray-600 font-mono text-[10px]">
                                        {msg.encrypted ? 'AES-GCM-256' : 'PLAINTEXT'}
                                    </Text>
                                </View>
                                <View
                                    className={`p-3 border ${
                                        msg.sender === 'user'
                                            ? 'bg-quantum-900/20 border-quantum-500/50 self-end'
                                            : 'bg-black border-white/20 self-start'
                                    } max-w-[85%]`}
                                >
                                    <Text className="text-white font-mono text-sm">{msg.text}</Text>
                                </View>
                            </>
                        )}
                    </View>
                ))}

                {sendError && (
                    <Text className="text-red-400 font-mono text-xs text-center mt-2">
                        ERR: {sendError}
                    </Text>
                )}
            </ScrollView>

            {/* Input Area */}
            <View className="p-4 border-t border-white/10 flex-row">
                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={isSecure ? 'ENCRYPT_AND_SEND()...' : 'AWAITING_SECURE_CHANNEL...'}
                    placeholderTextColor="#4b5563"
                    editable={isSecure}
                    className="flex-1 bg-black text-quantum-100 font-mono border border-white/20 p-3 mr-2"
                />
                <TouchableOpacity
                    onPress={sendMessage}
                    disabled={!isSecure}
                    className={`px-4 justify-center items-center border ${
                        isSecure
                            ? 'bg-quantum-600 border-quantum-400'
                            : 'bg-gray-900 border-gray-700'
                    }`}
                >
                    <Text
                        className={`font-mono font-bold ${
                            isSecure ? 'text-white' : 'text-gray-600'
                        }`}
                    >
                        SEND
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
