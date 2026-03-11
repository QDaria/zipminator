import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';

export default function QaiChat() {
    const { mode } = useExpertise();
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I am Q-AI Assistant, your PQC AI companion. How can I help you secure your day?", sender: "ai" }
    ]);
    const [inputText, setInputText] = useState("");

    const sendMessage = () => {
        if (!inputText.trim()) return;
        setMessages([...messages, { id: Date.now(), text: inputText, sender: "user" }]);
        setInputText("");

        // Simulate AI response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now(),
                text: "Processing request securely. My weights are executing locally, ensuring total privacy.",
                sender: "ai"
            }]);
        }, 1500);
    };

    if (mode === 'novice') {
        return (
            <View className="w-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-8 h-96">
                <View className="bg-blue-600/30 p-4 border-b border-white/10 flex-row items-center justify-between">
                    <Text className="text-white font-bold text-lg">AI Assistant</Text>
                    <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                        <Text className="text-blue-400 font-bold text-xs">100% Private (Local)</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 p-4">
                    {messages.map(msg => (
                        <View key={msg.id} className={`mb-4 max-w-[85%] rounded-2xl px-4 py-3 ${msg.sender === 'user' ? 'bg-quantum-600 self-end rounded-tr-sm' : 'bg-gray-800 self-start rounded-tl-sm'}`}>
                            <Text className="text-white">{msg.text}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View className="p-4 border-t border-white/10 flex-row">
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask me anything..."
                        placeholderTextColor="#6b7280"
                        className="flex-1 bg-black/50 text-white rounded-full px-4 py-3 mr-2 border border-white/10"
                    />
                    <TouchableOpacity onPress={sendMessage} className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center">
                        <Text className="text-white font-bold text-lg">↑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // EXPERT MODE
    return (
        <View className="w-full bg-black/80 rounded-2xl border border-blue-500/30 overflow-hidden mb-8 h-96">
            <View className="bg-black p-4 border-b border-blue-900/50">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-blue-400 font-mono text-sm font-bold">MCP::QAI_LLM</Text>
                    <Text className="text-green-400 font-mono text-xs">ON-DEVICE NPU</Text>
                </View>
                <Text className="text-gray-500 font-mono text-[10px]">MODEL: Qwen2.5-Coder-7B-Instruct (4-bit quant)</Text>
                <Text className="text-gray-500 font-mono text-[10px]">MCP PROTOCOL: ENABLED | TOOLS: [qrng, anonymize]</Text>
            </View>

            <ScrollView className="flex-1 p-4">
                {messages.map(msg => (
                    <View key={msg.id} className="mb-4">
                        <View className={`flex-row justify-between mb-1 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            <Text className="text-gray-500 font-mono text-[10px]">
                                {msg.sender === 'user' ? 'USER_PROMPT' : 'SYSTEM_INFERENCE'}
                            </Text>
                            {msg.sender === 'ai' && <Text className="text-blue-600 font-mono text-[10px]">t/s: 24.5</Text>}
                        </View>
                        <View className={`p-3 border ${msg.sender === 'user' ? 'bg-quantum-900/20 border-quantum-500/50 self-end' : 'bg-black border-blue-500/30 self-start'} max-w-[90%]`}>
                            <Text className="text-white font-mono text-sm">{msg.text}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View className="p-4 border-t border-white/10 flex-row">
                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="> INPUT_PROMPT..."
                    placeholderTextColor="#4b5563"
                    className="flex-1 bg-black text-blue-100 font-mono border border-blue-500/30 p-3 mr-2"
                />
                <TouchableOpacity onPress={sendMessage} className="bg-blue-900/40 px-4 justify-center items-center border border-blue-500">
                    <Text className="text-blue-400 font-mono font-bold">EXEC</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
