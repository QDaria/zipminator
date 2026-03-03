// LEGACY: This file is not used when expo-router is active (see app/_layout.tsx)
import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { ExpertiseProvider, useExpertise } from './src/context/ExpertiseContext';
import FileVault from './src/components/FileVault';

function MainScreen() {
    const { mode, toggleMode } = useExpertise();

    return (
        <SafeAreaView className="flex-1 bg-[#050510]">
            <StatusBar barStyle="light-content" />

            <ScrollView className="flex-1 w-full" contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, padding: 24 }}>

                {/* Header Section */}
                {mode === 'novice' ? (
                    <View className="items-center w-full mb-10 pt-10">
                        <View className="w-48 h-48 rounded-full bg-quantum-500/20 items-center justify-center border-4 border-quantum-400 mb-8 shadow-lg">
                            <Text className="text-white font-bold text-lg">Gathering Power...</Text>
                        </View>
                        <Text className="text-white text-3xl font-bold mb-4 text-center">
                            Ultra-Secure Lock
                        </Text>
                        <Text className="text-gray-300 text-center text-lg mb-4">
                            We are collecting true randomness from a real quantum computer to keep your files perfectly safe.
                        </Text>
                        <TouchableOpacity className="w-full max-w-xs bg-quantum-600 rounded-full py-4 items-center">
                            <Text className="text-white font-bold text-xl">Generate Keys</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="w-full justify-center mb-10 pt-10">
                        <View className="flex-row justify-between w-full mb-6">
                            <Text className="text-quantum-400 font-mono text-sm">FIPS-203 ML-KEM Key Generation</Text>
                            <Text className="text-green-400 font-mono text-sm">ONLINE</Text>
                        </View>

                        <View className="border border-white/20 bg-black/50 p-6 rounded-lg mb-6 shadow-lg">
                            <Text className="text-gray-400 font-mono text-xs mb-2">TARGET PROVIDER:</Text>
                            <Text className="text-white font-mono text-lg mb-1">qBraid Cloud - IBM Quantum</Text>
                            <Text className="text-quantum-300 font-mono text-sm">Active Node: Marrakesh (156q)</Text>
                        </View>

                        <View className="border border-white/20 bg-black/50 p-6 rounded-lg mb-8">
                            <Text className="text-gray-400 font-mono text-xs mb-2">ENTROPY POOL STATUS:</Text>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-white font-mono text-sm">Harvesting q-bits...</Text>
                                <Text className="text-white font-mono text-sm">1024B / 1024B</Text>
                            </View>
                            <View className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <View className="w-full h-full bg-quantum-500" />
                            </View>
                        </View>

                        <TouchableOpacity className="w-full bg-transparent border-2 border-quantum-500 rounded-lg py-4 items-center mb-4">
                            <Text className="text-quantum-400 font-mono text-sm font-bold">FORCE HARVEST (qBraid)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="w-full bg-quantum-600 rounded-lg py-4 items-center">
                            <Text className="text-white font-mono text-sm font-bold">GENERATE PQC KEYPAIR</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* File Vault Component rendering below the header */}
                <FileVault />

            </ScrollView>

            {/* Global Expertise Toggle Button Footer */}
            <View className="absolute bottom-10 w-full items-center px-6">
                <View className="bg-white/10 rounded-full p-1 flex-row border border-white/20">
                    <TouchableOpacity
                        onPress={() => mode !== 'novice' && toggleMode()}
                        className={`px-6 py-2 rounded-full ${mode === 'novice' ? 'bg-white' : 'bg-transparent'}`}
                    >
                        <Text className={`${mode === 'novice' ? 'text-black font-bold' : 'text-gray-400'}`}>Everyday</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => mode !== 'expert' && toggleMode()}
                        className={`px-6 py-2 rounded-full ${mode === 'expert' ? 'bg-white' : 'bg-transparent'}`}
                    >
                        <Text className={`${mode === 'expert' ? 'text-black font-bold' : 'text-gray-400'}`}>Expert</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

export default function App() {
    return (
        <ExpertiseProvider>
            <MainScreen />
        </ExpertiseProvider>
    );
}
