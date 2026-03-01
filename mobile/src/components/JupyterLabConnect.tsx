import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useExpertise } from '../context/ExpertiseContext';

export default function JupyterLabConnect() {
    const { mode } = useExpertise();
    const [url, setUrl] = useState('http://localhost:8888');
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

    const connectToJupyter = () => {
        setStatus('connecting');
        // Simulate connection to local zip-pqc micromamba evironment
        setTimeout(() => {
            setStatus('connected');
        }, 2000);
    };

    if (mode === 'novice') {
        return (
            <View className="w-full bg-white/5 rounded-2xl p-6 mb-8 border border-white/10">
                <View className="items-center mb-6">
                    <Text className="text-white text-xl font-bold mb-2">Data Science Environment</Text>
                    <Text className="text-gray-400 text-center text-sm mb-6">
                        Connect your Zipminator app directly to your desktop's JupyterLab `zip-pqc` environment to run quantum calculations securely.
                    </Text>

                    <View className="w-full bg-black/50 rounded-xl p-4 mb-6">
                        <TextInput
                            value={url}
                            onChangeText={setUrl}
                            placeholder="JupyterLab URL"
                            placeholderTextColor="#6b7280"
                            className="w-full text-white font-medium mb-4 border-b border-white/10 pb-2"
                        />
                        <TextInput
                            value={token}
                            onChangeText={setToken}
                            placeholder="Access Token"
                            placeholderTextColor="#6b7280"
                            secureTextEntry
                            className="w-full text-white font-medium border-b border-white/10 pb-2"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={connectToJupyter}
                        className={`w-full py-4 rounded-full items-center ${status === 'connected' ? 'bg-green-600' : 'bg-quantum-600'}`}
                    >
                        {status === 'connecting' ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">
                                {status === 'connected' ? 'Connected to JupyterLab' : 'Connect Env'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // EXPERT MODE
    return (
        <View className="w-full bg-black/80 rounded-2xl p-6 mb-8 border border-green-500/30">
            <View className="flex-row justify-between items-center mb-4 border-b border-white/10 pb-4">
                <View>
                    <Text className="text-green-400 font-mono text-sm font-bold">JUPYTER_LAB::MICROMAMBA_BRIDGE</Text>
                    <Text className="text-gray-500 font-mono text-[10px]">ENV: zip-pqc | KERNEL: Python 3.11</Text>
                </View>
                <View className={`px-2 py-1 border ${status === 'connected' ? 'border-green-500 bg-green-900/40' : 'border-red-500 bg-red-900/40'}`}>
                    <Text className="text-white font-mono text-xs">{status.toUpperCase()}</Text>
                </View>
            </View>

            <View className="bg-black border border-white/20 p-4 rounded-lg mb-6 flex-row items-center justify-between">
                <View className="flex-1">
                    <Text className="text-gray-400 font-mono text-xs mb-1">WS_ENDPOINT_URL</Text>
                    <TextInput
                        value={url}
                        onChangeText={setUrl}
                        className="text-green-400 font-mono text-sm"
                    />
                </View>
            </View>

            <TouchableOpacity
                onPress={connectToJupyter}
                className="w-full bg-green-900/20 border border-green-500 rounded-lg py-3 items-center"
            >
                <Text className="text-green-400 font-mono font-bold">INITIATE_HANDSHAKE()</Text>
            </TouchableOpacity>
        </View>
    );
}
