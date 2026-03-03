/**
 * AddressBar.tsx
 *
 * URL input field with PQC lock icon for the ZipBrowser component.
 * Adapts display based on ExpertiseMode:
 *   Novice: shows domain only, green/grey lock icon
 *   Expert: shows full URL, colour-coded lock with PQC label
 */

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import type { PqcStatusLevel } from '../../types/browser';
import { extractDomain } from '../../services/BrowserService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AddressBarProps {
  /** Current full URL to display. */
  url: string;
  /** Current PQC security level for the lock icon colour. */
  pqcStatus: PqcStatusLevel;
  /** Whether the user is in expert mode (shows full URL). */
  isExpert: boolean;
  /** Whether the browser is currently loading. */
  isLoading: boolean;
  /** Called when the user submits a new URL or search query. */
  onSubmit: (url: string) => void;
}

// ---------------------------------------------------------------------------
// Lock icon (text-based, no icon library dependency)
// ---------------------------------------------------------------------------

function LockIcon({ status }: { status: PqcStatusLevel }) {
  const color =
    status === 'pqc' ? 'text-green-400' :
    status === 'classical' ? 'text-yellow-400' :
    'text-gray-500';

  const symbol =
    status === 'pqc' ? '🔒' :
    status === 'classical' ? '🔓' :
    '⚬';

  return (
    <Text className={`text-base ${color} px-1`} accessibilityLabel={`Security: ${status}`}>
      {symbol}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// AddressBar
// ---------------------------------------------------------------------------

export default function AddressBar({
  url,
  pqcStatus,
  isExpert,
  isLoading,
  onSubmit,
}: AddressBarProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  const displayText = editing
    ? inputValue
    : isExpert
      ? url
      : extractDomain(url);

  function handleFocus() {
    setInputValue(url);
    setEditing(true);
  }

  function handleBlur() {
    setEditing(false);
    setInputValue('');
  }

  function handleSubmit() {
    const raw = inputValue.trim();
    if (raw) {
      onSubmit(raw);
    }
    setEditing(false);
    setInputValue('');
    inputRef.current?.blur();
  }

  return (
    <View className="flex-row items-center bg-white/8 rounded-xl px-2 py-1 flex-1 mx-2 border border-white/10">
      {/* Lock icon — hidden while editing */}
      {!editing && (
        <LockIcon status={pqcStatus} />
      )}

      {/* URL / search input */}
      <TextInput
        ref={inputRef}
        className={`flex-1 text-white text-sm py-1 px-1 ${isExpert ? 'font-mono' : ''}`}
        value={displayText}
        onChangeText={setInputValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        returnKeyType="go"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        selectTextOnFocus
        placeholder="Search or enter URL"
        placeholderTextColor="#6b7280"
        accessibilityLabel="Address bar"
        accessibilityHint="Type a URL or search query and press Go"
      />

      {/* PQC label (expert mode only, not editing) */}
      {isExpert && !editing && pqcStatus === 'pqc' && (
        <View className="bg-green-900/40 rounded px-1 ml-1 border border-green-700/50">
          <Text className="text-green-400 font-mono text-[9px] font-bold">ML-KEM</Text>
        </View>
      )}

      {/* Loading indicator / Go button */}
      {editing ? (
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-quantum-600 rounded-lg px-3 py-1 ml-1"
          accessibilityLabel="Go"
          accessibilityRole="button"
        >
          <Text className="text-white font-bold text-xs">Go</Text>
        </TouchableOpacity>
      ) : isLoading ? (
        <Text className="text-quantum-400 text-xs px-1">...</Text>
      ) : null}
    </View>
  );
}
