import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';
import { pqcMessenger } from '../services/PqcMessengerService';
import { signalingService } from '../services/SignalingService';

export default function SecureMessenger() {
    const { mode } = useExpertise();
    const [messages, setMessages] = useState([
        { id: 1, text: "Are the blueprints secured?", sender: "hq" },
        { id: 2, text: "Yes. Post-Quantum lock engaged.", sender: "user" },
    ]);
    const [inputText, setInputText] = useState("");
    const [myId] = useState(`user_${Math.floor(Math.random() * 1000)}`);
    const [targetId] = useState("user_target"); // Mock target

    useEffect(() => {
        // Initialize signaling and messenger
        signalingService.connect(myId);
        pqcMessenger.initialize(targetId);

        const handleIncomingMessage = async (msg: any) => {
            if (msg.type === 'chat_message') {
                const decrypted = await pqcMessenger.decryptMessage(msg.payload.text);
                setMessages(prev => [...prev, { id: Date.now(), text: decrypted, sender: msg.sender }]);
            }
        };

        signalingService.on('message', handleIncomingMessage);

        return () => {
            signalingService.disconnect();
            signalingService.removeListener('message', handleIncomingMessage);
        };
    }, []);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const encryptedText = await pqcMessenger.encryptMessage(inputText);

        // Send via signaling service
        signalingService.send({
            target: targetId,
            type: 'chat_message' as any,
            payload: { text: encryptedText }
        });

        setMessages([...messages, { id: Date.now(), text: inputText, sender: "user" }]);
        setInputText("");
    };

    const startHandshake = () => {
        pqcMessenger.startHandshake();
    };

    if (mode === 'novice') {
        return (
            <View className="flex-1 w-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden mt-6 mb-10 h-96">
                {/* Novice Header */}
                <View className="bg-quantum-600/30 p-4 border-b border-white/10 flex-row items-center justify-between">
                    <View>
                        <Text className="text-white font-bold text-lg">Secure Chat</Text>
                        <Text className="text-gray-400 text-[10px]">ID: {myId}</Text>
                    </View>
                    <TouchableOpacity onPress={startHandshake} className="bg-green-500/20 px-3 py-1 rounded-full">
                        <Text className="text-green-400 font-bold text-xs">Verify Security</Text>
                    </TouchableOpacity>
                </View>

                {/* Message List */}
                <ScrollView className="flex-1 p-4">
                    <Text className="text-gray-400 text-center mb-4 text-xs">
                        Every message you send is scrambled using true quantum randomness.
                    </Text>
                    {messages.map(msg => (
                        <View key={msg.id} className={`mb-4 max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender === 'user' ? 'bg-quantum-600 self-end rounded-tr-sm' : 'bg-gray-800 self-start rounded-tl-sm'}`}>
                            <Text className="text-white">{msg.text}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Input Area */}
                <View className="p-4 border-t border-white/10 flex-row items-center">
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a secure message..."
                        placeholderTextColor="#6b7280"
                        className="flex-1 bg-black/50 text-white rounded-full px-4 py-3 mr-2 border border-white/10"
                    />
                    <TouchableOpacity onPress={sendMessage} className="bg-quantum-500 w-12 h-12 rounded-full items-center justify-center">
                        <Text className="text-black font-bold text-lg">↑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // EXPERT MODE (Cyberpunk)
    return (
        <View className="flex-1 w-full bg-black/60 rounded-2xl border border-quantum-500/30 overflow-hidden mt-6 mb-10 h-96">

            {/* Expert Header */}
            <View className="bg-black p-4 border-b border-white/10">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-quantum-400 font-mono text-sm font-bold">PQC DOUBLE-RATCHET MESSENGER</Text>
                    <TouchableOpacity onPress={startHandshake}>
                        <Text className="text-green-400 font-mono text-xs underline">RE-KEY HANDSHAKE</Text>
                    </TouchableOpacity>
                </View>
                <Text className="text-gray-500 font-mono text-[10px]">MY_UID: {myId} | PEER: {targetId}</Text>
                <Text className="text-gray-500 font-mono text-[10px]">HANDSHAKE: ML-KEM-768 | SIG: ML-DSA-65</Text>
            </View>

            {/* Message List */}
            <ScrollView className="flex-1 p-4">
                {messages.map(msg => (
                    <View key={msg.id} className="mb-4">
                        <View className={`flex-row justify-between mb-1 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <Text className="text-gray-500 font-mono text-[10px]">{msg.sender.toUpperCase()}@[LOCAL]</Text>
                            <Text className="text-gray-600 font-mono text-[10px]">AES-GCM-256</Text>
                        </View>
                        <View className={`p-3 border ${msg.sender === 'user' ? 'bg-quantum-900/20 border-quantum-500/50 self-end' : 'bg-black border-white/20 self-start'} max-w-[85%]`}>
                            <Text className="text-white font-mono text-sm">{msg.text}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Input Area */}
            <View className="p-4 border-t border-white/10 flex-row">
                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="ENCRYPT_AND_SEND()..."
                    placeholderTextColor="#4b5563"
                    className="flex-1 bg-black text-quantum-100 font-mono border border-white/20 p-3 mr-2"
                />
                <TouchableOpacity onPress={sendMessage} className="bg-quantum-600 px-4 justify-center items-center border border-quantum-400">
                    <Text className="text-white font-mono font-bold">SEND</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
