import React, { Suspense } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useExpertise } from '../../src/context/ExpertiseContext';

// Lazy-load components that depend on the native crypto module.
// This defers the requireNativeModule() call so the error boundary can catch
// it when running in Expo Go (which cannot load custom native modules).
const KeyGenerator = React.lazy(() => import('../../src/components/KeyGenerator'));
const FileVault = React.lazy(() => import('../../src/components/FileVault'));
const SecureMessenger = React.lazy(() => import('../../src/components/SecureMessenger'));
const NetworkShield = React.lazy(() => import('../../src/components/NetworkShield'));
const OpenClawChat = React.lazy(() => import('../../src/components/OpenClawChat'));
const AnonymizationPanel = React.lazy(() => import('../../src/components/AnonymizationPanel'));
const JupyterLabConnect = React.lazy(() => import('../../src/components/JupyterLabConnect'));

// Error boundary for components that depend on the native crypto bridge.
// Catches crashes when the native module is unavailable (e.g. Expo Go, web).
class NativeBridgeGuard extends React.Component<
  { children: React.ReactNode; label?: string },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode; label?: string }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="w-full bg-red-900/20 rounded-2xl p-6 mb-8 border border-red-500/30 items-center">
          <Text className="text-red-400 font-bold mb-2">
            {this.props.label ?? 'Component'} Unavailable
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            The native crypto module is not available in this environment.
            Build a native dev client to use this feature.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function HomeScreen() {
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

        {/* Feature Components rendering below the header */}
        <Suspense fallback={<ActivityIndicator color="#8196f8" />}>
          <NativeBridgeGuard label="Key Generator">
            <KeyGenerator />
          </NativeBridgeGuard>
          <NativeBridgeGuard label="File Vault">
            <FileVault />
          </NativeBridgeGuard>
          <NativeBridgeGuard label="Secure Messenger">
            <SecureMessenger />
          </NativeBridgeGuard>
          <NativeBridgeGuard label="Network Shield">
            <NetworkShield />
          </NativeBridgeGuard>
          <NativeBridgeGuard label="JupyterLab Connect">
            <JupyterLabConnect />
          </NativeBridgeGuard>
          <NativeBridgeGuard label="Anonymization">
            <AnonymizationPanel />
          </NativeBridgeGuard>
          <NativeBridgeGuard label="OpenClaw Chat">
            <OpenClawChat />
          </NativeBridgeGuard>
        </Suspense>

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
