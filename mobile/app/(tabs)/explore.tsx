import React from 'react';
import { View, Text, SafeAreaView, StatusBar } from 'react-native';

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar barStyle="light-content" />
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-quantum-500/20 items-center justify-center border-2 border-quantum-400 mb-6">
          <Text className="text-quantum-300 text-3xl">Q</Text>
        </View>
        <Text className="text-slate-100 text-2xl font-bold mb-3 text-center">
          Explore Quantum Security
        </Text>
        <Text className="text-slate-400 text-base text-center leading-6">
          Coming soon: browse quantum security features, threat intel feeds, and network status.
        </Text>
      </View>
    </SafeAreaView>
  );
}
