/**
 * NavigationBar.tsx
 *
 * Back / Forward / Refresh / Home navigation buttons for ZipBrowser.
 * Keeps buttons visually consistent with the quantum-purple theme used
 * across Zipminator mobile components.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavigationBarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  tabCount: number;
  onGoBack: () => void;
  onGoForward: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onNewTab: () => void;
  onShare?: () => void;
}

// ---------------------------------------------------------------------------
// NavButton helper
// ---------------------------------------------------------------------------

interface NavButtonProps {
  label: string;
  symbol: string;
  onPress: () => void;
  disabled?: boolean;
  highlight?: boolean;
  accessibilityLabel?: string;
}

function NavButton({ label, symbol, onPress, disabled, highlight, accessibilityLabel }: NavButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      className={`items-center justify-center px-3 py-2 rounded-lg ${
        disabled ? 'opacity-30' :
        highlight ? 'bg-quantum-700/40' :
        'active:bg-white/10'
      }`}
    >
      <Text className={`text-lg ${disabled ? 'text-gray-600' : 'text-white'}`}>
        {symbol}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// NavigationBar
// ---------------------------------------------------------------------------

export default function NavigationBar({
  canGoBack,
  canGoForward,
  isLoading,
  tabCount,
  onGoBack,
  onGoForward,
  onRefresh,
  onHome,
  onNewTab,
  onShare,
}: NavigationBarProps) {
  return (
    <View className="flex-row items-center justify-between bg-black/80 border-t border-white/10 px-2 py-1">

      {/* Back */}
      <NavButton
        label="Back"
        symbol="‹"
        onPress={onGoBack}
        disabled={!canGoBack}
        accessibilityLabel="Go back"
      />

      {/* Forward */}
      <NavButton
        label="Forward"
        symbol="›"
        onPress={onGoForward}
        disabled={!canGoForward}
        accessibilityLabel="Go forward"
      />

      {/* Refresh / Stop */}
      <NavButton
        label={isLoading ? 'Stop' : 'Refresh'}
        symbol={isLoading ? '✕' : '↻'}
        onPress={onRefresh}
        accessibilityLabel={isLoading ? 'Stop loading' : 'Refresh page'}
      />

      {/* Home */}
      <NavButton
        label="Home"
        symbol="⌂"
        onPress={onHome}
        accessibilityLabel="Go to home page"
      />

      {/* New Tab with count badge */}
      <TouchableOpacity
        onPress={onNewTab}
        accessibilityLabel={`Open new tab. ${tabCount} tab${tabCount !== 1 ? 's' : ''} open`}
        accessibilityRole="button"
        className="items-center justify-center px-3 py-2 rounded-lg active:bg-white/10"
      >
        <View className="relative">
          <Text className="text-white text-base">⊞</Text>
          {tabCount > 0 && (
            <View className="absolute -top-1 -right-2 bg-quantum-600 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-[9px] font-bold">
                {tabCount > 9 ? '9+' : String(tabCount)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Share (optional) */}
      {onShare && (
        <NavButton
          label="Share"
          symbol="↑"
          onPress={onShare}
          accessibilityLabel="Share current page"
        />
      )}

    </View>
  );
}
