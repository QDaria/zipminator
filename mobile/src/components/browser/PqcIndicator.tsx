/**
 * PqcIndicator.tsx
 *
 * Shield icon with colour-coded PQC / TLS status for ZipBrowser.
 *
 * Novice mode: compact shield icon only (green / yellow / grey).
 * Expert mode: tappable shield that expands a detail panel showing
 *   key exchange algorithm, cipher, certificate issuer, and HSTS status.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { PqcStatus, PqcStatusLevel } from '../../types/browser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PqcIndicatorProps {
  /** Current PQC security level (drives colour). */
  status: PqcStatusLevel;
  /** Full TLS details for expert panel. */
  details?: PqcStatus;
  /** Whether to allow expanding the detail panel. */
  isExpert: boolean;
}

// ---------------------------------------------------------------------------
// Colour mapping
// ---------------------------------------------------------------------------

function statusColor(level: PqcStatusLevel) {
  switch (level) {
    case 'pqc':       return { shield: '🛡️', bg: 'bg-green-900/40', border: 'border-green-500/50', label: 'text-green-400', badge: 'PQC' };
    case 'classical': return { shield: '🔒', bg: 'bg-yellow-900/30', border: 'border-yellow-500/40', label: 'text-yellow-400', badge: 'TLS' };
    case 'unknown':   return { shield: '⚬',  bg: 'bg-white/5',       border: 'border-white/10',      label: 'text-gray-500',   badge: '???' };
  }
}

// ---------------------------------------------------------------------------
// Expert detail row helper
// ---------------------------------------------------------------------------

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between items-center py-1 border-b border-white/5">
      <Text className="text-gray-500 font-mono text-[10px]">{label}</Text>
      <Text className={`font-mono text-[10px] font-bold ${highlight ? 'text-green-400' : 'text-gray-300'}`}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PqcIndicator
// ---------------------------------------------------------------------------

export default function PqcIndicator({ status, details, isExpert }: PqcIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = statusColor(status);

  // Novice: compact icon, no tap interaction
  if (!isExpert) {
    return (
      <View
        className={`px-2 py-1 rounded-lg ${colors.bg} border ${colors.border} items-center justify-center`}
        accessibilityLabel={`Security: ${status}`}
        accessibilityRole="text"
      >
        <Text className="text-base">{colors.shield}</Text>
      </View>
    );
  }

  // Expert: tappable, expandable detail panel
  return (
    <View>
      <TouchableOpacity
        onPress={() => setExpanded((prev) => !prev)}
        className={`flex-row items-center px-2 py-1 rounded-lg ${colors.bg} border ${colors.border} gap-1`}
        accessibilityLabel={`PQC status: ${status}. Tap to ${expanded ? 'collapse' : 'expand'} details`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text className="text-sm">{colors.shield}</Text>
        <Text className={`font-mono text-[10px] font-bold ${colors.label}`}>
          {colors.badge}
        </Text>
        <Text className="text-gray-600 text-[10px]">{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View
          className={`absolute top-8 right-0 w-56 bg-black/95 rounded-xl border ${colors.border} p-3 z-50`}
          accessibilityLabel="TLS details panel"
        >
          <Text className={`font-mono text-xs font-bold ${colors.label} mb-2`}>
            TLS SESSION INFO
          </Text>

          <DetailRow
            label="KEY EXCHANGE"
            value={details?.keyExchange ?? 'unknown'}
            highlight={details?.keyExchange === 'ML-KEM-768'}
          />
          <DetailRow
            label="CIPHER"
            value={details?.cipher ?? 'unknown'}
          />
          <DetailRow
            label="ISSUER"
            value={details?.issuer ?? 'unknown'}
          />
          <DetailRow
            label="HSTS"
            value={details?.hsts ? 'ENABLED' : 'NONE'}
            highlight={details?.hsts}
          />
          <DetailRow
            label="CERT VALID"
            value={details?.certValid ? 'YES' : 'NO'}
            highlight={details?.certValid}
          />

          {status === 'pqc' && (
            <View className="mt-2 bg-green-900/30 rounded-lg p-2">
              <Text className="text-green-400 font-mono text-[9px] text-center font-bold">
                QUANTUM-SAFE CONNECTION ACTIVE
              </Text>
            </View>
          )}

          {status === 'classical' && (
            <View className="mt-2 bg-yellow-900/30 rounded-lg p-2">
              <Text className="text-yellow-400 font-mono text-[9px] text-center">
                WARNING: Classical TLS only
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
