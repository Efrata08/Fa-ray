import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['_action', '0', '⌫'],
];

/**
 * PinPad — reusable 3×4 numpad.
 *
 * Props:
 *   onKey(key)          called with '0'–'9' or '⌫'
 *   leftAction?         { label: string, onPress: fn }
 *                       if omitted, bottom-left cell is invisible
 *   disabled?           grays out all keys
 */
export default function PinPad({ onKey, leftAction, disabled }) {
  return (
    <View style={styles.grid}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => {
            const isBackspace = key === '⌫';
            const isAction    = key === '_action';

            if (isAction) {
              if (!leftAction) {
                return <View key={ki} style={styles.ghost} />;
              }
              return (
                <TouchableOpacity
                  key={ki}
                  style={[styles.key, disabled && styles.keyDisabled]}
                  onPress={leftAction.onPress}
                  disabled={disabled}
                  activeOpacity={0.6}
                >
                  <Text style={styles.actionText}>{leftAction.label}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={ki}
                style={[styles.key, disabled && styles.keyDisabled]}
                onPress={() => onKey(key)}
                disabled={disabled}
                activeOpacity={0.6}
              >
                <Text style={isBackspace ? styles.backText : styles.keyText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },

  key: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#D4D4D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: { opacity: 0.35 },
  ghost: { flex: 1 },

  keyText:    { fontSize: 16, fontWeight: '500', color: '#111' },
  backText:   { fontSize: 16, color: '#888' },
  actionText: { fontSize: 10, color: '#888' },
});
